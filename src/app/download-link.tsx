"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { withUtmParameters } from "./download-links";

export function DownloadLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();

  return (
    <a href={withUtmParameters(href, searchParams.toString())} className={className}>
      {children}
    </a>
  );
}
