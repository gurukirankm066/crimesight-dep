import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from 'sonner';
import { getFoundryReadiness } from '@/lib/foundry/ontology';
import { listFoundryFirs, type FoundryFirSync } from '@/lib/foundry/client';

export const dynamic = 'force-dynamic';

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const readiness = getFoundryReadiness();
  let sync: FoundryFirSync | null = null;
  if (readiness.configured) {
    try {
      sync = await listFoundryFirs();
    } catch {
      // Keep the prototype available with its local synthetic fallback.
    }
  }
  const foundryBootstrap = JSON.stringify({ readiness, sync }).replace(/</g, '\\u003c');

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0f1a] text-slate-200 overflow-hidden`}
      >
        <script dangerouslySetInnerHTML={{ __html: `window.__CRIMESIGHT_FOUNDRY__=${foundryBootstrap};` }} />
        {children}
        <Toaster />
        <SonnerToaster
          position="top-right"
          toastOptions={{
            style: { background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 },
          }}
        />
      </body>
    </html>
  );
}
