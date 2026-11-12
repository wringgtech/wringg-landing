"use client";

// My orders: the signed-in customer's active orders.
// Ported from washmate/apps/customer-mobile/app/(tabs)/orders.tsx, restyled
// on the customer design system (single white surface, list rows, StatusDot).

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BookingUnavailable,
  CustomerShell,
  ErrorNotice,
  LoadingBlock,
  useRequireSession,
} from "@/components/customer/customer-shell";
import { Button, SectionHeader, Skeleton, StatusDot } from "@/components/customer/ui";
import { ChevronRightIcon, RefreshIcon } from "@/components/customer/icons";
import { cx } from "@/components/customer/ui-helpers";
import { getCustomerDashboard, getOrderById } from "@/lib/washmate/api";
import { ApiError, errorMessage } from "@/lib/washmate/client";
import { fulfillmentLabel, serviceLabel } from "@/lib/washmate/labels";
import { formatRupees } from "@/lib/washmate/pricing";
import { CUSTOMER_APP_DOWNLOAD_URL } from "@/lib/site-links";
import { withAuth } from "@/lib/washmate/session";
import type { CustomerDashboardResult, GetOrderByIdResult } from "@/lib/washmate/types";
import { pickupLabel } from "../order/order-helpers";
import { activeOrdersLabel, itemCountLabel, statusToneFor } from "./orders-ui";

type OrderDetail = GetOrderByIdResult["order"];

/** Human order reference: first 8 characters of the id, uppercased. */
export function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

export function OrdersClient() {
  const state = useRequireSession();
  const status = state.status;

  const [dashboard, setDashboard] = useState<CustomerDashboardResult | null>(null);
  const [details, setDetails] = useState<Record<string, OrderDetail>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (status !== "signedIn") return;
    setLoading(true);
    setError(null);
    setUnavailable(null);
    try {
      const result = await withAuth((t) => getCustomerDashboard(t));
      const active = result.activeOrders.filter(
        (order) => order.fulfillmentState !== "delivered",
      );
      const detailEntries = await Promise.all(
        active.map(async (order) => {
          try {
            const { order: detail } = await withAuth((t) => getOrderById(order.id, t));
            return [order.id, detail] as const;
          } catch {
            return [order.id, null] as const;
          }
        }),
      );
      setDetails((current) => {
        const next = { ...current };
        for (const [orderId, detail] of detailEntries) {
          if (detail) next[orderId] = detail;
        }
        return next;
      });
      setDashboard(result);
    } catch (err) {
      if (err instanceof ApiError && (err.code === "APP_UPDATE_REQUIRED" || err.code === "NOT_CONFIGURED")) {
        setUnavailable(err.message);
      } else {
        setError(errorMessage(err, "Could not load your orders. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  }, [status]);
  useEffect(() => {
    if (status !== "signedIn") return;
    // Deferred by a microtask so the effect body itself never calls setState
    // synchronously (react-hooks/set-state-in-effect).
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled && status === "signedIn") await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [status, load]);

  if (state.status !== "signedIn") {
    return (
      <CustomerShell width="medium" title="My orders">
        <LoadingBlock label="Checking your session…" />
      </CustomerShell>
    );
  }

  const orders = (dashboard?.activeOrders ?? []).filter((order) => {
    const orderState = details[order.id]?.fulfillmentState ?? order.fulfillmentState;
    return orderState !== "delivered";
  });
  const activeCount = Math.max(orders.length, dashboard?.activeOrderCount ?? 0);
  const hasMore = activeCount > orders.length;

  return (
    <CustomerShell
      width="medium"
      title="My orders"
      description="Track your laundry from pickup to delivery."
      actions={
        <Button
          variant="ghost"
          size="md"
          onClick={() => void load()}
          disabled={loading}
          loading={loading}
          loadingLabel="Refreshing…"
        >
          <RefreshIcon size={18} />
          Refresh
        </Button>
      }
    >
      {/* Skeleton only until the first load lands; a manual refresh keeps
          the existing list on screen and the Refresh button shows progress. */}
      {!unavailable && dashboard === null && !error ? <OrdersSkeleton /> : null}

      {unavailable ? <BookingUnavailable message={unavailable} /> : null}

      {!unavailable && error ? (
        <div className="mb-5">
          <ErrorNotice>{error}</ErrorNotice>
          <Button
            variant="secondary"
            size="md"
            className="mt-4"
            onClick={() => void load()}
            loading={loading}
            loadingLabel="Retrying…"
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!unavailable && dashboard !== null ? (
        orders.length === 0 ? (
          <div className="rounded-[20px] border border-[var(--cw-hairline)] bg-white px-6 py-10 text-center shadow-[var(--cw-shadow-raised)]">
            <h2 className="text-[17px] font-bold text-[var(--cw-ink)]">No active orders</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-[var(--cw-muted)]">
              Your active laundry orders will show up here.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Button href="/book" size="lg">
                Book a pickup
              </Button>
              <Button href="/book" variant="secondary" size="lg">
                See how it works
              </Button>
            </div>
          </div>
        ) : (
          <section aria-label="Active orders">
            <SectionHeader title={activeOrdersLabel(activeCount)} />
            <ul className="mt-3 divide-y divide-[var(--cw-hairline)] rounded-[20px] border border-[var(--cw-hairline)] bg-white shadow-[var(--cw-shadow-raised)]">
              {orders.map((order) => {
                const detail = details[order.id];
                const orderState = detail?.fulfillmentState ?? order.fulfillmentState;
                const serviceName = detail ? serviceLabel(detail.serviceType) : "Laundry";
                const pickupText = detail
                  ? pickupLabel(detail.pickupSlot)
                  : "Pickup time in the app";
                const clothes = itemCountLabel(
                  detail?.itemCount ?? order.itemCount,
                );
                const amount = detail
                  ? formatRupees(detail.estimatedPrice)
                  : formatRupees(order.estimatedTotal);
                return (
                  <li key={order.id}>
                    <Link
                      href={`/order?id=${encodeURIComponent(order.id)}`}
                      className={cx(
                        "flex min-h-[88px] items-center gap-3 px-4 py-4 transition-colors duration-150 sm:px-6 sm:py-5",
                        "hover:bg-[var(--cw-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--cw-accent)]",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-baseline justify-between gap-3">
                          <span className="cw-display truncate text-[18px] font-bold leading-6 text-[var(--cw-ink)]">
                            {serviceName}
                          </span>
                          <span className="cw-display shrink-0 text-right text-[18px] font-bold leading-6 tabular-nums text-[var(--cw-ink)]">
                            {amount}
                          </span>
                        </div>
                        <div className="mt-1">
                          <StatusDot tone={statusToneFor(orderState)}>
                            {fulfillmentLabel(orderState)}
                          </StatusDot>
                        </div>
                        <p className="mt-1 truncate text-[12px] leading-4 text-[var(--cw-muted)] sm:text-[13px] sm:leading-[18px]">
                          {clothes} · {pickupText} · #{shortOrderId(order.id)}
                        </p>
                      </div>
                      <ChevronRightIcon size={18} className="shrink-0 text-[var(--cw-muted)]" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )
      ) : null}

      {!unavailable && dashboard !== null ? (
        <p className="mt-8 text-sm leading-6 text-[var(--cw-muted)]">
          {hasMore && orders.length > 0
            ? `Showing the ${orders.length} most recent active orders. `
            : ""}
          Past orders, ratings and support requests are in the{" "}
          <a
            href={CUSTOMER_APP_DOWNLOAD_URL}
            className={cx(
              "font-semibold text-[var(--cw-link)] transition-colors duration-150 hover:text-[var(--cw-accent-deep)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
            )}
            target="_blank"
            rel="noreferrer"
          >
            WRINGG app
          </a>
          .
        </p>
      ) : null}
    </CustomerShell>
  );
}

/** Three list-shaped skeleton rows matching the final layout. */
function OrdersSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading orders"
      className="rounded-[20px] border border-[var(--cw-hairline)] bg-white p-2 shadow-[var(--cw-shadow-raised)]"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cx(
            "flex min-h-[88px] items-center gap-3 px-4 py-4",
            i > 0 && "border-t border-[var(--cw-hairline)]",
          )}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}
