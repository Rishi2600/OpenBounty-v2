import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import WalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MockBanner from "@/components/MockBanner";
import { cn } from "@/lib/utils";
import "./globals.css";

// Fonts are exposed as CSS variables and mapped to Tailwind in globals.css:
// font-sans (DM Sans), font-display (DM Serif Display), font-mono (JetBrains Mono)
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "OpenBounty v2",
  description: "Trustless hackathon bounties on Solana",
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  // Font variables sit on <html> so every CSS variable in globals.css can use them.
  // "dark" is always on: the app has a single dark theme.
  const htmlClasses = cn("dark", dmSans.variable, dmSerif.variable, jetbrainsMono.variable);

  return (
    <html lang="en" className={htmlClasses}>
      <body className="flex flex-col">
        <WalletProvider>
          <MockBanner />
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
            {children}
          </main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}
