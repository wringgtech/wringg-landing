"use client";

import Image from "next/image";
import { Suspense, useRef, type MouseEvent } from "react";
import { buttonClassName } from "./button-styles";
import { DownloadLink } from "./download-link";

const linkClassName = `${buttonClassName("dark")} w-full`;

function StoreLink({ href, children }: { href: string; children: string }) {
  return (
    <Suspense fallback={<a href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>{children}</a>}>
      <DownloadLink href={href} target="_blank" rel="noopener noreferrer" className={linkClassName}>
        {children}
      </DownloadLink>
    </Suspense>
  );
}

export function DownloadAppDialog({
  iosUrl,
  androidUrl,
  triggerClassName,
}: {
  iosUrl: string;
  androidUrl: string;
  triggerClassName: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) dialogRef.current?.close();
  }

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={triggerClassName}>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2 h-4 w-4"
        >
          <path d="M10 2.5v9M6.5 8 10 11.5 13.5 8M3.5 13.5v2A2 2 0 0 0 5.5 17.5h9a2 2 0 0 0 2-2v-2" />
        </svg>
        Download App
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="download-app-title"
        onClick={handleBackdropClick}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-[1.5rem] border border-sky-100 bg-white p-0 text-[#0f3148] shadow-[0_30px_100px_rgba(5,34,53,0.35)] backdrop:bg-[#052235]/60"
      >
        <div className="p-5 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
                Get the app
              </p>
              <h2 id="download-app-title" className="mt-2 text-2xl font-black sm:text-3xl">
                Download WRINGG
              </h2>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close app download options"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-lg font-bold text-[#0f3148] transition hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-cyan-100"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Scan a QR code with your phone, or open the store link for your device.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-center sm:p-5">
              <p className="text-base font-black">iPhone</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                TestFlight beta
              </p>
              <Image
                src="/apps/ios-beta-qr.png"
                alt="QR code to join the WRINGG iPhone beta on TestFlight"
                width={148}
                height={148}
                loading="eager"
                className="mx-auto mt-4 h-32 w-32 rounded-xl border border-sky-100 bg-white p-1 sm:h-36 sm:w-36"
              />
              <div className="mt-4 flex flex-1 items-end">
                <StoreLink href={iosUrl}>Join iPhone Beta</StoreLink>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-center sm:p-5">
              <p className="text-base font-black">Android</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                Google Play
              </p>
              <Image
                src="/apps/android-app-qr.png"
                alt="QR code to download the WRINGG Android app"
                width={148}
                height={148}
                loading="eager"
                className="mx-auto mt-4 h-32 w-32 rounded-xl border border-sky-100 bg-white p-1 sm:h-36 sm:w-36"
              />
              <div className="mt-4 flex flex-1 items-end">
                <StoreLink href={androidUrl}>Get it on Google Play</StoreLink>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
