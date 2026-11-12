"use client";

// Profile hub for the signed-in customer (/account): identity, account
// stats (or a getting-started block), saved addresses, outstanding dues,
// quick links and sign-out.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  CustomerShell,
  ErrorNotice,
  LoadingBlock,
  SignOutDialog,
  useRequireSession,
} from "@/components/customer/customer-shell";
import {
  Button,
  Money,
  Notice,
  SectionHeader,
  Skeleton,
  SlowLoadingHint,
  StatusDot,
  useLoadTiming,
  useOnline,
} from "@/components/customer/ui";
import { ChevronRightIcon, LogOutIcon } from "@/components/customer/icons";
import {
  cx,
  formatPhoneDisplay,
  initialsFor,
  maskPhone,
  pluralize,
} from "@/components/customer/ui-helpers";
import { getCustomerDashboard, getCustomerDues, getCustomerProfile } from "@/lib/washmate/api";
import { errorMessage } from "@/lib/washmate/client";
import { formatRupeesExact } from "@/lib/washmate/pricing";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-links";
import { clearSession, withAuth } from "@/lib/washmate/session";
import type {
  Address,
  CustomerDashboardResult,
  CustomerDue,
  CustomerProfile,
  GetCustomerDuesResponse,
} from "@/lib/washmate/types";
import {
  dueReasonLabel,
  memberSinceLabel,
  shouldShowDues,
  shouldShowStats,
} from "./profile-helpers";

/** Header→rows list surface shared by the addresses and account-link sections. */
const listSurface =
  "divide-y divide-[var(--cw-hairline)] rounded-[20px] border border-[var(--cw-hairline)] bg-white shadow-[var(--cw-shadow-raised)]";

const quietLink = cx(
  "inline-flex min-h-[44px] touch-manipulation items-center rounded-full px-1.5 text-[13px] font-semibold text-[var(--cw-link)]",
  "transition-colors duration-150 hover:text-[var(--cw-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
);

/** Human order reference: first 8 characters of the id, uppercased. */
export function shortOrderId(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

export function AccountClient() {
  const state = useRequireSession();
  const status = state.status;
  const router = useRouter();
  const searchParams = useSearchParams();
  const online = useOnline();

  const [dashboard, setDashboard] = useState<CustomerDashboardResult | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null | undefined>(undefined);
  const [dues, setDues] = useState<GetCustomerDuesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [duesError, setDuesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  // Skeletons only once the load is actually slow (200ms), plus the muted
  // "still loading" line after 6s — no flash on fast reads.
  const loadingData = loading && dashboard === null;
  const { showSkeleton, slow: slowLoad } = useLoadTiming(loadingData);

  const load = useCallback(async () => {
    if (status !== "signedIn") return;
    // All requests wait for the network: the shell shows the offline banner,
    // and the `online` effect below re-runs this load when we're back.
    if (!online) return;
    setLoading(true);
    setError(null);
    setDuesError(null);
    try {
      // The dashboard owns the page: addresses, counts. Profile and dues are
      // enrichment — a failure there must not blank the whole hub.
      const [dash, prof, due] = await Promise.allSettled([
        withAuth((t) => getCustomerDashboard(t)),
        withAuth((t) => getCustomerProfile(t)),
        withAuth((t) => getCustomerDues(t)),
      ]);
      if (dash.status === "fulfilled") {
        setDashboard(dash.value);
      } else {
        setError(errorMessage(dash.reason));
      }
      setProfile(prof.status === "fulfilled" ? prof.value : undefined);
      if (due.status === "fulfilled") {
        setDues(due.value);
      } else if (dash.status === "fulfilled") {
        // Only surface the dues failure when the page itself loaded.
        setDuesError(errorMessage(due.reason));
      }
    } finally {
      setLoading(false);
    }
  }, [status, online]);

  useEffect(() => {
    if (status !== "signedIn" || !online) return;
    // Deferred by a microtask so the effect body itself never calls setState
    // synchronously (react-hooks/set-state-in-effect). Re-runs on `online`,
    // which covers the "retry when you're back" behaviour.
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled && status === "signedIn" && online) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [status, online, load]);

  if (status !== "signedIn") {
    return (
      <CustomerShell width="medium" title="Your profile">
        <LoadingBlock label="Checking your session…" />
      </CustomerShell>
    );
  }

  const session = state.session;
  const name = profile?.fullName || session.profileName || maskPhone(session.phone);
  const email = profile?.email ?? null;
  const memberSince = memberSinceLabel(profile?.createdAt);
  const addresses: Address[] = dashboard?.addresses ?? [];
  const activeOrderCount = dashboard?.activeOrders.length ?? 0;
  const totalOrders = dashboard?.totalOrders ?? 0;
  const justSaved = searchParams.get("saved") === "1";
  const showStats = dashboard !== null && shouldShowStats(addresses.length, activeOrderCount, totalOrders);

  function confirmSignOut() {
    setConfirmingSignOut(false);
    clearSession();
    router.push("/");
  }

  return (
    <CustomerShell
      width="medium"
      title="Your profile"
      description="Your details, addresses and everything else about your WRINGG account."
    >
      <div aria-live="polite">
        {justSaved ? <Notice tone="success">Profile updated.</Notice> : null}
      </div>

      {/* --- Identity ------------------------------------------------------- */}
      <section
        aria-label="Your details"
        className="rounded-[20px] border border-[var(--cw-hairline)] bg-white p-6 shadow-[var(--cw-shadow-raised)] sm:p-8"
      >
        {showSkeleton ? (
          <div aria-busy="true">
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-6 w-44" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <Skeleton className="mt-6 h-11 w-32 rounded-full" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--cw-accent-soft)] cw-display text-xl font-bold text-[var(--cw-accent-strong)]"
            >
              {initialsFor(name)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="cw-display truncate text-[24px] font-bold leading-8 text-[var(--cw-ink)]">{name}</h2>
              <p className="mt-0.5 text-sm text-[var(--cw-body)] [overflow-wrap:anywhere]">
                {formatPhoneDisplay(session.phone)}
                {email ? <span> · {email}</span> : null}
              </p>
              {memberSince ? (
                <p className="mt-0.5 text-[13px] leading-5 text-[var(--cw-muted)]">{memberSince}</p>
              ) : null}
            </div>
            <div className="w-full shrink-0 sm:w-auto">
              <Button href="/account/profile" variant="secondary" size="md" className="w-full sm:w-auto">
                Edit profile
              </Button>
            </div>
          </div>
        )}
        <SlowLoadingHint show={slowLoad} />
      </section>

      {/* --- Stats (kept only when something is non-zero) -------------------- */}
      {showSkeleton ? (
        <AccountStatsSkeleton />
      ) : showStats ? (
        <dl className="mt-6 grid grid-cols-3 divide-x divide-[var(--cw-hairline)] rounded-[20px] border border-[var(--cw-hairline)] bg-white py-4 text-center shadow-[var(--cw-shadow-raised)] sm:py-5">
          <Stat label="Saved addresses" value={addresses.length} />
          <Stat label="Active orders" value={activeOrderCount} />
          <Stat label="Total orders" value={totalOrders} />
        </dl>
      ) : dashboard !== null ? (
        <section
          aria-label="Getting started"
          className="mt-6 rounded-[20px] border border-[var(--cw-hairline)] bg-white p-6 text-center shadow-[var(--cw-shadow-raised)] sm:p-8"
        >
          <h2 className="text-[17px] font-bold leading-6 text-[var(--cw-ink)]">Getting started</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[15px] leading-6 text-[var(--cw-body)]">
            Add a pickup address and book your first wash — we&apos;ll confirm it&apos;s inside our
            BTM Layout pilot area.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Button href="/book" size="lg">
              Book a pickup
            </Button>
            <Button href="/add-address?next=/account" variant="secondary" size="lg">
              Add an address
            </Button>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mt-6">
          <ErrorNotice>{error}</ErrorNotice>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="secondary"
              size="md"
              onClick={() => void load()}
              loading={loading}
              loadingLabel="Retrying…"
            >
              Try again
            </Button>
            <Button href={SUPPORT_WHATSAPP_URL} variant="ghost" size="md">
              Message us on WhatsApp
            </Button>
          </div>
          <SlowLoadingHint show={slowLoad} />
        </div>
      ) : null}

      {/* --- Addresses ------------------------------------------------------ */}
      <section aria-label="Addresses" className="mt-10 border-t border-[var(--cw-hairline)] pt-8">
        <SectionHeader
          title="Addresses"
          description={addressSectionDescription(addresses.length)}
          // Exactly one add-address affordance at a time: the section action
          // when addresses exist, the empty-state CTA below when none do.
          action={
            addresses.length > 0 ? (
              <Button href="/add-address?next=/account" variant="ghost" size="md">
                Add an address
              </Button>
            ) : undefined
          }
        />
        {showSkeleton ? <AddressesSkeleton /> : null}
        {!error && dashboard !== null && addresses.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-[var(--cw-hairline)] bg-white px-6 py-8 text-center shadow-[var(--cw-shadow-raised)]">
            <p className="text-[15px] leading-6 text-[var(--cw-body)]">
              No saved addresses yet. Add one and we&apos;ll confirm it&apos;s inside our pilot area.
            </p>
            <Button href="/add-address?next=/account" className="mt-4">
              Add an address
            </Button>
          </div>
        ) : null}
        {!error && addresses.length > 0 ? (
          <ul className={`mt-4 ${listSurface}`}>
            {addresses.map((address) => (
              <li key={address.id} className="px-4 py-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex min-h-6 items-center rounded-full bg-[var(--cw-subtle)] px-2.5 text-[12px] font-semibold text-[var(--cw-text)]">
                      {address.label}
                    </span>
                    <p
                      title={address.addressLine1}
                      className="mt-1.5 truncate text-[15px] font-semibold text-[var(--cw-ink)]"
                    >
                      {address.addressLine1}
                    </p>
                    <p
                      title={[address.addressLine2, `${address.city} ${address.pincode}`]
                        .filter(Boolean)
                        .join(", ")}
                      className="mt-0.5 truncate text-[13px] leading-5 text-[var(--cw-muted)]"
                    >
                      {[address.addressLine2, `${address.city} ${address.pincode}`]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <div className="mt-1.5">
                      {address.isServiceable === true ? (
                        <StatusDot tone="success">In the pilot area</StatusDot>
                      ) : (
                        <StatusDot tone="warning">Outside the pilot area</StatusDot>
                      )}
                    </div>
                  </div>
                </div>
                {/* Only bookable addresses get a booking shortcut; /book
                    preselects the one passed in ?address=. Adding an address
                    lives once, in the section header. */}
                {address.isServiceable === true ? (
                  <div className="mt-2">
                    <Link
                      href={`/book?address=${encodeURIComponent(address.id)}`}
                      className={quietLink}
                    >
                      Book a pickup here
                    </Link>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* --- Dues (only when something is owed) ------------------------------ */}
      {dues !== null && shouldShowDues(dues.totalDue) ? (
        <section aria-label="Dues" className="mt-10 border-t border-[var(--cw-hairline)] pt-8">
          <SectionHeader
            title="Dues"
            description={`${dues.dues.filter((d) => !d.isCleared).length} ${pluralize(
              dues.dues.filter((d) => !d.isCleared).length,
              "charge",
              "charges",
            )} still to be collected on your orders.`}
          />
          <div className="mt-4 rounded-[20px] border border-[var(--cw-hairline)] bg-white p-5 shadow-[var(--cw-shadow-raised)] sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[15px] font-semibold text-[var(--cw-text)]">Total due</span>
              <span className="cw-display text-[28px] font-bold leading-9 tabular-nums text-[var(--cw-ink)]">
                {formatRupeesExact(dues.totalDue)}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-[var(--cw-hairline)] border-t border-[var(--cw-hairline)]">
              {dues.dues
                .filter((due) => !due.isCleared)
                .map((due) => (
                  <DueRow key={due.id} due={due} />
                ))}
            </ul>
            <p className="mt-4 text-sm leading-6 text-[var(--cw-muted)]">
              Pay on delivery — our team will contact you to settle this.
            </p>
            <p className="mt-1 text-sm leading-6">
              <a
                href={SUPPORT_WHATSAPP_URL}
                className={cx(
                  "font-semibold text-[var(--cw-link)] transition-colors duration-150 hover:text-[var(--cw-accent-deep)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
                )}
                target="_blank"
                rel="noreferrer"
              >
                Questions about this charge? Message us
              </a>
            </p>
          </div>
        </section>
      ) : null}
      {duesError ? (
        <div className="mt-10 border-t border-[var(--cw-hairline)] pt-8">
          <Notice
            tone="warning"
            title="Dues not loaded"
            actionLabel="Retry"
            onActionClick={() => void load()}
          >
            Couldn&apos;t check for pending dues.
          </Notice>
        </div>
      ) : null}

      {/* --- Account links --------------------------------------------------- */}
      <section aria-label="Account" className="mt-10 border-t border-[var(--cw-hairline)] pt-8">
        <SectionHeader title="Account" />
        <nav className="mt-4">
          <ul className={cx(listSurface, "divide-y divide-[var(--cw-hairline)]")}>
            <AccountLink href="/orders" label="My orders" />
            <AccountLink href="/book" label="Book a pickup" />
            <AccountLink href="/help" label="Help" />
            <AccountLink href="/privacy" label="Privacy policy" />
            <AccountLink href="/terms" label="Terms" />
            <AccountLink href="/delete-account" label="Delete account" danger />
          </ul>
        </nav>
        <Button
          variant="secondary"
          size="md"
          className="mt-6"
          onClick={() => setConfirmingSignOut(true)}
        >
          <LogOutIcon size={18} />
          Sign out
        </Button>
      </section>

      {confirmingSignOut ? (
        <SignOutDialog onCancel={() => setConfirmingSignOut(false)} onConfirm={confirmSignOut} />
      ) : null}
    </CustomerShell>
  );
}

function addressSectionDescription(count: number): string {
  return count === 1 ? "1 saved pickup address." : `${count} saved pickup addresses.`;
}

// --- Small local pieces ---------------------------------------------------------

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-2">
      {/* dd above dt inside a div-wrapped dl: value-first, still valid HTML. */}
      <dd className="cw-display text-[28px] font-bold leading-9 tabular-nums text-[var(--cw-ink)]">
        {value}
      </dd>
      <dt className="mt-0.5 truncate text-[12px] font-medium leading-4 text-[var(--cw-muted)]">
        {label}
      </dt>
    </div>
  );
}

function DueRow({ due }: { due: CustomerDue }) {
  return (
    <li className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="min-w-0 text-sm leading-6 text-[var(--cw-body)]">
        Order #{shortOrderId(due.orderId)} · {dueReasonLabel(due.dueReason)}
      </span>
      <Money amount={due.amountDue} className="shrink-0 text-sm font-bold text-[var(--cw-ink)]" />
    </li>
  );
}

function AccountLink({
  href,
  label,
  danger = false,
}: {
  href: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cx(
          "flex min-h-[56px] touch-manipulation items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 sm:px-5",
          "hover:bg-[var(--cw-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--cw-accent)]",
          danger ? "text-[var(--cw-danger)]" : "text-[var(--cw-text)]",
        )}
      >
        <span className="min-w-0 text-[15px] font-semibold">{label}</span>
        <ChevronRightIcon size={18} className="shrink-0 text-[var(--cw-muted)]" />
      </Link>
    </li>
  );
}

function AccountStatsSkeleton() {
  return (
    <div
      aria-busy="true"
      className="mt-6 grid grid-cols-3 divide-x divide-[var(--cw-hairline)] rounded-[20px] border border-[var(--cw-hairline)] bg-white py-5 shadow-[var(--cw-shadow-raised)]"
    >
      <StatSkeleton />
      <StatSkeleton />
      <StatSkeleton />
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 px-2">
      <Skeleton className="h-6 w-10" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function AddressesSkeleton() {
  return (
    <div aria-busy="true" className={`mt-4 ${listSurface}`}>
      {[0, 1].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-3 w-52" />
            <Skeleton className="mt-2 h-3 w-36" />
          </div>
        </div>
      ))}
    </div>
  );
}
