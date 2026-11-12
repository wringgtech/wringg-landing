// Booking-summary price estimate, ported from
// washmate/apps/customer-mobile/src/lib/pricing.ts.
//
// No rate lives here: the shape comes from pricing-get-active. The amount
// actually charged is decided by the backend at order creation; this only
// keeps the summary consistent with it. Unknown pricing returns null so the UI
// can say "confirmed at checkout" instead of inventing a number.

import type { ServiceType } from "./types";

export type ServicePriceShape =
  | { kind: "threshold"; basePrice: number; baseQuantity: number; extraUnitPrice: number }
  | { kind: "per_lot"; pricePerLot: number; lotSize: number }
  | { kind: "per_piece"; perCloth: number };

export interface PricingItemLike {
  pricePerLot: string | null;
  pricePerPiece: string | null;
  /** Garments per lot (1 LOT = 15 pieces at launch). Defaults to 15 when absent. */
  lotSize?: number | null;
  basePrice?: string | null;
  baseQuantity?: number | null;
  extraUnitPrice?: string | null;
}

/** Garments in one lot when the pricing row does not say. Matches the backend default. */
export const DEFAULT_LOT_SIZE = 15;

export type PricingByType = Partial<Record<ServiceType, PricingItemLike | undefined>>;

function toFiniteNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function priceShapeFromPricingItem(item: PricingItemLike | null | undefined): ServicePriceShape | null {
  if (!item) return null;

  const basePrice = toFiniteNumber(item.basePrice);
  const baseQuantity = toFiniteNumber(item.baseQuantity);
  const extraUnitPrice = toFiniteNumber(item.extraUnitPrice);
  if (
    basePrice !== null && basePrice >= 0 &&
    baseQuantity !== null && Number.isSafeInteger(baseQuantity) && baseQuantity >= 1 &&
    extraUnitPrice !== null && extraUnitPrice >= 0
  ) {
    return { kind: "threshold", basePrice, baseQuantity, extraUnitPrice };
  }

  const perCloth = toFiniteNumber(item.pricePerPiece);
  if (perCloth !== null && perCloth >= 0) return { kind: "per_piece", perCloth };

  // Per-lot pricing: the live Wash & Fold and Wash & Iron rows carry a lot rate
  // (₹149 / ₹249 per lot) instead of the threshold columns, so a lot rate is a
  // supported shape, not an unknown one. Round up: part of a lot costs a lot.
  const perLot = toFiniteNumber(item.pricePerLot);
  if (perLot !== null && perLot >= 0) {
    const lotSize = toFiniteNumber(item.lotSize);
    return {
      kind: "per_lot",
      pricePerLot: perLot,
      lotSize: lotSize !== null && Number.isSafeInteger(lotSize) && lotSize >= 1 ? lotSize : DEFAULT_LOT_SIZE,
    };
  }

  return null;
}

export function extraClothesFor(itemCount: number, baseQuantity: number): number {
  return Math.max(0, itemCount - baseQuantity);
}

/** Lots a clothes count needs, rounding up: 1–15 → 1, 16 → 2. */
export function lotsFor(clothesCount: number, lotSize: number): number {
  if (!Number.isSafeInteger(clothesCount) || clothesCount < 1) return 0;
  const size = Number.isSafeInteger(lotSize) && lotSize >= 1 ? lotSize : DEFAULT_LOT_SIZE;
  return Math.ceil(clothesCount / size);
}

export function computeCustomerPrice(
  clothesCount: number,
  shape: ServicePriceShape | null | undefined,
): number | null {
  if (!shape) return null;
  if (!Number.isSafeInteger(clothesCount) || clothesCount < 1) return null;

  const total =
    shape.kind === "threshold"
      ? shape.basePrice + extraClothesFor(clothesCount, shape.baseQuantity) * shape.extraUnitPrice
      : shape.kind === "per_lot"
        ? lotsFor(clothesCount, shape.lotSize) * shape.pricePerLot
        : clothesCount * shape.perCloth;

  return Number.isFinite(total) && total >= 0 ? Math.round(total * 100) / 100 : null;
}

export function estimateCustomerPrice(
  serviceType: ServiceType,
  clothesCount: number,
  pricingByType: PricingByType,
): number | null {
  return computeCustomerPrice(clothesCount, priceShapeFromPricingItem(pricingByType[serviceType]));
}

/** "8 clothes · ₹150 (up to 15)" / "18 clothes · ₹150 + 3 × ₹10" / "4 clothes × ₹15". */
export function priceBreakdownLabel(
  serviceType: ServiceType,
  clothesCount: number,
  pricingByType: PricingByType,
): string | null {
  const shape = priceShapeFromPricingItem(pricingByType[serviceType]);
  if (!shape || !Number.isSafeInteger(clothesCount) || clothesCount < 1) return null;

  if (shape.kind === "per_piece") return `${clothesCount} clothes × ₹${shape.perCloth}`;

  if (shape.kind === "per_lot") {
    const lots = lotsFor(clothesCount, shape.lotSize);
    return `${clothesCount} clothes · ${lots} LOT${lots === 1 ? "" : "S"} × ₹${shape.pricePerLot}`;
  }

  const extra = extraClothesFor(clothesCount, shape.baseQuantity);
  if (extra === 0) return `${clothesCount} clothes · ₹${shape.basePrice} (up to ${shape.baseQuantity})`;
  return `${clothesCount} clothes · ₹${shape.basePrice} + ${extra} × ₹${shape.extraUnitPrice}`;
}

/**
 * Short price shown on a service tile: "₹149 / lot", "₹10 / piece" or
 * "from ₹150". Null when the row carries no rate this client understands, so
 * the caller can say "Price at checkout" instead of inventing one.
 */
export function serviceTilePrice(serviceType: ServiceType, pricingByType: PricingByType): string | null {
  const shape = priceShapeFromPricingItem(pricingByType[serviceType]);
  if (!shape) return null;
  if (shape.kind === "per_lot") return `₹${shape.pricePerLot}/LOT`;
  if (shape.kind === "per_piece") return `₹${shape.perCloth} / piece`;
  return `from ₹${shape.basePrice}`;
}

/** Tile summary: "₹150 for up to 15, then ₹10/extra" or "₹15/cloth". */
export function servicePriceSummary(serviceType: ServiceType, pricingByType: PricingByType): string | null {
  const shape = priceShapeFromPricingItem(pricingByType[serviceType]);
  if (!shape) return null;
  if (shape.kind === "threshold") {
    return `₹${shape.basePrice} for up to ${shape.baseQuantity}, then ₹${shape.extraUnitPrice}/extra`;
  }
  if (shape.kind === "per_lot") return `₹${shape.pricePerLot}/LOT`;
  return `₹${shape.perCloth}/cloth`;
}

// --- Display formatting (presentation only; amounts come from the server) ------

function parseAmount(amount: string | number | null | undefined): number | null {
  if (amount == null || amount === "") return null;
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  return Number.isFinite(value) ? value : null;
}

/** "500.00" -> "₹500", "12.50" -> "₹12.50". Unusable input -> "₹0". */
export function formatRupees(amount: string | number | null | undefined): string {
  const value = parseAmount(amount);
  if (value === null || value <= 0) return "₹0";
  return Number.isInteger(value) ? `₹${value}` : `₹${value.toFixed(2)}`;
}

/**
 * "500" -> "₹500.00" — two decimals always, the way totals someone OWES are
 * shown (apps/customer-mobile/src/lib/money.ts formatRupeesExact).
 */
export function formatRupeesExact(amount: string | number | null | undefined): string {
  const value = parseAmount(amount);
  if (value === null) return "₹0.00";
  if (value < 0) return `-₹${Math.abs(value).toFixed(2)}`;
  return `₹${value.toFixed(2)}`;
}

/**
 * The <Money> primitive's formatter: ₹ with Indian digit grouping (en-IN:
 * thousands become lakhs/crores, e.g. ₹12,345.50) and no decimals unless the
 * amount actually has paise.
 */
export function formatRupeesIndian(amount: string | number | null | undefined): string {
  const value = parseAmount(amount);
  if (value === null || value <= 0) return "₹0";
  const hasPaise = Math.round(value * 100) % 100 !== 0;
  const grouped = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(value);
  return `₹${grouped}`;
}

/** Number form of a server decimal string, or null. */
export function amountToNumber(amount: string | number | null | undefined): number | null {
  return parseAmount(amount);
}
