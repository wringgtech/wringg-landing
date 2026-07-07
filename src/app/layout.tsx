import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wringg.in"),
  title: {
    default: "WRINGG | Wash. Wear. Repeat.",
    template: "%s | WRINGG",
  },
  description:
    "WRINGG is a hyperlocal clothing-care pilot in BTM Layout, Bengaluru, offering pickup, wash, iron, and delivery through trusted local partners.",
  keywords: [
    "WRINGG",
    "laundry BTM Layout",
    "clothing care Bengaluru",
    "wash and iron",
    "laundry pickup",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WRINGG | Neighbourhood-powered clothing care",
    description:
      "A hyperlocal clothing-care pilot connecting customers with trusted local hosts in BTM Layout, Bengaluru.",
    url: "https://wringg.in",
    siteName: "WRINGG",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/LOGO+TEXT.jpg",
        width: 2048,
        height: 512,
        alt: "WRINGG logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WRINGG | Neighbourhood-powered clothing care",
    description:
      "Trusted local hosts, convenient pickup, and a BTM-first clothing-care pilot.",
    images: ["/LOGO+TEXT.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
