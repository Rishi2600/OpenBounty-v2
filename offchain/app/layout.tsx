import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import WalletProvider from "@/components/WalletProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
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
      <body className={dmSans.variable}>
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