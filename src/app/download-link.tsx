"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { withUtmParameters } from "./download-links";

export function DownloadLink({
  href,
  className,
  children,
  loadingLabel,
}: {
  href: string;
  className: string;
  children: ReactNode;
  loadingLabel?: string;
}) {
  const searchParams = useSearchParams();
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    if (!opening) return;

    const reset = () => setOpening(false);
    const resetWhenVisible = () => {
      if (document.visibilityState === "visible") reset();
    };
    // Re-enable the link after returning from Play or a stalled handoff.
    const timeout = window.setTimeout(reset, 15_000);
    window.addEventListener("pageshow", reset);
    document.addEventListener("visibilitychange", resetWhenVisible);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pageshow", reset);
      document.removeEventListener("visibilitychange", resetWhenVisible);
    };
  }, [opening]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform;
    const android = platform === "Android" || /Android/i.test(navigator.userAgent);

    if (!loadingLabel || !android || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    if (opening) {
      event.preventDefault();
      return;
    }

    setOpening(true);
  }

  return (
    <a
      href={withUtmParameters(href, searchParams.toString())}
      className={`${className}${loadingLabel ? " relative" : ""}${opening ? " cursor-wait" : ""}`}
      onClick={handleClick}
      aria-busy={opening || undefined}
      aria-disabled={opening || undefined}
    >
      <span className={opening ? "invisible" : undefined}>{children}</span>
      {opening ? (
        <span role="status" className="absolute inset-0 flex items-center justify-center gap-1.5 px-2 text-xs leading-4">
          <span aria-hidden="true" className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
          <span>{loadingLabel}</span>
        </span>
      ) : null}
    </a>
  );
}
