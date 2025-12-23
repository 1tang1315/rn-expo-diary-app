import dayjs from "dayjs";
import { View } from "react-native";
import DateCell from "@/components/habit-tracking/components/calendar/DateCell";

/**
 * 补零格式化数字
 */
export const padZero = (num) => String(num).padStart(2, '0');

/**
 * 获取月份日历布局
 */
let calendarLayoutCache = new Map();
const getMonthCalendarLayout = (year, month) => {
  const cacheKey = `${year}-${month}`;
  if (calendarLayoutCache.has(cacheKey)) {
    return calendarLayoutCache.get(cacheKey);
  }
  
  const formattedMonth = padZero(month);
  const daysInMonth = dayjs(`${year}-${formattedMonth}`).daysInMonth();
  const firstDayOfWeek = dayjs(`${year}-${formattedMonth}-01`).day();
  const firstDayIndex = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const totalCells = firstDayIndex + daysInMonth;
  const needFillEmpty = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  
  const result = {
    formattedMonth,
    daysInMonth,
    firstDayIndex,
    needFillEmpty,
    totalCells: totalCells + needFillEmpty
  };
  
  calendarLayoutCache.set(cacheKey, result);
  return result;
};

/**
 * 生成月份格子数据
 */
export const generateMonthCells = (year, month) => {
  const layout = getMonthCalendarLayout(year, month);
  const cells = [];
  
  // 首行空白
  for (let i = 0; i < layout.firstDayIndex; i++) {
    cells.push({ type: 'empty', key: `month-${month}-empty-${i}` });
  }
  
  // 日期格子
  for (let day = 1; day <= layout.daysInMonth; day++) {
    const dateKey = `${year}-${layout.formattedMonth}-${padZero(day)}`;
    cells.push({
      type: 'date',
      key: `month-${month}-date-${day}`,
      dayNum: day,
      dateKey
    });
  }
  
  // 最后一行空白
  for (let i = 0; i < layout.needFillEmpty; i++) {
    cells.push({ type: 'empty', key: `month-${month}-post-empty-${i}` });
  }
  
  return cells;
};

/**
 * 日历格子渲染函数
 */
export const renderCalendarCell = ({ item, cardItem, size = 38 }) => {
  if (item.type === 'empty') {
    return <View style={{ width: size, height: size }} />;
  }
  
  const count = cardItem.dailyCounts[item.dateKey] || 0;
  return (
    <DateCell
      dayNum={item.dayNum}
      count={count}
      color={cardItem.color}
      size={size}
    />
  );
};