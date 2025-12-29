import EmptyContainer from '@/components/common/EmptyContainer';
import { useTheme } from '@/context/ThemeContext';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import SortBar from './components/SortBar';

import { useSortConfig } from "@/context/SortConfigContext";
import { getCategoryName } from "@/utils/categoryUtils";
import { formatDurationByMinutes, getTotalMinutes } from "@/utils/formatTimeUtils";
import dayjs from "dayjs";
import DayView from './views/DayView';
import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import YearView from './views/YearView';

// region start 常量 + 函数(折叠代码注释)
const VIEW_TYPES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

// 颜色缓存映射表
const colorCache = new Map();

// 高对比度随机颜色
const getRandomColor = (eventKey) => {
  // 如果缓存中有该key的颜色，直接返回
  if (colorCache.has(eventKey)) {
    return colorCache.get(eventKey);
  }
  
  const letters = '0123456789ABCDEF';
  let color = '#';
  
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // 确保颜色对比度足够（偏暗，文字显示清晰）
  const finalColor = brightness < 128
    ? color
    : `#${(0xFFFFFF - parseInt(color.slice(1), 16)).toString(16).padStart(6, '0')}`;
  
  // 将生成的颜色存入缓存
  colorCache.set(eventKey, finalColor);
  
  return finalColor;
};

// 过滤无效数据
const filterValidEvents = (data) => {
  return data.filter(item => item.title || getCategoryName(item.category) && item.start_datetime);
};

// 初始化不同视图类型的基础数据
const initEventBaseData = (eventKey, viewType, event) => {
  const baseData = {
    title: eventKey,
    color: event.color || getRandomColor(eventKey),
    count: 0,
    totalMinutes: 0,
    totalDurationStr: ''
  };
  
  switch (viewType) {
    case 'day':
      return { ...baseData, timeRanges: [], date: '' };
    case 'week':
      return { ...baseData, weeklyCounts: new Array(7).fill(0) };
    case 'month':
      return { ...baseData, dailyCounts: {} };
    case 'year':
      return { ...baseData, dailyCounts: {}, monthlyCounts: {} };
    default:
      return { ...baseData, weeklyCounts: new Array(7).fill(0) };
  }
};

// 处理单条事件数据的聚合逻辑
const processSingleEvent = (event, eventMap, viewType, dateRange) => {
  const eventKey = event.title || getCategoryName(event.category);
  if (!eventKey) return;
  
  // 初始化数据（不存在则创建）
  if (!eventMap.has(eventKey)) {
    eventMap.set(eventKey, initEventBaseData(eventKey, viewType, event));
  }
  
  const eventData = eventMap.get(eventKey);
  eventData.count++;
  
  const startDatetime = dayjs(event.start_datetime);
  const endDatetime = dayjs(event.end_datetime || event.start_datetime);
  const totalMinutes = getTotalMinutes(event.start_datetime, event.end_datetime || event.start_datetime);
  eventData.totalMinutes += totalMinutes;
  
  // 按视图类型补充数据
  switch (viewType) {
    case 'day':
      eventData.timeRanges.push({
        startTime: startDatetime.format('HH:mm'),
        endTime: endDatetime.format('HH:mm'),
        durationStr: formatDurationByMinutes(totalMinutes),
        startDatetime: event.start_datetime,
        endDatetime: event.end_datetime || event.start_datetime
      });
      eventData.date = eventData.date || startDatetime.format('YYYY-MM-DD');
      break;
    case 'week':
      const weekStart = dateRange?.startDate
        ? dayjs(dateRange.startDate).startOf('week')
        : dayjs().startOf('week');
      const dayDiff = startDatetime.diff(weekStart, 'day');
      const weekIndex = dayDiff >= 0 && dayDiff < 7 ? dayDiff : -1;
      if (weekIndex >= 0 && weekIndex < 7) {
        eventData.weeklyCounts[weekIndex]++;
      }
      break;
    case 'month':
      const dateStr = startDatetime.format('YYYY-MM-DD');
      eventData.dailyCounts[dateStr] = (eventData.dailyCounts[dateStr] || 0) + 1;
      break;
    case 'year':
      const yearDateStr = startDatetime.format('YYYY-MM-DD');
      const monthStr = startDatetime.format('YYYY-MM');
      eventData.dailyCounts[yearDateStr] = (eventData.dailyCounts[yearDateStr] || 0) + 1;
      eventData.monthlyCounts[monthStr] = (eventData.monthlyCounts[monthStr] || 0) + 1;
      break;
  }
};

// 格式化聚合后的数据
const formatEventData = (eventMap, viewType) => {
  return Array.from(eventMap.values()).map(item => {
    item.totalDurationStr = formatDurationByMinutes(item.totalMinutes);
    
    if (viewType === 'day' && item.timeRanges) {
      item.timeRanges.sort((a, b) =>
        dayjs(a.startDatetime).isBefore(dayjs(b.startDatetime)) ? -1 : 1
      );
      item.date = item.date || dayjs().format('YYYY-MM-DD');
    }
    
    return item;
  });
};

// 排序数据
const sortEventData = (data, sortType, customSortData = []) => {
  const sortedData = [...data]; // 避免修改原数组
  
  // 支持自定义排序函数
  if (typeof sortType === 'function') {
    return sortedData.sort(sortType);
  }
  
  switch (sortType) {
    case 'name_asc':
      return sortedData.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
    case 'name_desc':
      return sortedData.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'));
    case 'count_asc':
      return sortedData.sort((a, b) => a.count - b.count);
    case 'count_desc':
      return sortedData.sort((a, b) => b.count - a.count);
    case 'duration_asc':
      return sortedData.sort((a, b) => a.totalMinutes - b.totalMinutes);
    case 'duration_desc':
      return sortedData.sort((a, b) => b.totalMinutes - a.totalMinutes);
    case 'custom':
      if (customSortData.length > 0) {
        const sortOrderMap = new Map(
          customSortData.map((item, index) => [item.title, index])
        );
        return sortedData.sort((a, b) => {
          const orderA = sortOrderMap.get(a.title);
          const orderB = sortOrderMap.get(b.title);
          if (orderA !== undefined && orderB !== undefined) {
            return orderA - orderB;
          }
          if (orderA !== undefined) return -1;
          if (orderB !== undefined) return 1;
          return 0;
        });
      }
      return sortedData;
    default:
      return sortedData;
  }
};
// endregion  end(折叠代码注释)

const CheckStat = ({
  data = [],
  viewType,
  dateRange
}) => {
  const { theme } = useTheme();
  const { currentSort, isLoading, customSortData } = useSortConfig();
  
  // 解析当前年月 周范围
  const { currentYear, currentMonth, weekStartDate } = useMemo(() => {
    const currentDate = dayjs(dateRange?.startDate);
    const weekStart = dateRange?.startDate
      ? dayjs(dateRange.startDate).startOf('week')
      : dayjs().startOf('week');
    
    return {
      currentYear: dateRange?.startDate ? currentDate.year() : dayjs().year(),
      currentMonth: dateRange?.startDate ? currentDate.month() + 1 : dayjs().month() + 1,
      weekStartDate: weekStart
    };
  }, [dateRange]);
  
  const viewData = useMemo(() => {
    if (isLoading) return [];
    
    const eventMap = new Map();
    
    // 1. 过滤有效数据
    const validData = filterValidEvents(data);
    
    // 2. 聚合每条事件数据
    validData.forEach(event => {
      processSingleEvent(event, eventMap, viewType, dateRange);
    });
    
    // 3. 格式化数据
    const formattedData = formatEventData(eventMap, viewType);
    
    // 4. 排序数据
    return sortEventData(formattedData, currentSort, customSortData);
  }, [isLoading, data, viewType, currentSort, customSortData, dateRange]);
  
  if(!viewData.length) {
    return (
      <EmptyContainer
        model="box"
        iconLib="MaterialIcons"
        iconName="insights"
      />
    );
  }
  
  return (
    <View style={{
      flex: 1,
      borderRadius: 5,
      backgroundColor: theme.colors.background
    }}>
      <SortBar />
      
      {viewType === VIEW_TYPES.DAY && <DayView items={viewData} />}
      {viewType === VIEW_TYPES.WEEK && <WeekView items={viewData} weekStartDate={weekStartDate} />}
      {viewType === VIEW_TYPES.MONTH && <MonthView items={viewData} year={currentYear} month={currentMonth} />}
      {viewType === VIEW_TYPES.YEAR && <YearView items={viewData} year={currentYear} />}
    </View>
  );
};

export default CheckStat;