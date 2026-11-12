import assert from "node:assert/strict";
import test from "node:test";
import {
  ORDER_MILESTONES,
  canShowDeliveryCode,
  formatOrderTime,
  isValidOrderId,
  milestoneIndex,
  nextStepFor,
  orderMilestones,
  paymentStateLabel,
  pickupLabel,
  shortOrderId,
} from "../src/app/order/order-helpers.ts";

test("keeps the five customer milestones in order", () => {
  assert.deepEqual(
    ORDER_MILESTONES.map((milestone) => milestone.label),
    ["Booked", "Picked up", "Cleaning", "Out for delivery", "Delivered"],
  );
});

test("maps every fulfillment state to a milestone", () => {
  const expected = {
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

  for (const [state, index] of Object.entries(expected)) {
    assert.equal(milestoneIndex(state), index, state);
  }
  assert.equal(Object.keys(expected).length, 17);
});

test("marks completed, current and upcoming milestones", () => {
  const milestones = orderMilestones("washing");
  assert.equal(milestones.length, ORDER_MILESTONES.length);
  assert.deepEqual(
    milestones.map((milestone) => milestone.status),
    ["complete", "complete", "current", "upcoming", "upcoming"],
  );
  assert.equal(milestones[2].label, "Cleaning");
});

test("marks every earlier milestone complete for a delivered order", () => {
  assert.deepEqual(
    orderMilestones("delivered").map((milestone) => milestone.status),
    ["complete", "complete", "complete", "complete", "current"],
  );
  assert.deepEqual(
    orderMilestones("placed").map((milestone) => milestone.status),
    ["current", "upcoming", "upcoming", "upcoming", "upcoming"],
  );
});

test("has no milestone track for a cancelled order", () => {
  assert.deepEqual(orderMilestones("cancelled"), []);
});

test("labels every payment state for the customer", () => {
  assert.equal(paymentStateLabel("not_due"), "Pay on delivery");
  assert.equal(paymentStateLabel("payment_requested"), "Payment requested");
  assert.equal(paymentStateLabel("paid"), "Paid");
  assert.equal(paymentStateLabel("payment_pending_exception"), "Payment issue — we'll follow up");
  assert.equal(paymentStateLabel("refund_pending"), "Refund pending");
  assert.equal(paymentStateLabel("refunded"), "Refunded");
  assert.equal(paymentStateLabel("partially_refunded"), "Partially refunded");
});

test("labels instant and scheduled pickups in IST", () => {
  assert.equal(pickupLabel("instant"), "Instant pickup");
  assert.equal(pickupLabel("2026-11-13T10:00:00+05:30"), "Fri, 13 Nov · 10:00 AM");
  assert.equal(pickupLabel("2026-11-13T04:30:00Z"), "Fri, 13 Nov · 10:00 AM");
  assert.equal(pickupLabel("2026-11-13T13:05:00+05:30"), "Fri, 13 Nov · 1:05 PM");
  assert.equal(pickupLabel("2026-11-13T00:15:00+05:30"), "Fri, 13 Nov · 12:15 AM");
});

test("never echoes an unparseable pickup slot", () => {
  assert.equal(pickupLabel("later"), "Pickup scheduled");
  assert.equal(pickupLabel(""), "Pickup scheduled");
});

test("formats order timestamps in IST and omits unparseable ones", () => {
  assert.equal(formatOrderTime("2026-11-12T18:31:00Z"), "Fri, 13 Nov · 12:01 AM");
  assert.equal(formatOrderTime("not-a-date"), null);
});

test("hides the delivery code only for delivered or cancelled orders", () => {
  assert.equal(canShowDeliveryCode({ deliveryOtp: "1234", fulfillmentState: "washing" }), true);
  assert.equal(canShowDeliveryCode({ deliveryOtp: "1234", fulfillmentState: "out_for_delivery" }), true);
  assert.equal(canShowDeliveryCode({ deliveryOtp: "1234", fulfillmentState: "delivered" }), false);
  assert.equal(canShowDeliveryCode({ deliveryOtp: "1234", fulfillmentState: "cancelled" }), false);
  assert.equal(canShowDeliveryCode({ deliveryOtp: null, fulfillmentState: "washing" }), false);
});

test("accepts only UUID order ids", () => {
  assert.equal(isValidOrderId("6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b"), true);
  assert.equal(isValidOrderId("6F1D2C3B-4A5E-4F60-8A7B-9C0D1E2F3A4B"), true);
  assert.equal(isValidOrderId(null), false);
  assert.equal(isValidOrderId(""), false);
  assert.equal(isValidOrderId("not-an-order"), false);
  assert.equal(isValidOrderId("6f1d2c3b-4a5e-4f60-8a7b"), false);
});

test("shows the same uppercase eight-character short id as My orders", () => {
  assert.equal(shortOrderId("6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b"), "6F1D2C3B");
});

test("gives every fulfillment state a next-step sentence", () => {
  const sentences = {
    placed: "We've received your order and we're finding a nearby host.",
    host_assignment_pending:
      "We're matching a nearby host. This usually takes a few minutes.",
    host_assigned: "A nearby host is assigned. We're arranging your pickup.",
    pickup_rider_assignment_pending:
      "Your host is set. We're arranging a pickup rider.",
    pickup_rider_assigned:
      "A pickup rider is assigned and will collect your clothes in your slot.",
    pickup_in_progress: "Your clothes are being collected now.",
    picked_up: "Your clothes are picked up and on the way to your host.",
    received_by_host: "Your host has your clothes and will start the care.",
    washing: "Your clothes are being washed.",
    drying: "Your clothes are drying.",
    folding_or_ironing: "Your clothes are being folded or ironed.",
    ready_for_return: "Your clothes are ready. We're arranging delivery.",
    delivery_rider_assignment_pending:
      "Your clothes are ready. We're arranging a delivery rider.",
    delivery_rider_assigned:
      "A delivery rider is assigned and will bring your clothes back.",
    out_for_delivery:
      "Your clothes are on the way. Share the code below when they arrive.",
    delivered: "Delivered. Thanks for choosing WRINGG.",
    cancelled:
      "This order was cancelled, so no pickup or delivery is scheduled.",
  };

  for (const [state, sentence] of Object.entries(sentences)) {
    assert.equal(nextStepFor(state), sentence);
  }
  assert.match(nextStepFor("something_new"), /latest update/i);
});
