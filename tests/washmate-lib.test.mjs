import assert from "node:assert/strict";
import test from "node:test";
import {
  computeCustomerPrice,
  estimateCustomerPrice,
  lotsFor,
  formatRupees,
  priceBreakdownLabel,
  priceShapeFromPricingItem,
  servicePriceSummary,
  serviceTilePrice,
} from "../src/lib/washmate/pricing.ts";
import { safeNextPath, loginHref } from "../src/lib/washmate/redirect.ts";

const washFold = { pricePerLot: "149.00", pricePerPiece: null, basePrice: "150.00", baseQuantity: 15, extraUnitPrice: "10.00" };
const iron = { pricePerLot: null, pricePerPiece: "10.00" };

test("threshold pricing charges the base up to the base quantity, then per extra cloth", () => {
  const shape = priceShapeFromPricingItem(washFold);
  assert.deepEqual(shape, { kind: "threshold", basePrice: 150, baseQuantity: 15, extraUnitPrice: 10 });
  assert.equal(computeCustomerPrice(1, shape), 150);
  assert.equal(computeCustomerPrice(15, shape), 150);
  assert.equal(computeCustomerPrice(18, shape), 180);
});

test("per-lot pricing rounds up: 1-15 clothes is one lot, 16 is two", () => {
  const washFold = { pricePerLot: "149.00", pricePerPiece: null, lotSize: 15 };
  assert.equal(estimateCustomerPrice("wash", 1, { wash: washFold }), 149);
  assert.equal(estimateCustomerPrice("wash", 15, { wash: washFold }), 149);
  assert.equal(estimateCustomerPrice("wash", 16, { wash: washFold }), 298);
  assert.equal(estimateCustomerPrice("wash", 45, { wash: washFold }), 447);
  assert.equal(lotsFor(0, 15), 0);
  assert.equal(lotsFor(31, 15), 3);
  // A row without lot_size falls back to the backend default of 15.
  assert.equal(estimateCustomerPrice("wash_and_iron", 20, { wash_and_iron: { pricePerLot: "249.00", pricePerPiece: null } }), 498);
  // Wording matches the customer app (apps/customer-mobile/src/lib/pricing.ts).
  assert.equal(priceBreakdownLabel("wash", 18, { wash: washFold }), "18 clothes · 2 LOTS × ₹149");
  assert.equal(priceBreakdownLabel("wash", 10, { wash: washFold }), "10 clothes · 1 LOT × ₹149");
  assert.equal(servicePriceSummary("wash", { wash: washFold }), "₹149/LOT");
});

test("service tile shows a price for every supported shape", () => {
  assert.equal(serviceTilePrice("wash", { wash: { pricePerLot: "149.00", pricePerPiece: null, lotSize: 15 } }), "₹149/LOT");
  assert.equal(serviceTilePrice("iron_only", { iron_only: { pricePerLot: null, pricePerPiece: "10.00" } }), "₹10 / piece");
  assert.equal(
    serviceTilePrice("wash", { wash: { pricePerLot: null, pricePerPiece: null, basePrice: "150.00", baseQuantity: 15, extraUnitPrice: "10.00" } }),
    "from ₹150",
  );
  assert.equal(serviceTilePrice("wash", {}), null);
});

test("per-piece pricing multiplies by the clothes count", () => {
  assert.equal(estimateCustomerPrice("iron_only", 4, { iron_only: iron }), 40);
});

test("unknown pricing or nonsense counts yield no number rather than a guess", () => {
  assert.equal(estimateCustomerPrice("wash", 5, {}), null);
  // A lot rate is a supported shape now; only a row with no usable rate is unknown.
  assert.deepEqual(priceShapeFromPricingItem({ pricePerLot: "149", pricePerPiece: null }), { kind: "per_lot", pricePerLot: 149, lotSize: 15 });
  assert.equal(computeCustomerPrice(0, priceShapeFromPricingItem(iron)), null);
  assert.equal(computeCustomerPrice(2.5, priceShapeFromPricingItem(iron)), null);
  assert.equal(priceShapeFromPricingItem({ pricePerLot: null, pricePerPiece: "" }), null);
});

test("labels describe the arithmetic the total uses", () => {
  assert.equal(priceBreakdownLabel("wash", 8, { wash: washFold }), "8 clothes · ₹150 (up to 15)");
  assert.equal(priceBreakdownLabel("wash", 18, { wash: washFold }), "18 clothes · ₹150 + 3 × ₹10");
  assert.equal(priceBreakdownLabel("iron_only", 4, { iron_only: iron }), "4 clothes × ₹10");
  assert.equal(servicePriceSummary("wash", { wash: washFold }), "₹150 for up to 15, then ₹10/extra");
  assert.equal(servicePriceSummary("iron_only", { iron_only: iron }), "₹10/cloth");
});

test("rupee formatting keeps paise only when present", () => {
  assert.equal(formatRupees("500.00"), "₹500");
  assert.equal(formatRupees("12.50"), "₹12.50");
  assert.equal(formatRupees(null), "₹0");
  assert.equal(formatRupees("-3"), "₹0");
});

test("post-login redirects stay on this site", () => {
  assert.equal(safeNextPath("/order?id=abc"), "/order?id=abc");
  assert.equal(safeNextPath("https://evil.example"), "/book");
  assert.equal(safeNextPath("//evil.example"), "/book");
  assert.equal(safeNextPath("/\\evil.example"), "/book");
  assert.equal(safeNextPath(null, "/orders"), "/orders");
  assert.equal(loginHref("/order?id=1&placed=1"), "/login?next=%2Forder%3Fid%3D1%26placed%3D1");
});
