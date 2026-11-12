import type { Metadata } from "next";
import Link from "next/link";
import { CustomerShell } from "@/components/customer/customer-shell";
import { Button } from "@/components/customer/ui";
import { ChevronRightIcon, WhatsAppIcon } from "@/components/customer/icons";
import { cx } from "@/components/customer/ui-helpers";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_WHATSAPP_URL } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "Help",
  robots: { index: false, follow: false },
};

const linkRowClasses = cx(
  "flex min-h-[56px] items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 sm:px-5",
  "hover:bg-[var(--cw-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--cw-accent)]",
);

const FAQS: ReadonlyArray<{ question: string; answer: string; rateCard?: boolean; whatsapp?: boolean }> = [
  {
    question: "Can I pay cash on delivery?",
    answer:
      "Yes — cash on delivery is the only payment method right now. We collect the amount when we return your clothes.",
  },
  {
    question: "Can I reschedule a pickup?",
    answer:
      "Message us on WhatsApp with your order number and we'll move your pickup to another available slot.",
  },
  {
    question: "How is a lot priced?",
    answer: "One price covers a fixed number of clothes per lot, with a small fee per extra cloth.",
    rateCard: true,
  },
  {
    question: "Where do you operate?",
    answer:
      "We're piloting in BTM Layout, Bengaluru. The booking page confirms whether your address is inside the pilot area before you book.",
  },
  {
    question: "What if an item comes back damaged?",
    answer:
      "Message us with your order number and photos of the item, and we'll work out a fair fix with you.",
    whatsapp: true,
  },
];

export default function HelpPage() {
  return (
    <CustomerShell
      width="narrow"
      title="Help"
      description="Short answers about booking, payments and the pilot. For anything else, WhatsApp us — a person actually replies."
    >
      {/* WhatsApp support: the primary action */}
      <section
        aria-label="WhatsApp support"
        className="rounded-[20px] border border-[var(--cw-hairline)] bg-white p-6 shadow-[var(--cw-shadow-raised)] sm:p-8"
      >
        <h2 className="cw-display text-[22px] font-bold leading-7 text-[var(--cw-ink)]">Chat with us</h2>
        <p className="mt-1.5 text-[15px] leading-6 text-[var(--cw-body)]">
          The fastest way to reach WRINGG. Message us about an order, a booking or a problem.
        </p>
        <Button href={SUPPORT_WHATSAPP_URL} size="lg" className="mt-4 w-full sm:w-auto">
          <WhatsAppIcon size={18} />
          WhatsApp {SUPPORT_PHONE_DISPLAY}
        </Button>
      </section>

      {/* Where is my order? */}
      <section aria-label="Your orders" className="mt-8">
        <ul className="divide-y divide-[var(--cw-hairline)] rounded-[20px] border border-[var(--cw-hairline)] bg-white shadow-[var(--cw-shadow-raised)]">
          <li>
            <Link href="/orders" className={linkRowClasses}>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-[var(--cw-text)]">
                  Where is my order?
                </span>
                <span className="mt-0.5 block text-[13px] leading-[18px] text-[var(--cw-muted)]">
                  Track your pickup and delivery in real time
                </span>
              </span>
              <ChevronRightIcon size={18} className="shrink-0 text-[var(--cw-muted)]" />
            </Link>
          </li>
        </ul>
      </section>

      {/* Common questions */}
      <section aria-label="Common questions" className="mt-10 border-t border-[var(--cw-hairline)] pt-8">
        <h2 className="text-[17px] font-bold leading-6 text-[var(--cw-ink)]">Common questions</h2>
        <dl className="mt-4 divide-y divide-[var(--cw-hairline)] rounded-[20px] border border-[var(--cw-hairline)] bg-white px-4 shadow-[var(--cw-shadow-raised)] sm:px-6">
          {FAQS.map((faq) => (
            <div key={faq.question} className="py-4">
              <dt className="text-[15px] font-semibold leading-6 text-[var(--cw-ink)]">
                {faq.question}
              </dt>
              <dd className="mt-1 text-sm leading-6 text-[var(--cw-body)] [overflow-wrap:anywhere]">
                {faq.answer}{" "}
                {faq.rateCard ? (
                  <Link
                    href="/book"
                    className={cx(
                      "font-semibold text-[var(--cw-link)] underline-offset-2 hover:underline",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
                    )}
                  >
                    See the rate card
                  </Link>
                ) : null}
                {faq.whatsapp ? (
                  <a
                    href={SUPPORT_WHATSAPP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={cx(
                      "font-semibold text-[var(--cw-link)] underline-offset-2 hover:underline",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
                    )}
                  >
                    Message us on WhatsApp
                  </a>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[13px] leading-[18px] text-[var(--cw-muted)]">
          Rates shown on the booking page are the ones we charge — the amount is confirmed on your
          order summary before you book.
        </p>
      </section>
    </CustomerShell>
  );
}
