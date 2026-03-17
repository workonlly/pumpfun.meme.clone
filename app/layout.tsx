
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./Web3Provider";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PUMP.meme.coin - Meme Coin Launchpad",
  description: "Launch your meme coin on Sepolia testnet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white min-h-screen`}
      >
      <Web3Provider>
        <nav className="bg-[#111] text-white w-full h-16 flex items-center justify-between px-6 md:px-10 border-b border-[#2a2a2a]">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-white">PUMP</span>
            <span className="text-gray-500">.meme.coin</span>
          </Link >

          {/* Right Section */}
          <div className="flex flex-row gap-3 items-center">
            <Link href="/cre">
              <div className="text-gray-500 ring-2 bg-black/30 p-2 rounded-md hover:text-white hover:bg-black/10 cursor-pointer"> + create new token</div>
            </Link>
            <ConnectButton />
          </div>
        </nav>
        {children}
      </Web3Provider>
      </body>
    </html>
  );
}
