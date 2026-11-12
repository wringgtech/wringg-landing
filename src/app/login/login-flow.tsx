"use client";

// Customer sign-in: phone -> OTP -> (new customers) name.
// Mirrors washmate/apps/customer-mobile/app/login.tsx and app/onboarding.tsx.
// Behaviour (API calls, 429/401 handling, session writes, redirects) is
// unchanged from the first implementation; only structure and styling follow
// the customer design system.

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  BookingUnavailable,
  CustomerShell,
  ErrorNotice,
  LoadingBlock,
} from "@/components/customer/customer-shell";
import {
  Button,
  Notice,
  OtpInput,
  TagCard,
  TagPerforation,
  TagRow,
  TextField,
} from "@/components/customer/ui";
import { cx } from "@/components/customer/ui-helpers";
import { completeProfile, requestOtp, verifyOtp } from "@/lib/washmate/api";
import { ApiError } from "@/lib/washmate/client";
import {
  clearSession,
  saveSession,
  safeNextPath,
  updateSession,
  useCustomerSession,
  withAuth,
} from "@/lib/washmate/session";
import {
  isValidIndianMobile,
  isValidOtp,
  maskPhone,
  sanitizePhoneInput,
  toE164Phone,
  validateEmail,
  validateFullName,
} from "./login-helpers";

type Step = "phone" | "otp" | "name";

const STEP_ORDER: Step[] = ["phone", "otp", "name"];

const STEP_COPY: Record<Step, { title: string; description: string }> = {
  phone: {
    title: "Sign in to book a pickup",
    description: "Enter your mobile number and we'll text you a 6-digit code.",
  },
  otp: {
    title: "Enter the 6-digit code",
    description: "Type the code from the SMS we just sent.",
  },
  name: {
    title: "What should we call you?",
    description: "We use your name on order updates and receipts.",
  },
};

export function LoginFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const state = useCustomerSession();
  // Set by useRequireSession on other pages when token refresh fails
  // (loginHref + "&expired=1"). Session storage is belt-and-braces for arrivals
  // where the URL param was lost by a redirect chain.
  const expiredParam = searchParams.get("expired") === "1";

  // Already-signed-in customers never see the form; they land on their
  // destination (or /book) straight away.
  useEffect(() => {
    if (state.status === "signedIn" && state.session.hasProfile) {
      router.replace(safeNextPath(searchParams.get("next")));
    }
  }, [state, router, searchParams]);

  if (state.status === "loading") {
    return <LoadingShell />;
  }

  // Signed-in with a profile: keep the loading shell up while
  // router.replace(safeNextPath(next)) takes the customer to the destination
  // so the form never flashes first.
  if (state.status === "signedIn" && state.session.hasProfile) {
    return <LoadingShell />;
  }

  const signedInNoProfile = state.status === "signedIn" && !state.session.hasProfile;

  return (
    <CustomerShell width="wide">
      <LoginForm
        startStep={signedInNoProfile ? "name" : "phone"}
        next={safeNextPath(searchParams.get("next"))}
        expired={expiredParam}
        // Signed-in customers landing on the name step keep their number so a
        // 401 fallback from complete-profile still shows it on the phone step.
        initialPhone={signedInNoProfile ? sanitizePhoneInput(state.session.phone) : ""}
      />
    </CustomerShell>
  );
}

function LoadingShell() {
  return (
    <CustomerShell width="wide">
      <LoadingBlock label="Loading sign-in…" />
    </CustomerShell>
  );
}

const PICKUP_FACTS: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Pickup", value: "From your door, in BTM Layout" },
  { label: "Payment", value: "Cash when your clothes come back" },
  { label: "Timing", value: "Pick a slot that suits you" },
];

function LoginForm({
  startStep,
  next,
  expired = false,
  initialPhone = "",
}: {
  startStep: Step;
  next: string;
  /** Arrived from a forced sign-out after token refresh failed. */
  expired?: boolean;
  /** 10-digit subscriber number preseeded from an existing session. */
  initialPhone?: string;
}) {
  const router = useRouter();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(startStep);
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Autofocus the phone field on mount without a scroll jump (preventScroll;
  // reduced-motion users get the same instant focus, nothing animates).
  const autoFocusPhone = startStep === "phone";
  useEffect(() => {
    if (!autoFocusPhone) return;
    phoneInputRef.current?.focus({ preventScroll: true });
  }, [autoFocusPhone, step]);

  function fail(err: unknown, fallback: string) {
    if (err instanceof ApiError && (err.code === "APP_UPDATE_REQUIRED" || err.code === "NOT_CONFIGURED")) {
      setUnavailable(err.message || fallback);
      return;
    }
    setError(err instanceof Error && err.message ? err.message : fallback);
  }

  async function handleRequestOtp(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    if (!isValidIndianMobile(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setBusy(true);
    try {
      const result = await requestOtp({ phone: toE164Phone(phone) });
      setSessionId(result.sessionId ?? "");
      setCountdown(result.retryAfterSeconds);
      setOtp("");
      setStep("otp");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError("Please wait before requesting another OTP.");
      } else {
        fail(err, "Could not send the code. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isValidOtp(otp)) {
      setError("Enter the 6-digit code we texted you.");
      return;
    }
    if (!sessionId) {
      setError("This code has expired. Please request a new one.");
      return;
    }
    setBusy(true);
    try {
      const result = await verifyOtp({ phone: toE164Phone(phone), otp, sessionId });
      const hasProfile = result.customer ? result.customer.hasProfile : !result.isNewUser;
      saveSession({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        userId: result.userId,
        phone: toE164Phone(phone),
        hasProfile,
        profileName: result.profileName ?? null,
      });
      if (hasProfile) {
        router.replace(next);
      } else {
        setStep("name");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Wrong or expired code. Please try again.");
      } else {
        fail(err, "Could not verify the code. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCompleteProfile(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const nameError = validateFullName(fullName);
    if (nameError) {
      setError(nameError);
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setBusy(true);
    try {
      const name = fullName.trim();
      await withAuth((t) => completeProfile({ fullName: name, email: email.trim() || undefined }, t));
      updateSession({ hasProfile: true, profileName: name });
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // withAuth already cleared the stored session on the refresh-retry
        // failure; clear again so updateSession has nothing to write to.
        clearSession();
        setError("Your session has expired. Please sign in again.");
        setStep("phone");
        setSessionId("");
      } else {
        fail(err, "Could not save your name. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (unavailable) {
    return <BookingUnavailable message={unavailable} />;
  }

  const copy = STEP_COPY[step];
  const stepNumber = STEP_ORDER.indexOf(step) + 1;

  return (
    <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
      {/* Form column */}
      <div className="w-full max-w-[420px]">
        <p className="text-[13px] font-medium text-[var(--cw-muted)]">
          Step {stepNumber} of 3
        </p>
        <h1 className="cw-display mt-1 text-[34px] font-bold leading-[38px] text-[var(--cw-ink)] sm:text-[44px] sm:leading-[48px]">
          {copy.title}
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-[var(--cw-body)]">{copy.description}</p>

        {expired ? (
          <div className="mt-4">
            <Notice tone="info">Your session expired — sign in again to continue.</Notice>
          </div>
        ) : null}

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} noValidate className="mt-7">
            <TextField
              label="Mobile number"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              hint="Booking is open in the BTM Layout pilot area."
              prefix={<span className="text-[15px] font-semibold text-[var(--cw-text)]">+91</span>}
              value={phone}
              onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
              disabled={busy}
              name="phone"
              inputRef={phoneInputRef}
            />

            {error ? (
              <div className="mt-4">
                <ErrorNotice>{error}</ErrorNotice>
              </div>
            ) : null}

            <Button type="submit" size="lg" loading={busy} loadingLabel="Sending code…" className="mt-6 w-full">
              Send code
            </Button>
          </form>
        ) : null}

        {step === "otp" ? (
          <form onSubmit={handleVerifyOtp} noValidate className="mt-7">
            <p className="flex flex-wrap items-center gap-x-2 text-[15px] text-[var(--cw-body)]">
              <span>
                Sent to{" "}
                <span className="font-semibold text-[var(--cw-ink)]">
                  {maskPhone(toE164Phone(phone))}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setSessionId("");
                  setCountdown(0);
                  setError(null);
                }}
                disabled={busy}
                className="inline-flex min-h-11 items-center font-semibold text-[var(--cw-link)] underline-offset-4 transition-colors duration-150 hover:text-[var(--cw-accent-deep)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]"
              >
                Change number
              </button>
            </p>

            <div className="mt-3">
              <OtpInput
                length={6}
                value={otp}
                onChange={setOtp}
                disabled={busy}
                autoFocus
                label="6-digit code"
              />
            </div>

            <p className="mt-3 flex min-h-11 flex-wrap items-center gap-x-1.5 text-sm text-[var(--cw-muted)]">
              Didn&apos;t get it?
              {countdown > 0 ? (
                <span aria-live="polite" className="font-medium tabular-nums">
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleRequestOtp()}
                  disabled={busy}
                  className={cx(
                    "inline-flex min-h-11 items-center font-semibold text-[var(--cw-link)] underline-offset-4 transition-colors duration-150",
                    "hover:text-[var(--cw-accent-deep)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
                  )}
                >
                  Resend code
                </button>
              )}
            </p>

            {error ? (
              <div className="mt-4">
                <ErrorNotice>{error}</ErrorNotice>
              </div>
            ) : null}

            <Button type="submit" size="lg" loading={busy} loadingLabel="Verifying…" className="mt-6 w-full">
              Verify & continue
            </Button>
          </form>
        ) : null}

        {step === "name" ? (
          <form onSubmit={handleCompleteProfile} noValidate className="mt-7">
            <TextField
              label="Full name"
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="Aravind Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={busy}
            />
            <div className="mt-4">
              <TextField
                label="Email (optional)"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>

            {error ? (
              <div className="mt-4">
                <ErrorNotice>{error}</ErrorNotice>
              </div>
            ) : null}

            <Button type="submit" size="lg" loading={busy} loadingLabel="Saving…" className="mt-6 w-full">
              Continue
            </Button>
          </form>
        ) : null}

        <p className="mt-6 text-[13px] leading-[18px] text-[var(--cw-muted)]">
          By continuing you agree to our{" "}
          <Link href="/terms" className="font-semibold text-[var(--cw-link)] hover:text-[var(--cw-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]">
            Terms
          </Link>{" "}
          &{" "}
          <Link href="/privacy" className="font-semibold text-[var(--cw-link)] hover:text-[var(--cw-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Signature panel: one surfaced laundry tag with the photo and the
          pickup facts as tag rows. Hidden below lg — phones get the form only. */}
      <aside aria-label="What to expect" className="hidden w-full max-w-[560px] flex-1 lg:block">
        <TagCard kicker="Pickup tag">
          <Image
            src="/2.WEBP.png?v=2"
            alt="Freshly cleaned and folded laundry packed by WRINGG"
            width={880}
            height={560}
            className="h-56 w-full rounded-xl object-cover sm:h-64"
            priority
          />
          <TagPerforation />
          <div className="space-y-1.5">
            {PICKUP_FACTS.map((fact) => (
              <TagRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </div>
          <footer>
            <p className="text-[13px] leading-[18px] text-[var(--cw-muted)]">
              Cash on delivery · BTM Layout pilot · no advance payment
            </p>
          </footer>
        </TagCard>
      </aside>
    </div>
  );
}
