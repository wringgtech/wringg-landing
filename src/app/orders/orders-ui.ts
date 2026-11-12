// Pure mapping helpers for the My orders screen. No runtime imports so the
// node:test suite can load this file directly.

export type OrderStatusTone = "success" | "danger" | "info";

/**
 * StatusDot tone for an order: finished orders are green, cancelled is red,
 * everything in progress is brand blue.
 */
export function statusToneFor(fulfillmentState: string): OrderStatusTone {
  if (fulfillmentState === "delivered") return "success";
  if (fulfillmentState === "cancelled") return "danger";
  return "info";
}

/** "1 cloth" / "18 clothes" — the list should never say "1 clothes". */
export function itemCountLabel(count: number): string {
  return `${count} ${count === 1 ? "cloth" : "clothes"}`;
}

/** "1 active order" / "8 active orders". */
export function activeOrdersLabel(count: number): string {
  return `${count} active ${count === 1 ? "order" : "orders"}`;
}
