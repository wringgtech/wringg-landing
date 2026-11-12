import type { Metadata } from "next";
import { OrdersClient } from "./orders-client";

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false },
};

export default function OrdersPage() {
  return <OrdersClient />;
}
