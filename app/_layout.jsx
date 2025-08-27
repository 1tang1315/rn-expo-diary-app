import { Stack } from "expo-router";
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn'; // 引入中文本地化配置
import weekday from 'dayjs/plugin/weekday';
import localeData from 'dayjs/plugin/localeData';
import updateLocale from 'dayjs/plugin/updateLocale';

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
  return <Stack screenOptions={{ headerShown: false }} />;
}
