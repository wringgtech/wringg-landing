// Request/response shapes for the Washmate customer backend.
//
// Ported from washmate/packages/domain/src (auth, customer, address, zone,
// slot, pricing, order) and apps/customer-mobile/src/api. The website cannot
// import that workspace package, so keep these in step with it by hand.

export type ServiceType = "wash" | "wash_and_iron" | "iron_only";

export const SERVICE_TYPES: readonly ServiceType[] = ["wash", "wash_and_iron", "iron_only"];

export type FulfillmentState =
  | "placed"
  | "host_assignment_pending"
  | "host_assigned"
  | "pickup_rider_assignment_pending"
  | "pickup_rider_assigned"
  | "pickup_in_progress"
  | "picked_up"
  | "received_by_host"
  | "washing"
  | "drying"
  | "folding_or_ironing"
  | "ready_for_return"
  | "delivery_rider_assignment_pending"
  | "delivery_rider_assigned"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentState =
  | "not_due"
  | "payment_requested"
  | "paid"
  | "payment_pending_exception"
  | "refund_pending"
  | "refunded"
  | "partially_refunded";

// --- Auth --------------------------------------------------------------------

export interface RequestOtpInput {
  /** E.164, e.g. "+919876543210". */
  phone: string;
}

export interface RequestOtpResult {
  success: boolean;
  retryAfterSeconds: number;
  sessionId?: string;
  devMode?: boolean;
}

export interface VerifyOtpInput {
  phone: string;
  otp: string;
  sessionId: string;
}

export interface VerifyOtpResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  appRole: "partner" | "customer" | "admin" | null;
  isNewUser: boolean;
  profileName?: string | null;
  customer: { hasProfile: boolean } | null;
}

// --- Customer profile ----------------------------------------------------------

export interface CompleteProfileInput {
  fullName: string;
  displayName?: string;
  email?: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  fullName: string;
  displayName: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteProfileResult {
  profile: CustomerProfile;
}

// --- Profile edits and dues ------------------------------------------------------

/** What /account/profile may patch. Omitted keys are left unchanged; null clears. */
export interface UpdateProfileInput {
  fullName: string;
  displayName?: string | null;
  email?: string | null;
}

export interface CustomerDue {
  id: string;
  customerId: string;
  orderId: string;
  amountDue: string;
  dueReason: string;
  isCleared: boolean;
  clearedAt: string | null;
  createdAt: string;
}

export interface GetCustomerDuesResponse {
  dues: CustomerDue[];
  /** Decimal string; "0.00" when nothing is owed. */
  totalDue: string;
}

// --- Addresses and zones ------------------------------------------------------

export interface CreateAddressInput {
  label: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  googlePlaceId: string | null;
  isServiceable: boolean | null;
  serviceZoneId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressResult {
  address: Address;
  isServiceable: boolean;
  serviceZoneId: string | null;
}

export interface CheckServiceabilityInput {
  latitude: number;
  longitude: number;
}

export interface CheckServiceabilityResult {
  isServiceable: boolean;
  zone: { id: string; name: string } | null;
}

// --- Dashboard ----------------------------------------------------------------

export interface ActiveOrderSummary {
  id: string;
  itemCount: number;
  estimatedTotal: number;
  fulfillmentState: string;
}

export interface CustomerDashboardResult {
  addresses: Address[];
  activeOrders: ActiveOrderSummary[];
  /** Lifetime count of non-cancelled orders. */
  totalOrders: number;
  activeOrderCount?: number;
}

// --- Pricing and coupons --------------------------------------------------------

export interface PricingItem {
  id: string;
  pricingVersionId: string;
  serviceType: ServiceType;
  pricePerLot: string | null;
  pricePerPiece: string | null;
  minPieces: number | null;
  lotSize: number;
  basePrice?: string | null;
  baseQuantity?: number | null;
  extraUnitPrice?: string | null;
}

export interface GetActivePricingResult {
  pricingVersionId: string;
  versionLabel: string;
  effectiveFrom: string;
  item: PricingItem;
}

export interface ValidateCouponRequest {
  couponCode: string;
  addressId: string;
  serviceType: ServiceType;
  itemCount: number;
}

export interface ValidateCouponResult {
  valid: boolean;
  couponCode?: string;
  reason?: string;
  /** Customer-safe explanation when invalid. */
  message?: string;
  /** Decimal strings, all computed by the server. */
  grossAmount?: string;
  maxDiscount?: string;
  discountAmount?: string;
  payableAmount?: string;
  isWaived?: boolean;
}

export interface MyCouponEligibility {
  isFirstOrder: boolean;
  eligibleCoupon: { code: string; label: string; maxDiscount: string } | null;
  hasRedeemed: boolean;
}

// --- Slots --------------------------------------------------------------------

export interface AvailableSlot {
  /** Pass this back to orders-create unchanged. */
  slotKey: string;
  startsAt: string;
  endsAt: string;
}

export interface GetAvailableSlotsInput {
  addressId: string;
  serviceType: ServiceType;
  /** YYYY-MM-DD in zone-local time; defaults to today. */
  date?: string;
}

export interface GetAvailableSlotsResult {
  slots: AvailableSlot[];
  instantPickupAvailable: boolean;
}

// --- Orders -------------------------------------------------------------------

/**
 * Cash on delivery only: the website never sends a `payment` proof.
 * `expectedTotal` is the payable amount the customer reviewed; the backend
 * answers 409 when its own total differs.
 */
export interface CreateOrderInput {
  addressId: string;
  serviceType: ServiceType;
  /** "instant" or a slotKey returned by slots-get-available-slots. */
  pickupSlot: string;
  itemCount: number;
  couponCode?: string | null;
  expectedTotal?: number;
}

export interface Order {
  id: string;
  customerId: string;
  addressId: string;
  serviceZoneId: string;
  serviceType: ServiceType;
  pricingVersionId: string;
  itemCount: number;
  lotCount: number;
  /** Payable amount after any coupon (decimal string). */
  estimatedPrice: string;
  grossPrice?: string;
  discountAmount?: string;
  couponCode?: string | null;
  isWaived?: boolean;
  pickupSlot: string;
  hostId: string | null;
  deliveryOtp: string | null;
  fulfillmentState: FulfillmentState;
  paymentState: PaymentState;
  issueState: string;
  complaintState: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderResult {
  order: Order;
}

export interface GetOrderByIdResult {
  order: Order & {
    pickupRiderId: string | null;
    pickupProof: string | null;
    hostReceiptProof: string | null;
    deliveryRiderId: string | null;
    payment: { id: string; amount: string; paymentState: string; paidAt: string | null } | null;
    rating: { overallRating: number; submittedAt: string } | null;
    complaint: { id: string; complaintType: string; complaintState: string; createdAt: string } | null;
  };
}
