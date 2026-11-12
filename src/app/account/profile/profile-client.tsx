"use client";

// Edit profile (/account/profile): full name, display name and email.
// Payload rules are ported from apps/customer-mobile/app/profile — a cleared
// field only sends null when the load had shown a value, otherwise the key is
// omitted so a failed read can never blank stored data. The pure rules live
// in ../profile-helpers and are unit-tested.

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type FormEvent,
} from "react";
import {
  CustomerShell,
  LoadingBlock,
  useRequireSession,
} from "@/components/customer/customer-shell";
import {
  Button,
  Notice,
  Skeleton,
  SlowLoadingHint,
  TextField,
  useLoadTiming,
  useOnline,
} from "@/components/customer/ui";
import { ChevronLeftIcon } from "@/components/customer/icons";
import { cx } from "@/components/customer/ui-helpers";
import { SUPPORT_WHATSAPP_URL } from "@/lib/site-links";
import { completeProfile, getCustomerProfile, updateCustomerProfile } from "@/lib/washmate/api";
import { ApiError, errorMessage } from "@/lib/washmate/client";
import { updateSession, withAuth } from "@/lib/washmate/session";
import {
  buildProfileUpdatePayload,
  validateProfileDraft,
  type ProfileDraft,
} from "../profile-helpers";

const EMPTY_DRAFT: ProfileDraft = { fullName: "", displayName: "", email: "" };

const backLinkClasses = cx(
  "inline-flex min-h-[44px] touch-manipulation items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-[var(--cw-body)] -ml-2 mb-5",
  "transition-colors duration-150 hover:text-[var(--cw-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
);

const FIELD_ORDER: Array<keyof ProfileDraft> = ["fullName", "displayName", "email"];

export function ProfileClient() {
  const state = useRequireSession();
  const status = state.status;
  const router = useRouter();
  const online = useOnline();

  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT);
  // Errors are set on blur (not every keystroke) and re-checked on submit.
  const [errors, setErrors] = useState<Partial<ProfileDraft>>({});
  // What the last successful load had, if anything, for the optional fields.
  const [loaded, setLoaded] = useState<{
    displayName: string | null;
    email: string | null;
  } | null>(null);
  // No profile row exists yet → the blank form is valid and Save takes the
  // create path (completeProfile, falling back to PATCH on a 409 race).
  const [needsCreate, setNeedsCreate] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  // Set when the initial read fails for a customer who already has a profile.
  // Without a distinct state, a transient error leaves empty fields on an
  // editable form: saving would PATCH nulls over data that was never loaded.
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // The values the form had after the last successful load — the dirty check
  // compares against this, and Discard restores it.
  const [baseline, setBaseline] = useState<ProfileDraft>(EMPTY_DRAFT);

  // Skeleton only once the read is actually slow (200ms)…
  const { showSkeleton, slow: slowLoad } = useLoadTiming(initialLoading);

  const load = useCallback(async () => {
    if (status !== "signedIn") return;
    // Requests wait for the network; the effect below re-runs on `online`.
    if (!online) return;
    setLoadError(null);
    setInitialLoading(true);
    try {
      const existing = await withAuth((t) => getCustomerProfile(t));
      if (existing) {
        const next = {
          fullName: existing.fullName || "",
          displayName: existing.displayName || "",
          email: existing.email || "",
        };
        setDraft(next);
        // The baseline the dirty check compares against.
        setBaseline(next);
        setLoaded({ displayName: existing.displayName ?? null, email: existing.email ?? null });
        setNeedsCreate(false);
      } else {
        // No row yet (e.g. an auth user who never finished onboarding): blank
        // form on the create path. PATCHing a nonexistent row would report
        // success while persisting nothing.
        setDraft(EMPTY_DRAFT);
        setBaseline(EMPTY_DRAFT);
        setLoaded(null);
        setNeedsCreate(true);
      }
    } catch (err) {
      // Only a failure to read an EXISTING profile is destructive — the form
      // becomes read-only with a retry. On a genuine first run there is no
      // stored data to lose, so the blank form stays valid.
      setLoadError(errorMessage(err));
      setNeedsCreate(false);
    } finally {
      setInitialLoading(false);
    }
  }, [status, online]);

  useEffect(() => {
    if (status !== "signedIn" || !online) return;
    // Deferred by a microtask so the effect body never calls setState
    // synchronously (react-hooks/set-state-in-effect). Re-runs on `online`.
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (!cancelled && status === "signedIn" && online) await load();
    })();
    return () => {
      cancelled = true;
    };
  }, [status, online, load]);

  // --- Dirty-state guard -----------------------------------------------------

  const isDirty = useMemo(
    () =>
      draft.fullName !== baseline.fullName ||
      draft.displayName !== baseline.displayName ||
      draft.email !== baseline.email,
    [draft, baseline],
  );

  // Browser-level guard: leaving the site with unsaved edits prompts first.
  useEffect(() => {
    if (!isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  // Correctness first: when the initial read fails, the customer is known to
  // HAVE a profile (hasProfile in the session) but its values are unknown —
  // the form must not be editable.
  const blockedByLoadError =
    status === "signedIn" && state.session.hasProfile && !needsCreate && loadError !== null;
  const disabled = blockedByLoadError || submitting || initialLoading;

  // Inline validation on blur: validate the whole draft but surface only the
  // field just left, so earlier untouched fields never shout at the customer.
  function handleBlur(event: FocusEvent<HTMLFormElement>) {
    const field = event.target.name as keyof ProfileDraft | undefined;
    if (!field || !FIELD_ORDER.includes(field)) return;
    // Only fullName and email carry validation rules; touching other fields
    // just clears any stale message on them.
    const fieldError =
      field === "fullName" || field === "email" ? validateProfileDraft(draft)[field] : undefined;
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  }

  async function saveProfile(): Promise<void> {
    if (blockedByLoadError || status !== "signedIn") return;

    const nextErrors = validateProfileDraft(draft);
    setErrors((prev) => ({ ...prev, fullName: nextErrors.fullName, email: nextErrors.email }));
    if (nextErrors.fullName || nextErrors.email) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (needsCreate) {
        try {
          await withAuth((t) =>
            completeProfile(
              {
                fullName: draft.fullName.trim(),
                displayName: draft.displayName.trim() || undefined,
                email: draft.email.trim() || undefined,
              },
              t,
            ),
          );
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            // The row appeared underneath us (onboarding finished elsewhere);
            // fall back to the update path. Nothing was loaded for the
            // optional fields, so no key is cleared — only set.
            await withAuth((t) =>
              updateCustomerProfile(
                buildProfileUpdatePayload(draft, { displayName: null, email: null }),
                t,
              ),
            );
          } else {
            throw err;
          }
        }
      } else {
        await withAuth((t) =>
          updateCustomerProfile(
            buildProfileUpdatePayload(draft, loaded ?? { displayName: null, email: null }),
            t,
          ),
        );
      }
      // The header greeting reads profileName — it updates immediately.
      updateSession({ profileName: draft.displayName.trim() || draft.fullName.trim() });
      router.replace("/account?saved=1");
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void saveProfile();
  }

  return (
    <CustomerShell width="narrow" title="Edit profile">
      <div>
        <Link
          href="/account"
          className={backLinkClasses}
          onClick={(e) => {
            if (isDirty && !blockedByLoadError) {
              e.preventDefault();
              setConfirmDiscard(true);
            }
          }}
        >
          <ChevronLeftIcon size={16} />
          Back
        </Link>
      </div>

      {status !== "signedIn" ? <LoadingBlock label="Checking your session…" /> : null}

      {status === "signedIn" && showSkeleton ? (
        <div aria-busy="true" className="space-y-5">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      ) : null}
      {status === "signedIn" && initialLoading && !showSkeleton ? (
        <SlowLoadingHint show={slowLoad} />
      ) : null}

      {status === "signedIn" && blockedByLoadError ? (
        <div>
          <Notice
            tone="error"
            title="Couldn't load your profile"
            actionLabel="Retry"
            onActionClick={() => void load()}
          >
            Your profile couldn&apos;t be loaded, so it can&apos;t be edited right now. Nothing you
            see here was changed.
          </Notice>
          <div className="mt-4">
            <Button href={SUPPORT_WHATSAPP_URL} variant="ghost" size="md">
              Message us on WhatsApp
            </Button>
          </div>
          <SlowLoadingHint show={slowLoad} />
        </div>
      ) : null}

      {status === "signedIn" && !initialLoading && !blockedByLoadError ? (
        <form onSubmit={handleSubmit} onBlur={handleBlur} noValidate>
          <div className="space-y-5">
            <TextField
              label="Full name"
              name="fullName"
              value={draft.fullName}
              onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
              error={errors.fullName}
              autoComplete="name"
              maxLength={100}
              disabled={disabled}
              required
            />
            <TextField
              label="Display name"
              name="displayName"
              hint="Optional — a shorter name for greetings, like your first name."
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              maxLength={60}
              disabled={disabled}
            />
            <TextField
              label="Email"
              name="email"
              hint="Optional — for order updates if we ever email you."
              type="email"
              inputMode="email"
              autoComplete="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              error={errors.email}
              disabled={disabled}
            />
          </div>

          {submitError ? (
            <div className="mt-5">
              <Notice
                tone="error"
                actionLabel="Retry"
                onActionClick={() => void saveProfile()}
              >
                {submitError}
              </Notice>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => (isDirty ? setConfirmDiscard(true) : router.push("/account"))}
            >
              Cancel
            </Button>
            {/* Nothing changed → nothing to save. */}
            <Button type="submit" size="lg" disabled={!isDirty} loading={submitting} loadingLabel="Saving…">
              Save changes
            </Button>
          </div>
          <p className="mt-4 text-[13px] leading-[18px] text-[var(--cw-muted)]">
            Your phone number can&apos;t be changed — it is how you sign in.
          </p>
        </form>
      ) : null}

      {confirmDiscard ? (
        <DiscardDialog onCancel={() => setConfirmDiscard(false)} onConfirm={discardEdits} />
      ) : null}
    </CustomerShell>
  );

  function discardEdits() {
    setConfirmDiscard(false);
    setDraft(baseline);
    setErrors({});
    router.push("/account");
  }
}

/**
 * Native <dialog> confirm for leaving with unsaved edits. Same interaction
 * contract as the shell's SignOutDialog (top layer, Esc = cancel).
 */
function DiscardDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    cancelRef.current?.focus();
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
      aria-labelledby="discard-title"
      aria-describedby="discard-body"
      onClick={(event) => {
        // Close only for clicks actually outside the dialog box.
        const rect = dialogRef.current?.getBoundingClientRect();
        if (!rect) return;
        const { clientX, clientY } = event;
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
          onCancel();
        }
      }}
      className="cw-dialog m-auto w-[calc(100%-2rem)] max-w-sm rounded-[20px] border border-[var(--cw-hairline)] bg-white p-6 shadow-[var(--cw-shadow-tag)]"
    >
      <h2 id="discard-title" className="cw-display text-xl font-bold text-[var(--cw-ink)]">
        Discard changes?
      </h2>
      <p id="discard-body" className="mt-1.5 text-sm leading-6 text-[var(--cw-body)]">
        You haven&apos;t saved your edits yet. Leaving now will undo them.
      </p>
      <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <button
          type="button"
          ref={cancelRef}
          onClick={onCancel}
          className={cx(
            "inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full bg-[var(--cw-accent-strong)] px-5 text-sm font-semibold text-white",
            "transition-colors duration-150 hover:bg-[var(--cw-accent-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
          )}
        >
          Keep editing
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={cx(
            "inline-flex min-h-11 touch-manipulation items-center justify-center rounded-full border border-[var(--cw-hairline-strong)] bg-white px-5 text-sm font-semibold text-[var(--cw-text)]",
            "transition-colors duration-150 hover:bg-[var(--cw-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
          )}
        >
          Discard
        </button>
      </div>
    </dialog>
  );
}

function FieldSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-[18px] w-28 bg-transparent" />
      <Skeleton className="mt-3 h-12 w-full" />
    </div>
  );
}
