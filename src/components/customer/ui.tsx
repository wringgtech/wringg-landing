"use client";

// Customer UI primitives for the redesigned pages: Button, TextField, OTP
// entry, choice tiles, stepper, the laundry-tag pieces and small helpers.
// Design tokens live in customer.css and are loaded via customer-shell.tsx.

import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ClipboardEvent as ReactClipboardEvent,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from "react";
import {
  AlertIcon,
  CheckIcon,
  InfoIcon,
  SparkleIcon,
} from "@/components/customer/icons";
import {
  OTP_BLANK,
  applyOtpValue,
  clampStepper,
  cx,
  digitsOnly,
  parseStepperInput,
  removeOtpDigit,
  sanitizeStepperDraft,
} from "@/components/customer/ui-helpers";
import { formatRupeesIndian } from "@/lib/washmate/pricing";
import "./customer.css";

// --- Shared class strings ---------------------------------------------------

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]";

const BUTTON_BASE = cx(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold",
  "touch-manipulation",
  "transition-colors duration-150 ease-out disabled:cursor-not-allowed disabled:shadow-none",
  FOCUS_RING,
);

const BUTTON_VARIANTS = {
  primary:
    "bg-[var(--cw-accent-strong)] text-white shadow-[var(--cw-shadow-raised)] hover:bg-[var(--cw-accent-deep)] disabled:bg-[var(--cw-subtle)] disabled:text-[var(--cw-muted)]",
  secondary:
    "border border-[var(--cw-hairline-strong)] bg-white text-[var(--cw-text)] hover:bg-[var(--cw-subtle)] disabled:opacity-55",
  ghost:
    "text-[var(--cw-link)] hover:bg-[var(--cw-accent-soft)] disabled:opacity-55",
} as const;

const BUTTON_SIZES = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-12 px-6 text-[15px]",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none",
        className,
      )}
    />
  );
}

export { Spinner };

const INTERNAL_HREF = /^\/(?!\/)/;

// --- Button -----------------------------------------------------------------

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** replaces the button text while loading (e.g. "Checking…") */
  loadingLabel?: string;
};

export type ButtonProps = ButtonOwnProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export type ButtonLinkProps = ButtonOwnProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/**
 * Pill button. Renders a Next <Link> (href starting with "/"), a plain <a>
 * (external hrefs) or a <button>. `loading` shows an inline spinner +
 * `loadingLabel` and blocks activation (aria-busy).
 */
export function Button(props: ButtonProps | ButtonLinkProps) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    loadingLabel,
    className,
    children,
    onClick,
    ...rest
  } = props;

  const classes = cx(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className);

  const loadingContent = (
    <>
      <Spinner />
      <span>{loadingLabel ?? children}</span>
    </>
  );

  if ("href" in props && props.href !== undefined) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    const anchorOnClick = onClick as unknown as
      | AnchorHTMLAttributes<HTMLAnchorElement>["onClick"]
      | undefined;
    const guardedOnClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
      if (loading) {
        event.preventDefault();
        return;
      }
      anchorOnClick?.(event);
    };
    const content = loading ? loadingContent : children;
    if (INTERNAL_HREF.test(props.href)) {
      return (
        <Link
          href={props.href}
          className={classes}
          aria-busy={loading || undefined}
          aria-disabled={loading || undefined}
          onClick={guardedOnClick}
          {...anchorProps}
        >
          {content}
        </Link>
      );
    }
    return (
      <a
        href={props.href}
        className={classes}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={guardedOnClick}
        {...anchorProps}
      >
        {content}
      </a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  const buttonOnClick = onClick as ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  return (
    <button
      type="button"
      className={classes}
      disabled={loading || buttonProps.disabled}
      aria-busy={loading || undefined}
      onClick={buttonOnClick}
      {...buttonProps}
    >
      {loading ? loadingContent : children}
    </button>
  );
}

// --- TextField ----------------------------------------------------------------

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  /** Visible label — always required, this is a labelled form. */
  label: string;
  /** Optional helper text shown under the label. */
  hint?: string;
  /** Error message; switches the field to its error state (role=alert text). */
  error?: string;
  /** Decorative lead-in inside the field, e.g. an icon or "+91". */
  prefix?: ReactNode;
  /** Visually hides the label (still announced to screen readers). */
  hideLabel?: boolean;
  /**
   * Ref to the inner input — for focus control (e.g. autofocus without a
   * scroll jump via el.focus({ preventScroll: true })).
   */
  inputRef?: Ref<HTMLInputElement>;
}

/** Labelled text input with hint/error wiring (aria-describedby, aria-invalid).
 * The input is 16px minimum so iOS never zooms the viewport on focus. */
export function TextField({
  label,
  hint,
  error,
  prefix,
  hideLabel = false,
  inputRef,
  className,
  ...inputProps
}: TextFieldProps) {
  const autoId = useId();
  const id = inputProps.id ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className={cx(
          "block text-[13px] font-semibold leading-[18px] text-[var(--cw-text)]",
          hideLabel && "sr-only",
        )}
      >
        {label}
      </label>
      <div
        className={cx(
          "mt-1.5 flex min-h-12 items-center gap-2 rounded-xl border bg-white px-3.5 transition-colors duration-150",
          error
            ? "border-[var(--cw-danger)]"
            : "border-[var(--cw-hairline-strong)] focus-within:border-[var(--cw-accent)]",
        )}
      >
        {prefix ? <span className="shrink-0 text-[var(--cw-muted)]">{prefix}</span> : null}
        <input
          id={id}
          ref={inputRef}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cx(
            "w-full min-w-0 bg-transparent py-3 text-[16px] text-[var(--cw-text)]",
            "placeholder:text-slate-400 focus-visible:outline-none",
            className,
          )}
          {...inputProps}
        />
      </div>
      {hint && !error ? (
        <p id={hintId} className="mt-1.5 text-[13px] leading-[18px] text-[var(--cw-muted)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-[13px] font-medium text-[var(--cw-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

// --- OtpInput -----------------------------------------------------------------

export interface OtpInputProps {
  /** Number of digit boxes. Defaults to 6. */
  length?: number;
  /** Current value as a plain digit string ("" or up to `length` digits). */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessible group label. */
  label?: string;
}

/** Multi-box one-time-code entry: paste spreads digits, backspace steps back,
 * arrow keys move between boxes. One accessible group label, numeric keypad. */
export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  label = "One-time code",
}: OtpInputProps) {
  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);

  const focusBox = (index: number) => {
    const clamped = Math.min(length - 1, Math.max(0, index));
    boxRefs.current[clamped]?.focus();
    boxRefs.current[clamped]?.select();
  };

  const handleInput = (index: number, raw: string) => {
    const digits = digitsOnly(raw);
    if (!digits) {
      // Non-digit keystroke clears just this box.
      if (value[index] && value[index] !== OTP_BLANK) {
        onChange(applyOtpValue(value, index, "", length));
      }
      return;
    }
    // One digit lands in this box; anything longer (SMS autofill into the
    // first box, or a multi-char payload) spreads across the boxes like paste.
    const next = applyOtpValue(value, index, digits, length);
    onChange(next);
    focusBox(index + digits.length);
  };

  const handleKeyDown = (index: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    const filled = Boolean(value[index] && value[index] !== OTP_BLANK);
    if (event.key === "Backspace") {
      event.preventDefault();
      if (filled) {
        onChange(removeOtpDigit(value, index, length));
      } else if (index > 0) {
        onChange(removeOtpDigit(value, index - 1, length));
        focusBox(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index: number, event: ReactClipboardEvent<HTMLInputElement>) => {
    const pasted = digitsOnly(event.clipboardData.getData("text"));
    if (!pasted) return;
    event.preventDefault();
    onChange(applyOtpValue(value, index, pasted, length));
    focusBox(index + pasted.length);
  };

  return (
    <div role="group" aria-label={label} className="flex gap-2 sm:gap-2.5">
      {Array.from({ length }, (_, i) => {
        const char = value[i] && value[i] !== OTP_BLANK ? value[i] : "";
        return (
          <input
            key={i}
            ref={(el) => {
              boxRefs.current[i] = el;
            }}
            value={char}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={(e) => handlePaste(i, e)}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            autoFocus={autoFocus && i === 0}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            // The first box must accept a full SMS-autofilled code; its input
            // handler spreads multi-digit values across the boxes.
            maxLength={i === 0 ? length : 1}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1} of ${length}`}
            className={cx(
              "cw-display h-14 w-full min-w-0 max-w-12 rounded-xl border bg-white text-center text-[24px] font-bold tabular-nums text-[var(--cw-ink)]",
              "transition-colors duration-150 placeholder:text-slate-300",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--cw-accent)]",
              char
                ? "border-[var(--cw-accent)]"
                : "border-[var(--cw-hairline-strong)]",
              disabled && "cursor-not-allowed opacity-55",
            )}
          />
        );
      })}
    </div>
  );
}

// --- ChoiceGroup / ChoiceTile ---------------------------------------------------

export interface ChoiceGroupProps {
  /** Group label, rendered as the fieldset legend. */
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/** Radio group wrapper (fieldset + legend) for a stack/grid of ChoiceTiles. */
export function ChoiceGroup({ label, hint, children, className }: ChoiceGroupProps) {
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="text-[13px] font-semibold leading-[18px] text-[var(--cw-text)]">
        {label}
      </legend>
      {hint ? <p className="mt-1 text-[13px] leading-[18px] text-[var(--cw-muted)]">{hint}</p> : null}
      <div className="mt-2.5 grid gap-2.5">{children}</div>
    </fieldset>
  );
}

export interface ChoiceTileProps {
  /** Radio group name (shared by tiles in one ChoiceGroup). */
  name: string;
  value: string;
  checked?: boolean;
  /** Called with `value` when this tile is selected. */
  onCheck?: (value: string) => void;
  /** Leading icon (e.g. from icons.tsx). */
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Right-aligned extra info, e.g. "₹99 · per order". */
  meta?: ReactNode;
  disabled?: boolean;
  /** Shown in place of the description when the tile is disabled. */
  disabledReason?: string;
}

/** Selectable tile with native radio semantics and an accent selected state. */
export function ChoiceTile({
  name,
  value,
  checked = false,
  onCheck,
  icon,
  title,
  description,
  meta,
  disabled = false,
  disabledReason,
}: ChoiceTileProps) {
  const reasonId = useId();
  return (
    <label
      className={cx(
        "relative flex cursor-pointer items-center gap-3.5 rounded-2xl border bg-white p-4 transition-[border-color,box-shadow,background-color] duration-150",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--cw-accent)]",
        checked
          ? "border-[var(--cw-accent)] shadow-[inset_0_0_0_1px_var(--cw-accent),var(--cw-shadow-raised)]"
          : "border-[var(--cw-hairline-strong)] hover:border-[rgba(15,49,72,0.32)]",
        disabled && "cursor-not-allowed bg-[var(--cw-subtle)] hover:border-[var(--cw-hairline-strong)]",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onCheck?.(value)}
        disabled={disabled}
        aria-describedby={disabled && disabledReason ? reasonId : undefined}
        className="peer sr-only"
      />
      {icon ? (
        <span
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150",
            checked
              ? "bg-[var(--cw-accent-strong)] text-white"
              : "bg-[var(--cw-accent-soft)] text-[var(--cw-accent-strong)]",
            disabled && "bg-white text-[var(--cw-muted)]",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span
          className={cx(
            "block text-[15px] font-bold leading-6",
            disabled ? "text-[var(--cw-muted)]" : "text-[var(--cw-ink)]",
          )}
        >
          {title}
        </span>
        {disabled && disabledReason ? (
          <span id={reasonId} className="mt-0.5 block text-[13px] leading-[18px] text-[var(--cw-muted)]">
            {disabledReason}
          </span>
        ) : (
          description && (
            <span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--cw-muted)]">
              {description}
            </span>
          )
        )}
      </span>
      {meta !== undefined && meta !== null ? (
        <span className="ml-1 shrink-0 text-right text-sm font-bold tabular-nums text-[var(--cw-text)]">
          {meta}
        </span>
      ) : null}
      <RadioMark checked={checked} disabled={disabled} />
    </label>
  );
}

/** Visible radio ring so unselected tiles still read as choosable. */
export function RadioMark({ checked, disabled = false }: { checked: boolean; disabled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
        checked
          ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-strong)]"
          : "border-[var(--cw-hairline-strong)] bg-white",
        disabled && "opacity-50",
      )}
    >
      {checked ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
    </span>
  );
}

// --- Stepper --------------------------------------------------------------------

export interface StepperProps {
  /** Accessible name for the whole control. */
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  /** Quick preset chips under the control, e.g. [5, 10, 15, 20]. */
  quickPicks?: readonly number[];
}

/** −/value/+ counter with 44px buttons and optional quick-pick preset chips. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  disabled = false,
  quickPicks,
}: StepperProps) {
  // While the user edits the text field we hold a raw digit draft (empty
  // allowed) and only commit a clamped integer on blur or Enter. `null` means
  // the input mirrors the authoritative `value` prop.
  const [draft, setDraft] = useState<string | null>(null);
  const set = (next: number) => {
    setDraft(null);
    onChange(clampStepper(next, min, max));
  };

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = parseStepperInput(draft, min, max);
    // An empty or unparsable draft reverts to the current value.
    onChange(parsed ?? value);
    setDraft(null);
  };

  const shown = draft ?? String(value);

  return (
    <div>
      <div className="inline-flex items-center gap-2" role="group" aria-label={label}>
        <button
          type="button"
          aria-label={`Fewer — ${label}`}
          disabled={disabled || value <= min}
          onClick={() => set(value - 1)}
          className={cx(
            "flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border border-[var(--cw-hairline-strong)] bg-white text-2xl font-medium text-[var(--cw-ink)]",
            "transition-colors duration-150 hover:bg-[var(--cw-subtle)] disabled:cursor-not-allowed disabled:opacity-50",
            FOCUS_RING,
          )}
        >
          −
        </button>
        <input
          aria-label={label}
          value={shown}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          onChange={(e) => {
            // Digits only; empty stays empty so the field can be cleared
            // before retyping. Clamping happens on commit, not mid-edit.
            setDraft(sanitizeStepperDraft(e.target.value));
          }}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            }
          }}
          className={cx(
            "cw-display h-14 w-20 rounded-2xl border border-[var(--cw-hairline-strong)] bg-white text-center text-[28px] font-bold tabular-nums text-[var(--cw-ink)]",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--cw-accent)] disabled:opacity-55",
          )}
        />
        <button
          type="button"
          aria-label={`More — ${label}`}
          disabled={disabled || value >= max}
          onClick={() => set(value + 1)}
          className={cx(
            "flex h-12 w-12 touch-manipulation items-center justify-center rounded-full border border-[var(--cw-hairline-strong)] bg-white text-2xl font-medium text-[var(--cw-ink)]",
            "transition-colors duration-150 hover:bg-[var(--cw-subtle)] disabled:cursor-not-allowed disabled:opacity-50",
            FOCUS_RING,
          )}
        >
          +
        </button>
      </div>
      {quickPicks && quickPicks.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {quickPicks.map((pick) => (
            <button
              key={pick}
              type="button"
              disabled={disabled || pick < min || pick > max}
              onClick={() => set(pick)}
              aria-pressed={pick === value}
              className={cx(
                "min-h-9 min-w-11 touch-manipulation rounded-full border px-3 text-[13px] font-semibold tabular-nums transition-colors duration-150",
                pick === value
                  ? "border-[var(--cw-accent-strong)] bg-[var(--cw-accent-strong)] text-white"
                  : "border-[var(--cw-hairline-strong)] bg-white text-[var(--cw-text)] hover:bg-[var(--cw-subtle)]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                FOCUS_RING,
              )}
            >
              {pick}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// --- SectionHeader / Divider ------------------------------------------------------

export interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned action (link/button). */
  action?: ReactNode;
}

/** 20px display section heading with optional description and trailing action. */
export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="cw-display text-[20px] font-bold leading-7 text-[var(--cw-ink)]">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[14px] leading-5 text-[var(--cw-muted)]">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Hairline divider (used between sections). */
export function Divider({ className }: { className?: string }) {
  return <hr className={cx("border-0 border-t border-[var(--cw-hairline)]", className)} />;
}

// --- Notice ------------------------------------------------------------------------

export type NoticeTone = "info" | "success" | "warning" | "error";

const NOTICE_TONES: Record<NoticeTone, { box: string; text: string; icon: ReactNode }> = {
  info: {
    box: "border-[var(--cw-hairline-strong)] bg-[var(--cw-subtle)]",
    text: "text-[var(--cw-text)]",
    icon: <InfoIcon className="text-[var(--cw-link)]" />,
  },
  success: {
    box: "border-emerald-100 bg-[var(--cw-success-soft)]",
    text: "text-[var(--cw-success)]",
    icon: <CheckIcon className="text-[var(--cw-success)]" />,
  },
  warning: {
    box: "border-amber-100 bg-[var(--cw-warning-soft)]",
    text: "text-[var(--cw-warning)]",
    icon: <SparkleIcon className="text-[var(--cw-warning)]" />,
  },
  error: {
    box: "border-rose-100 bg-[var(--cw-danger-soft)]",
    text: "text-[var(--cw-danger)]",
    icon: <AlertIcon className="text-[var(--cw-danger)]" />,
  },
};

export interface NoticeProps {
  tone: NoticeTone;
  title?: string;
  children: ReactNode;
  /** Optional trailing action (retry link/button). */
  action?: ReactNode;
  /**
   * Single-action shorthand: renders a small ghost button after the body.
   * Give `actionLabel` plus `onActionClick` and/or `actionHref`.
   */
  actionLabel?: string;
  onActionClick?: () => void;
  actionHref?: string;
  className?: string;
}

/** Inline notice box. Errors use role="alert" with aria-live; other tones role="status". */
export function Notice({
  tone,
  title,
  children,
  action,
  actionLabel,
  onActionClick,
  actionHref,
  className,
}: NoticeProps) {
  const t = NOTICE_TONES[tone];
  const trailing =
    actionLabel !== undefined ? (
      <Button variant="ghost" size="md" href={actionHref} onClick={onActionClick}>
        {actionLabel}
      </Button>
    ) : (
      action
    );
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cx(
        "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm leading-6",
        t.box,
        t.text,
        className,
      )}
    >
      <span className="mt-0.5 shrink-0">{t.icon}</span>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={cx(title && "mt-0.5", "text-[13.5px] leading-6 opacity-90")}>{children}</div>
        {trailing ? <div className="mt-2">{trailing}</div> : null}
      </div>
    </div>
  );
}

// --- Loading timing / connectivity ----------------------------------------------

export interface LoadTiming {
  /** False until the load has taken 200ms — no skeleton flash on fast reads. */
  showSkeleton: boolean;
  /** True after 6s of the same load — show the "still loading" line. */
  slow: boolean;
}

/**
 * Loading-state timing for data regions: skeletons appear only once a load
 * has actually taken 200ms, and after 6s `slow` turns on so the page can add
 * a muted "Still loading" line. Timers reset whenever `active` flips.
 */
export function useLoadTiming(active: boolean, delayMs = 200, slowMs = 6000): LoadTiming {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!active) {
      // Deferred by a microtask so the effect body itself never calls setState
      // synchronously (react-hooks/set-state-in-effect).
      let cancelled = false;
      void (async () => {
        await Promise.resolve();
        if (!cancelled) {
          setShowSkeleton(false);
          setSlow(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }
    const skeletonTimer = setTimeout(() => setShowSkeleton(true), delayMs);
    const slowTimer = setTimeout(() => setSlow(true), slowMs);
    return () => {
      clearTimeout(skeletonTimer);
      clearTimeout(slowTimer);
    };
  }, [active, delayMs, slowMs]);

  return { showSkeleton, slow };
}

/** The muted line shown under skeletons once a load takes 6s. */
export function SlowLoadingHint({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p role="status" className="mt-3 text-[13px] leading-[18px] text-[var(--cw-muted)]">
      Still loading — this can take a moment on a slow connection.
    </p>
  );
}

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

/** Live online/offline state. Server render always reports online. */
export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, getOnline, () => true);
}

// --- Money ---------------------------------------------------------------------------

export interface MoneyProps {
  /** Server decimal string (e.g. "1234.50") or a number. */
  amount: string | number | null | undefined;
  className?: string;
}

/**
 * ₹ with Indian digit grouping (en-IN: ₹12,345.50) and no decimals unless
 * paise exist. Always tabular-nums.
 */
export function Money({ amount, className }: MoneyProps) {
  return <span className={cx("tabular-nums", className)}>{formatRupeesIndian(amount)}</span>;
}

// --- Skeleton ------------------------------------------------------------------------

/** Loading placeholder block with a reduced-motion-safe shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cx("cw-skeleton h-4 w-full", className)} />;
}

// --- Laundry tag (signature) --------------------------------------------------------

export interface TagCardProps {
  /** Title printed on the tag's navy band, e.g. "Pickup tag". */
  kicker?: string;
  /** Right side of the band, e.g. care symbols for the chosen service. */
  bandAside?: ReactNode;
  children: ReactNode;
  /** Footer slot for CTA / notes, separated by a hairline. */
  footer?: ReactNode;
  className?: string;
}

/** The signature hang tag: navy band with an eyelet, white body, perforated
 * divider slot and optional footer. */
export function TagCard({ kicker = "Pickup tag", bandAside, children, footer, className }: TagCardProps) {
  return (
    <section className={cx("cw-tag", className)}>
      <div className="cw-tag-band">
        <span className="cw-tag-eyelet" aria-hidden="true" />
        <p className="cw-tag-title">{kicker}</p>
        {bandAside ? <div className="shrink-0 text-white/80">{bandAside}</div> : null}
      </div>
      <div className="cw-tag-body">
        {children}
        {footer ? (
          <div className="mt-5 border-t border-[var(--cw-hairline)] pt-5">{footer}</div>
        ) : null}
      </div>
    </section>
  );
}

export interface TagRowProps {
  label: string;
  value: ReactNode;
  /** Emphasised value (accent ink, bolder) for the one key row. */
  emphasis?: boolean;
}

/** One tag line: muted label left, semibold tabular value right. */
export function TagRow({ label, value, emphasis = false }: TagRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[13px] leading-[18px] text-[var(--cw-muted)]">{label}</span>
      <span
        className={cx(
          "text-right tabular-nums",
          emphasis
            ? "text-sm font-extrabold text-[var(--cw-accent-strong)]"
            : "text-sm font-semibold text-[var(--cw-text)]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Perforated divider with notches cut into both card edges. */
export function TagPerforation() {
  return <div className="cw-tag-perforation" role="presentation" />;
}

export interface TagTotalProps {
  label: string;
  /** Formatted amount, e.g. "₹340". */
  amount: ReactNode;
}

/** Total row on the tag: 15px semibold label, 32px display amount. */
export function TagTotal({ label, amount }: TagTotalProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <span className="text-[15px] font-semibold text-[var(--cw-text)]">{label}</span>
      <span className="cw-display text-[32px] font-bold leading-9 tabular-nums text-[var(--cw-ink)]">
        {amount}
      </span>
    </div>
  );
}

// --- StatusDot -----------------------------------------------------------------------

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const STATUS_COLORS: Record<StatusTone, { dot: string; text: string }> = {
  success: { dot: "bg-[var(--cw-success)]", text: "text-[var(--cw-success)]" },
  warning: { dot: "bg-[var(--cw-warning)]", text: "text-[var(--cw-warning)]" },
  danger: { dot: "bg-[var(--cw-danger)]", text: "text-[var(--cw-danger)]" },
  info: { dot: "bg-[var(--cw-accent)]", text: "text-[var(--cw-link)]" },
  neutral: { dot: "bg-slate-400", text: "text-[var(--cw-muted)]" },
};

export interface StatusDotProps {
  tone: StatusTone;
  /** Status text shown next to the dot. */
  children: ReactNode;
}

/** Small coloured dot + plain text — statuses without pill styling. */
export function StatusDot({ tone, children }: StatusDotProps) {
  const c = STATUS_COLORS[tone];
  return (
    <span className={cx("inline-flex items-center gap-2 text-[13px] font-medium", c.text)}>
      <span aria-hidden="true" className={cx("h-1.5 w-1.5 shrink-0 rounded-full", c.dot)} />
      {children}
    </span>
  );
}
