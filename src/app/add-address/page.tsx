import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerShell, LoadingBlock } from "@/components/customer/customer-shell";
import { AddAddressClient } from "./add-address-client";

export const metadata: Metadata = {
  title: "Add an address",
  robots: { index: false, follow: false },
};

export default function AddAddressPage() {
  return (
    <Suspense
      fallback={
        <CustomerShell width="medium" title="Add an address">
          <LoadingBlock label="Loading…" />
        </CustomerShell>
      }
    >
      <AddAddressClient />
    </Suspense>
  );
}
