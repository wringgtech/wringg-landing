// Customer-facing labels. Never show raw enum values.

import type { FulfillmentState, ServiceType } from "./types";

export const SERVICE_LABELS: Record<ServiceType, { name: string; detail: string }> = {
  wash: { name: "Wash & Fold", detail: "Washed, dried and neatly folded" },
  wash_and_iron: { name: "Wash & Iron", detail: "Washed, dried and pressed" },
  iron_only: { name: "Steam Iron", detail: "Crisp press for clean clothes" },
};

const FULFILLMENT_LABELS: Record<FulfillmentState, string> = {
  placed: "Order placed",
  host_assignment_pending: "Finding a nearby host",
  host_assigned: "Host assigned",
  pickup_rider_assignment_pending: "Arranging pickup",
  pickup_rider_assigned: "Pickup scheduled",
  pickup_in_progress: "Pickup on the way",
  picked_up: "Picked up",
  received_by_host: "With your host",
  washing: "Washing",
  drying: "Drying",
  folding_or_ironing: "Folding / ironing",
  ready_for_return: "Ready for return",
  delivery_rider_assignment_pending: "Arranging delivery",
  delivery_rider_assigned: "Delivery scheduled",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function fulfillmentLabel(state: string): string {
  return FULFILLMENT_LABELS[state as FulfillmentState] ?? "In progress";
}

export function serviceLabel(type: string): string {
  return SERVICE_LABELS[type as ServiceType]?.name ?? "Laundry";
}
