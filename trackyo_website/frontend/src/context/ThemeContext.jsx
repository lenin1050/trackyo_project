import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Default to dark theme or fetch saved
    return localStorage.getItem('trackyo-theme') || 'dark';
  });

  useEffect(() => {
    // Apply theme attribute to document element
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('trackyo-theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    if (['dark', 'light', 'neon', 'minimal'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
