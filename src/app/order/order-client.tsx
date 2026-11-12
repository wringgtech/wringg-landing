"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookingUnavailable,
  CustomerShell,
  LoadingBlock,
  useRequireSession,
} from "@/components/customer/customer-shell";
import {
  CareSymbols,
  CheckIcon,
  RefreshIcon,
  WhatsAppIcon,
} from "@/components/customer/icons";
import {
  Button,
  Notice,
  Skeleton,
  TagCard,
  TagPerforation,
  TagRow,
  TagTotal,
} from "@/components/customer/ui";
import { cx } from "@/components/customer/ui-helpers";
import { getOrderById } from "@/lib/washmate/api";
import { ApiError, errorMessage } from "@/lib/washmate/client";
import { fulfillmentLabel, serviceLabel } from "@/lib/washmate/labels";
import { amountToNumber, formatRupees } from "@/lib/washmate/pricing";
import { withAuth } from "@/lib/washmate/session";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-links";
import type { GetOrderByIdResult } from "@/lib/washmate/types";
import {
  canShowDeliveryCode,
  formatOrderTime,
  isValidOrderId,
  nextStepFor,
  orderMilestones,
  paymentStateLabel,
  pickupLabel,
  shortOrderId,
  type MilestoneStatus,
} from "./order-helpers";

type CopyStatus = "idle" | "copied" | "failed";

type OrderDetail = GetOrderByIdResult["order"];

function whatsappHref(message: string): string {
  const url = new URL(SUPPORT_WHATSAPP_URL);
  url.searchParams.set("text", message);
  return url.toString();
}

async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to the textarea fallback when the Clipboard API rejects.
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    const copied = document.execCommand("copy");
    if (!copied) throw new Error("Copy failed");
  } finally {
    document.body.removeChild(area);
  }
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; order: OrderDetail }
  | { status: "notFound" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

function MilestoneMarker({ status }: { status: MilestoneStatus }) {
  if (status === "complete") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--cw-accent)] text-white">
        <CheckIcon size={14} />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--cw-accent)] bg-white">
        <span className="h-2 w-2 rounded-full bg-[var(--cw-accent)]" />
      </span>
    );
  }
  return (
    <span className="block h-7 w-7 shrink-0 rounded-full border border-[var(--cw-hairline-strong)] bg-white" />
  );
}

function MilestoneTrack({ order }: { order: OrderDetail }) {
  const milestones = orderMilestones(order.fulfillmentState);
  const subStatus = fulfillmentLabel(order.fulfillmentState);
  const bookedAt = formatOrderTime(order.createdAt);

  return (
    <>
      {/* Horizontal stepper from sm up */}
      <ol className="mt-5 hidden grid-cols-5 sm:grid">
        {milestones.map((milestone, index) => {
          const current = milestone.status === "current";
          return (
            <li
              key={milestone.key}
              aria-current={current ? "step" : undefined}
              className="relative flex min-w-0 flex-col items-center px-1 text-center"
            >
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className={cx(
                    "absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2",
                    milestone.status === "upcoming"
                      ? "bg-[var(--cw-hairline)]"
                      : "bg-[var(--cw-accent)]",
                  )}
                />
              ) : null}
              <span className="relative z-10 flex">
                <MilestoneMarker status={milestone.status} />
              </span>
              <span
                className={cx(
                  "mt-2 max-w-full break-words text-[13px] leading-[18px]",
                  milestone.status === "current"
                    ? "font-semibold text-[var(--cw-ink)]"
                    : milestone.status === "complete"
                      ? "font-medium text-[var(--cw-body)]"
                      : "text-[var(--cw-muted)]",
                )}
              >
                {milestone.label}
              </span>
              {milestone.key === "booked" &&
              milestone.status === "complete" &&
              bookedAt ? (
                <span className="mt-0.5 max-w-full break-words text-[12px] leading-4 text-[var(--cw-muted)]">
                  {bookedAt}
                </span>
              ) : null}
              {current && subStatus !== milestone.label ? (
                <span className="mt-0.5 max-w-full break-words text-[12px] leading-4 text-[var(--cw-muted)]">
                  {subStatus}
                </span>
              ) : null}
              <span className="sr-only">
                {milestone.status === "complete"
                  ? " (completed)"
                  : milestone.status === "current"
                    ? " (current step)"
                    : " (upcoming)"}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Vertical track on phones */}
      <ol className="mt-4 sm:hidden">
        {milestones.map((milestone, index) => {
          const current = milestone.status === "current";
          const last = index === milestones.length - 1;
          return (
            <li
              key={milestone.key}
              aria-current={current ? "step" : undefined}
              className="flex gap-3"
            >
              <div className="flex flex-col items-center">
                <MilestoneMarker status={milestone.status} />
                {last ? null : (
                  <span
                    aria-hidden="true"
                    className={cx(
                      "min-h-6 w-0.5 flex-1",
                      milestone.status === "upcoming"
                        ? "bg-[var(--cw-hairline)]"
                        : "bg-[var(--cw-accent)]",
                    )}
                  />
                )}
              </div>
              <div className={cx("min-w-0 break-words", last ? "pb-1" : "pb-5")}>
                <p
                  className={cx(
                    "text-[15px] leading-6",
                    milestone.status === "current"
                      ? "font-semibold text-[var(--cw-ink)]"
                      : milestone.status === "complete"
                        ? "font-medium text-[var(--cw-body)]"
                        : "text-[var(--cw-muted)]",
                  )}
                >
                  {milestone.label}
                </p>
                {milestone.key === "booked" &&
                milestone.status === "complete" &&
                bookedAt ? (
                  <p className="text-[13px] leading-[18px] text-[var(--cw-muted)]">
                    {bookedAt}
                  </p>
                ) : null}
                {current && subStatus !== milestone.label ? (
                  <p className="text-[13px] leading-[18px] text-[var(--cw-muted)]">
                    {subStatus}
                  </p>
                ) : null}
                <span className="sr-only">
                  {milestone.status === "complete"
                    ? " (completed)"
                    : milestone.status === "current"
                      ? " (current step)"
                      : " (upcoming)"}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function OrderSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading order" className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="flex items-start justify-between gap-2">
        {[0, 1, 2, 3, 4].map((step) => (
          <div key={step} className="flex flex-col items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white p-7 shadow-[var(--cw-shadow-tag)]">
        <Skeleton className="h-4 w-full" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-4" />
          ))}
        </div>
        <Skeleton className="mt-8 h-9 w-32" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-[20px] border border-[var(--cw-hairline)] bg-white px-6 py-10 text-center shadow-[var(--cw-shadow-raised)]">
      <h2 className="cw-display text-[24px] font-bold text-[var(--cw-ink)]">Order not found</h2>
      <p className="mx-auto mt-2 max-w-sm text-[15px] leading-6 text-[var(--cw-body)]">
        This order does not exist, or it belongs to another account.
      </p>
      <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
        <Button href="/orders" variant="secondary">
          My orders
        </Button>
        <Button href="/book">Book a pickup</Button>
        <Button
          href={SUPPORT_WHATSAPP_URL}
          variant="ghost"
          target="_blank"
          rel="noreferrer"
        >
          <WhatsAppIcon size={18} />
          Message us
        </Button>
      </div>
    </div>
  );
}

export function OrderClient() {
  const session = useRequireSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const id = rawId?.trim() ?? "";
  const validId = isValidOrderId(id);
  const placedParam = searchParams.get("placed") === "1";
  const ready = session.status === "signedIn" && session.session.hasProfile;

  const [loaded, setLoaded] = useState<{ id: string; result: LoadState } | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<{ orderId: string; status: CopyStatus }>({
    orderId: "",
    status: "idle",
  });
  const copyStatus = copyState.orderId === id ? copyState.status : "idle";

  useEffect(() => {
    if (copyState.status === "idle") return;
    const timeout = window.setTimeout(() => {
      setCopyState({ orderId: copyState.orderId, status: "idle" });
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  // Keep the arrival banner for this visit even after the URL is cleaned, but
  // never carry it over when the id changes in place.
  const [arrival, setArrival] = useState(() => ({ id, placed: placedParam }));
  if (arrival.id !== id) {
    setArrival({ id, placed: placedParam });
  }
  const currentIdRef = useRef(id);

  useEffect(() => {
    currentIdRef.current = id;
  }, [id]);

  const load = useCallback(async (): Promise<LoadState> => {
    try {
      const { order } = await withAuth((token) => getOrderById(id, token));
      return { status: "ready", order };
    } catch (err) {
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
        return { status: "notFound" };
      }
      if (
        err instanceof ApiError &&
        (err.code === "APP_UPDATE_REQUIRED" || err.code === "NOT_CONFIGURED")
      ) {
        return { status: "unavailable", message: err.message };
      }
      return {
        status: "error",
        message: errorMessage(err, "Could not load this order. Please try again."),
      };
    }
  }, [id]);

  useEffect(() => {
    if (!validId || !ready) return;
    let cancelled = false;
    void load().then((next) => {
      if (!cancelled) setLoaded({ id, result: next });
    });
    return () => {
      cancelled = true;
    };
  }, [validId, ready, id, load]);

  // Drop the one-time `placed` flag so reloads and later visits start clean.
  useEffect(() => {
    if (!validId || !placedParam) return;
    router.replace(`/order?id=${encodeURIComponent(id)}`, { scroll: false });
  }, [validId, placedParam, id, router]);

  async function refresh() {
    const refreshId = id;
    setRefreshingId(refreshId);
    try {
      const next = await load();
      if (currentIdRef.current === refreshId) {
        setLoaded({ id: refreshId, result: next });
      }
    } finally {
      setRefreshingId((current) => (current === refreshId ? null : current));
    }
  }

  const refreshing = refreshingId === id;
  const visibleState: LoadState =
    loaded === null || loaded.id !== id
      ? { status: "loading" }
      : loaded.result.status === "ready" &&
          loaded.result.order.id.toLowerCase() !== id.toLowerCase()
        ? { status: "loading" }
        : loaded.result;
  const order = visibleState.status === "ready" ? visibleState.order : null;
  const orderDiscount = order ? amountToNumber(order.discountAmount) : null;
  const showPlacedBanner =
    arrival.id === id &&
    arrival.placed &&
    order !== null &&
    (order.fulfillmentState === "placed" ||
      order.fulfillmentState === "host_assignment_pending");

  async function copyDeliveryCode() {
    if (!order?.deliveryOtp) return;
    try {
      await copyText(order.deliveryOtp);
      setCopyState({ orderId: id, status: "copied" });
    } catch {
      setCopyState({ orderId: id, status: "failed" });
    }
  }

  const reportHref = order
    ? whatsappHref(
        `Hi WRINGG, I need help with order #${shortOrderId(order.id)} (${order.id}). Status: ${fulfillmentLabel(order.fulfillmentState)}.`,
      )
    : SUPPORT_WHATSAPP_URL;

  return (
    <CustomerShell title="Order status" width="medium">
      {!validId ? (
        <NotFound />
      ) : visibleState.status === "unavailable" ? (
        <BookingUnavailable message={visibleState.message} />
      ) : visibleState.status === "notFound" ? (
        <NotFound />
      ) : session.status !== "signedIn" || !session.session.hasProfile ? (
        <LoadingBlock label="Checking your sign-in…" />
      ) : visibleState.status === "loading" ? (
        <OrderSkeleton />
      ) : visibleState.status === "error" ? (
        <div className="space-y-3">
          <Notice tone="error">{visibleState.message}</Notice>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button variant="secondary" onClick={() => void refresh()} loading={refreshing}>
              Try again
            </Button>
            <Button
              href={SUPPORT_WHATSAPP_URL}
              variant="ghost"
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon size={18} />
              Message us
            </Button>
          </div>
        </div>
      ) : order ? (
        <div className="space-y-8">
          {showPlacedBanner ? (
            <Notice tone="success">Order placed. We&apos;re finding a nearby host.</Notice>
          ) : null}

          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium leading-[18px] text-[var(--cw-muted)]">
                Order #{shortOrderId(order.id)}
              </p>
              <Button
                variant="ghost"
                className="shrink-0"
                onClick={() => void refresh()}
                loading={refreshing}
                loadingLabel="Refreshing"
              >
                <RefreshIcon size={16} />
                Refresh
              </Button>
            </div>
            <h2 className="cw-display mt-1 text-[32px] font-bold leading-10 text-[var(--cw-ink)]">
              {fulfillmentLabel(order.fulfillmentState)}
            </h2>
            <p className="mt-2 max-w-[52ch] text-[15px] leading-6 text-[var(--cw-body)]">
              {nextStepFor(order.fulfillmentState)}
            </p>
          </div>

          {canShowDeliveryCode(order) ? (
            <div className="rounded-2xl border border-dashed border-[var(--cw-marigold)] bg-[var(--cw-marigold-soft)] px-4 py-4 sm:px-5">
              <p className="text-[13px] font-semibold leading-[1.4] text-[var(--cw-marigold-ink)]">
                Delivery code
              </p>
              <p className="mt-1 max-w-full break-all cw-display text-[36px] font-bold leading-[1.15] tracking-[0.18em] tabular-nums text-[var(--cw-ink)] sm:text-[40px] sm:leading-[48px] sm:tracking-[0.26em]">
                {order.deliveryOtp}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <Button
                  variant="secondary"
                  onClick={() => void copyDeliveryCode()}
                >
                  {copyStatus === "copied" ? <CheckIcon size={16} /> : null}
                  {copyStatus === "copied" ? "Copied" : "Copy code"}
                </Button>
                <p
                  role="status"
                  className="min-h-[18px] max-w-full break-words text-[13px] leading-[1.4] text-[var(--cw-marigold-ink)]"
                >
                  {copyStatus === "copied"
                    ? "Delivery code copied."
                    : copyStatus === "failed"
                      ? "Could not copy. Select the code and copy it."
                      : ""}
                </p>
              </div>
              <p className="mt-2 text-[13px] leading-[1.4] text-[var(--cw-marigold-ink)]">
                Share it with your partner only at delivery.
              </p>
            </div>
          ) : null}

          <section>
            <h2 className="cw-display text-[20px] font-bold leading-7 text-[var(--cw-ink)]">Progress</h2>
            {order.fulfillmentState === "cancelled" ? (
              <Notice tone="error" title="This order was cancelled" className="mt-3">
                No pickup or delivery is scheduled. If you were charged, our team will help.
              </Notice>
            ) : (
              <MilestoneTrack order={order} />
            )}
          </section>

          <div className="pt-2">
            <TagCard kicker="Pickup tag" bandAside={<CareSymbols type={order.serviceType} />}>
              <h2 className="sr-only">Order summary</h2>
              <TagRow label="Service" value={serviceLabel(order.serviceType)} />
              <TagRow
                label="Clothes"
                value={`${order.itemCount} ${order.itemCount === 1 ? "cloth" : "clothes"}`}
              />
              <TagRow
                label="Pickup"
                value={
                  <span className="block max-w-[10rem] break-words text-right">
                    {pickupLabel(order.pickupSlot)}
                  </span>
                }
              />
              <TagRow
                label="Payment"
                value={
                  <span className="block max-w-[9rem] break-words text-right">
                    Cash on delivery
                    <span className="block text-[13px] font-normal leading-[18px] text-[var(--cw-muted)]">
                      {paymentStateLabel(order.paymentState)}
                    </span>
                  </span>
                }
              />
              <TagPerforation />
              {orderDiscount !== null && orderDiscount > 0 ? (
                <TagRow
                  label="Discount"
                  value={
                    <span className="block max-w-[9rem] break-words text-right">
                      {order.couponCode ? `${order.couponCode} ` : ""}
                      −{formatRupees(order.discountAmount)}
                    </span>
                  }
                />
              ) : null}
              <div className="mt-2">
                <TagTotal
                  label="Total payable"
                  amount={formatRupees(order.estimatedPrice)}
                />
              </div>
            </TagCard>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Button href="/orders" variant="secondary" className="sm:flex-1">
                All orders
              </Button>
              <Button href="/book" className="sm:flex-1">
                Book another pickup
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <a
                href={SUPPORT_WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-semibold text-[var(--cw-link)] transition-colors duration-150 hover:text-[var(--cw-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]"
              >
                <WhatsAppIcon size={18} />
                Need help? WhatsApp
              </a>
              <a
                href={reportHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-full text-sm font-semibold text-[var(--cw-link)] transition-colors duration-150 hover:text-[var(--cw-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]"
              >
                Report an issue
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </CustomerShell>
  );
}
