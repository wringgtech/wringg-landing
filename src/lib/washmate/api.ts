// Endpoint wrappers. Every call that needs a signed-in customer takes the
// access token; wrap it in `withAuth` (./session) to get refresh-and-retry.

import { apiFetch } from "./client";
import type {
  CheckServiceabilityInput,
  CheckServiceabilityResult,
  CompleteProfileInput,
  CompleteProfileResult,
  CreateAddressInput,
  CreateAddressResult,
  CreateOrderInput,
  CreateOrderResult,
  CustomerDashboardResult,
  CustomerProfile,
  GetCustomerDuesResponse,
  GetActivePricingResult,
  GetAvailableSlotsInput,
  GetAvailableSlotsResult,
  GetOrderByIdResult,
  MyCouponEligibility,
  RequestOtpInput,
  RequestOtpResult,
  ServiceType,
  UpdateProfileInput,
  ValidateCouponRequest,
  ValidateCouponResult,
  VerifyOtpInput,
  VerifyOtpResult,
} from "./types";

// --- Auth (no token) --------------------------------------------------------------

export function requestOtp(input: RequestOtpInput): Promise<RequestOtpResult> {
  return apiFetch("/functions/v1/auth-request-otp", { body: input });
}

export function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
  return apiFetch("/functions/v1/auth-verify-otp", { body: input });
}

// --- Customer -----------------------------------------------------------------------

export function completeProfile(input: CompleteProfileInput, token: string): Promise<CompleteProfileResult> {
  return apiFetch("/functions/v1/customer-complete-profile", { body: input, token });
}

/**
 * Reads the signed-in customer's profile row straight from PostgREST, the same
 * way the app does (apps/customer-mobile/src/api/customer.ts). Returns null
 * when no row exists yet, which means the create path applies.
 */
export async function getCustomerProfile(token: string): Promise<CustomerProfile | null> {
  const rows = await apiFetch<Array<Record<string, unknown>>>(
    "/rest/v1/customer_profiles",
    {
      method: "GET",
      token,
      query: { select: "id,user_id,full_name,display_name,email,phone,created_at,updated_at", limit: "1" },
    },
  );
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const row = rows[0];
  return {
    id: String(row.id ?? ""),
    userId: String(row.user_id ?? ""),
    fullName: String(row.full_name ?? ""),
    displayName: typeof row.display_name === "string" ? row.display_name : null,
    email: typeof row.email === "string" ? row.email : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

/**
 * Partial profile update. `undefined` leaves a column untouched; an explicit
 * null clears it. Pass nothing you have not loaded, or a failed read would
 * silently blank stored data (the app guards this the same way).
 */
export async function updateCustomerProfile(
  input: UpdateProfileInput,
  token: string,
): Promise<CustomerProfile> {
  const patch: Record<string, unknown> = { full_name: input.fullName.trim() };
  if (input.displayName !== undefined) {
    patch.display_name = input.displayName === null ? null : input.displayName.trim();
  }
  if (input.email !== undefined) {
    patch.email = input.email === null ? null : input.email.trim();
  }
  const rows = await apiFetch<Array<Record<string, unknown>>>("/rest/v1/customer_profiles", {
    method: "PATCH",
    token,
    body: patch,
    headers: { Prefer: "return=representation" },
  });
  const row = Array.isArray(rows) && rows[0] ? rows[0] : {};
  return {
    id: String(row.id ?? ""),
    userId: String(row.user_id ?? ""),
    fullName: String(row.full_name ?? input.fullName),
    displayName: typeof row.display_name === "string" ? row.display_name : (input.displayName ?? null),
    email: typeof row.email === "string" ? row.email : (input.email ?? null),
    createdAt: typeof row.created_at === "string" ? row.created_at : "",
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : "",
  };
}

/** Outstanding dues on the customer's account (customer-dues-get). */
export function getCustomerDues(token: string): Promise<GetCustomerDuesResponse> {
  return apiFetch("/functions/v1/customer-dues-get", { method: "GET", token });
}

export function getCustomerDashboard(token: string): Promise<CustomerDashboardResult> {
  return apiFetch("/functions/v1/customer-dashboard", { method: "GET", token });
}

export function checkServiceability(
  input: CheckServiceabilityInput,
  token: string,
): Promise<CheckServiceabilityResult> {
  return apiFetch("/functions/v1/zones-check-serviceability", { body: input, token });
}

export function createAddress(input: CreateAddressInput, token: string): Promise<CreateAddressResult> {
  return apiFetch("/functions/v1/customer-create-address", { body: input, token });
}

// --- Booking --------------------------------------------------------------------------

export function getActivePricing(serviceType: ServiceType, token: string): Promise<GetActivePricingResult> {
  return apiFetch("/functions/v1/pricing-get-active", { body: { serviceType }, token });
}

export function getAvailableSlots(input: GetAvailableSlotsInput, token: string): Promise<GetAvailableSlotsResult> {
  return apiFetch("/functions/v1/slots-get-available-slots", { body: input, token });
}

export function getMyCouponEligibility(token: string): Promise<MyCouponEligibility> {
  return apiFetch("/functions/v1/coupons-my-eligibility", { method: "GET", token });
}

/** The server prices the coupon; the client never computes a discount. */
export function validateCoupon(input: ValidateCouponRequest, token: string): Promise<ValidateCouponResult> {
  return apiFetch("/functions/v1/coupons-validate", { body: input, token });
}

/**
 * Server quote for a cash-on-delivery booking, exactly as the customer app does
 * it (apps/customer-mobile/src/api/payments.ts quoteCheckout). The backend prices
 * the booking and returns the payable total; the client never guesses it. A
 * quote is required even though no online payment is taken — see
 * supabase/functions/payments-create-checkout: "Quotes are still needed for COD
 * pricing."
 */
export function quoteCheckout(
  input: CreateOrderInput & { couponCode?: string | null },
  token: string,
): Promise<{ amount: string; subtotal: string; discount: string; appliedCoupon: string | null }> {
  return apiFetch("/functions/v1/payments-create-checkout", {
    body: { ...input, quoteOnly: true },
    token,
  });
}

/** Cash on delivery. A 409 means the price changed: re-quote and ask again. */
export function createOrder(input: CreateOrderInput, token: string): Promise<CreateOrderResult> {
  return apiFetch("/functions/v1/orders-create", { body: input, token });
}

export function getOrderById(orderId: string, token: string): Promise<GetOrderByIdResult> {
  return apiFetch("/functions/v1/orders-get-by-id", { method: "GET", token, query: { orderId } });
}
