import EmptyContainer from '@/components/common/EmptyContainer';
import { useTheme } from '@/context/ThemeContext';
import React, { useMemo } from 'react';
import { View } from 'react-native';
import SortBar from './components/SortBar';

import { useSortConfig } from "@/context/SortConfigContext";
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
    
    // 排序数据
    return sortEventData(data, currentSort, customSortData);
  }, [isLoading, data, currentSort, customSortData]);
  
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