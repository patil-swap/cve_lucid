import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CVE Simplified",
  description: "Security advisories made readable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceMono.variable} font-sans antialiased bg-[#05050a] text-stone-100`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
