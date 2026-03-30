"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "ابحث عن متجر أو فئة... (مثال: عطور، إلكترونيات)",
}: SearchBarProps) {
  const [local, setLocal]   = useState(value);
  const [focused, setFocused] = useState(false);
  const [debouncing, setDebouncing] = useState(false);

  // Debounce: 350ms for server-side filtering
  useEffect(() => {
    if (local === value) return;
    setDebouncing(true);
    const t = setTimeout(() => {
      onChange(local);
      setDebouncing(false);
    }, 350);
    return () => clearTimeout(t);
  }, [local, value, onChange]);

  const handleClear = useCallback(() => {
    setLocal("");
    onChange("");
  }, [onChange]);

  return (
    <div
      className={cn(
        "relative flex items-center bg-white rounded-2xl border-2 transition-all duration-200 shadow-sm",
        focused
          ? "border-[#1B4FD8] shadow-blue-100 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Search icon */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        {debouncing ? (
          <Loader2 className="w-5 h-5 text-[#1B4FD8] animate-spin" />
        ) : (
          <Search className={cn(
            "w-5 h-5 transition-colors",
            focused ? "text-[#1B4FD8]" : "text-gray-400"
          )} />
        )}
      </div>

      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        dir="rtl"
        className="w-full py-3.5 pr-12 pl-12 bg-transparent text-gray-800 placeholder:text-gray-400 text-sm font-medium focus:outline-none rounded-2xl"
      />

      {/* Clear button */}
      {local && (
        <button
          onClick={handleClear}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      )}
    </div>
  );
}
