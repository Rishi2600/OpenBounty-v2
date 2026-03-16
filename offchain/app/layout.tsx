import type { Metadata } from "next";
import WalletProvider from "../src/components/WalletProvider";
import "./globals.css";

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
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}