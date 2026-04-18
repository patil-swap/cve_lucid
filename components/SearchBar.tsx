"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        try {
          const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.suggestions);
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent | string) => {
    if (typeof e !== "string") e.preventDefault();
    const finalQuery = typeof e === "string" ? e : query;
    
    if (finalQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    } else {
      router.push("/");
    }
    setShowSuggestions(false);
  };

  const selectSuggestion = (val: string) => {
    setQuery(val);
    handleSearch(val);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearch} className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-stone-500" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder="Search (e.g. log4j, Windows) /"
          className="block w-full pl-10 pr-12 py-2 bg-stone-900/50 border border-stone-800 rounded-md text-sm text-stone-300 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 transition-all font-mono"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 border border-stone-700 rounded bg-stone-800 text-stone-500 text-[10px] font-mono">
            /
          </kbd>
        </div>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-[#0a0a0f] border border-stone-800 rounded shadow-2xl py-1 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {suggestions.map((s, i) => (
            <li 
              key={`${s.value}-${i}`}
              onClick={() => selectSuggestion(s.value)}
              className="px-4 py-2 hover:bg-stone-900 cursor-pointer flex items-center justify-between group transition-colors"
            >
              <span className="text-xs font-mono text-stone-300 group-hover:text-sky-400 truncate max-w-[80%]">
                {s.value}
              </span>
              <span className="text-[9px] font-mono uppercase text-stone-600 tracking-tighter">
                {s.type}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
