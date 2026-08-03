import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Delete Account",
  description: "Submit a request to permanently delete your WRINGGG account and associated data.",
  alternates: { canonical: "/delete-account" },
};

const landingImages = {
  logoWordmark: "/LOGO+TEXT.jpg?v=2",
} as const;

const navItems = [
  { label: "USP", href: "/#usp" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Become Host", href: "/#partners" },
  { label: "Pilot", href: "/#pilot" },
];

const HOST_CTA_URL =
  "https://wa.me/918438508211?text=Hi%20Wringg%2C%20I%20would%20like%20to%20become%20an%20early%20host%20for%20the%20BTM%20pilot.";
const SUPPORT_CTA_URL =
  "https://wa.me/918438508211?text=Hi%20Wringg%2C%20I%20need%20help%20with%20clothing-care%20service.";

function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark";
}) {
  const styles = {
    primary:
      "bg-[#2098d6] text-white shadow-sky-500/20 hover:bg-[#1689c8] hover:shadow-sky-500/30",
    secondary:
      "border border-sky-200 bg-white text-[#0f3e5c] shadow-sky-200/40 hover:border-sky-300 hover:bg-sky-50",
    dark: "bg-[#0f3148] text-white shadow-slate-900/15 hover:bg-[#123c58]",
  };

  return (
    <a
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold shadow-lg transition duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-cyan-100 ${styles[variant]}`}
    >
      {children}
    </a>
  );
}

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-[#fbfdff] text-[#0f3148] flex flex-col">
      <header className="sticky top-0 z-50 border-b border-sky-100/70 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3.5 sm:px-8 lg:py-4">
          <Link href="/" className="flex min-w-0 items-center">
            <Image
              src={landingImages.logoWordmark}
              alt="Wringg logo and wordmark"
              width={226}
              height={56}
              className="h-11 w-auto object-contain sm:h-14"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-1 py-2 transition hover:text-[#2098d6]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <ButtonLink href={HOST_CTA_URL}>Join Pilot</ButtonLink>
        </div>
      </header>

      <section className="flex-1 px-5 py-12 sm:px-8 lg:py-16 mx-auto w-full max-w-5xl">
        <div className="text-center mb-12 fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700 mb-3">
            Account Management
          </p>
          <h1 className="text-4xl font-black text-[#0b2638] sm:text-5xl">
            Delete Your WRINGGG Account
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
            At WRINGGG, we respect your privacy and your right to control your personal information. If you wish to permanently delete your WRINGGG account and associated personal data, you can submit an account deletion request.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* How to request deletion */}
          <div className="md:col-span-2 rounded-[1.45rem] border border-sky-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,62,92,0.07)] sm:p-8 transition duration-300 hover:shadow-[0_26px_75px_rgba(15,62,92,0.12)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#2098d6]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-[#0f3148]">How to request deletion</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8 justify-between">
              <div className="text-base leading-8 text-slate-600">
                <p className="mb-1"><strong className="text-[#0f3148]">Email:</strong> wringg.in@gmail.com</p>
                <p className="mb-4"><strong className="text-[#0f3148]">Subject:</strong> Delete My WRINGGG Account</p>
                <p className="font-semibold text-[#0f3148] mb-2 mt-5">Please include in your email:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Registered Name</li>
                  <li>Registered Phone Number</li>
                  <li>Registered Email Address (if available)</li>
                </ul>
              </div>
              <div className="md:self-center mt-2 md:mt-0">
                <ButtonLink href="mailto:wringg.in@gmail.com?subject=Delete%20My%20WRINGGG%20Account">
                  Email Deletion Request
                </ButtonLink>
              </div>
            </div>
          </div>

          {/* Processing Time */}
          <div className="rounded-[1.45rem] border border-sky-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,62,92,0.04)] sm:p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,62,92,0.08)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[#0f3148]">Processing Time</h3>
            </div>
            <p className="text-sm leading-7 text-slate-600 mt-2">
              Your deletion request will be processed within <strong className="text-[#0f3148]">7 business days</strong> after successful identity verification.
            </p>
          </div>

          {/* Data that will be deleted */}
          <div className="rounded-[1.45rem] border border-sky-100 bg-white p-6 shadow-[0_12px_40px_rgba(15,62,92,0.04)] sm:p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,62,92,0.08)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-red-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[#0f3148]">Data that will be deleted</h3>
            </div>
            <ul className="text-sm leading-7 text-slate-600 list-disc pl-5 space-y-1">
              <li>User Profile</li>
              <li>Saved Addresses</li>
              <li>Laundry Order History</li>
              <li>Preferences</li>
              <li>Associated Personal Information</li>
            </ul>
          </div>

          {/* Data that may be retained */}
          <div className="md:col-span-2 rounded-[1.45rem] border border-sky-100 bg-sky-50/50 p-6 shadow-[0_12px_40px_rgba(15,62,92,0.03)] sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-sky-100">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-sky-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
              </div>
              <h3 className="text-lg font-black text-[#0f3148]">Data that may be retained</h3>
            </div>
            <p className="text-sm leading-7 text-slate-600 max-w-4xl">
              Some information may be retained where legally required, including taxation records, fraud prevention, dispute resolution, and regulatory compliance.
            </p>
          </div>
          
          {/* Need Help? */}
          <div className="md:col-span-2 rounded-[1.65rem] bg-[#0f3148] p-6 text-white shadow-[0_24px_60px_rgba(15,49,72,0.18)] sm:p-8 mt-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
              <div>
                <h3 className="text-xl font-black mb-2 flex items-center justify-center sm:justify-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-cyan-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                  </svg>
                  Need Help?
                </h3>
                <p className="text-sky-100 text-sm max-w-xl leading-relaxed">
                  If you have any questions about our data deletion policy or need assistance with your request, please contact our support team.
                </p>
              </div>
              <div className="shrink-0">
                <a href="mailto:wringg.in@gmail.com" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-400/30 bg-white/10 px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-white/20 hover:border-sky-400/50">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  wringg.in@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-sky-100 bg-white mt-auto">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-3">
            <Image
              src={landingImages.logoWordmark}
              alt="Wringg logo and wordmark"
              width={190}
              height={48}
              className="h-11 w-fit object-contain"
            />
            <p className="text-sm font-semibold text-slate-500">
              Wash. Wear. Repeat. Built in Bengaluru.
            </p>
            <a href={SUPPORT_CTA_URL} className="text-sm font-bold text-cyan-700 hover:text-sky-600 transition">
              WhatsApp support: +91 84385 08211
            </a>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-slate-600">
            <Link href="/privacy" className="hover:text-sky-600 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-sky-600 transition">Terms</Link>
            <Link href="/refund" className="hover:text-sky-600 transition">Refund Policy</Link>
            <Link href="/shipping" className="hover:text-sky-600 transition">Shipping</Link>
            <Link href="/contact" className="hover:text-sky-600 transition">Contact</Link>
            <Link href="/delete-account" className="hover:text-sky-600 transition">Delete Account</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
