import type { Metadata } from "next";
import Link from "next/link";
import { appStoreLinks } from "../../lib/app-links.mjs";
import { StoreRedirect } from "./redirect";

export const metadata: Metadata = {
  title: "Download WRINGG",
  description: "Get the WRINGG app for doorstep laundry pickup and delivery.",
  alternates: { canonical: "https://wringg.in/download" },
};

export default function DownloadPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8fcff] px-5 py-12 text-[#071f3f]">
      <StoreRedirect />
      <section className="w-full max-w-lg rounded-3xl border border-sky-100 bg-white p-8 shadow-xl sm:p-12">
        <Link href="/" className="text-xl font-black text-[#0051C2]">WRINGG</Link>
        <h1 className="mt-6 text-4xl font-black">Laundry, one tap away.</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Open this link on your phone to go to the available app store, or choose below.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          <a href={appStoreLinks.android} className="rounded-full bg-[#0051C2] px-6 py-4 text-center font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4">
            Get it on Google Play
          </a>
          {appStoreLinks.ios ? (
            <a href={appStoreLinks.ios} className="rounded-full bg-[#071f3f] px-6 py-4 text-center font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-4">
              Download on the App Store
            </a>
          ) : (
            <p className="rounded-2xl bg-sky-50 p-4 text-sm leading-6">
              Using an iPhone or iPad? Contact us for help booking a pickup.
              {" "}<a href="mailto:contact@wringg.in" className="font-bold text-[#0051C2] underline">contact@wringg.in</a>
            </p>
          )}
        </div>
        <p className="mt-6 text-sm leading-6 text-slate-500">Service is available in selected Bengaluru neighbourhoods.</p>
        <Link href="/" className="mt-6 inline-block text-sm font-bold underline">Back to WRINGG</Link>
      </section>
    </main>
  );
}
