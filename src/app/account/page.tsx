import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerShell, LoadingBlock } from "@/components/customer/customer-shell";
import { AccountClient } from "./account-client";

export const metadata: Metadata = {
  title: "Your profile",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <CustomerShell width="medium" title="Your profile">
          <LoadingBlock label="Loading your profile…" />
        </CustomerShell>
      }
    >
      <AccountClient />
    </Suspense>
  );
}
