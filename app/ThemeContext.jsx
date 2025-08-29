import React, { createContext, useState, useContext } from 'react';
import { lightTheme, darkTheme } from '@/constants/themes';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('light'); // 默认 light
  const theme = themeName === 'light' ? lightTheme : darkTheme;
  
  const toggleTheme = () => {
    setThemeName(prev => (prev === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;