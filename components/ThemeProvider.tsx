import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light' | 'dark';
}

const ThemeProviderContext = createContext<ThemeProviderContext | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'rise-ui-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    
    try {
      const stored = localStorage.getItem(storageKey);
      return (stored as Theme) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    
    try {
      const stored = localStorage.getItem(storageKey);
      const storedTheme = (stored as Theme) || defaultTheme;
      
      if (storedTheme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return storedTheme as 'light' | 'dark';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const updateActualTheme = (newTheme: Theme) => {
      let resolvedTheme: 'light' | 'dark';

      if (newTheme === 'system') {
        resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        resolvedTheme = newTheme;
      }

      setActualTheme(resolvedTheme);

      // Remove all theme classes first
      root.classList.remove('light', 'dark', 'system');
      
      // Always add a specific theme class
      if (newTheme === 'system') {
        // For system theme, add both system indicator and resolved theme
        root.classList.add('system', resolvedTheme);
      } else {
        // For explicit choices, add the specific theme class
        root.classList.add(resolvedTheme);
      }
      
      // Debug logging (remove in production)
      console.log('Theme updated:', {
        newTheme,
        resolvedTheme,
        classes: root.className,
        storage: localStorage.getItem(storageKey)
      });
    };

    // Apply theme immediately
    updateActualTheme(theme);

    // Listen for system theme changes when theme is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateActualTheme(theme);
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Apply initial theme on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      
      // Force initial theme application
      const updateActualTheme = (newTheme: Theme) => {
        let resolvedTheme: 'light' | 'dark';

        if (newTheme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
          resolvedTheme = newTheme;
        }

        setActualTheme(resolvedTheme);

        // Remove all theme classes first
        root.classList.remove('light', 'dark', 'system');
        
        // Always add a specific theme class
        if (newTheme === 'system') {
          // For system theme, add both system indicator and resolved theme
          root.classList.add('system', resolvedTheme);
        } else {
          // For explicit choices, add the specific theme class
          root.classList.add(resolvedTheme);
        }
        
        // Debug logging (remove in production)
        console.log('Initial theme applied:', {
          newTheme,
          resolvedTheme,
          classes: root.className,
          storage: localStorage.getItem(storageKey)
        });
      };
      
      updateActualTheme(theme);
    }
  }, []); // Run only on mount

  const handleSetTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      // Handle localStorage errors silently
    }
    setTheme(newTheme);
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
    actualTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}