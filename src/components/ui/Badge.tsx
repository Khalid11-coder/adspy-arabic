import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "active" | "inactive" | "meta" | "tiktok" | "snapchat" | "category";
  className?: string;
}

const variants = {
  active:   "bg-emerald-100 text-emerald-700 border border-emerald-200",
  inactive: "bg-red-100 text-red-600 border border-red-200",
  meta:     "bg-blue-100 text-blue-700 border border-blue-200",
  tiktok:   "bg-black text-white border border-gray-800",
  snapchat: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  category: "bg-indigo-50 text-indigo-700 border border-indigo-200",
};

export function Badge({ children, variant = "category", className }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
