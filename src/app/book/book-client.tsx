"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AddressForm } from "@/components/customer/address-form";
import {
  BookingUnavailable,
  CustomerShell,
  useRequireSession,
} from "@/components/customer/customer-shell";
import { CashIcon, CheckIcon, PlusIcon, WhatsAppIcon } from "@/components/customer/icons";
import {
  Button,
  ChoiceTile,
  Notice,
  Skeleton,
  Stepper,
  TagCard,
  TagPerforation,
  TagRow,
  TagTotal,
  TextField,
} from "@/components/customer/ui";
import { cx } from "@/components/customer/ui-helpers";
import {
  createOrder,
  getActivePricing,
  getAvailableSlots,
  getCustomerDashboard,
  getMyCouponEligibility,
  quoteCheckout,
  validateCoupon,
} from "@/lib/washmate/api";
import { ApiError, errorMessage } from "@/lib/washmate/client";
import { SERVICE_LABELS } from "@/lib/washmate/labels";
import {
  amountToNumber,
  estimateCustomerPrice,
  formatRupees,
  priceBreakdownLabel,
  serviceTilePrice,
  type PricingByType,
} from "@/lib/washmate/pricing";
import { withAuth } from "@/lib/washmate/session";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-links";
import {
  SERVICE_TYPES,
  type Address,
  type AvailableSlot,
  type MyCouponEligibility,
  type ServiceType,
} from "@/lib/washmate/types";
import {
  DEFAULT_ITEM_COUNT,
  MAX_ITEM_COUNT,
  MIN_ITEM_COUNT,
  bookingActionHint,
  clampItemCount,
  formatDayHint,
  formatSlotRange,
  groupSlotsByPeriod,
  itemCountLabel,
  nextAvailableSlotKey,
  nextPickupDayLabel,
  nextPickupDayOffset,
  pickupDayOptions,
  pickupTagLabel,
  preferredAddressId,
  selectBookingTotals,
  type AppliedCoupon,
  type PickupDayOffset,
  type PickupDayOption,
} from "./booking-helpers";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]";

/** Bento sizes: the first service takes a wide plate, the other two sit beside it. */
const SERVICE_HERO: Record<ServiceType, boolean> = {
  wash: true,
  wash_and_iron: false,
  iron_only: false,
};

/**
 * One service plate. Selection is the only dark object in the section: the chosen
 * service takes the ink plate, the rest stay paper, so colour carries meaning
 * instead of decorating three equal blocks.
 */
function ServiceBentoCard({
  type,
  checked,
  onSelect,
  title,
  description,
  price,
}: {
  type: ServiceType;
  checked: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  price: string;
}) {
  const hero = SERVICE_HERO[type];
  return (
    <label
      className={cx(
        "relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-[16px] p-4 transition-colors duration-150 sm:p-5",
        "min-h-[124px] sm:min-h-[132px]",
        hero && "sm:col-span-2",
        // Same selection treatment as the pickup section (day tabs and the
        // instant option): accent border, soft accent fill, ink text.
        "border",
        checked
          ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-soft)]"
          : "border-[var(--cw-hairline-strong)] bg-white hover:border-[var(--cw-accent)]",
        "cw-plate",
      )}
    >
      <input
        type="radio"
        name="service-type"
        value={type}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="cw-display block text-[17px] font-bold leading-6">{title}</span>
          <span className="mt-1 block text-[13px] leading-[18px] text-[var(--cw-muted)]">
            {description}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={cx(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-opacity duration-150",
            checked
              ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-strong)] text-white opacity-100"
              : "border-[var(--cw-hairline-strong)] opacity-0",
          )}
        >
          <CheckIcon size={12} />
        </span>
      </span>
      <span
        className={cx(
          "mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums",
          checked
            ? "bg-white text-[var(--cw-accent-strong)]"
            : "bg-[var(--cw-subtle)] text-[var(--cw-body)]",
        )}
      >
        {price}
      </span>
    </label>
  );
}

const SLOT_GRID = "grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4";

type Settled<T> = { ok: true; value: T } | { ok: false; error: unknown };

function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  return promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
}

function unavailableMessage(err: unknown): string | null {
  if (
    err instanceof ApiError &&
    (err.code === "APP_UPDATE_REQUIRED" || err.code === "NOT_CONFIGURED")
  ) {
    return err.message;
  }
  return null;
}

function BookingSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading booking form" className="space-y-7">
      {[2, 3, 1].map((rows, section) => (
        <div
          key={section}
          className={cx(section > 0 && "border-t border-[var(--cw-hairline)] pt-7")}
        >
          <Skeleton className="h-5 w-36" />
          <div className="mt-3 grid gap-2">
            {Array.from({ length: rows }, (_, row) => (
              <Skeleton key={row} className="h-[68px] rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

/** Compact price for the tile's top row; the full rule stays below. */
function serviceTileMeta(type: ServiceType, pricingByType: PricingByType): string {
  // One source of truth for the arithmetic: the shared shape handles threshold,
  // per-lot and per-piece rows alike, so a lot-priced service shows its rate
  // here instead of falling back to "At checkout".
  return serviceTilePrice(type, pricingByType) ?? "At checkout";
}

export function BookClient() {
  const session = useRequireSession();
  const router = useRouter();
  const ready = session.status === "signedIn" && session.session.hasProfile;

  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [blockingMessage, setBlockingMessage] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressNotice, setAddressNotice] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const [pricingByType, setPricingByType] = useState<PricingByType>({});
  const [pricingFailed, setPricingFailed] = useState(false);
  const [eligibility, setEligibility] = useState<MyCouponEligibility | null>(null);
  const [dayOptions, setDayOptions] = useState<PickupDayOption[]>([]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState<ServiceType>("wash");
  const [itemCountInput, setItemCountInput] = useState(String(DEFAULT_ITEM_COUNT));
  const [dayOffset, setDayOffset] = useState<PickupDayOffset>(0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [slotsState, setSlotsState] = useState<{
    key: string;
    slots: AvailableSlot[];
    instantPickupAvailable: boolean;
    error: string | null;
  } | null>(null);
  const [slotRetryKey, setSlotRetryKey] = useState(0);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [showCouponField, setShowCouponField] = useState(false);
  const couponRequestRef = useRef(0);

  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const placingRef = useRef(false);

  const tagRef = useRef<HTMLDivElement>(null);
  const slotSectionRef = useRef<HTMLLIElement>(null);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  // Start hidden on mobile: the observer reveals the bar once it knows the
  // tag is off-screen.
  const [summaryInView, setSummaryInView] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    const run = async () => {
      const [dashboard, pricingResults, couponEligibility] = await Promise.all([
        settle(withAuth((token) => getCustomerDashboard(token))),
        Promise.all(
          SERVICE_TYPES.map(async (type) => ({
            type,
            result: await settle(withAuth((token) => getActivePricing(type, token))),
          })),
        ),
        settle(withAuth((token) => getMyCouponEligibility(token))),
      ]);
      if (cancelled) return;

      if (dashboard.ok) {
        const list = dashboard.value.addresses;
        setAddresses(list);
        setAddressError(null);
        const requested = new URLSearchParams(window.location.search).get("address");
        setSelectedAddressId((current) => preferredAddressId(list, current, requested));
      } else {
        setAddressError(
          errorMessage(
            dashboard.error,
            "Could not load your addresses and pricing. Please try again.",
          ),
        );
        const unavailable = unavailableMessage(dashboard.error);
        if (unavailable) setBlockingMessage(unavailable);
      }

      const nextPricing: PricingByType = {};
      let anyPricingFailed = false;
      for (const { type, result } of pricingResults) {
        if (result.ok) {
          nextPricing[type] = result.value.item;
        } else {
          anyPricingFailed = true;
          const unavailable = unavailableMessage(result.error);
          if (unavailable) setBlockingMessage(unavailable);
        }
      }
      setPricingByType(nextPricing);
      setPricingFailed(anyPricingFailed);

      setEligibility(couponEligibility.ok ? couponEligibility.value : null);
      setDayOptions(pickupDayOptions(new Date()));
      setLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [ready, reloadKey]);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? null;
  const selectedDay = dayOptions.find((option) => option.offset === dayOffset) ?? null;
  const itemCount = clampItemCount(itemCountInput);
  const estimate = estimateCustomerPrice(serviceType, itemCount, pricingByType);
  const breakdown = priceBreakdownLabel(serviceType, itemCount, pricingByType);
  const totals = selectBookingTotals(estimate, appliedCoupon);

  const slotRequestKey =
    ready && selectedAddress && selectedDay
      ? `${selectedAddress.id}|${serviceType}|${selectedDay.date}`
      : null;
  const activeSlots =
    slotRequestKey && slotsState?.key === slotRequestKey ? slotsState : null;
  const slotsLoading = Boolean(slotRequestKey) && activeSlots === null;
  // Instant pickup is a same-day promise: the backend reports availability
  // per date, but only Today may offer it on this page.
  const instantPickupOffered = dayOffset === 0 && activeSlots?.instantPickupAvailable === true;
  const chosenSlot =
    selectedSlot && selectedSlot !== "instant"
      ? activeSlots?.slots.find((slot) => slot.slotKey === selectedSlot)
      : undefined;
  let selectedSlotLabel: string | null = null;
  if (selectedSlot === "instant") {
    if (instantPickupOffered) selectedSlotLabel = "Instant pickup";
  } else if (chosenSlot) {
    selectedSlotLabel = formatSlotRange(chosenSlot.startsAt, chosenSlot.endsAt);
  }

  useEffect(() => {
    if (!slotRequestKey || !selectedAddressId || !selectedDay) return;
    const addressId = selectedAddressId;
    const date = selectedDay.date;
    let cancelled = false;

    withAuth((token) => getAvailableSlots({ addressId, serviceType, date }, token))
      .then((result) => {
        if (cancelled) return;
        setSlotsState({
          key: slotRequestKey,
          slots: result.slots,
          instantPickupAvailable: result.instantPickupAvailable,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSlotsState({
          key: slotRequestKey,
          slots: [],
          instantPickupAvailable: false,
          error: errorMessage(err, "Could not load pickup times. Please try another day."),
        });
        const unavailable = unavailableMessage(err);
        if (unavailable) setBlockingMessage(unavailable);
      });

    return () => {
      cancelled = true;
    };
  }, [slotRequestKey, selectedAddressId, selectedDay, serviceType, slotRetryKey]);

  useEffect(() => {
    if (!ready || loading) return;
    const tag = tagRef.current;
    if (!tag || typeof IntersectionObserver === "undefined") {
      setSummaryInView(false);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setSummaryInView(entry.isIntersecting);
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0.05 },
    );
    observer.observe(tag);
    return () => observer.disconnect();
  }, [ready, loading]);

  function resetCoupon() {
    couponRequestRef.current += 1;
    setCouponBusy(false);
    setAppliedCoupon(null);
    setCouponError(null);
    setShowCouponField(false);
  }

  function chooseAddress(addressId: string) {
    setSelectedAddressId(addressId);
    setSelectedSlot(null);
    setAddressNotice(null);
    setOrderError(null);
    resetCoupon();
  }

  function chooseService(next: ServiceType) {
    setServiceType(next);
    setSelectedSlot(null);
    setOrderError(null);
    resetCoupon();
  }

  function chooseDay(next: PickupDayOffset) {
    setDayOffset(next);
    setSelectedSlot(null);
    setOrderError(null);
  }

  function chooseSlot(next: string) {
    setSelectedSlot(next);
    setOrderError(null);
  }

  function changeItemCount(next: string) {
    setItemCountInput(next);
    setOrderError(null);
    resetCoupon();
  }

  function handleAddressSaved(address: Address) {
    setAddresses((current) =>
      current.some((item) => item.id === address.id)
        ? current.map((item) => (item.id === address.id ? address : item))
        : [...current, address],
    );
    setShowAddressForm(false);
    setSelectedSlot(null);
    resetCoupon();
    if (address.isServiceable === true) {
      setSelectedAddressId(address.id);
      setAddressError(null);
      setAddressNotice(null);
    } else {
      setAddressNotice("This address is outside the pilot area. Choose another address or message us on WhatsApp.");
    }
  }

  async function applyCoupon(codeOverride?: string) {
    const code = (codeOverride ?? couponInput).trim().toUpperCase();
    if (!selectedAddressId) {
      setCouponError("Choose a pickup address first.");
      return;
    }
    if (!code) {
      setCouponError("Enter a coupon code.");
      return;
    }

    const requestId = couponRequestRef.current + 1;
    couponRequestRef.current = requestId;
    setCouponBusy(true);
    setCouponError(null);

    try {
      const result = await withAuth((token) =>
        validateCoupon(
          { couponCode: code, addressId: selectedAddressId, serviceType, itemCount },
          token,
        ),
      );
      if (couponRequestRef.current !== requestId) return;

      if (!result.valid) {
        setAppliedCoupon(null);
        setCouponError(result.message ?? "This coupon can't be applied.");
        return;
      }
      setAppliedCoupon({
        code: result.couponCode ?? code,
        grossAmount: result.grossAmount,
        discountAmount: result.discountAmount,
        payableAmount: result.payableAmount,
      });
      setCouponInput(result.couponCode ?? code);
    } catch (err) {
      if (couponRequestRef.current !== requestId) return;
      setAppliedCoupon(null);
      const unavailable = unavailableMessage(err);
      if (unavailable) setBlockingMessage(unavailable);
      setCouponError(errorMessage(err, "Could not apply this coupon. Please try again."));
    } finally {
      if (couponRequestRef.current === requestId) setCouponBusy(false);
    }
  }

  async function refreshPricingAndCoupon(): Promise<PricingByType> {
    const pricingResults = await Promise.all(
      SERVICE_TYPES.map(async (type) => ({
        type,
        result: await settle(withAuth((token) => getActivePricing(type, token))),
      })),
    );
    const nextPricing: PricingByType = {};
    let anyPricingFailed = false;
    for (const { type, result } of pricingResults) {
      if (result.ok) {
        nextPricing[type] = result.value.item;
      } else {
        anyPricingFailed = true;
        const unavailable = unavailableMessage(result.error);
        if (unavailable) setBlockingMessage(unavailable);
      }
    }
    setPricingByType(nextPricing);
    setPricingFailed(anyPricingFailed);

    const code = appliedCoupon?.code;
    if (!code || !selectedAddressId) return nextPricing;

    const requestId = couponRequestRef.current + 1;
    couponRequestRef.current = requestId;
    setCouponBusy(false);
    try {
      const result = await withAuth((token) =>
        validateCoupon(
          { couponCode: code, addressId: selectedAddressId, serviceType, itemCount },
          token,
        ),
      );
      if (couponRequestRef.current !== requestId) return nextPricing;
      if (result.valid) {
        setAppliedCoupon({
          code: result.couponCode ?? code,
          grossAmount: result.grossAmount,
          discountAmount: result.discountAmount,
          payableAmount: result.payableAmount,
        });
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError(result.message ?? "That coupon is no longer available.");
      }
    } catch (err) {
      if (couponRequestRef.current !== requestId) return nextPricing;
      setAppliedCoupon(null);
      setCouponError(errorMessage(err, "Could not re-check this coupon. Please try again."));
    }
    return nextPricing;
  }

  async function placeOrder() {
    if (placingRef.current) return;
    if (selectedSlot === "instant" && !instantPickupOffered) return;
    if (estimate === null || !selectedAddressId || !selectedSlot || totals.total === null) return;

    placingRef.current = true;
    setPlacing(true);
    setOrderError(null);
    let created = false;

    try {
      const orderInput = {
        addressId: selectedAddressId,
        serviceType,
        pickupSlot: selectedSlot,
        itemCount,
        couponCode: appliedCoupon?.code ?? undefined,
      };

      // Price with the server before creating anything, the way the customer app
      // does it (apps/customer-mobile/app/payment.tsx refreshQuote). The amount it
      // returns is the only number we are allowed to send as expectedTotal, which
      // is what keeps a reviewed total and a written order from ever disagreeing.
      let expectedTotal = totals.total ?? undefined;
      try {
        const quote = await withAuth((token) => quoteCheckout(orderInput, token));
        const quotedAmount = amountToNumber(quote.amount);
        if (quotedAmount !== null) {
          if (totals.total !== null && Math.round(quotedAmount * 100) !== Math.round(totals.total * 100)) {
            // The server's price moved since the page was rendered: show it and
            // make the customer look before an order is written.
            setOrderError(
              `The price is now ${formatRupees(quotedAmount)} instead of ${formatRupees(totals.total)}. Review the total above and place the order again.`,
            );
            await refreshPricingAndCoupon();
            placingRef.current = false;
            setPlacing(false);
            return;
          }
          expectedTotal = quotedAmount;
        }
      } catch (quoteError) {
        // A quote is a safety check, not a blocker: if this deployment cannot
        // quote, fall back to the amount already on screen and let the backend
        // be the authority (it re-prices and rejects a mismatch itself).
        if (quoteError instanceof ApiError && (quoteError.code === "APP_UPDATE_REQUIRED" || quoteError.code === "NOT_CONFIGURED")) {
          throw quoteError;
        }
        console.warn("[book] quote unavailable, placing with the reviewed total", quoteError);
      }

      const { order } = await withAuth((token) =>
        createOrder({ ...orderInput, expectedTotal }, token),
      );
      created = true;
      router.push(`/order?id=${encodeURIComponent(order.id)}&placed=1`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // 409 is not only "the price moved". The backend also answers 409 when an
        // earlier online checkout was never finished, when the account has a
        // deletion pending, and when the price guard fires. Quoting that first
        // cause as a price change sent the customer round in circles, so only the
        // price-guard wording goes down the re-quote path.
        const serverSays = err.message ?? "";
        const isPriceGuard = /price changed|review the .*total|total changed/i.test(serverSays);
        if (!isPriceGuard && serverSays) {
          setOrderError(serverSays);
          placingRef.current = false;
          setPlacing(false);
          return;
        }
        // The backend refused the order because its own total differs from the
        // one the customer reviewed. Say both numbers instead of only that
        // something changed, and log the payload so a support report is usable.
        const reviewed = totals.total;
        console.warn("[book] price guard rejected the order", {
          reviewedTotal: reviewed,
          itemCount,
          serviceType,
          couponCode: appliedCoupon?.code ?? null,
          serverMessage: err.message,
        });
        // Compare against FRESHLY fetched pricing, not the state snapshot: a
        // state read here would be stale and would always report "unchanged".
        const freshPricing = await refreshPricingAndCoupon();
        const currentEstimate = estimateCustomerPrice(serviceType, itemCount, freshPricing);
        const reviewedLabel = reviewed === null ? "—" : formatRupees(reviewed);
        if (currentEstimate !== null && reviewed !== null && currentEstimate !== reviewed) {
          setOrderError(
            `The price changed: you reviewed ${reviewedLabel}, the current total is ${formatRupees(currentEstimate)}. Check the total and place the order again.`,
          );
        } else if (appliedCoupon) {
          // The service price is unchanged, so the coupon's own value moved:
          // the first-order engine re-resolves its discount when the order is
          // written, and a spent/limited campaign can come back smaller.
          setOrderError(
            `The discount from ${appliedCoupon.code} could not be confirmed when the order was placed. Clear the coupon and place the order again, or pick another code.`,
          );
        } else {
          // Price and coupon both unchanged locally, so the disagreement is in
          // what the request carried (count, service or slot). Name those.
          setOrderError(
            `We could not confirm ${itemCountLabel(itemCount)} of ${SERVICE_LABELS[serviceType].name} at ${reviewedLabel}. Check the order details above and place it again.`,
          );
        }
        reviewOrder();
      } else if (err instanceof ApiError && err.status === 422) {
        setOrderError(err.message);
      } else {
        const unavailable = unavailableMessage(err);
        if (unavailable) setBlockingMessage(unavailable);
        setOrderError(errorMessage(err, "Could not place your order. Please try again."));
      }
    } finally {
      if (!created) {
        placingRef.current = false;
        setPlacing(false);
      }
    }
  }

  function retryLoad() {
    setLoading(true);
    setBlockingMessage(null);
    setAddressError(null);
    setSelectedSlot(null);
    resetCoupon();
    setReloadKey((key) => key + 1);
  }

  function retrySlots() {
    setSlotsState(null);
    setSlotRetryKey((key) => key + 1);
  }

  function tryNextDay() {
    const next = nextPickupDayOffset(dayOffset);
    chooseDay(next);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      slotSectionRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function reviewOrder() {
    const tag = tagRef.current;
    if (!tag) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tag.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    summaryHeadingRef.current?.focus({ preventScroll: true });
  }

  const canPlaceOrder = Boolean(
    estimate !== null &&
      selectedAddressId &&
      selectedSlot &&
      selectedSlotLabel &&
      totals.total !== null,
  );
  const hasServiceableAddress = addresses.some((address) => address.isServiceable === true);
  const firstRunAddress = addresses.length === 0 && !addressError;
  const slotGroups = groupSlotsByPeriod(activeSlots?.slots ?? []);
  const hasAvailableSlots = activeSlots
    ? activeSlots.slots.length > 0 || instantPickupOffered
    : true;
  const nextSlotKey = nextAvailableSlotKey(
    activeSlots?.slots ?? [],
    new Date(),
    dayOffset,
  );
  const tryNextDayLabel = nextPickupDayLabel(dayOffset);
  const pickupTagValue = pickupTagLabel(selectedDay, selectedSlotLabel);
  const eligibleCoupon = eligibility?.eligibleCoupon ?? null;
  const eligibleSaving = eligibleCoupon
    ? amountToNumber(eligibleCoupon.maxDiscount)
    : null;
  const nextStepHint = bookingActionHint({
    estimate,
    hasAddress: Boolean(selectedAddressId),
    hasAvailableSlots,
    hasSlot: Boolean(selectedSlotLabel),
    total: totals.total,
  });
  const stickyNotice = orderError ?? (!canPlaceOrder ? nextStepHint : null);
  const showPage = ready && !loading && !blockingMessage;

  // Matches the order page: sections separated by whitespace only, with the
  // same display-weight section headings it uses.
  const SECTION = "";
  const SECTION_TITLE = "cw-display text-[20px] font-bold leading-7 text-[var(--cw-ink)]";

  return (
    <CustomerShell
      title="Book a pickup"
      description="We pick up from your door. Pay cash when your clothes come back."
      width="wide"
    >
      {blockingMessage ? (
        <BookingUnavailable message={blockingMessage} />
      ) : !showPage ? (
        <BookingSkeleton />
      ) : (
        <div className="pb-32">
          {addressError ? (
            <div className="mb-8 space-y-3">
              <Notice tone="error">{addressError}</Notice>
              <Button variant="secondary" onClick={retryLoad}>
                Try again
              </Button>
            </div>
          ) : null}

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
            <div className="min-w-0 space-y-8">
            {/* Address */}
            <section className={SECTION} aria-labelledby="book-address">
              <h2 id="book-address" className={SECTION_TITLE}>
                Pickup address
              </h2>
              <div className="mt-3">
                {firstRunAddress || showAddressForm ? (
                  <div className="rounded-2xl border border-[var(--cw-hairline-strong)] bg-white p-5">
                    {firstRunAddress ? (
                      <p className="mb-5 text-[15px] leading-6 text-[var(--cw-body)]">
                        Add an address in the BTM Layout pilot area so we can check pickup
                        availability.
                      </p>
                    ) : null}
                    <AddressForm
                      onSaved={handleAddressSaved}
                      onCancel={
                        addresses.length > 0 ? () => setShowAddressForm(false) : undefined
                      }
                    />
                  </div>
                ) : (
                  <>
                    {addressNotice ? (
                      <Notice tone="warning" className="mb-3">
                        {addressNotice}
                      </Notice>
                    ) : null}
                    <fieldset>
                      <legend className="sr-only">Choose a pickup address</legend>
                      <div className="grid gap-2">
                        {addresses.map((address) => (
                          <ChoiceTile
                            key={address.id}
                            name="pickup-address"
                            value={address.id}
                            checked={address.id === selectedAddressId}
                            onCheck={chooseAddress}
                            title={address.label}
                            description={[
                              address.addressLine1,
                              address.addressLine2,
                              `${address.city} ${address.pincode}`,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                            disabled={address.isServiceable !== true}
                            disabledReason="Outside the BTM Layout pilot area for now"
                          />
                        ))}
                      </div>
                    </fieldset>
                    {!addressError && !addressNotice && !hasServiceableAddress ? (
                      <p className="mt-3 text-[13px] leading-[18px] text-[var(--cw-warning)]">
                        None of your saved addresses are in the pilot area yet. Add a new
                        address or{" "}
                        <a
                          href={SUPPORT_WHATSAPP_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold underline underline-offset-4"
                        >
                          message us on WhatsApp
                        </a>
                        .
                      </p>
                    ) : null}
                    <Button
                      variant="ghost"
                      className="mt-1 -ml-3 px-3"
                      onClick={() => {
                        setAddressNotice(null);
                        setShowAddressForm(true);
                      }}
                    >
                      <PlusIcon size={18} />
                      Add a new address
                    </Button>
                  </>
                )}
                {firstRunAddress ? (
                  <p className="mt-3 text-[13px] leading-[18px] text-[var(--cw-muted)]">
                    Not sure if we cover your street?{" "}
                    <a
                      href={SUPPORT_WHATSAPP_URL}
                      target="_blank"
                      rel="noreferrer"
                      className={cx(
                        "inline-flex min-h-11 items-center gap-1.5 font-semibold text-[var(--cw-link)] underline underline-offset-4",
                        FOCUS_RING,
                      )}
                    >
                      <WhatsAppIcon size={16} />
                      Message us on WhatsApp
                    </a>
                  </p>
                ) : null}
              </div>
            </section>

            {/* Service */}
            <section className={SECTION} aria-labelledby="book-service">
              <h2 id="book-service" className={SECTION_TITLE}>
                Service
              </h2>
              <fieldset className="mt-3">
                <legend className="sr-only">Choose a service</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SERVICE_TYPES.map((type) => (
                    <ServiceBentoCard
                      key={type}
                      type={type}
                      checked={type === serviceType}
                      onSelect={() => chooseService(type)}
                      title={SERVICE_LABELS[type].name}
                      description={SERVICE_LABELS[type].detail}
                      price={serviceTileMeta(type, pricingByType)}
                    />
                  ))}
                </div>
              </fieldset>
              {pricingFailed ? (
                <p className="mt-2 text-[13px] leading-[18px] text-[var(--cw-muted)]">
                  Some prices could not be loaded. The final total is confirmed when you place
                  the order.
                </p>
              ) : null}
            </section>

            {/* Clothes */}
            <section className={SECTION} aria-labelledby="book-clothes">
              <h2 id="book-clothes" className={SECTION_TITLE}>
                Number of clothes
              </h2>
              <p className="mt-0.5 text-[13px] leading-[18px] text-[var(--cw-muted)]">
                A rough count is fine. We count again at pickup.
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <Stepper
                  label="Number of clothes"
                  value={itemCount}
                  min={MIN_ITEM_COUNT}
                  max={MAX_ITEM_COUNT}
                  onChange={(next) => changeItemCount(String(next))}
                />
                <div className="text-right">
                  <p className="text-[17px] font-bold tabular-nums text-[var(--cw-ink)]">
                    {estimate === null ? "—" : formatRupees(estimate)}
                  </p>
                  {breakdown ? (
                    <p className="text-[12px] leading-4 tabular-nums text-[var(--cw-muted)]">
                      {breakdown}
                    </p>
                  ) : null}
                </div>
              </div>
              {itemCount > 60 ? (
                <p className="mt-2 text-[13px] leading-[18px] text-[var(--cw-muted)]">
                  Large bags may need two host slots — we&apos;ll confirm at pickup.
                </p>
              ) : null}
              {estimate === null ? (
                <Notice tone="warning" className="mt-3">
                  We couldn&apos;t load the price for this service, so this order can&apos;t be
                  placed right now. Reload the page or choose another service.
                </Notice>
              ) : null}
            </section>

            {/* Pickup time */}
            <section
              ref={slotSectionRef}
              className={cx(SECTION, "scroll-mt-24")}
              aria-labelledby="book-time"
            >
              <h2 id="book-time" className={SECTION_TITLE}>
                Pickup time
              </h2>
              <fieldset className="mt-3">
                <legend className="sr-only">Pickup day</legend>
                <div className="grid grid-cols-3 gap-2">
                  {dayOptions.map((option) => {
                    const selected = option.offset === dayOffset;
                    return (
                      <label
                        key={option.offset}
                        className={cx(
                          "flex min-h-12 cursor-pointer flex-col items-center justify-center rounded-xl border px-2 py-1.5 text-center transition-colors duration-150",
                          "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--cw-accent)]",
                          selected
                            ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-soft)] text-[var(--cw-ink)]"
                            : "border-[var(--cw-hairline-strong)] bg-white text-[var(--cw-body)]",
                        )}
                      >
                        <input
                          type="radio"
                          name="pickup-day"
                          value={option.offset}
                          checked={selected}
                          onChange={() => chooseDay(option.offset)}
                          className="sr-only"
                        />
                        <span className="text-[14px] font-semibold leading-5">{option.label}</span>
                        <span className="text-[12px] leading-4 text-[var(--cw-muted)]">
                          {formatDayHint(option.date)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {slotsLoading ? (
                <div
                  role="status"
                  aria-busy="true"
                  aria-label="Loading pickup times"
                  className={cx(SLOT_GRID, "mt-3")}
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : activeSlots?.error ? (
                <Notice
                  tone="error"
                  className="mt-3"
                  action={
                    <Button variant="secondary" onClick={retrySlots}>
                      Try again
                    </Button>
                  }
                >
                  {activeSlots.error}
                </Notice>
              ) : activeSlots ? (
                <fieldset className="mt-3">
                  <legend className="sr-only">Pickup time</legend>
                  {instantPickupOffered ? (
                    <InstantPickupOption
                      selected={selectedSlot === "instant"}
                      onClick={() => chooseSlot("instant")}
                      className="mt-3"
                    />
                  ) : null}
                  <div className={cx(SLOT_GRID, instantPickupOffered && "mt-2")}>
                    {slotGroups.flatMap((group) => group.slots).map((slot) => (
                      <SlotButton
                        key={slot.slotKey}
                        label={formatSlotRange(slot.startsAt, slot.endsAt) ?? "Pickup window"}
                        hint={slot.slotKey === nextSlotKey ? "Earliest" : undefined}
                        selected={selectedSlot === slot.slotKey}
                        onClick={() => chooseSlot(slot.slotKey)}
                      />
                    ))}
                  </div>
                  {slotGroups.length === 0 && !instantPickupOffered ? (
                    <p className="text-[15px] leading-6 text-[var(--cw-body)]">
                      No pickup times left for this day.{" "}
                      <button
                        type="button"
                        onClick={tryNextDay}
                        className={cx(
                          "inline-flex min-h-11 items-center font-semibold text-[var(--cw-link)] underline underline-offset-4",
                          FOCUS_RING,
                        )}
                      >
                        {tryNextDayLabel}
                      </button>
                    </p>
                  ) : null}
                </fieldset>
              ) : null}
            </section>

            {/* Payment */}
            <section className={SECTION} aria-labelledby="book-payment">
              <h2 id="book-payment" className={SECTION_TITLE}>
                Payment
              </h2>
              <div className="mt-3 flex items-start gap-3 rounded-[16px] border border-[var(--cw-hairline-strong)] bg-white p-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--cw-accent-soft)] text-[var(--cw-accent-strong)]">
                  <CashIcon size={18} />
                </span>
                <div className="min-w-0">
                  <p className="cw-display text-[15px] font-bold leading-5 text-[var(--cw-ink)]">
                    Cash on delivery
                  </p>
                  <p className="mt-1 text-[13px] leading-[18px] text-[var(--cw-muted)]">
                    No advance payment. Pay the partner when your clothes come back.
                  </p>
                </div>
              </div>
            </section>

            {/* Summary — same laundry-tag card the order page uses. */}
            </div>

            <div
              ref={tagRef}
              id="booking-tag"
              className="scroll-mt-24 lg:sticky lg:top-24"
            >
              <TagCard kicker="WRINGG pickup tag">
                <h2
                  ref={summaryHeadingRef}
                  id="booking-summary-heading"
                  tabIndex={-1}
                  className="sr-only focus-visible:outline-none"
                >
                  Order summary
                </h2>
                <TagRow label="Service" value={SERVICE_LABELS[serviceType].name} />
                <TagRow label="Clothes" value={itemCountLabel(itemCount)} />
                <TagRow label="Pickup" value={pickupTagValue} />
                <TagRow
                  label="Address"
                  value={selectedAddress ? selectedAddress.label : "Choose an address"}
                />
                <TagRow label="Payment" value="Cash on delivery" />
                {appliedCoupon && totals.discount > 0 ? (
                  <TagRow
                    label={`Discount (${appliedCoupon.code})`}
                    value={`−${formatRupees(totals.discount)}`}
                  />
                ) : null}
                <TagPerforation />
                <div className="mt-4" />

              <div className="mt-4 border-t border-[var(--cw-hairline)] pt-4">
                {appliedCoupon ? (
                  <p role="status" className="flex items-center justify-between gap-3 text-[13px] text-[var(--cw-success)]">
                    <span className="font-semibold">{appliedCoupon.code} applied</span>
                    <button
                      type="button"
                      onClick={resetCoupon}
                      className={cx(
                        "inline-flex min-h-11 items-center font-semibold text-[var(--cw-link)] underline underline-offset-4",
                        FOCUS_RING,
                      )}
                    >
                      Remove
                    </button>
                  </p>
                ) : eligibleCoupon && !showCouponField ? (
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 text-[13px] leading-[18px] text-[var(--cw-text)]">
                      <span className="font-semibold">{eligibleCoupon.label}</span>
                      {eligibleSaving !== null && eligibleSaving > 0
                        ? ` · up to ${formatRupees(eligibleSaving)} off`
                        : null}
                    </p>
                    <Button
                      variant="secondary"
                      className="shrink-0 px-4"
                      onClick={() => {
                        setCouponInput(eligibleCoupon.code);
                        void applyCoupon(eligibleCoupon.code);
                      }}
                      loading={couponBusy}
                      loadingLabel="Checking"
                    >
                      Apply
                    </Button>
                  </div>
                ) : null}
                {!appliedCoupon && eligibleCoupon && !showCouponField ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCouponError(null);
                      setShowCouponField(true);
                    }}
                    aria-expanded={false}
                    aria-controls="coupon-code-field"
                    className={cx(
                      "inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--cw-link)] underline underline-offset-4",
                      FOCUS_RING,
                    )}
                  >
                    Use a different code
                  </button>
                ) : null}
                {appliedCoupon || (eligibleCoupon && !showCouponField) ? null : showCouponField ? (
                  renderCouponField()
                ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCouponError(null);
                        setShowCouponField(true);
                      }}
                      aria-expanded={false}
                      aria-controls="coupon-code-field"
                      className={cx(
                        "inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--cw-link)] underline underline-offset-4",
                        FOCUS_RING,
                      )}
                    >
                      Have a coupon code?
                    </button>
                )}
                {couponError ? (
                  <p role="alert" className="mt-1 text-[13px] leading-[18px] text-[var(--cw-danger)]">
                    {couponError}
                  </p>
                ) : null}
              </div>

              <div className="mt-2">
                <TagTotal
                  label="Pay on delivery"
                  amount={totals.total === null ? "—" : formatRupees(totals.total)}
                />
              </div>

              {orderError ? (
                <Notice tone="error" className="mt-4">
                  {orderError}
                </Notice>
              ) : null}
              <Button
                size="lg"
                className="mt-4 w-full"
                onClick={() => void placeOrder()}
                disabled={!canPlaceOrder}
                loading={placing}
                loadingLabel="Placing order…"
              >
                Place order
              </Button>
              {nextStepHint && !placing ? (
                <p className="mt-2 text-center text-[13px] leading-[18px] text-[var(--cw-muted)]">
                  {nextStepHint}
                </p>
              ) : null}
              <p className="mt-3 text-center text-[12px] leading-4 text-[var(--cw-muted)]">
                Free pickup and delivery · Cash on delivery
              </p>
              </TagCard>
            </div>
          </div>
        </div>
      )}

      {showPage ? (
        <div
          aria-hidden={summaryInView || undefined}
          inert={summaryInView || undefined}
          className={cx(
            "fixed inset-x-0 bottom-0 z-30 border-t border-[var(--cw-hairline)] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-16px_rgba(15,49,72,0.28)] lg:hidden",
            "transition-transform duration-[250ms] ease-out motion-reduce:transition-none",
            summaryInView ? "translate-y-full" : "translate-y-0",
          )}
        >
          <div className="mx-auto max-w-[560px] px-5 py-3">
            {stickyNotice && !placing ? (
              <p
                className={cx(
                  "mb-1.5 text-[12px] leading-4",
                  orderError ? "text-[var(--cw-danger)]" : "text-[var(--cw-muted)]",
                )}
              >
                {stickyNotice}
              </p>
            ) : null}
            <div className="flex items-center gap-3">
              <p className="min-w-0 flex-1 text-[18px] font-extrabold leading-6 tabular-nums text-[var(--cw-ink)]">
                {totals.total === null ? "—" : formatRupees(totals.total)}
                <span className="ml-1.5 text-[13px] font-semibold text-[var(--cw-muted)]">
                  {itemCountLabel(itemCount)}
                </span>
              </p>
              <Button
                size="lg"
                className="shrink-0 px-6"
                onClick={() => void placeOrder()}
                disabled={!canPlaceOrder}
                loading={placing}
                loadingLabel="Placing…"
              >
                Place order
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </CustomerShell>
  );

  function renderCouponField() {
    return (
      <div>
        <div id="coupon-code-field" className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <TextField
              label="Coupon code"
              hideLabel
              placeholder="Coupon code"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              value={couponInput}
              disabled={couponBusy}
              autoFocus={showCouponField}
              onChange={(event) => {
                setCouponInput(event.target.value.toUpperCase());
                setCouponError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void applyCoupon();
                }
              }}
            />
          </div>
          <Button
            variant="secondary"
            className="mt-1.5 shrink-0"
            onClick={() => void applyCoupon()}
            loading={couponBusy}
            loadingLabel="Checking"
          >
            Apply
          </Button>
        </div>
        {eligibleCoupon ? (
          <button
            type="button"
            onClick={() => {
              setCouponError(null);
              setShowCouponField(false);
            }}
            className={cx(
              "inline-flex min-h-11 items-center text-[13px] font-semibold text-[var(--cw-link)] underline underline-offset-4",
              FOCUS_RING,
            )}
          >
            Use the offer instead
          </button>
        ) : null}
      </div>
    );
  }
}

// --- Booking pieces -----------------------------------------------------------


/** Same-day instant pickup: a full-width option above the timed windows. */
function InstantPickupOption({
  selected,
  onClick,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150",
        FOCUS_RING,
        className,
        selected
          ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-soft)]"
          : "border-[var(--cw-hairline-strong)] bg-white hover:border-[var(--cw-accent)]",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="cw-display block text-[15px] font-bold leading-5 text-[var(--cw-ink)]">
          Instant pickup
        </span>
        <span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--cw-muted)]">
          Within the next hour today
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cx(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-opacity duration-150",
          selected
            ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-strong)] text-white opacity-100"
            : "border-[var(--cw-hairline-strong)] opacity-0",
        )}
      >
        <CheckIcon size={12} />
      </span>
    </button>
  );
}

function SlotButton({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "min-h-12 rounded-xl border px-2 py-2 text-[14px] font-semibold leading-5 tabular-nums transition-colors duration-150",
        FOCUS_RING,
        selected
          ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-strong)] text-white"
          : "border-[var(--cw-hairline-strong)] bg-white text-[var(--cw-text)]",
      )}
    >
      <span className="block">{label}</span>
      {hint ? (
        <span
          className={cx(
            "block text-[12px] font-medium leading-4",
            selected ? "text-white/85" : "text-[var(--cw-link)]",
          )}
        >
          {hint}
        </span>
      ) : null}
    </button>
  );
}
