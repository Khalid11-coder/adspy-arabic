"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search, User, CreditCard, Menu, X, Sparkles,
  Bell, Globe2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ── Right: Logo ── */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Logo mark */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1B4FD8] to-[#4F46E5] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {/* Wordmark */}
              <div className="flex flex-col leading-none">
                <span className="text-xl font-black text-[#1B4FD8] tracking-tight">
                  أدسباي
                </span>
                <span className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase">
                  AdSpy Arabia
                </span>
              </div>
            </Link>

            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="live-dot w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span className="text-xs font-bold text-emerald-700">مباشر</span>
            </div>
          </div>

          {/* ── Center: Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="#" icon={<Globe2 className="w-4 h-4" />} label="استكشاف" active />
            <NavLink href="#" icon={<CreditCard className="w-4 h-4" />} label="الأسعار" />
            <NavLink href="#" icon={<Search className="w-4 h-4" />} label="بحث متقدم" />
          </nav>

          {/* ── Left: Actions ── */}
          <div className="flex items-center gap-2">
            {/* Notification */}
            <button className="hidden sm:flex relative w-9 h-9 rounded-xl bg-gray-100 hover:bg-blue-50 items-center justify-center transition-colors group">
              <Bell className="w-4.5 h-4.5 text-gray-500 group-hover:text-[#1B4FD8]" />
              <span className="absolute -top-0.5 -left-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-[6px] text-white font-bold">3</span>
              </span>
            </button>

            {/* User */}
            <button className="flex items-center gap-2 bg-[#1B4FD8] text-white px-4 py-2 rounded-xl hover:bg-[#1E3A8A] transition-colors shadow-sm shadow-blue-200 font-semibold text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">دخول</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          <MobileNavItem href="#" label="🌐 استكشاف" />
          <MobileNavItem href="#" label="💳 الأسعار" />
          <MobileNavItem href="#" label="🔍 بحث متقدم" />
        </div>
      )}
    </header>
  );
}

function NavLink({ href, icon, label, active }: {
  href: string; icon: React.ReactNode; label: string; active?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
        active
          ? "bg-blue-50 text-[#1B4FD8]"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      {icon}
      {label}
    </a>
  );
}

function MobileNavItem({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#1B4FD8] transition-colors">
      {label}
    </a>
  );
}
