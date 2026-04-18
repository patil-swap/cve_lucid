"use client";

import { useState } from "react";
import semver from "semver";
import { VersionRange } from "@/types/cve";
import { Button } from "../ui/button";
import { CheckCircle2, AlertCircle, Search } from "lucide-react";
import { Badge } from "../ui/badge";

interface VersionCheckerProps {
  versionRanges: VersionRange[];
}

export function VersionChecker({ versionRanges }: VersionCheckerProps) {
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<"affected" | "not-affected" | "all-versions" | null>(null);
  const [matchingProduct, setMatchingProduct] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkVersion = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!inputValue) return;

    // Standardize input for semver (ensure it has 3 parts if it doesn't)
    let version = inputValue.trim();
    if (version.split('.').length === 1) version += ".0.0";
    if (version.split('.').length === 2) version += ".0";

    if (!semver.valid(version)) {
      setError("Enter a version number like 2.4.1");
      return;
    }

    let isAffected = false;
    let productMatch: string | null = null;

    for (const range of versionRanges) {
      // If versionStart and versionEnd are both null, but it's in the list, it means all versions are affected
      if (!range.versionStart && !range.versionEnd) {
        setResult("all-versions");
        return;
      }

      const inRange = semver.satisfies(version, 
        `${range.versionStart ? `>=${range.versionStart}` : '*'} ${
          range.versionEnd ? (range.versionEndExcluding ? `<${range.versionEnd}` : `<=${range.versionEnd}`) : ''
        }`.trim()
      );

      if (inRange) {
        isAffected = true;
        productMatch = range.product;
        break;
      }
    }

    setResult(isAffected ? "affected" : "not-affected");
    setMatchingProduct(productMatch);
  };

  return (
    <div className="bg-[#0a0a0f] border border-stone-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-4 h-4 text-stone-500" />
        <h4 className="text-[10px] uppercase font-bold tracking-[0.2em] text-stone-500">Am I Affected? Version Checker</h4>
      </div>

      <form onSubmit={checkVersion} className="flex gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="e.g. 2.4.51"
            className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-4 py-2 text-sm text-stone-300 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all font-mono"
          />
          {error && <p className="absolute -bottom-5 left-0 text-[9px] text-rose-500 font-mono italic">{error}</p>}
        </div>
        <Button 
          type="submit"
          variant="outline"
          className="bg-stone-900 border-stone-800 text-stone-400 hover:text-sky-400 hover:border-sky-900 h-10 px-6 uppercase text-[10px] font-bold tracking-widest transition-all"
        >
          Check
        </Button>
      </form>

      <div className="pt-2">
        {result === "affected" && (
          <div className="flex items-center gap-3 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <div>
              <p className="text-xs font-bold text-rose-400">Likely Affected</p>
              <p className="text-[10px] text-stone-500 font-mono">Matches affected range for <span className="text-stone-300">{matchingProduct}</span></p>
            </div>
          </div>
        )}

        {result === "not-affected" && (
          <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-emerald-400">Not Affected</p>
              <p className="text-[10px] text-stone-500 font-mono">Version falls outside all known vulnerable ranges.</p>
            </div>
          </div>
        )}

        {result === "all-versions" && (
          <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg animate-in fade-in slide-in-from-top-1 duration-300">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <div>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">All versions affected</p>
              <p className="text-[10px] text-stone-500 italic mt-1 leading-relaxed">Check vendor advisory for manual mitigation steps.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
