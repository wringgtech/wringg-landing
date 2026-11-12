// Pure helpers for the order-status page. No runtime imports: tests load
// this file directly with `node --experimental-strip-types`.
import type { FulfillmentState, PaymentState } from "@/lib/washmate/types";

export type MilestoneKey =
  | "booked"
  | "picked_up"
  | "cleaning"
  | "out_for_delivery"
  | "delivered";

export interface OrderMilestone {
  key: MilestoneKey;
  label: string;
}

export type MilestoneStatus = "complete" | "current" | "upcoming";

/** The five customer-facing milestones shown on the order page. */
export const ORDER_MILESTONES: readonly OrderMilestone[] = [
  { key: "booked", label: "Booked" },
  { key: "picked_up", label: "Picked up" },
  { key: "cleaning", label: "Cleaning" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

// Cancelled orders leave the milestone track entirely (-1) and render a
// cancellation notice instead.
const MILESTONE_INDEX: Record<FulfillmentState, number> = {
  placed: 0,
  host_assignment_pending: 0,
  host_assigned: 0,
  pickup_rider_assignment_pending: 1,
  pickup_rider_assigned: 1,
  pickup_in_progress: 1,
  picked_up: 1,
  received_by_host: 1,
  washing: 2,
  drying: 2,
  folding_or_ironing: 2,
  ready_for_return: 2,
  delivery_rider_assignment_pending: 3,
  delivery_rider_assigned: 3,
  out_for_delivery: 3,
  delivered: 4,
  cancelled: -1,
};

/** -1 for a cancelled order; the five milestones otherwise. */
export function milestoneIndex(state: FulfillmentState): number {
  return MILESTONE_INDEX[state] ?? 0;
}

/**
 * Every milestone, marked complete before the current one and current at it.
 * Cancelled orders have no track and return an empty list.
 */
export function orderMilestones(
  state: FulfillmentState,
): Array<OrderMilestone & { status: MilestoneStatus }> {
  const current = milestoneIndex(state);
  if (current < 0) return [];
  return ORDER_MILESTONES.map((milestone, index) => ({
    ...milestone,
    status: index < current ? "complete" : index === current ? "current" : "upcoming",
  }));
}

/** Customer-facing payment state; never the raw enum. */
export function paymentStateLabel(state: PaymentState): string {
  switch (state) {
    case "not_due":
      return "Pay on delivery";
    case "payment_requested":
      return "Payment requested";
    case "paid":
      return "Paid";
    case "payment_pending_exception":
      return "Payment issue — we'll follow up";
    case "refund_pending":
      return "Refund pending";
    case "refunded":
      return "Refunded";
    case "partially_refunded":
      return "Partially refunded";
    default:
      return "Pay on delivery";
  }
}

/**
 * One plain sentence under the status heading: what is happening now and,
 * where useful, what the customer should expect next. Every fulfillment
 * state has a sentence so the page never leaves the customer guessing.
 */
export function nextStepFor(state: FulfillmentState): string {
  switch (state) {
    case "placed":
      return "We've received your order and we're finding a nearby host.";
    case "host_assignment_pending":
      return "We're matching a nearby host. This usually takes a few minutes.";
    case "host_assigned":
      return "A nearby host is assigned. We're arranging your pickup.";
    case "pickup_rider_assignment_pending":
      return "Your host is set. We're arranging a pickup rider.";
    case "pickup_rider_assigned":
      return "A pickup rider is assigned and will collect your clothes in your slot.";
    case "pickup_in_progress":
      return "Your clothes are being collected now.";
    case "picked_up":
      return "Your clothes are picked up and on the way to your host.";
    case "received_by_host":
      return "Your host has your clothes and will start the care.";
    case "washing":
      return "Your clothes are being washed.";
    case "drying":
      return "Your clothes are drying.";
    case "folding_or_ironing":
      return "Your clothes are being folded or ironed.";
    case "ready_for_return":
      return "Your clothes are ready. We're arranging delivery.";
    case "delivery_rider_assignment_pending":
      return "Your clothes are ready. We're arranging a delivery rider.";
    case "delivery_rider_assigned":
      return "A delivery rider is assigned and will bring your clothes back.";
    case "out_for_delivery":
      return "Your clothes are on the way. Share the code below when they arrive.";
    case "delivered":
      return "Delivered. Thanks for choosing WRINGG.";
    case "cancelled":
      return "This order was cancelled, so no pickup or delivery is scheduled.";
    default:
      return "We're checking the latest update. Refresh for the latest status.";
  }
}

// Asia/Kolkata is a fixed UTC+05:30 offset (no daylight saving).
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/**
 * "Fri, 13 Nov · 10:00 AM" in Asia/Kolkata. Null for unparseable input, so
 * callers can omit a caption rather than print an empty timestamp.
 */
export function formatOrderTime(value: string): string | null {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;

  const shifted = new Date(time + IST_OFFSET_MS);
  const hour24 = shifted.getUTCHours();
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minute = String(shifted.getUTCMinutes()).padStart(2, "0");
  const meridiem = hour24 < 12 ? "AM" : "PM";
  return `${WEEKDAYS[shifted.getUTCDay()]}, ${shifted.getUTCDate()} ${MONTHS[shifted.getUTCMonth()]} · ${hour12}:${minute} ${meridiem}`;
}

/**
 * "Instant pickup" for the instant value, otherwise the slot start in
 * Asia/Kolkata, e.g. "Fri, 13 Nov · 10:00 AM". Never echoes an unparseable
 * value to the customer.
 */
export function pickupLabel(pickupSlot: string): string {
  if (pickupSlot === "instant") return "Instant pickup";
  return formatOrderTime(pickupSlot) ?? "Pickup scheduled";
}

/** The delivery code is useless (and a leak) once the order is closed. */
export function canShowDeliveryCode(order: {
  deliveryOtp: string | null;
  fulfillmentState: FulfillmentState;
}): boolean {
  return (
    Boolean(order.deliveryOtp) &&
    order.fulfillmentState !== "delivered" &&
    order.fulfillmentState !== "cancelled"
  );
}

export function isValidOrderId(value: string | null | undefined): boolean {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
  );
}

/** `#` + the first 8 characters, uppercased like the My orders list. */
export function shortOrderId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
