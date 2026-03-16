"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { SchoolConfig } from "../schools";

const ThemeContext = createContext<{ school: SchoolConfig | null }>({ school: null });

export function ThemeProvider({ 
  children, 
  school 
}: { 
  children: ReactNode; 
  school: SchoolConfig;
}) {
  useEffect(() => {
    // Inject CSS variables into the :root
    const root = document.documentElement;
    root.style.setProperty("--primary", school.primaryColor);
    root.style.setProperty("--primary-foreground", school.primaryForeground);
    
    if (school.secondaryColor) {
      root.style.setProperty("--secondary", school.secondaryColor);
    } else {
      // Default secondary behavior if not provided
      root.style.setProperty("--secondary", school.primaryColor);
    }

    // Update the document title or other metadata if needed
    document.title = `${school.name} | Campus Virtual`;

  }, [school]);

  return (
    <ThemeContext.Provider value={{ school }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useSchool = () => useContext(ThemeContext);
