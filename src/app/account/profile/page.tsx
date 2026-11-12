import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerShell, LoadingBlock } from "@/components/customer/customer-shell";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Edit profile",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <CustomerShell width="narrow" title="Edit profile">
          <LoadingBlock label="Loading your profile…" />
        </CustomerShell>
      }
    >
      <ProfileClient />
    </Suspense>
  );
}
