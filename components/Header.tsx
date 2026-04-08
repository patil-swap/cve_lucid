"use client";

import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { LayoutDashboard, Compass } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-stone-800 bg-[#05050a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center font-bold text-black transform group-hover:rotate-12 transition-transform">L</div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">CVE Lucid</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm font-medium text-stone-400 hover:text-stone-100 transition-colors flex items-center gap-2">
                <Compass className="w-4 h-4" />
                Explore
              </Link>
              <Link href="/dashboard" className="text-sm font-medium text-stone-400 hover:text-stone-100 transition-colors flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex-1 flex justify-center max-w-md">
            <SearchBar />
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="text-[10px] font-mono text-stone-500 bg-stone-900 px-2 py-1 rounded border border-stone-800">
               V2.0 STABLE
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
