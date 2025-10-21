import { formatDate, formatDurationByMinutes, getTotalMinutes } from "@/utils/formatTimeUtils";
import { getCategoryName } from "@/utils/categoryUtils";
import { getEventsByDateRange } from "@/db/eventDB";

/**
 * 根据起始日期生成每日事件的格式化文本
 * @returns {string}
 * @param startDate
 * @param endDate
 */
export const getEventsText = async (startDate, endDate) => {
  // 生成日期范围数组
  const getDateRange = (start, end) => {
    const result = [];
    let current = new Date(start);
    const endDateObj = new Date(end);
    while (current <= endDateObj) {
      result.push(current);
      current.setDate(current.getDate() + 1);
    }
    return result;
  };
  
  const days = getDateRange(startDate, endDate);

  const dailyTextsPromises = days.map(async (dayStr) => {
    // 获取当天的事件
    const events = await getEventsByDateRange(dayStr);

    if(events.length === 0) {
      return `${dayStr} (0 个事件, 总时长 0分)\n暂无数据`;
    }
    
    // 总数和总时长
    const totalEventsCount = events?.length;
    const totalDurationMinutes = events?.reduce((total, e) => {
      return total + getTotalMinutes(e.start_datetime, e.end_datetime);
    }, 0);
    const formattedTotalDuration = formatDurationByMinutes(totalDurationMinutes);
    
    // 按分类分组
    const eventsByCategory = events.reduce((acc, event) => {
      const category = event.category || '其他';
      if(!acc[category]) acc[category] = [];
      acc[category].push(event);
      return acc;
    }, {});
    
    const categoriesText = Object.entries(eventsByCategory)
      .map(([category, events]) => {
        const totalCategoryDurationMinutes = events.reduce((total, event) => {
          return total + getTotalMinutes(event.start_datetime, event.end_datetime);
        }, 0);
        
        const formattedCategoryDuration = formatDurationByMinutes(totalCategoryDurationMinutes);
        
        const eventItems = events
          .map(e => {
            const startTimeStr = e.start_datetime.split(' ')[1];
            const endTimeStr = e.end_datetime.split(' ')[1];
            const durationMinutes = getTotalMinutes(e.start_datetime, e.end_datetime);
            const formattedDuration = formatDurationByMinutes(durationMinutes);
            const descPart = e.description ? `：${e.description}` : '';
            return `[${startTimeStr}~${endTimeStr} ${formattedDuration}] ${e.title || getCategoryName(category)}${descPart}`;
          })
          .join('\n');
        
        return `${getCategoryName(category)}: ${formattedCategoryDuration}\n${eventItems}`;
      })
      .join('\n\n');
    
    return `${formatDate(dayStr)} (${totalEventsCount} 个事件, 总时长 ${formattedTotalDuration})\n\n${categoriesText}`;
  });
  
  const dailyTexts = await Promise.all(dailyTextsPromises);
  
  return dailyTexts.join('\n\n----------------------\n\n');
};
