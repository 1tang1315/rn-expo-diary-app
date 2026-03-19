import dayjs from "dayjs";
import { statisticsColors as colors } from "@/constants/commonConstans";
import { getTotalMinutes } from "@/utils/formatTimeUtils";
import { getCategoryName } from "@/utils/categoryUtils";

export const processStatistics = (data, groupByCategory = false) => {
  const completedEvents = data.filter(item => item.status === 'completed');
  
  const groupedData = {};
  completedEvents.forEach(item => {
    const key = groupByCategory
      ? getCategoryName(item.category) // all时用分类名称作为key
      : (item.title && item.title.trim() !== '' ? item.title : getCategoryName(item.category));
    
    
    // 计算时长（分钟）
    const durationMinutes = getTotalMinutes(item.startDatetime, item.endDatetime);
    
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
  
  const chartData = Object.keys(groupedData).map((key, index) => ({
    label: key,
    value: groupedData[key].durationMinutes,
    color: colors[index % colors.length],
    useCount: groupedData[key].useCount
  }));
  
  const totalMinutes = completedEvents.reduce((sum, e) => {
    const start = dayjs(e.startDatetime);
    const end = dayjs(e.endDatetime);
    const duration = end.diff(start, 'minute');
    return sum + (duration > 0 ? duration : 0);
  }, 0);
  
  return { chartData, totalMinutes, completedEvents };
};