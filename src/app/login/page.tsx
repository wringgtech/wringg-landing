import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingBlock } from "@/components/customer/customer-shell";
import { LoginFlow } from "./login-flow";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading sign-in…" />}>
      <LoginFlow />
    </Suspense>
  );
}
