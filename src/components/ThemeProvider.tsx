"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper function to apply theme to DOM
const applyTheme = (newTheme: Theme) => {
  console.log("[ThemeProvider] Applying theme:", newTheme);
  const root = document.documentElement;
  
  if (newTheme === "dark") {
    root.classList.add("dark");
    console.log("[ThemeProvider] Added 'dark' class to <html>");
  } else {
    root.classList.remove("dark");
    console.log("[ThemeProvider] Removed 'dark' class from <html>");
  }
  
  console.log("[ThemeProvider] Current classList:", root.classList.toString());
  console.log("[ThemeProvider] HTML element:", root);
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with light theme to match server-side rendering
  const [theme, setTheme] = useState<Theme>("light");

  // After mounting, read the actual theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    console.log("[ThemeProvider] Component mounted, initial theme:", initialTheme);
    
    if (initialTheme !== theme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(initialTheme);
    }
    applyTheme(initialTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply theme changes when theme state updates (after initial mount)
  useEffect(() => {
    applyTheme(theme);
    console.log("[ThemeProvider] Theme changed, applying:", theme);
  }, [theme]);

  const toggleTheme = () => {
    console.log("[ThemeProvider] toggleTheme called. Current theme:", theme);
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("[ThemeProvider] Toggling to:", newTheme);
    
    setTheme(newTheme);
    applyTheme(newTheme);
    
    localStorage.setItem("theme", newTheme);
    console.log("[ThemeProvider] Saved to localStorage:", newTheme);
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
