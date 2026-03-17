import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display, Playfair_Display } from "next/font/google";
import WalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "OpenBounty v2",
  description: "Trustless hackathon bounties on Solana",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSerifDisplay.variable} ${playfairDisplay.variable}`}>
        <WalletProvider>
          <Header />
          <main style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "2.5rem 1.5rem 4rem",
          }}>
            {children}
          </main>
          <Footer />
        </WalletProvider>
      </body>
    </html>
  );
}