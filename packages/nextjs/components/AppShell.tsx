"use client";

import { Sidebar } from "~~/components/sidebar/Sidebar";

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-0 flex-1 pb-16 md:pb-0">
      <Sidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};
