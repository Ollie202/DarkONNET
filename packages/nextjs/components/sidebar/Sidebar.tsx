"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid, Plus, User } from "lucide-react";
import { useSidebar } from "~~/components/sidebar/SidebarContext";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

const navItems: NavItem[] = [
  { label: "Markets", href: "/", icon: LayoutGrid },
  { label: "My Positions", href: "/positions", icon: BarChart3 },
  { label: "Profile", href: "/profile", icon: User },
];

export const Sidebar = () => {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const createActive = pathname === "/create-market";

  return (
    <>
      <aside
        className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-[#E5E5E5] bg-white transition-[width] duration-200 ease-out dark:border-[#1F1F1F] dark:bg-[#0A0A0A] md:flex ${
          isCollapsed ? "w-16" : "w-60"
        }`}
        aria-label="primary navigation"
      >
        <div className="flex h-14 items-center border-b border-[#E5E5E5] px-4 dark:border-[#1F1F1F]">
          {!isCollapsed ? (
            <span className="text-sm font-semibold tracking-tight text-[#0A0A0A] dark:text-[#FAFAFA]">
              Zama <span className="text-[#FFD60A]">Predict</span>
            </span>
          ) : (
            <span className="mx-auto h-2 w-2 rounded-full bg-[#FFD60A]" />
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
                    className={`smooth-action flex h-10 items-center gap-3 rounded-md px-3 text-sm ${
                      active
                        ? "bg-[#F4F4F5] text-[#0A0A0A] dark:bg-[#1F1F1F] dark:text-[#FFD60A]"
                        : "text-[#525252] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FAFAFA]"
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
          <div className="mt-3 px-2">
            <Link
              href="/create-market"
              className={`smooth-action flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-semibold text-[#0A0A0A] hover:bg-[#FFD60A]/90 ${
                createActive ? "bg-[#FFD60A]" : "bg-[#FFD60A]/85"
              } ${isCollapsed ? "px-0" : "px-3"}`}
              title={isCollapsed ? "Create Market" : undefined}
            >
              <Plus size={18} className="shrink-0" />
              {!isCollapsed && <span className="truncate">Create Market</span>}
            </Link>
          </div>
        </nav>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-[90] border-t border-[#E5E5E5] bg-white px-2 py-2 dark:border-[#1F1F1F] dark:bg-[#0A0A0A] md:hidden"
        aria-label="mobile navigation"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {[...navItems, { label: "Create", href: "/create-market", icon: Plus }].map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`smooth-action flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold ${
                  active
                    ? "bg-[#FFD60A] text-[#0A0A0A]"
                    : "text-[#525252] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FAFAFA]"
                }`}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
