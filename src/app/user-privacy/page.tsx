import type { Metadata } from "next";
import { legalPages } from "../legal-content";
import { LegalPage } from "../legal-page";

export const metadata: Metadata = {
  title: legalPages.userPrivacy.title,
  description: legalPages.userPrivacy.description,
  alternates: { canonical: "/user-privacy" },
};

export default function UserPrivacyPage() {
  return <LegalPage content={legalPages.userPrivacy} />;
}
