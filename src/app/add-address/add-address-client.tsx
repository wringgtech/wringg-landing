"use client";

// Standalone add-address page (/add-address?next=/account), reached from the
// profile hub. Wraps the shared AddressForm (geolocation + serviceability
// gate + customer-create-address) and returns to `next` — or /account when
// no safe destination is given — once the address is saved.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CustomerShell,
  LoadingBlock,
  useRequireSession,
} from "@/components/customer/customer-shell";
import { ChevronLeftIcon } from "@/components/customer/icons";
import { cx } from "@/components/customer/ui-helpers";
import { safeNextPath } from "@/lib/washmate/redirect";
import { AddressForm } from "@/components/customer/address-form";

const backLinkClasses = cx(
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-[var(--cw-body)] -ml-2 mb-5",
  "transition-colors duration-150 hover:text-[var(--cw-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cw-accent)]",
);

export function AddAddressClient() {
  const state = useRequireSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"), "/account");

  if (state.status !== "signedIn") {
    return (
      <CustomerShell width="medium" title="Add an address">
        <LoadingBlock label="Checking your session…" />
      </CustomerShell>
    );
  }

  return (
    <CustomerShell
      width="medium"
      title="Add an address"
      description="We'll check straight away whether the address is inside our BTM Layout pilot area."
    >
      <div>
        <Link href={next} className={backLinkClasses}>
          <ChevronLeftIcon size={16} />
          Back
        </Link>
      </div>
      <div className="rounded-[20px] border border-[var(--cw-hairline)] bg-white p-6 shadow-[var(--cw-shadow-raised)] sm:p-8">
        <AddressForm
          onSaved={() => {
            // The address list on /account reloads on navigation.
            router.replace(next);
          }}
        />
      </div>
    </CustomerShell>
  );
}
