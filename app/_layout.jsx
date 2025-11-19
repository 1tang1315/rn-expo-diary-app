import { SplashScreen, Stack } from "expo-router";
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // 引入中文本地化配置
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import updateLocale from 'dayjs/plugin/updateLocale';
import { ThemeProvider } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { AsyncStorage } from "expo-sqlite/kv-store";

dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(updateLocale);

// 设置为中文
dayjs.locale('zh-cn');

// 设置周起始为周日
dayjs.updateLocale('zh-cn', {
  weekStart: 0,
});

export default function RootLayout() {
  const [config, setConfig] = useState(null);
  
  // 从本地加载主题
  useEffect(() => {
    const init = async () => {
      const mode = await AsyncStorage.getItem('theme_mode');
      const primary = await AsyncStorage.getItem('theme_primary');
      const scene = await AsyncStorage.getItem('theme_scene');
      
      setConfig({ mode, primary, scene });
      await SplashScreen.hideAsync();
    };
    
    SplashScreen.preventAutoHideAsync().then();
    init().then();
  }, []);
  
  if (!config) return null;

  return (
    <ThemeProvider initialConfig={config}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
