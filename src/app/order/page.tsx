import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerShell, LoadingBlock } from "@/components/customer/customer-shell";
import { OrderClient } from "./order-client";

export const metadata: Metadata = {
  title: "Order status",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <CustomerShell title="Order status">
          <LoadingBlock label="Loading your order…" />
        </CustomerShell>
      }
    >
      <OrderClient />
    </Suspense>
  );
}
