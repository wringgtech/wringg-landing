import type { Metadata } from "next";
import { legalPages } from "../legal-content";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: "Delete Account",
  description: legalPages.deletion.description,
  alternates: { canonical: "/delete-account" },
};

export default function DeleteAccountPage() {
  return <LegalPage content={legalPages.deletion} />;
}
