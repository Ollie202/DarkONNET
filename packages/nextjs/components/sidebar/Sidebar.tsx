"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid, Plus, Trophy, User } from "lucide-react";
import { useSidebar } from "~~/components/sidebar/SidebarContext";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Markets", href: "/", icon: LayoutGrid },
  { label: "My Positions", href: "/positions", icon: BarChart3 },
  { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { label: "Profile", href: "/profile", icon: User },
];

export const Sidebar = () => {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={`hidden md:flex shrink-0 flex-col border-r border-[#E5E5E5] dark:border-[#1F1F1F] bg-white dark:bg-[#0A0A0A] transition-[width] duration-200 ease-out ${
        isCollapsed ? "w-16" : "w-60"
      }`}
      aria-label="primary navigation"
    >
      <div className="flex items-center h-14 px-4 border-b border-[#E5E5E5] dark:border-[#1F1F1F]">
        {!isCollapsed ? (
          <span className="text-sm font-semibold tracking-tight text-[#0A0A0A] dark:text-[#FAFAFA]">
            Zama <span className="text-[#FFD60A]">Predict</span>
          </span>
        ) : (
          <span className="w-2 h-2 rounded-full bg-[#FFD60A] mx-auto" />
        )}
      </div>

      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 h-10 text-sm transition-colors ${
                    active
                      ? "bg-[#F4F4F5] dark:bg-[#1F1F1F] text-[#0A0A0A] dark:text-[#FFD60A]"
                      : "text-[#525252] dark:text-[#A1A1A1] hover:bg-[#F4F4F5] dark:hover:bg-[#141414] hover:text-[#0A0A0A] dark:hover:text-[#FAFAFA]"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-[#E5E5E5] dark:border-[#1F1F1F] p-3">
        <button
          type="button"
          className={`flex items-center justify-center gap-2 w-full h-10 rounded-md bg-[#FFD60A] text-[#0A0A0A] text-sm font-semibold hover:bg-[#FFD60A]/90 transition-colors ${
            isCollapsed ? "px-0" : "px-3"
          }`}
          title={isCollapsed ? "create market" : undefined}
        >
          <Plus size={18} className="shrink-0" />
          {!isCollapsed && <span className="truncate">Create Market</span>}
        </button>
      </div>
    </aside>
  );
};
