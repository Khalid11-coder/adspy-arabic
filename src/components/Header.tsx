"use client";
import { User, DollarSign, Search } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo — Right side (RTL) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600">
            <span className="text-white font-black text-sm">أد</span>
          </div>
          <span className="text-2xl font-black text-blue-600 tracking-tight">أدسباي</span>
        </div>

        {/* Navigation — Left side */}
        <nav className="flex items-center gap-6">
          <Link
            href="#"
            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
          >
            <DollarSign size={16} />
            <span>الأسعار</span>
          </Link>
          <Link
            href="#"
            className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
          >
            <Search size={16} />
            <span>البحث</span>
          </Link>
          <button className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 transition-all text-gray-600">
            <User size={18} />
          </button>
        </nav>
      </div>
    </header>
  );
}
