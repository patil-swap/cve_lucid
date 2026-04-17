import type { Metadata } from "next";
import { Oswald, Space_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Header } from "@/components/Header";

const oswald = Oswald({ 
  subsets: ["latin"], 
  variable: "--font-oswald",
  weight: ["200", "300", "400", "500", "600", "700"]
});

const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CVE Lucid",
  description: "Security advisories made readable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${oswald.variable} ${spaceMono.variable} dark`}>
      <body className="font-sans antialiased bg-[#05050a] text-stone-100 font-[400]">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
