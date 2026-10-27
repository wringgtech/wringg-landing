import Link from "next/link";
import type { LegalPageContent } from "./legal-content";

export function LegalPage({ content }: { content: LegalPageContent }) {
  return (
    <main className="min-h-screen bg-[#f8fcff] text-[#071f3f]">
      <header className="border-b border-sky-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="text-xl font-black">
            Wringg
          </Link>
          <Link
            href="/"
            className="rounded-full border border-sky-200 bg-white px-5 py-2 text-sm font-bold text-[#071f3f] transition hover:bg-sky-50"
          >
            Back home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="rounded-[2rem] border border-sky-100 bg-white p-7 shadow-[0_24px_70px_rgba(7,31,63,0.08)] sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-600">
            Wringg
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-6xl">{content.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            {content.description}
          </p>
          <p className="mt-4 text-sm font-bold text-slate-500">
            Last updated: {content.updated}
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {content.sections.map((section) => (
            <article
              key={section.heading}
              className="rounded-[1.5rem] border border-sky-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-2xl font-black">{section.heading}</h2>
              <div className="mt-4 space-y-4 text-base leading-8 text-slate-600">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[1.5rem] bg-[#071f3f] p-6 text-white">
          <p className="font-black">Need help?</p>
          <p className="mt-2 text-sm leading-7 text-sky-50">
            WhatsApp +91 84385 08211 or email{" "}<a href="mailto:contact@wringg.in" className="underline">contact@wringg.in</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
