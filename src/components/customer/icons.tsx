// Inline SVG icon set for the customer pages. One consistent outline style:
// 24x24 viewBox, 1.75 stroke, round caps, `currentColor`. Icons are
// decorative by default (aria-hidden) — pass `title` when the icon is the
// only content or carries meaning.

import type { ReactNode, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  /** Pixel size (width and height). Defaults to 20. */
  size?: number;
  /** Accessible name — turns the icon into an image for screen readers. */
  title?: string;
  strokeWidth?: number;
  className?: string;
}

function IconBase({
  size = 20,
  title,
  strokeWidth = 1.75,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  if (title) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        role="img"
        aria-label={title}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        <title>{title}</title>
        {children}
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </IconBase>
  );
}

export function ShirtIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2Z" />
    </IconBase>
  );
}

export function IronIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 18.5h19" />
      <path d="M4.5 18.5V13a6.5 6.5 0 0 1 6.5-6.5h1.5A7.5 7.5 0 0 1 20 14v4.5" />
      <path d="M9.5 6.5v-1a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1" />
    </IconBase>
  );
}

export function WasherIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="12" cy="14" r="4.25" />
      <path d="M7 6.75h.01M11 6.75h.01" />
      <path d="M8 14.2c1.3 1.2 2.2 1.2 3.4.2 1.3-1.1 2.3-1 3.4.2" />
    </IconBase>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10.5h18" />
    </IconBase>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.6 12.6 12.6 2.6A2 2 0 0 1 14 2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.6 1.4l-10 10a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1 0-2.8Z" />
      <circle cx="16.5" cy="7.5" r="1" />
    </IconBase>
  );
}

export function CashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.75" />
      <path d="M6 12h.01M18 12h.01" />
    </IconBase>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m4 12.5 5.5 5.5L20 6.5" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 5 7 7-7 7" />
    </IconBase>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m15 5-7 7 7 7" />
    </IconBase>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </IconBase>
  );
}

export function WhatsAppIcon({ size = 20, title, strokeWidth, className }: IconProps) {
  void strokeWidth;
  if (title) {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={title} className={className}>
        <path fill="currentColor" fillRule="evenodd" d={WHATSAPP_PATH} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={className}>
      <path fill="currentColor" fillRule="evenodd" d={WHATSAPP_PATH} />
    </svg>
  );
}

// Official WhatsApp glyph (simple-icons), filled rather than stroked.
const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z";

export function RefreshIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1.06 6.36 2.64L21 8" />
      <path d="M21 3v5h-5" />
    </IconBase>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </IconBase>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M11 4 12.7 8.8 17.5 10.5 12.7 12.2 11 17 9.3 12.2 4.5 10.5 9.3 8.8 11 4Z" />
      <path d="M18.5 15.5v4M16.5 17.5h4" />
    </IconBase>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </IconBase>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </IconBase>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.2-3.1 4-4.5 7-4.5s5.8 1.4 7 4.5" />
    </IconBase>
  );
}

// --- Care-label symbols ------------------------------------------------------
// Drawn after the wash-tub and iron symbols printed on garment care labels.
// Used for services (tiles and the pickup tag), where they carry meaning.

export function WashTubSymbol(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M2.5 7.5c1.6-1.6 3.2-1.6 4.75 0s3.15 1.6 4.75 0 3.15-1.6 4.75 0 3.15 1.6 4.75 0" />
      <path d="M3.5 10.5 5.25 19.5h13.5l1.75-9" />
    </IconBase>
  );
}

export function IronSymbol(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 18.5h18v-2.25c0-3.6-2.9-6.25-6.5-6.25H7.25L3 18.5Z" />
      <path d="M7.75 10 8.75 6h9" />
      <path d="M12 14.5h.01" strokeWidth={2.5} />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

/** Care-label symbols for a service: tub for washing, iron for pressing. */
export function CareSymbols({ type, size = 22 }: { type: string; size?: number }) {
  const washes = type !== "iron_only";
  const irons = type !== "wash";
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {washes ? <WashTubSymbol size={size} /> : null}
      {irons ? <IronSymbol size={size} /> : null}
    </span>
  );
}
