import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Component
 * 
 * Functionality: Manages the application theme (light/dark) and persists it to local storage.
 * Input: children (ReactNode) - Child components to be wrapped.
 * Response: JSX.Element - The ThemeContext provider wrapping the children.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    // Initialize state from local storage or default to light
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme as Theme) || 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove both classes first to ensure clean state
        root.classList.remove('light', 'dark');

        // Add the current theme class
        root.classList.add(theme);

        // Persist to local storage
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Custom hook to use theme context
 * 
 * Functionality: Provides access to the theme context.
 * Input: None
 * Response: ThemeContextType - The theme context value including theme and toggleTheme.
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
