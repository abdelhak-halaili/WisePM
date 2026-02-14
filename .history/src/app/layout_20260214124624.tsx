import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"] });

import LemonSqueezyScript from "@/components/billing/LemonSqueezyScript";

export const metadata: Metadata = {
  title: "WisePM | AI-Powered Product Management",
  description: "Automate your product workflows with AI assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={publicSans.className} suppressHydrationWarning>
        <LemonSqueezyScript />
        {children}
      </body>
    </html>
  );
}
