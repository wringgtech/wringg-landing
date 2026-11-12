import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ITEM_COUNT,
  MAX_ITEM_COUNT,
  MIN_ITEM_COUNT,
  bookingActionHint,
  clampItemCount,
  formatDayHint,
  formatSlotRange,
  groupSlotsByPeriod,
  istDayKey,
  itemCountLabel,
  nextAvailableSlotKey,
  nextPickupDayLabel,
  nextPickupDayOffset,
  pickupDayOptions,
  pickupTagLabel,
  preferredAddressId,
  selectBookingTotals,
  slotPeriodKey,
  stepItemCount,
} from "../src/app/book/booking-helpers.ts";

test("uses the Asia/Kolkata calendar day, not the browser's day", () => {
  // 18:29:59Z is 23:59:59 IST — still the 12th.
  assert.equal(istDayKey(new Date("2026-11-12T18:29:59Z")), "2026-11-12");
  // 18:30Z is midnight IST — the 13th.
  assert.equal(istDayKey(new Date("2026-11-12T18:30:00Z")), "2026-11-13");
  // 00:30 IST on New Year's Day.
  assert.equal(istDayKey(new Date("2025-12-31T19:00:00Z")), "2026-01-01");
});

test("builds today, tomorrow and the day after from the IST date", () => {
  const options = pickupDayOptions(new Date("2026-11-12T19:00:00Z")); // 13 Nov in IST
  assert.deepEqual(
    options.map((option) => [option.label, option.date]),
    [
      ["Today", "2026-11-13"],
      ["Tomorrow", "2026-11-14"],
      ["Day after", "2026-11-15"],
    ],
  );
  assert.deepEqual(options.map((option) => option.offset), [0, 1, 2]);
});

test("rolls month and year boundaries correctly", () => {
  const now = new Date("2026-11-30T20:00:00Z"); // 1 Dec, 01:30 IST
  assert.equal(istDayKey(now, 0), "2026-12-01");
  assert.equal(istDayKey(now, 1), "2026-12-02");
  assert.equal(istDayKey(now, 2), "2026-12-03");
});

test("formats day hints from a YYYY-MM-DD key", () => {
  assert.equal(formatDayHint("2026-11-13"), "Fri 13 Nov");
  assert.equal(formatDayHint("2026-01-01"), "Thu 1 Jan");
  assert.equal(formatDayHint("not-a-date"), "not-a-date");
});

test("labels slot ranges in IST without repeating the meridiem", () => {
  assert.equal(
    formatSlotRange("2026-11-13T10:00:00+05:30", "2026-11-13T10:30:00+05:30"),
    "10:00 – 10:30 AM",
  );
  assert.equal(
    formatSlotRange("2026-11-13T13:00:00+05:30", "2026-11-13T13:30:00+05:30"),
    "1:00 – 1:30 PM",
  );
  assert.equal(
    formatSlotRange("2026-11-13T00:00:00+05:30", "2026-11-13T00:30:00+05:30"),
    "12:00 – 12:30 AM",
  );
});

test("shows both meridiems when a slot crosses noon", () => {
  assert.equal(
    formatSlotRange("2026-11-13T11:30:00+05:30", "2026-11-13T12:00:00+05:30"),
    "11:30 AM – 12:00 PM",
  );
});

test("treats the same instant in UTC and IST as the same slot", () => {
  assert.equal(
    formatSlotRange("2026-11-13T04:30:00Z", "2026-11-13T05:00:00Z"),
    "10:00 – 10:30 AM",
  );
});

test("returns null for unparseable slot timestamps", () => {
  assert.equal(formatSlotRange("", "2026-11-13T10:30:00+05:30"), null);
  assert.equal(formatSlotRange("2026-11-13T10:00:00+05:30", "later"), null);
});

test("buckets slot starts by IST time of day", () => {
  assert.equal(slotPeriodKey("2026-11-13T00:30:00+05:30"), "morning");
  assert.equal(slotPeriodKey("2026-11-13T11:59:00+05:30"), "morning");
  assert.equal(slotPeriodKey("2026-11-13T12:00:00+05:30"), "afternoon");
  assert.equal(slotPeriodKey("2026-11-13T16:59:00+05:30"), "afternoon");
  assert.equal(slotPeriodKey("2026-11-13T17:00:00+05:30"), "evening");
  assert.equal(slotPeriodKey("2026-11-13T23:30:00+05:30"), "evening");
  // 05:30Z is 11:00 IST, still morning on a device in any timezone.
  assert.equal(slotPeriodKey("2026-11-13T05:30:00Z"), "morning");
  assert.equal(slotPeriodKey("later"), "other");
});

test("groups slots in period order and drops empty periods", () => {
  const slots = [
    { slotKey: "e1", startsAt: "2026-11-13T18:00:00+05:30" },
    { slotKey: "m1", startsAt: "2026-11-13T09:00:00+05:30" },
    { slotKey: "a1", startsAt: "2026-11-13T13:00:00+05:30" },
    { slotKey: "e2", startsAt: "2026-11-13T20:00:00+05:30" },
  ];

  const groups = groupSlotsByPeriod(slots);
  assert.deepEqual(
    groups.map((group) => group.label),
    ["Morning", "Afternoon", "Evening"],
  );
  assert.deepEqual(
    groups.map((group) => group.slots.map((slot) => slot.slotKey)),
    [["m1"], ["a1"], ["e1", "e2"]],
  );
});

test("keeps unparseable slots renderable in an other-times group", () => {
  const groups = groupSlotsByPeriod([
    { slotKey: "x", startsAt: "later" },
    { slotKey: "m", startsAt: "2026-11-13T10:00:00+05:30" },
  ]);
  assert.deepEqual(
    groups.map((group) => [group.label, group.slots.length]),
    [["Morning", 1], ["Other times", 1]],
  );
});

test("has no groups when there are no slots", () => {
  assert.deepEqual(groupSlotsByPeriod([]), []);
});

test("labels the tag pickup row with the chosen day", () => {
  const [, tomorrow, dayAfter] = pickupDayOptions(new Date("2026-11-12T13:00:00Z"));

  assert.equal(
    pickupTagLabel({ offset: 0, date: "2026-11-13" }, "4:00 – 4:30 PM"),
    "Today · 4:00 – 4:30 PM",
  );
  assert.equal(
    pickupTagLabel(tomorrow, "4:00 – 4:30 PM"),
    "Tomorrow · 4:00 – 4:30 PM",
  );
  assert.equal(
    pickupTagLabel(dayAfter, "10:00 – 10:30 AM"),
    "Sat 14 Nov · 10:00 – 10:30 AM",
  );
  assert.equal(
    pickupTagLabel({ offset: 0, date: "2026-11-13" }, "Instant pickup"),
    "Instant pickup (today)",
  );
});

test("falls back to the slot or a prompt when the day is unknown", () => {
  assert.equal(pickupTagLabel(null, "4:00 – 4:30 PM"), "4:00 – 4:30 PM");
  assert.equal(pickupTagLabel(null, null), "Choose a time");
  assert.equal(
    pickupTagLabel({ offset: 0, date: "2026-11-13" }, null),
    "Choose a time",
  );
});

test("keeps the clothes count an integer between 1 and 200", () => {
  assert.equal(MIN_ITEM_COUNT, 1);
  assert.equal(MAX_ITEM_COUNT, 200);
  assert.equal(DEFAULT_ITEM_COUNT, 10);

  assert.equal(clampItemCount("10"), 10);
  assert.equal(clampItemCount(""), 10);
  assert.equal(clampItemCount("abc"), 10);
  assert.equal(clampItemCount("0"), 1);
  assert.equal(clampItemCount(-4), 1);
  assert.equal(clampItemCount("201"), 200);
  assert.equal(clampItemCount(999), 200);
  assert.equal(clampItemCount("12.6"), 13);
  assert.equal(clampItemCount(42.4), 42);
  assert.equal(clampItemCount("7", 20), 7);
});

test("steps within the same clamp", () => {
  assert.equal(stepItemCount("10", 1), 11);
  assert.equal(stepItemCount("10", -1), 9);
  assert.equal(stepItemCount("1", -1), 1);
  assert.equal(stepItemCount("200", 1), 200);
  assert.equal(stepItemCount("", 5), 15);
  assert.equal(stepItemCount("10", Number.NaN), 10);
});

test("uses the local estimate only until a server-priced coupon exists", () => {
  assert.deepEqual(selectBookingTotals(480, null), {
    subtotal: 480,
    discount: 0,
    total: 480,
  });
  assert.deepEqual(
    selectBookingTotals(480, {
      code: "FIRST",
      grossAmount: "600.00",
      discountAmount: "150.00",
      payableAmount: "450.00",
    }),
    { subtotal: 600, discount: 150, total: 450 },
  );
});

test("falls back to the estimate and server discount when coupon fields are partial", () => {
  assert.deepEqual(
    selectBookingTotals(300, {
      code: "PARTIAL",
      discountAmount: "50",
    }),
    { subtotal: 300, discount: 50, total: 250 },
  );
});

test("keeps a fully waived payable total at zero", () => {
  assert.deepEqual(
    selectBookingTotals(200, {
      code: "FREE100",
      grossAmount: "200",
      discountAmount: "200",
      payableAmount: "0",
    }),
    { subtotal: 200, discount: 200, total: 0 },
  );
});

test("has no totals when pricing failed and no coupon is applied", () => {
  assert.deepEqual(selectBookingTotals(null, null), {
    subtotal: null,
    discount: 0,
    total: null,
  });
});

test("has no totals when a coupon lacks a gross and local pricing failed", () => {
  assert.deepEqual(
    selectBookingTotals(null, {
      code: "PARTIAL",
      discountAmount: "50",
    }),
    { subtotal: null, discount: 50, total: null },
  );
});

test("pluralizes clothes counts", () => {
  assert.equal(itemCountLabel(1), "1 cloth");
  assert.equal(itemCountLabel(18), "18 clothes");
  assert.equal(itemCountLabel(0), "0 clothes");
});

test("marks the first future slot today and never marks another day", () => {
  const now = new Date("2026-11-13T04:00:00Z"); // 09:30 IST
  const slots = [
    { slotKey: "past", startsAt: "2026-11-13T03:00:00Z" },
    { slotKey: "later", startsAt: "2026-11-13T06:00:00Z" },
    { slotKey: "next", startsAt: "2026-11-13T05:00:00Z" },
    { slotKey: "broken", startsAt: "not-a-date" },
  ];
  assert.equal(nextAvailableSlotKey(slots, now, 0), "next");
  assert.equal(nextAvailableSlotKey(slots, now, 1), null);
  assert.equal(nextAvailableSlotKey([], now, 0), null);
});

test("names the next concrete booking action", () => {
  assert.equal(
    bookingActionHint({
      estimate: null,
      hasAddress: false,
      hasAvailableSlots: true,
      hasSlot: false,
      total: null,
    }),
    "Pricing is unavailable right now.",
  );
  assert.equal(
    bookingActionHint({
      estimate: 100,
      hasAddress: false,
      hasAvailableSlots: true,
      hasSlot: false,
      total: 100,
    }),
    "Choose a pickup address to continue.",
  );
  assert.equal(
    bookingActionHint({
      estimate: 100,
      hasAddress: true,
      hasAvailableSlots: false,
      hasSlot: false,
      total: 100,
    }),
    "Pick a day with an available slot.",
  );
  assert.equal(
    bookingActionHint({
      estimate: 100,
      hasAddress: true,
      hasAvailableSlots: true,
      hasSlot: false,
      total: 100,
    }),
    "Choose a pickup time to continue.",
  );
  assert.equal(
    bookingActionHint({
      estimate: 100,
      hasAddress: true,
      hasAvailableSlots: true,
      hasSlot: true,
      total: null,
    }),
    "Waiting for the final price. Try again.",
  );
  assert.equal(
    bookingActionHint({
      estimate: 100,
      hasAddress: true,
      hasAvailableSlots: true,
      hasSlot: true,
      total: 100,
    }),
    null,
  );
});

test("steps the day picker forward with honest labels", () => {
  assert.equal(nextPickupDayOffset(0), 1);
  assert.equal(nextPickupDayOffset(1), 2);
  assert.equal(nextPickupDayOffset(2), 0);
  assert.equal(nextPickupDayLabel(0), "Try tomorrow");
  assert.equal(nextPickupDayLabel(1), "Try day after");
  assert.equal(nextPickupDayLabel(2), "Try today");
});

test("picks the pickup address: kept choice, then requested, then first in the pilot area", () => {
  const list = [
    { id: "out", isServiceable: false },
    { id: "home", isServiceable: true },
    { id: "work", isServiceable: true },
  ];
  assert.equal(preferredAddressId(list, null, null), "home");
  assert.equal(preferredAddressId(list, null, "work"), "work");
  assert.equal(preferredAddressId(list, "home", "work"), "home");
  // A requested address outside the pilot area, or an unknown id, falls back.
  assert.equal(preferredAddressId(list, null, "out"), "home");
  assert.equal(preferredAddressId(list, null, "missing"), "home");
  // A kept choice that is no longer bookable is dropped.
  assert.equal(preferredAddressId(list, "out", null), "home");
  assert.equal(preferredAddressId([{ id: "out", isServiceable: false }], null, null), null);
});
