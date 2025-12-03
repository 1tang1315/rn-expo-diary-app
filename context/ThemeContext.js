import React, { createContext, useContext, useState, useEffect } from 'react';
import { AsyncStorage } from "expo-sqlite/kv-store";

const ThemeContext = createContext(null);

// 预设主色调选项
const PRESET_COLORS = [
  '#3b82f6', // 蓝色
  '#10b981', // 绿色
  '#8b5cf6', // 紫色
  '#ec4899', // 粉色
  '#f59e0b', // 橙色
  '#ef4444', // 红色
  '#6366f1', // 靛蓝色
  '#14b8a6', // 青绿色
];

// 主色应用场景配置
const PRIMARY_APPLICATIONS = {
  interactive: {
    interactive: 'primary',
    emphasis: 'text',
    detail: 'border',
  },
  emphasis: {
    interactive: 'primary',
    emphasis: 'primary',
    detail: 'border',
  },
  detail: {
    interactive: 'primary',
    emphasis: 'text',
    detail: 'primary',
  },
  minimal: {
    interactive: 'primary',
    emphasis: 'text',
    detail: 'border',
  },
  none: {
    interactive: 'primary',
    emphasis: 'text',
    detail: 'border',
  },
};

// 基础主题
const baseThemes = {
  light: {
    background: '#ffffff',
    card: '#f8fafc',
    text: '#0f172a',
    subText: '#475569',
    border: '#e2e8f0',
    dim: '#94a3b8',
    primary: '#3b82f6',
    active: '#2563eb',
    inactive: '#cbd5e1',
    weekend: '#2563eb',
    holiday: '#dc2626',
    today: '#16a34a',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
  dark: {
    background: '#0b1220',
    card: '#1e293b',
    text: '#e6eef8',
    subText: '#94a3b8',
    border: '#334155',
    dim: '#64748b',
    primary: '#60a5fa',
    active: '#3b82f6',
    inactive: '#475569',
    weekend: '#60a5fa',
    holiday: '#f87171',
    today: '#4ade80',
    error: '#f87171',
    warning: '#fbbf24',
    success: '#4ade80',
  },
  blue: {
    background: '#ffffff',
    card: '#f0f9ff',
    text: '#0f172a',
    subText: '#334155',
    border: '#bfdbfe',
    dim: '#60a5fa',
    primary: '#2563eb',
    active: '#1d4ed8',
    inactive: '#94a3b8',
    weekend: '#1d4ed8',
    holiday: '#dc2626',
    today: '#16a34a',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
  green: {
    background: '#ffffff',
    card: '#f0fdf4',
    text: '#0f172a',
    subText: '#334155',
    border: '#a7f3d0',
    dim: '#4ade80',
    primary: '#16a34a',
    active: '#15803d',
    inactive: '#6ee7b7',
    weekend: '#15803d',
    holiday: '#dc2626',
    today: '#16a34a',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
  purple: {
    background: '#ffffff',
    card: '#faf5ff',
    text: '#0f172a',
    subText: '#334155',
    border: '#e9d5ff',
    dim: '#c084fc',
    primary: '#7c3aed',
    active: '#6d28d9',
    inactive: '#a855f7',
    weekend: '#6d28d9',
    holiday: '#dc2626',
    today: '#16a34a',
    error: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
  },
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(rgb) {
  const toHex = (x) => ('0' + x.toString(16)).slice(-2);
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function adjustColor(hex, brightnessFactor, saturationFactor) {
  let { r, g, b } = hexToRgb(hex);
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  
  s *= saturationFactor;
  l *= brightnessFactor;
  
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  
  let r_new, g_new, b_new;
  
  if (s === 0) {
    r_new = g_new = b_new = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r_new = hue2rgb(p, q, h + 1 / 3);
    g_new = hue2rgb(p, q, h);
    b_new = hue2rgb(p, q, h - 1 / 3);
  }
  
  return rgbToHex({
    r: Math.round(r_new * 255),
    g: Math.round(g_new * 255),
    b: Math.round(b_new * 255)
  });
}

function hexWithAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const sRGB = [r / 255, g / 255, b / 255].map(v => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
}

// 构建主题
export function buildTheme(mode = 'light', primaryApplication = 'interactive', customPrimary = null) {
  const baseTheme = baseThemes[mode] || baseThemes.light;
  const primary = customPrimary || baseTheme.primary;
  
  const primaryLight = adjustColor(primary, 1.2, 0.9);
  const primaryDark = adjustColor(primary, 0.8, 1.1);
  const primaryTransparent = hexWithAlpha(primary, 0.1);
  const luminance = getLuminance(primary);
  const primaryContrast = luminance > 0.5 ? '#000000' : '#ffffff';
  
  const appConfig = PRIMARY_APPLICATIONS[primaryApplication] || PRIMARY_APPLICATIONS.interactive;
  
  const sceneColors = {
    interactive: appConfig.interactive === 'primary' ? primary : baseTheme[appConfig.interactive],
    interactiveLight: appConfig.interactive === 'primary' ? primaryLight : adjustColor(baseTheme[appConfig.interactive], 1.5, 0.9),
    interactiveDark: appConfig.interactive === 'primary' ? primaryDark : adjustColor(baseTheme[appConfig.interactive], 0.8, 1.1),
    interactiveContrast: appConfig.interactive === 'primary' ? primaryContrast : luminance > 0.5 ? '#000000' : '#ffffff',
    emphasis: appConfig.emphasis === 'primary' ? primary : baseTheme[appConfig.emphasis],
    detail: appConfig.detail === 'primary' ? primary : baseTheme[appConfig.detail],
    detailTransparent: appConfig.detail === 'primary' ? primaryTransparent : hexWithAlpha(baseTheme[appConfig.detail], 0.1),
  };
  
  const derivedColors = {
    placeholder: hexWithAlpha(baseTheme.text, 0.5),
    disabledBackground: mode === 'light'
      ? adjustColor(baseTheme.background, 0.95, 0.5)
      : adjustColor(baseTheme.background, 1.1, 0.5),
    disabledBorder: hexWithAlpha(baseTheme.border, 0.7),
    disabledText: hexWithAlpha(baseTheme.text, 0.4),
    textInverse: primaryContrast,
  };
  
  return {
    mode,
    primary,
    colors: {
      ...baseTheme,
      ...sceneColors,
      ...derivedColors,
      primaryLight,
      primaryDark,
      primaryTransparent,
      primaryContrast,
    },
  };
}

export function ThemeProvider({ initialConfig, children }) {
  const [mode, setMode] = useState(initialConfig.mode);
  const [primaryApplication, setPrimaryApplication] = useState(initialConfig.scene);
  const [primaryColor, setPrimaryColor] = useState(initialConfig.primary || PRESET_COLORS[0]);
  const [theme, setTheme] = useState(buildTheme(initialConfig.mode, initialConfig.scene, initialConfig.primary));
  
  useEffect(() => {
    if (!initialConfig) return;
    setMode(initialConfig.mode || 'light');
    setPrimaryApplication(initialConfig.scene || 'interactive');
    setPrimaryColor(initialConfig.primary || PRESET_COLORS[0]);
  }, [initialConfig]);
  
  // 状态变化时更新主题并保存
  useEffect(() => {
    if (mode && primaryApplication && primaryColor) {
      const newTheme = buildTheme(mode, primaryApplication, primaryColor);
      setTheme(newTheme);
      // 保存到本地存储
      try {
        AsyncStorage.setItem('theme_mode', mode).then();
        AsyncStorage.setItem('theme_primary', primaryColor).then();
        AsyncStorage.setItem('theme_scene', primaryApplication).then();
      } catch (e) {
        console.error('Failed to save theme settings', e);
      }
    }
  }, [mode, primaryApplication, primaryColor]);

  const toggleMode = () => {
    setMode(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setThemeMode = (newMode) => {
    setMode(newMode);
  };

  const setPrimaryApplicationScene = (scene) => {
    setPrimaryApplication(scene);
  };

  const handleSetPrimaryColor = (color) => {
    setPrimaryColor(color);
  };

  // 提供兜底值，避免初始状态为 null 时出错
  const value = {
    mode: mode || 'light',
    theme: theme || buildTheme('light', 'interactive', PRESET_COLORS[0]),
    primaryColor: primaryColor || PRESET_COLORS[0],
    primaryApplication: primaryApplication || 'interactive',
    PRESET_COLORS,
    toggleMode,
    setThemeMode,
    setPrimaryColor: handleSetPrimaryColor,
    setPrimaryApplicationScene,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}