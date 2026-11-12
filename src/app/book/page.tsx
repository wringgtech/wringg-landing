import type { Metadata } from "next";
import { BookClient } from "./book-client";

export const metadata: Metadata = {
  title: "Book a pickup",
  description:
    "Book a wash, wash-and-iron or steam-iron pickup with WRINGG. Pick a slot, pay cash on delivery, and track your laundry from pickup to delivery.",
};

export default function Page() {
  return <BookClient />;
}
