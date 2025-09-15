import dayjs from "dayjs";
import { statisticsColors as colors } from "@/constants/statisticsConstants";
import { categories } from "@/constants/commonConstans";
import { getTotalMinutes } from "@/utils/formatTimeUtils";

export const processStatistics = (data) => {
  const completedEvents = data.filter(item => item.status === 'completed');
  
  const groupedData = {};
  completedEvents.forEach(item => {
    const key = item.title && item.title.trim() !== '' ? item.title : item.category;
    
    // 计算时长（分钟）
    const durationMinutes = getTotalMinutes(item.start_datetime, item.end_datetime);
    
    // 第一次groupedData[key]没有, 进行初始化
    if (!groupedData[key]) {
      groupedData[key] = {
        durationMinutes: 0,
        useCount: 0
      };
    }
    // groupedData有了, 进行累加
    groupedData[key].durationMinutes += durationMinutes > 0 ? durationMinutes : 0;
    groupedData[key].useCount += 1;
  });
  
  // 分类id->name映射
  const categoryMap = categories.reduce((acc, cur) => {
    acc[cur.id] = cur.name;
    return acc;
  }, {});
  
  const chartData = Object.keys(groupedData).map((key, index) => ({
    label: categoryMap[key] || key,
    value: groupedData[key].durationMinutes,
    color: colors[index % colors.length],
    useCount: groupedData[key].useCount
  }));
  
  const totalMinutes = completedEvents.reduce((sum, e) => {
    const start = dayjs(e.start_datetime);
    const end = dayjs(e.end_datetime);
    const duration = end.diff(start, 'minute');
    return sum + (duration > 0 ? duration : 0);
  }, 0);
  
  return { chartData, totalMinutes, completedEvents };
};