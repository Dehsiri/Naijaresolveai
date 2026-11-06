"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scale,
  LayoutDashboard,
  MessageSquareText,
  FileText,
  BookOpen,
  Gavel,
  Users,
  Settings,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/(auth)/actions";

/**
 * Sidebar Component (Section 4 Spec):
 * - Navy bg (#121212), 232px width on desktop, stacks on mobile.
 * - Items min-h 44px, radius 12px (rounded-btn); active item bg `navy-700` + white text.
 * - Items: Dashboard, AI assistant, Documents, Know your rights, Disputes, Find a lawyer;
 *   Settings pinned bottom (+ Admin link when user role is admin).
 */
interface SidebarProps {
  isAdmin?: boolean;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI assistant", href: "/assistant", icon: MessageSquareText },
  { label: "Documents", href: "/documents", icon: FileText },
  {
    label: "Know your rights",
    href: "/dashboard?tab=rights",
    icon: BookOpen,
    badge: "Soon",
  },
  { label: "Disputes", href: "/documents?view=disputes", icon: Gavel },
  {
    label: "Find a lawyer",
    href: "/dashboard?tab=lawyers",
    icon: Users,
    badge: "Soon",
  },
];

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Main navigation"
      className="w-full lg:w-[232px] lg:min-h-screen shrink-0 bg-navy text-white border-b lg:border-b-0 lg:border-r border-navy-line flex flex-col justify-between p-4"
    >
      <div>
        {/* Brand Header */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-2 py-2 mb-4"
        >
          <div className="h-9 w-9 rounded-btn bg-ig-gradient flex items-center justify-center text-white font-extrabold shrink-0">
            <Scale className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-[17px] font-extrabold tracking-tight text-white">
            NaijaResolve AI
          </span>
        </Link>

        {/* Navigation Links (horizontal scroll on mobile, vertical stack on desktop) */}
        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href.split("?")[0]));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between gap-3 min-h-[44px] px-3.5 py-2.5 rounded-btn text-[14px] font-semibold transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-navy-700 text-white"
                    : "text-muted-dark hover:bg-navy-800 hover:text-white"
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span className="hidden lg:inline-block rounded-full bg-navy-800 border border-navy-line px-2 py-0.5 text-[11px] font-bold text-muted-dark">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-btn text-[14px] font-semibold transition-colors whitespace-nowrap",
                pathname.startsWith("/admin")
                  ? "bg-navy-700 text-white"
                  : "text-emerald-300 hover:bg-navy-800 hover:text-white"
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Admin panel</span>
            </Link>
          )}
        </nav>
      </div>

      {/* Bottom pinned Settings + Sign out */}
      <div className="hidden lg:flex flex-col gap-1.5 pt-4 border-t border-navy-line">
        <Link
          href="/dashboard?tab=settings"
          className="flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-btn text-[14px] font-semibold text-muted-dark hover:bg-navy-800 hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Settings</span>
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 min-h-[44px] px-3.5 py-2.5 rounded-btn text-[14px] font-semibold text-muted-dark hover:bg-navy-800 hover:text-white transition-colors text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

