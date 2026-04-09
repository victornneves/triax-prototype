import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const getInitialTheme = () => {
    try {
        const stored = localStorage.getItem('triax-theme');
        if (stored) return stored;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    } catch (e) {
        return 'light';
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    // Persist theme preference to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem('triax-theme', theme);
        } catch (e) {
            // localStorage quota or access error — ignore silently
        }
    }, [theme]);

    // Clear FOUC script's attribute on <html> so .app-container becomes sole authority
    useEffect(() => {
        document.documentElement.removeAttribute('data-app-theme');
    }, []);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
