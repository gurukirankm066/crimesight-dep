import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CrimeSight AI — Karnataka State Police Command Center",
  description:
    "AI-Powered Crime Intelligence & Analytics Platform for Karnataka State Police. KSP Datathon 2026.",
  keywords: [
    "CrimeSight",
    "KSP",
    "Karnataka Police",
    "Crime Analytics",
    "AI",
    "Command Center",
  ],
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0f1a] text-slate-200 overflow-hidden`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="top-right"
          visibleToasts={1}
          closeButton
          toastOptions={{
            style: { background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 },
          }}
        />
      </body>
    </html>
  );
}
