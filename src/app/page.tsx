import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// CTA switch:
// Keep false during pilot mode so primary actions use WhatsApp onboarding flows.
// Set true after app links/APKs are ready, then replace the placeholder URLs below.
const ENABLE_APP_DOWNLOAD = false;
const CUSTOMER_APP_DOWNLOAD_URL = "#customer-app-link-coming-soon";
const HOST_APP_DOWNLOAD_URL = "#host-app-link-coming-soon";

const CUSTOMER_CTA_URL =
  "https://wa.me/918438508211?text=Hi%20Wringg%2C%20I%20would%20like%20to%20join%20the%20BTM%20pilot%20and%20book%20a%20pickup.";
const HOST_CTA_URL =
  "https://wa.me/918438508211?text=Hi%20Wringg%2C%20I%20would%20like%20to%20become%20an%20early%20host%20for%20the%20BTM%20pilot.";
const SUPPORT_CTA_URL =
  "https://wa.me/918438508211?text=Hi%20Wringg%2C%20I%20need%20help%20with%20clothing-care%20service.";

const landingImages = {
  logoWordmark: "/LOGO+TEXT.jpg?v=2",
  localCare: "/1 (2).png?v=2",
  hostMachine: "/1.WEBP.png?v=2",
  hostNetwork: "/1 (3).png?v=2",
  hero: "/2.WEBP.png?v=2",
} as const;

const customerActionUrl = ENABLE_APP_DOWNLOAD
  ? CUSTOMER_APP_DOWNLOAD_URL
  : CUSTOMER_CTA_URL;
const hostActionUrl = ENABLE_APP_DOWNLOAD ? HOST_APP_DOWNLOAD_URL : HOST_CTA_URL;

const navItems = [
  { label: "USP", href: "#usp" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Become Host", href: "#partners" },
  { label: "Pilot", href: "#pilot" },
];

const uspCards = [
  {
    title: "Not a laundry counter",
    description:
      "A neighbourhood-powered clothing care network built around nearby hosts and local trust.",
    image: landingImages.localCare,
  },
  {
    title: "Make money with your washing machine",
    description:
      "Turn idle washing capacity into income by becoming a WRINGG host in your community.",
    image: landingImages.hostMachine,
  },
  {
    title: "Built like a local host network",
    description:
      "Distributed hosts, simple coordination, and trust layered into one hyperlocal flow.",
    image: landingImages.hostNetwork,
  },
];

const steps = [
  {
    title: "Book pickup",
    description: "Tell us what you need from the active BTM pilot zone.",
  },
  {
    title: "Matched nearby",
    description: "WRINGG coordinates with a trusted local host.",
  },
  {
    title: "Care handled",
    description: "Wash, iron, fold, and delivery happen through the local network.",
  },
];

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

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-700">
      {children}
    </p>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[600px] lg:ml-auto">
      <div className="absolute -left-5 top-10 h-28 w-28 rounded-full bg-sky-100 blur-3xl" />
      <div className="absolute -right-5 bottom-8 h-32 w-32 rounded-full bg-cyan-100 blur-3xl" />
      <div className="relative rounded-[1.8rem] border border-white/80 bg-white/75 p-3 shadow-[0_28px_80px_rgba(15,62,92,0.14)] backdrop-blur">
        <div className="relative aspect-[1.08] overflow-hidden rounded-[1.45rem] bg-sky-50 sm:aspect-[1.18]">
          <Image
            src={landingImages.hero}
            alt="Wringg local host handing fresh clothes to a customer"
            fill
            sizes="(max-width: 1024px) 100vw, 52vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#052235]/42 via-transparent to-white/10" />
          <div className="absolute left-4 top-4 rounded-2xl border border-white/70 bg-white/92 px-4 py-3 shadow-lg backdrop-blur sm:left-6 sm:top-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
              BTM Pilot
            </p>
            <p className="mt-1 text-base font-black text-[#0f3148]">Network live</p>
          </div>
          <div className="absolute bottom-4 right-4 max-w-[210px] rounded-2xl border border-white/70 bg-white/92 px-4 py-3 shadow-lg backdrop-blur sm:bottom-6 sm:right-6">
            <p className="text-sm font-black text-[#0f3148]">Host matched nearby</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Trained. Local. Accountable.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UspCard({ card }: { card: (typeof uspCards)[number] }) {
  return (
    <article className="group overflow-hidden rounded-[1.45rem] border border-sky-100 bg-white shadow-[0_18px_55px_rgba(15,62,92,0.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_75px_rgba(15,62,92,0.12)]">
      <div className="relative aspect-[1.65] overflow-hidden bg-sky-50">
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#062334]/30 via-transparent to-transparent" />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-black text-[#0f3148]">{card.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
      </div>
    </article>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfdff] text-[#0f3148]">
      <header className="sticky top-0 z-50 border-b border-sky-100/70 bg-white/82 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3.5 sm:px-8 lg:py-4">
          <Link href="#home" className="flex min-w-0 items-center">
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

          <ButtonLink href={hostActionUrl}>Join Pilot</ButtonLink>
        </div>
      </header>

      <section id="home" className="relative bg-gradient-to-b from-white via-sky-50/45 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:pb-14 lg:pt-14">
          <div className="fade-up max-w-2xl">
            <div className="mb-5 inline-flex rounded-full border border-cyan-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-700 shadow-sm">
              BTM pilot now onboarding
            </div>
            <h1 className="text-4xl font-black leading-[1.04] tracking-normal text-[#0b2638] sm:text-5xl lg:text-6xl">
              Not a laundry shop. A neighbourhood-powered care network.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              WRINGG connects busy customers with trained local hosts nearby,
              making clothing care faster, more trusted, and more human.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={customerActionUrl}>Book Pickup</ButtonLink>
              <ButtonLink href={hostActionUrl} variant="secondary">
                Become Host
              </ButtonLink>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      <section id="usp" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {uspCards.map((card) => (
            <UspCard key={card.title} card={card} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-12 lg:py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <SectionLabel>How it Works</SectionLabel>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Simple enough to try. Local enough to trust.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.35rem] border border-sky-100 bg-sky-50/60 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_50px_rgba(15,62,92,0.08)]"
              >
                <span className="mb-7 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#2098d6] text-sm font-black text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="partners"
        className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 lg:grid-cols-2 lg:py-14"
      >
        <div className="rounded-[1.8rem] bg-[#0f3148] p-7 text-white shadow-[0_28px_80px_rgba(15,49,72,0.18)] sm:p-9">
          <SectionLabel>For customers</SectionLabel>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">
            Stop spending weekends washing, drying and ironing.
          </h2>
          <p className="mt-5 text-base leading-8 text-sky-50">
            WRINGG helps you get clothing care handled nearby, without turning
            your free time into chore time.
          </p>
          <div className="mt-7">
            <ButtonLink href={customerActionUrl} variant="secondary">
              Book Pickup
            </ButtonLink>
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.8rem] border border-sky-100 bg-white shadow-[0_28px_80px_rgba(15,62,92,0.1)]">
          <div className="grid h-full sm:grid-cols-[0.85fr_1.15fr]">
            <div className="relative min-h-64 bg-sky-50">
              <Image
                src={landingImages.hostMachine}
                alt="Wringg host network"
                fill
                sizes="(max-width: 768px) 100vw, 28vw"
                className="object-cover"
              />
            </div>
            <div className="p-7 sm:p-9">
              <SectionLabel>For hosts</SectionLabel>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                Make money with your washing machine.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-600">
                Have a washing machine and free time? Turn everyday clothing
                care into neighbourhood income.
              </p>
              <div className="mt-7">
                <ButtonLink href={hostActionUrl}>Become a Host</ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pilot" className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-14">
        <div className="rounded-[1.8rem] border border-sky-100 bg-white p-7 text-center shadow-[0_24px_80px_rgba(15,62,92,0.08)] sm:p-10">
          <SectionLabel>BTM Pilot</SectionLabel>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black sm:text-5xl">
            Currently piloting in BTM, Bengaluru.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Early customers and hosts are being onboarded now. Join the pilot
            while the network is still being shaped.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href={customerActionUrl}>Book Pickup</ButtonLink>
            <ButtonLink href={hostActionUrl} variant="secondary">
              Become Host
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-sky-100 bg-white">
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
            <a href={SUPPORT_CTA_URL} className="text-sm font-bold text-cyan-700 hover:text-sky-600">
              WhatsApp support: +91 84385 08211
            </a>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-slate-600">
            <Link href="/privacy" className="hover:text-sky-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-sky-600">Terms</Link>
            <Link href="/refund" className="hover:text-sky-600">Refund Policy</Link>
            <Link href="/shipping" className="hover:text-sky-600">Shipping</Link>
            <Link href="/contact" className="hover:text-sky-600">Contact</Link>
            <Link href="/delete-account" className="hover:text-sky-600">Delete Account</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
