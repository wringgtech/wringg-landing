"use client";

// Shared frame for the customer pages (/login, /book, /order, /orders) plus
// the shared cross-page states (unavailable backend, errors, loading) and the
// legacy style constants other components still import.
//
// Visual language: light theme, brand blue #2098d6 accent, navy ink, the
// tokens defined in src/components/customer/customer.css.

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { isBackendConfigured } from "@/lib/washmate/client";
import { clearSession, loginHref, useCustomerSession, type SessionState } from "@/lib/washmate/session";
import { CUSTOMER_APP_DOWNLOAD_URL, SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP_URL } from "@/lib/site-links";
import {
  Button,
  Notice,
  Spinner,
  useOnline,
} from "@/components/customer/ui";
import { LogOutIcon, UserIcon, WhatsAppIcon } from "@/components/customer/icons";
import { cx, initialsFor, maskPhone } from "@/components/customer/ui-helpers";
import "./customer.css";

// --- Legacy style constants (still imported by existing pages) ----------------

export const customerButton = {
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--cw-accent-strong)] px-5 text-sm font-semibold text-white shadow-[var(--cw-shadow-raised)] transition-colors duration-150 hover:bg-[var(--cw-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:opacity-55",
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--cw-hairline-strong)] bg-white px-5 text-sm font-semibold text-[var(--cw-text)] transition-colors duration-150 hover:bg-[var(--cw-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)] disabled:cursor-not-allowed disabled:opacity-55",
} as const;

export const customerCard =
  "rounded-[20px] border border-[var(--cw-hairline)] bg-white p-6 shadow-[var(--cw-shadow-raised)] sm:p-8";

export const customerInput =
  "min-h-12 w-full rounded-xl border border-[var(--cw-hairline-strong)] bg-white px-3.5 text-[16px] text-[var(--cw-text)] placeholder:text-slate-400 focus:border-[var(--cw-accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--cw-accent)]";

// --- Widths ----------------------------------------------------------------

export type ShellWidth = "narrow" | "medium" | "wide";

const SHELL_WIDTHS: Record<ShellWidth, string> = {
  narrow: "max-w-[560px]",
  medium: "max-w-[720px]",
  wide: "max-w-[1120px]",
};

// --- Header ----------------------------------------------------------------

function ShellNav({
  current,
  session,
  accountLabel,
  onSignOutClick,
}: {
  current: string | null;
  session: SessionState;
  accountLabel: string | null;
  onSignOutClick: () => void;
}) {
  const link = (href: string, label: string, shortLabel?: string) => {
    const active = current === href;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={cx(
          "inline-flex min-h-[44px] touch-manipulation items-center rounded-full px-2.5 text-sm font-semibold transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
          active ? "text-[var(--cw-accent-strong)]" : "text-[var(--cw-body)] hover:text-[var(--cw-ink)]",
        )}
      >
        <span className="sm:hidden">{shortLabel ?? label}</span>
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <nav aria-label="Customer" className="flex min-w-0 items-center gap-0.5 sm:gap-1">
      {link("/book", "Book a pickup", "Book")}
      {session.status === "signedIn" ? link("/orders", "My orders", "Orders") : null}
      {link("/help", "Help")}
      {session.status === "signedIn" ? link("/account", "Profile") : null}
      {session.status === "signedIn" ? (
        <div className="flex items-center gap-1">
          {accountLabel ? (
            <span
              aria-hidden="true"
              className="hidden max-w-[9rem] items-center truncate px-1 text-sm font-semibold text-[var(--cw-body)] md:inline-flex"
            >
              {accountLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onSignOutClick}
            aria-label={accountLabel ? `Sign out (${accountLabel})` : "Sign out"}
            className={cx(
              "inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-[var(--cw-body)]",
              "transition-colors duration-150 hover:text-[var(--cw-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
            )}
          >
            <LogOutIcon size={16} />
            <span className="sr-only sm:not-sr-only">Sign out</span>
          </button>
        </div>
      ) : session.status === "signedOut" ? (
        link("/login", "Sign in")
      ) : null}
    </nav>
  );
}

/** Sign-out confirm. Exported so /account can reuse the identical control. */
export function SignOutDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    cancelRef.current?.focus();
    // Esc fires the native cancel event; keep it under our control.
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onCancel();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onCancel]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="signout-title"
      aria-describedby="signout-body"
      onClick={(event) => {
        // Close only for clicks actually outside the dialog box — clicks in
        // the dialog's own padding (event.target === dialog) must not close.
        const rect = dialogRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { clientX, clientY } = event;
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          onCancel();
        }
      }}
      className="cw-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-[20px] border border-[var(--cw-hairline)] bg-white p-6 shadow-[var(--cw-shadow-tag)]"
    >
      <h2 id="signout-title" className="cw-display text-xl font-bold text-[var(--cw-ink)]">
        Sign out?
      </h2>
      <p id="signout-body" className="mt-1.5 text-sm leading-6 text-[var(--cw-body)]">
        You can sign back in with your phone number any time.
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <button
          type="button"
          ref={cancelRef}
          onClick={onCancel}
          className={cx(
            "inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full border border-[var(--cw-hairline-strong)] bg-white px-5 text-sm font-semibold text-[var(--cw-text)]",
            "transition-colors duration-150 hover:bg-[var(--cw-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cx(
            "inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full bg-[var(--cw-accent-strong)] px-5 text-sm font-semibold text-white",
            "transition-colors duration-150 hover:bg-[var(--cw-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
          )}
        >
          Sign out
        </button>
      </div>
    </dialog>
  );
}

// --- Shell -----------------------------------------------------------------

/**
 * Set by the shell's own sign-out paths just before clearSession() so
 * useRequireSession can tell a deliberate sign-out from a session expiry
 * (only the latter should land on /login with ?expired=1).
 */
let signOutWasDeliberate = false;

export interface CustomerShellProps {
  /** Optional page title (h1). */
  title?: string;
  /** Optional lede under the page title. */
  description?: string;
  /** Content width preset. Defaults to "medium" (720px). */
  width?: ShellWidth;
  /** Optional actions shown beside the page title block. */
  actions?: ReactNode;
  children: ReactNode;
}

/**
 * Customer page frame: sticky header (logo, nav, account area), optional
 * title block, footer, and the backend-configured gate. When the backend
 * env is missing the content is replaced by BookingUnavailable.
 *
 * The signed-in nav reads Book · My orders · Help · Profile · Sign out.
 * Help (/help) is the support page; Profile (/account) is the signed-in
 * customer's hub. Header sign-out keeps its confirm dialog, exported below
 * so /account can reuse the same control for its own Sign out button.
 */
export function CustomerShell({
  title,
  description,
  width = "medium",
  actions,
  children,
}: CustomerShellProps) {
  const state = useCustomerSession();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const online = useOnline();

  function confirmSignOut() {
    setConfirmingSignOut(false);
    setMobileMenuOpen(false);
    signOutWasDeliberate = true;
    clearSession();
    router.push("/");
  }

  const accountName =
    state.status === "signedIn"
      ? state.session.profileName?.trim() || maskPhone(state.session.phone)
      : null;
  const accountLabel = accountName
    ? state.status === "signedIn" && state.session.profileName?.trim()
      ? `Hi, ${accountName.split(/\s+/)[0]}`
      : accountName
    : null;

  return (
    <main className="flex min-h-screen flex-col bg-[var(--cw-page)] text-[var(--cw-text)]">
      <a
        href="#cw-content"
        className={cx(
          "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2",
          "focus:text-sm focus:font-semibold focus:text-[var(--cw-ink)] focus:shadow-[var(--cw-shadow-raised)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
        )}
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--cw-hairline)] bg-white">
        <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-2 px-4 sm:px-8">
          <Link
            href="/"
            aria-label="WRINGG home"
            className="flex min-h-[44px] items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]"
          >
            <Image
              src="/LOGO+TEXT.jpg?v=2"
              alt=""
              width={180}
              height={45}
              className="h-8 w-auto object-contain sm:h-10"
              priority
            />
          </Link>
          <div className="flex min-w-0 items-center">
            {/* Below sm: logo · primary Book pill · account control. Three
                fixed-width pieces budgeted to fit 320px see-through. */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <Button href="/book" size="md" className="min-h-11 px-4">
                Book
              </Button>
              {state.status === "signedIn" ? (
                <button
                  ref={menuTriggerRef}
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={mobileMenuOpen}
                  aria-label={`Account menu — ${accountLabel ?? "account"}`}
                  onClick={() => setMobileMenuOpen(true)}
                  className={cx(
                    "flex h-11 w-11 touch-manipulation shrink-0 items-center justify-center rounded-full",
                    "bg-[var(--cw-accent-soft)] text-[13px] font-extrabold text-[var(--cw-accent-deep)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
                  )}
                >
                  {state.session.profileName?.trim() ? (
                    initialsFor(state.session.profileName)
                  ) : (
                    <UserIcon size={20} />
                  )}
                </button>
              ) : state.status === "signedOut" ? (
                <Link
                  href="/login"
                  className={cx(
                    "inline-flex min-h-11 touch-manipulation items-center rounded-full px-3 text-sm font-semibold text-[var(--cw-text)]",
                    "transition-colors duration-150 hover:bg-[var(--cw-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
                  )}
                >
                  Sign in
                </Link>
              ) : null}
            </div>
            <div className="hidden sm:block">
              <ShellNav
                current={pathname}
                session={state}
                accountLabel={accountLabel}
                onSignOutClick={() => setConfirmingSignOut(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {!online ? (
        <div
          role="status"
          aria-live="polite"
          className="border-b border-amber-100 bg-[var(--cw-warning-soft)] px-5 py-2.5 text-center text-sm font-medium text-[var(--cw-warning)]"
        >
          You&apos;re offline — we&apos;ll retry when you&apos;re back.
        </div>
      ) : null}

      <div
        id="cw-content"
        className={cx(
          "mx-auto w-full flex-1 px-5 py-8 sm:px-8 sm:py-12",
          SHELL_WIDTHS[width],
        )}
      >
        {title || description || actions ? (
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-10">
            <div className="min-w-0 flex-1">
              {title ? (
                <h1 className="cw-display text-[34px] font-bold leading-[38px] text-[var(--cw-ink)] sm:text-[44px] sm:leading-[48px]">
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p className="mt-2.5 max-w-xl text-[15px] leading-6 text-[var(--cw-body)] sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        ) : null}
        {isBackendConfigured() ? children : <BookingUnavailable />}
      </div>

      <footer className="border-t border-[var(--cw-hairline)] bg-white">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-6 text-sm text-[var(--cw-muted)] sm:px-8">
          <span>Cash on delivery · BTM Layout pilot</span>
          <a
            href={SUPPORT_WHATSAPP_URL}
            className={cx(
              "inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-[var(--cw-link)]",
              "transition-colors duration-150 hover:text-[var(--cw-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
            )}
          >
            <WhatsAppIcon size={16} />
            WhatsApp {SUPPORT_PHONE_DISPLAY}
          </a>
        </div>
      </footer>

      {confirmingSignOut ? (
        <SignOutDialog onCancel={() => setConfirmingSignOut(false)} onConfirm={confirmSignOut} />
      ) : null}

      {mobileMenuOpen && state.status === "signedIn" ? (
        <MobileAccountMenu
          current={pathname}
          label={accountLabel ?? "Account"}
          onClose={() => {
            setMobileMenuOpen(false);
            menuTriggerRef.current?.focus();
          }}
          onSignOut={confirmSignOut}
        />
      ) : null}
    </main>
  );
}

// --- Mobile account menu -----------------------------------------------------

/**
 * Small dropdown for <sm screens, opened from the header avatar. Native
 * <dialog> in the top layer pinned under the header; Esc and outside clicks
 * close it; focus returns to the trigger via onClose. Rows are 44px tall and
 * carry aria-current for the active site section.
 */
function MobileAccountMenu({
  current,
  label,
  onClose,
  onSignOut,
}: {
  current: string | null;
  label: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstRowRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    firstRowRef.current?.focus();
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  const row = (href: string, text: string, ref?: Ref<HTMLAnchorElement>) => {
    const active = current === href;
    return (
      <Link
        ref={ref}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onClose}
        className={cx(
          "flex min-h-[44px] touch-manipulation items-center justify-between gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--cw-accent)]",
          active
            ? "bg-[var(--cw-subtle)] text-[var(--cw-accent-strong)]"
            : "text-[var(--cw-text)] hover:bg-[var(--cw-subtle)]",
        )}
      >
        {text}
        {active ? (
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cw-accent)]" />
        ) : null}
      </Link>
    );
  };

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Account menu — ${label}`}
      onClick={(event) => {
        // Close only for clicks actually outside the dialog box (padding
        // clicks land on the dialog element itself and must not close).
        const rect = dialogRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { clientX, clientY } = event;
        if (
          clientX < rect.left ||
          clientX > rect.right ||
          clientY < rect.top ||
          clientY > rect.bottom
        ) {
          onClose();
        }
      }}
      /* Pinned as a dropdown under the header (top-layer dialog, right-aligned
         with a 16px gutter matching the header's px-4). */
      className={cx(
        "cw-dialog fixed left-auto right-4 top-[68px] m-0 w-[min(240px,calc(100vw-32px))]",
        "rounded-[16px] border border-[var(--cw-hairline)] bg-white p-2 shadow-[var(--cw-shadow-tag)]",
      )}
    >
      <p className="truncate px-3.5 pb-1.5 pt-2 text-[13px] font-semibold text-[var(--cw-muted)]">
        {label}
      </p>
      <nav aria-label="Account" className="flex flex-col gap-0.5">
        {row("/orders", "My orders", firstRowRef)}
        {row("/help", "Help")}
        {row("/account", "Profile")}
      </nav>
      <div className="my-1.5 border-t border-[var(--cw-hairline)]" />
      <button
        type="button"
        onClick={onSignOut}
        className={cx(
          "flex min-h-[44px] w-full touch-manipulation items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-[var(--cw-danger)]",
          "transition-colors duration-150 hover:bg-[var(--cw-danger-soft)]",
          "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--cw-danger)]",
        )}
      >
        <LogOutIcon size={16} />
        Sign out
      </button>
    </dialog>
  );
}

// --- Shared states -----------------------------------------------------------

/** Shown when online booking cannot be used; points to the app and WhatsApp. */
export function BookingUnavailable({ message }: { message?: string }) {
  return (
    <Notice tone="warning" title="Book in the WRINGG app" className="rounded-[20px] border-amber-100 px-5 py-5">
      <p className="text-[14px]">
        {message ?? "Online booking is not available right now."} You can still book a pickup in
        the app or message us on WhatsApp.
      </p>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Button href={CUSTOMER_APP_DOWNLOAD_URL} size="md">
          Get the app
        </Button>
        <Button href={SUPPORT_WHATSAPP_URL} variant="secondary" size="md">
          WhatsApp us
        </Button>
      </div>
    </Notice>
  );
}

/** Inline error box for failed actions. */
export function ErrorNotice({ children }: { children: ReactNode }) {
  return <Notice tone="error">{children}</Notice>;
}

/** Full-width loading region with an inline spinner (use Skeletons for bodies). */
export function LoadingBlock({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" className="flex items-center gap-3 py-10 text-sm font-semibold text-[var(--cw-muted)]">
      <Spinner />
      {label}
    </div>
  );
}

/**
 * Session for pages that need a signed-in customer. Signed-out visitors are
 * sent to /login with a `next` back to this page; signed-in customers without
 * a profile are sent to /login to finish the name step.
 */
export function useRequireSession(): SessionState {
  const state = useCustomerSession();
  const router = useRouter();
  const pathname = usePathname();
  // True once this visit reached signedIn. A flip to signedOut without a
  // deliberate sign-out (see signOutWasDeliberate) means token refresh failed
  // — the customer gets the "session expired" notice at /login.
  const wasSignedInRef = useRef(false);

  useEffect(() => {
    if (state.status === "signedOut") {
      const next = `${pathname}${window.location.search}`;
      const expired = wasSignedInRef.current && !signOutWasDeliberate;
      if (signOutWasDeliberate) signOutWasDeliberate = false;
      router.replace(expired ? `${loginHref(next)}&expired=1` : loginHref(next));
    } else if (state.status === "signedIn" && !state.session.hasProfile) {
      const next = `${pathname}${window.location.search}`;
      router.replace(loginHref(next));
    }
    wasSignedInRef.current = state.status === "signedIn";
  }, [state, pathname, router]);

  return state;
}
