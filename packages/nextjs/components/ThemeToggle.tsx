"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? theme === "dark" : true;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="toggle theme"
      className="inline-flex items-center justify-center h-9 w-9 rounded-md text-[#525252] dark:text-[#A1A1A1] hover:bg-[#F4F4F5] dark:hover:bg-[#141414] hover:text-[#0A0A0A] dark:hover:text-[#FFD60A] transition-colors"
    >
      {mounted ? isDark ? <Moon size={18} /> : <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
};
