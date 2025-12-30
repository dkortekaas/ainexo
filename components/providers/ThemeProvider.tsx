"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize theme from DOM to match the inline script
  const [theme, setTheme] = useState<Theme>(() => {
    // This will run on the client side
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") as Theme;
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      return savedTheme || (systemPrefersDark ? "dark" : "light");
    }
    return "light";
  });

  useEffect(() => {
    // Sync with the DOM class that was set by the inline script
    const htmlElement = document.documentElement;
    const isDark = htmlElement.classList.contains("dark");
    const currentTheme = isDark ? "dark" : "light";

    // Only update if there's a mismatch
    if (theme !== currentTheme) {
      setTheme(currentTheme);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't set a preference
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        if (newTheme === "dark") {
          htmlElement.classList.add("dark");
        } else {
          htmlElement.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    const htmlElement = document.documentElement;
    if (newTheme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
