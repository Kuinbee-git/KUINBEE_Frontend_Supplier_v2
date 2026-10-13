import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "sonner";
import "./globals.css";

const isStaging = process.env.NEXT_PUBLIC_APP_ENV === 'staging';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kuinbee Supplier Portal",
  description:
    "Manage datasets and custom collection services on the Kuinbee marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors />
        {isStaging && (
          <div role="status" data-environment="staging" className="pointer-events-none fixed bottom-2 right-2 z-[9999] rounded bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-950 shadow">
            Staging · Test environment
          </div>
        )}
      </body>
    </html>
  );
}
