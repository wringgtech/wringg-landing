// Pure helpers for the booking page. No runtime imports: tests load this file
// directly with `node --experimental-strip-types`.

export const MIN_ITEM_COUNT = 1;
export const MAX_ITEM_COUNT = 200;
export const DEFAULT_ITEM_COUNT = 10;

export type PickupDayOffset = 0 | 1 | 2;

export interface PickupDayOption {
  offset: PickupDayOffset;
  label: string;
  /** YYYY-MM-DD in Asia/Kolkata. */
  date: string;
}

export interface AppliedCoupon {
  code: string;
  grossAmount?: string;
  discountAmount?: string;
  payableAmount?: string;
}

export interface BookingTotals {
  subtotal: number | null;
  discount: number;
  total: number | null;
}

// Asia/Kolkata is a fixed UTC+05:30 offset (no daylight saving), so shifting
// the instant and reading UTC fields gives the zone's wall clock on every
// device, regardless of the browser's own timezone.
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;
const DAY_MS = 24 * 60 * 60_000;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

interface IstParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
  minutesOfDay: number;
}

function istParts(value: string | Date): IstParts | null {
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  if (!Number.isFinite(time)) return null;
  const shifted = new Date(time + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    minutesOfDay: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** The Asia/Kolkata calendar date, YYYY-MM-DD, `offsetDays` from `now`. */
export function istDayKey(now: Date, offsetDays = 0): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS + offsetDays * DAY_MS);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

/** Today / Tomorrow / Day after, each with its Asia/Kolkata date key. */
export function pickupDayOptions(now: Date): PickupDayOption[] {
  return [
    { offset: 0, label: "Today", date: istDayKey(now, 0) },
    { offset: 1, label: "Tomorrow", date: istDayKey(now, 1) },
    { offset: 2, label: "Day after", date: istDayKey(now, 2) },
  ];
}

// --- Pickup slot groups ------------------------------------------------------

export type SlotPeriodKey = "morning" | "afternoon" | "evening" | "other";

export interface SlotPeriodGroup<T> {
  key: SlotPeriodKey;
  label: string;
  slots: T[];
}

const SLOT_PERIODS: ReadonlyArray<{ key: SlotPeriodKey; label: string }> = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
  { key: "other", label: "Other times" },
];

/** Morning < 12:00, afternoon 12:00–17:00, evening ≥ 17:00 (IST). */
export function slotPeriodKey(startsAt: string): SlotPeriodKey {
  const parts = istParts(startsAt);
  if (!parts) return "other";
  if (parts.minutesOfDay < 12 * 60) return "morning";
  if (parts.minutesOfDay < 17 * 60) return "afternoon";
  return "evening";
}

/**
 * Slots grouped by time of day in their original order. Empty groups are
 * dropped, so the page renders only the headings it has slots for.
 */
export function groupSlotsByPeriod<T extends { startsAt: string }>(
  slots: readonly T[],
): Array<SlotPeriodGroup<T>> {
  const buckets = new Map<SlotPeriodKey, T[]>();
  for (const slot of slots) {
    const key = slotPeriodKey(slot.startsAt);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(slot);
    else buckets.set(key, [slot]);
  }

  return SLOT_PERIODS.flatMap(({ key, label }) => {
    const bucket = buckets.get(key);
    return bucket ? [{ key, label, slots: bucket }] : [];
  });
}

/** "2026-11-13" -> "Fri 13 Nov". Unparseable input -> the input itself. */
export function formatDayHint(dayKey: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey);
  if (!match) return dayKey;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${WEEKDAYS[weekday]} ${day} ${MONTHS[month - 1]}`;
}

/**
 * Pickup row on the laundry tag: "Today · 4:00 – 4:30 PM",
 * "Tomorrow · …", "Sat 14 Nov · …", or "Instant pickup (today)".
 */
export function pickupTagLabel(
  day: Pick<PickupDayOption, "offset" | "date"> | null,
  slotLabel: string | null,
): string {
  if (!slotLabel) return "Choose a time";
  if (slotLabel === "Instant pickup") return "Instant pickup (today)";
  if (!day) return slotLabel;
  if (day.offset === 0) return `Today · ${slotLabel}`;
  if (day.offset === 1) return `Tomorrow · ${slotLabel}`;
  return `${formatDayHint(day.date)} · ${slotLabel}`;
}

interface ClockTime {
  time: string;
  meridiem: "AM" | "PM";
}

function istClock(minutesOfDay: number): ClockTime {
  const hour24 = Math.floor(minutesOfDay / 60) % 24;
  const minute = minutesOfDay % 60;
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    time: `${hour12}:${String(minute).padStart(2, "0")}`,
    meridiem: hour24 < 12 ? "AM" : "PM",
  };
}

/**
 * "10:00 – 10:30 AM" for a slot within one half of the day, or
 * "11:30 AM – 12:00 PM" when the window crosses noon/midnight.
 * Returns null for unparseable timestamps.
 */
export function formatSlotRange(startsAt: string, endsAt: string): string | null {
  const start = istParts(startsAt);
  const end = istParts(endsAt);
  if (!start || !end) return null;
  const from = istClock(start.minutesOfDay);
  const to = istClock(end.minutesOfDay);
  if (from.meridiem === to.meridiem) {
    return `${from.time} – ${to.time} ${to.meridiem}`;
  }
  return `${from.time} ${from.meridiem} – ${to.time} ${to.meridiem}`;
}

/** Integer clothes count in [1, 200]; blank or invalid input uses the fallback. */
export function clampItemCount(
  value: string | number,
  fallback: number = DEFAULT_ITEM_COUNT,
): number {
  const safeFallback = Number.isFinite(fallback)
    ? Math.min(MAX_ITEM_COUNT, Math.max(MIN_ITEM_COUNT, Math.round(fallback)))
    : DEFAULT_ITEM_COUNT;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value.trim());
  if (!Number.isFinite(parsed)) return safeFallback;
  return Math.min(MAX_ITEM_COUNT, Math.max(MIN_ITEM_COUNT, Math.round(parsed)));
}

export function stepItemCount(current: string | number, delta: number): number {
  const base = clampItemCount(current);
  const step = Number.isFinite(delta) ? Math.round(delta) : 0;
  return clampItemCount(base + step);
}

function amountValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The summary the server priced wins; the local estimate only fills in when
 * no coupon is applied. Discounts are never computed here.
 */
export function selectBookingTotals(
  estimate: number | null,
  coupon: AppliedCoupon | null,
): BookingTotals {
  if (!coupon) return { subtotal: estimate, discount: 0, total: estimate };

  const gross = amountValue(coupon.grossAmount) ?? estimate;
  const discount = amountValue(coupon.discountAmount) ?? 0;
  // A coupon without a server gross and without a local estimate has no
  // trustworthy subtotal; showing 0 would claim the order is free.
  if (gross === null) return { subtotal: null, discount, total: null };

  const payable = amountValue(coupon.payableAmount) ?? Math.max(0, gross - discount);
  return { subtotal: gross, discount, total: payable };
}

/** "1 cloth" / "18 clothes" — used in the tag and the sticky bar. */
export function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? "cloth" : "clothes"}`;
}

/**
 * The first future slot, used for the "Next available" marker. Only today
 * gets the marker; the API already returns bookable windows in order.
 */
export function nextAvailableSlotKey<T extends { slotKey: string; startsAt: string }>(
  slots: readonly T[],
  now: Date,
  dayOffset: PickupDayOffset,
): string | null {
  if (dayOffset !== 0) return null;

  const nowTime = now.getTime();
  let bestKey: string | null = null;
  let bestTime = Number.POSITIVE_INFINITY;
  for (const slot of slots) {
    const time = new Date(slot.startsAt).getTime();
    if (!Number.isFinite(time) || time <= nowTime) continue;
    if (time < bestTime) {
      bestTime = time;
      bestKey = slot.slotKey;
    }
  }
  return bestKey;
}

/**
 * Why the review/place action is blocked. The sticky bar shows this above a
 * disabled button, so it always names the next concrete action.
 */
export function bookingActionHint(input: {
  estimate: number | null;
  hasAddress: boolean;
  hasAvailableSlots: boolean;
  hasSlot: boolean;
  total: number | null;
}): string | null {
  if (input.estimate === null) return "Pricing is unavailable right now.";
  if (!input.hasAddress) return "Choose a pickup address to continue.";
  if (!input.hasAvailableSlots) return "Pick a day with an available slot.";
  if (!input.hasSlot) return "Choose a pickup time to continue.";
  if (input.total === null) return "Waiting for the final price. Try again.";
  return null;
}

/** The next day in the three-day picker; wraps back to today. */
export function nextPickupDayOffset(current: PickupDayOffset): PickupDayOffset {
  return current === 0 ? 1 : current === 1 ? 2 : 0;
}

/** Honest label for the one-tap day switch from an empty slot list. */
export function nextPickupDayLabel(current: PickupDayOffset): string {
  return current === 0 ? "Try tomorrow" : current === 1 ? "Try day after" : "Try today";
}

/**
 * Which address the booking form starts on: keep the current choice while it
 * is still bookable, else the one requested via `?address=` (e.g. "Book from
 * here" on /account) when it is in the pilot area, else the first bookable one.
 */
export function preferredAddressId(
  addresses: readonly { id: string; isServiceable: boolean | null }[],
  current: string | null,
  requested: string | null,
): string | null {
  const bookable = (id: string | null) =>
    id !== null && addresses.some((address) => address.id === id && address.isServiceable === true);
  if (bookable(current)) return current;
  if (bookable(requested)) return requested;
  return addresses.find((address) => address.isServiceable === true)?.id ?? null;
}
