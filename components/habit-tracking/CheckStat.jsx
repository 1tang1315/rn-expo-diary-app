import React, { useMemo, memo, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity } from 'react-native';
import dayjs from "dayjs";
import { useTheme } from "@/context/ThemeContext";
import ThemeText from "@/components/Theme/ThemeText";
import { formatDurationByMinutes, getTotalMinutes } from "@/utils/formatTimeUtils";
import ThemeTitleText from "@/components/Theme/ThemeTitleText";
import ThemeSubTitleText from "@/components/Theme/ThemeSubTitleText";
import EmptyContainer from "@/components/common/EmptyContainer";
import { getCategoryName } from "@/utils/categoryUtils";
import { AsyncStorage } from "expo-sqlite/kv-store";

// === 常量定义 ===
// 排序相关常量
const SORT_TYPES = {
  DEFAULT: 'default', // 默认（用户自定义）
  NAME_ASC: 'name_asc', // 名称升序
  NAME_DESC: 'name_desc', // 名称降序
  COUNT_ASC: 'count_asc', // 次数升序
  COUNT_DESC: 'count_desc', // 次数降序
  DURATION_ASC: 'duration_asc', // 时长升序
  DURATION_DESC: 'duration_desc' // 时长降序
};
const STORAGE_KEY = 'checkStat_sort_config'; // 排序配置存储key

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日'];
const VIEW_TYPES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year'
};

// === 工具函数 ===
/**
 * 对视图数据进行排序
 */
const sortViewData = (data, sortType) => {
  const sortedData = Array.isArray(data) ? [...data] : [];
  
  switch (sortType) {
    case SORT_TYPES.NAME_ASC:
      return sortedData.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
    case SORT_TYPES.NAME_DESC:
      return sortedData.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'));
    case SORT_TYPES.COUNT_ASC:
      return sortedData.sort((a, b) => a.count - b.count);
    case SORT_TYPES.COUNT_DESC:
      return sortedData.sort((a, b) => b.count - a.count);
    case SORT_TYPES.DURATION_ASC:
      return sortedData.sort((a, b) => a.totalMinutes - b.totalMinutes);
    case SORT_TYPES.DURATION_DESC:
      return sortedData.sort((a, b) => b.totalMinutes - a.totalMinutes);
    case SORT_TYPES.DEFAULT:
    default:
      return sortedData; // 使用用户自定义顺序（从本地存储读取）
  }
};

/**
 * 保存排序配置到本地
 */
const saveSortConfig = async (sortType, customOrder = []) => {
  try {
    const config = {
      sortType,
      customOrder,
      updateTime: dayjs().valueOf()
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('保存排序配置失败:', e);
  }
};

/**
 * 从本地读取排序配置
 */
const getSortConfig = async () => {
  try {
    const configStr = await AsyncStorage.getItem(STORAGE_KEY);
    return configStr ? JSON.parse(configStr) : { sortType: SORT_TYPES.DEFAULT, customOrder: [] };
  } catch (e) {
    console.error('读取排序配置失败:', e);
    return { sortType: SORT_TYPES.DEFAULT, customOrder: [] };
  }
};

/**
 * 生成高对比度随机颜色
 */
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness < 128
    ? color
    : `#${(0xFFFFFF - parseInt(color.slice(1), 16)).toString(16).padStart(6, '0')}`;
};

/**
 * 补零格式化数字
 */
const padZero = (num) => String(num).padStart(2, '0');

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

// === 组件 ===
/**
 * 排序弹窗组件
 */
const SortModal = memo(({ visible, onClose, sortOptions, currentSort, onSelect }) => {
  const { theme } = useTheme();
  
  if (!visible) return null;
  
  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.innerCard }]}>
        {/* 弹窗标题 */}
        <View style={styles.modalHeader}>
          <ThemeText style={styles.modalTitle}>选择排序方式</ThemeText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemeText style={styles.closeText}>×</ThemeText>
          </TouchableOpacity>
        </View>
        
        {/* 排序选项列表 */}
        <FlatList
          data={sortOptions}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sortOptionItem,
                currentSort === item.value && { backgroundColor: theme.colors.primary + '20' }
              ]}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
            >
              <ThemeText style={styles.optionText}>{item.label}</ThemeText>
              {currentSort === item.value && (
                <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]} />
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.value}
          style={styles.optionsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
});
SortModal.displayName = 'SortModal';

/**
 * 排序栏组件
 */
const SortBar = memo(({ currentSort, onSortChange, sortOptions }) => {
  const { theme } = useTheme();
  // 新增弹窗显示状态
  const [modalVisible, setModalVisible] = useState(false);
  
  // 获取当前排序标签
  const getCurrentSortLabel = () => {
    const currentOption = sortOptions.find(option => option.value === currentSort);
    return currentOption?.label || '默认排序';
  };
  
  return (
    <>
      <View style={[
        styles.sortBarContainer,
        { backgroundColor: theme.colors.innerCard }
      ]}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setModalVisible(true)} // 改为显示弹窗
        >
          <Text style={styles.sortText}>
            {getCurrentSortLabel()}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 排序弹窗 */}
      <SortModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        sortOptions={sortOptions}
        currentSort={currentSort}
        onSelect={onSortChange}
      />
    </>
  );
}, (prev, next) => prev.currentSort === next.currentSort);
SortBar.displayName = 'SortBar';

/**
 * 标题头部组件
 */
const TitleHeader = memo(({ title, count, totalDuration }) => (
  <View style={styles.titleContainer}>
    <ThemeTitleText style={styles.title}>{title}</ThemeTitleText>
    <View style={{ width: '50%' }}>
      <ThemeText style={styles.count}>总次数: {count}</ThemeText>
      <ThemeSubTitleText style={styles.duration}>总时长: {totalDuration}</ThemeSubTitleText>
    </View>
  </View>
), (prev, next) => {
  return prev.title === next.title && prev.count === next.count && prev.totalDuration === next.totalDuration;
});
TitleHeader.displayName = 'TitleHeader';

/**
 * 星期头部组件
 */
const WeekHeader = memo(() => (
  <View style={styles.weekHeader}>
    {WEEK_DAYS.map((day, dIndex) => (
      <Text key={dIndex} style={styles.weekDayLabel}>{day}</Text>
    ))}
  </View>
));
WeekHeader.displayName = 'WeekHeader';

/**
 * 日期格子组件
 */
const DateCell = memo(({ dayNum, count, color }) => {
  const isHasData = count > 0;
  const cellStyles = [
    styles.statBox,
    styles.monthStatBox,
    {
      backgroundColor: isHasData ? color : 'transparent',
      borderColor: isHasData ? color : '#E8E8E8'
    }
  ];
  
  return (
    <View style={cellStyles}>
      <Text style={[
        styles.dateText,
        !isHasData && styles.emptyBoxText
      ]}>
        {dayNum}
      </Text>
      {isHasData && (
        <Text style={[
          styles.countText,
          !isHasData && styles.emptyBoxText
        ]}>
          {count}
        </Text>
      )}
    </View>
  );
}, (prev, next) => {
  return prev.dayNum === next.dayNum &&
    prev.count === next.count &&
    prev.color === next.color;
});
DateCell.displayName = 'DateCell';

/**
 * 空格子组件
 */
const EmptyCell = memo(() => (
  <View style={styles.emptyBox} />
));
EmptyCell.displayName = 'EmptyCell';

/**
 * 日历格子渲染函数
 */
const renderCalendarCell = ({ item, cardItem }) => {
  if (item.type === 'empty') {
    return <EmptyCell />;
  }
  
  const count = cardItem.dailyCounts[item.dateKey] || 0;
  return (
    <DateCell
      dayNum={item.dayNum}
      count={count}
      color={cardItem.color}
    />
  );
};

/**
 * 生成月份格子数据
 */
const generateMonthCells = (year, month) => {
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

// === 视图组件 ===
/**
 * 日视图组件
 */
const DayView = memo(({ items, theme }) => {
  // 渲染单个日视图卡片
  const renderDayCard = ({ item, index }) => (
    <View
      key={index}
      style={[styles.cardContainer, { backgroundColor: theme.colors.innerCard }]}
    >
      <TitleHeader
        title={item.title}
        count={item.count}
        totalDuration={item.totalDurationStr}
      />
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayBoxesContainer}
      >
        {item.timeRanges?.length > 0 ? (
          item.timeRanges.map((range, rangeIndex) => (
            <View key={rangeIndex} style={styles.timeRangeItem}>
              <View style={[styles.statBox, { backgroundColor: item.color, borderColor: item.color }]}>
                <Text style={styles.boxText}>{range.startTime}</Text>
              </View>
              
              <View style={styles.timeRangeConnector}>
                <View style={[styles.connectLine, { backgroundColor: item.color }]} />
                <Text style={styles.durationText}>{range.durationStr}</Text>
              </View>
              
              <View style={[styles.statBox, { backgroundColor: item.color, borderColor: item.color }]}>
                <Text style={styles.boxText}>{range.endTime}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.statBox, styles.emptyStatBox]}>
            <Text style={styles.emptyBoxText}>无数据</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
  
  // 增加 items 空值校验
  if (!items || items.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>暂无数据</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={items}
      renderItem={renderDayCard}
      keyExtractor={item => `day-card-${item.title}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      removeClippedSubviews={true} // 优化性能
      extraData={items}
    />
  );
}, (prev, next) => {
  return (prev.items?.length === next.items?.length) && (prev.viewType === next.viewType);
});
DayView.displayName = 'DayView';

/**
 * 周视图组件
 */
const WeekView = memo(({ items, theme }) => {
  // 渲染单个周视图卡片
  const renderWeekCard = ({ item, index }) => (
    <View
      key={index}
      style={[
        styles.cardContainer,
        { backgroundColor: theme.colors.innerCard }
      ]}
    >
      <TitleHeader
        title={item.title}
        count={item.count}
        totalDuration={item.totalDurationStr}
      />
      
      <WeekHeader />
      
      <View style={styles.weekDataRow}>
        {WEEK_DAYS.map((day, dIndex) => {
          const count = item.weeklyCounts[dIndex] || 0;
          const isHasData = count > 0;
          
          return (
            <View
              key={dIndex}
              style={[
                styles.statBox,
                {
                  backgroundColor: isHasData ? item.color : 'transparent',
                  borderColor: isHasData ? item.color : '#E8E8E8'
                }
              ]}
            >
              <Text style={[
                styles.boxText, !isHasData && styles.emptyBoxText
              ]}>
                {isHasData ? count : '-'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
  
  if (!items || items.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>暂无数据</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={items}
      renderItem={renderWeekCard}
      keyExtractor={item => `week-card-${item.title}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      removeClippedSubviews={true} // 优化性能
      extraData={items}
    />
  );
}, (prev, next) => {
  return (prev.items?.length === next.items?.length) && (prev.viewType === next.viewType);
});
WeekView.displayName = 'WeekView';

/**
 * 月视图组件
 */
const MonthView = memo(({ items, year, month, theme }) => {
  // 预生成日历格子数据
  const calendarCells = useMemo(() => generateMonthCells(year, month), [year, month]);
  
  // 渲染单个卡片
  const renderMonthCard = ({ item: cardItem }) => {
    return (
      <View style={[
        styles.cardContainer,
        { backgroundColor: theme.colors.innerCard }
      ]}>
        <TitleHeader
          title={cardItem.title}
          count={cardItem.count}
          totalDuration={cardItem.totalDurationStr}
        />
        
        <WeekHeader />
        
        <FlatList
          data={calendarCells}
          renderItem={(props) => renderCalendarCell({ ...props, cardItem })}
          keyExtractor={(item) => item.key}
          numColumns={7}
          scrollEnabled={false}
          style={styles.monthGrid}
          columnWrapperStyle={{
            justifyContent: 'space-between'
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={7}
          windowSize={3}
          getItemLayout={(data, index) => ({
            length: 36,
            offset: 36 * index,
            index,
          })}
          extraData={items}
        />
      </View>
    );
  };
  
  if (!items || items.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>暂无数据</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={items}
      renderItem={renderMonthCard}
      keyExtractor={item => `month-card-${item.title}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      removeClippedSubviews={true}
      extraData={items}
    />
  );
}, (prev, next) => {
  return prev.year === next.year &&
    prev.month === next.month &&
    (prev.items?.length === next.items?.length);
});
MonthView.displayName = 'MonthView';

/**
 * 年视图组件 - 核心修复
 */
const YearView = memo(({ items, year, theme }) => {
  // 预计算有数据的月份
  const validMonths = useMemo(() => {
    const monthSet = new Set();
    
    items.forEach(item => {
      Object.keys(item.monthlyCounts).forEach(monthKey => {
        if (monthKey.startsWith(year)) {
          const month = parseInt(monthKey.split('-')[1]);
          monthSet.add(month);
        }
      });
    });
    
    return Array.from(monthSet).sort((a, b) => a - b);
  }, [items, year]);
  
  // 预生成所有月份的格子数据
  const allMonthCells = useMemo(() => {
    const result = {};
    validMonths.forEach(month => {
      result[month] = generateMonthCells(year, month);
    });
    return result;
  }, [validMonths, year]);
  
  // 独立渲染单个月份的日历
  const renderSingleMonthCalendar = (month, cardItem) => {
    const monthCells = allMonthCells[month];
    if (!monthCells) return null;
    
    // 校验当前卡片项在该月份是否有数据
    const monthKey = `${year}-${padZero(month)}`;
    const hasMonthData = cardItem.monthlyCounts[monthKey] > 0;
    if (!hasMonthData) return null;
    
    return (
      <View key={`${cardItem.title}-${month}`} style={styles.yearMonthCard}>
        <Text style={styles.monthTitle}>{year}年{month}月</Text>
        <WeekHeader />
        
        <View style={styles.calendarGridContainer}>
          <FlatList
            data={monthCells}
            renderItem={(props) => renderCalendarCell({ ...props, cardItem })}
            keyExtractor={(item) => item.key}
            numColumns={7}
            scrollEnabled={false}
            style={styles.monthGrid}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              columnGap: 1
            }}
            removeClippedSubviews={true}
            maxToRenderPerBatch={28} // 一个月最多28-31天，设置足够大的批次
            windowSize={1}
            getItemLayout={(data, index) => ({
              length: 36,
              offset: 36 * index,
              index,
            })}
            extraData={items}
          />
        </View>
      </View>
    );
  };
  
  // 渲染年视图卡片
  const renderYearCard = ({ item: cardItem }) => {
    // 过滤当前卡片项有数据的月份
    const cardValidMonths = validMonths.filter(month => {
      const monthKey = `${year}-${padZero(month)}`;
      return cardItem.monthlyCounts[monthKey] > 0;
    });
    
    // 当前卡片无任何月份数据时显示空状态
    if (cardValidMonths.length === 0) {
      return (
        <View style={[styles.cardContainer, { backgroundColor: theme.colors.innerCard }]}>
          <TitleHeader
            title={cardItem.title}
            count={cardItem.count}
            totalDuration={cardItem.totalDurationStr}
          />
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>本年度暂无数据</Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={[styles.cardContainer, { backgroundColor: theme.colors.innerCard }]}>
        <TitleHeader
          title={cardItem.title}
          count={cardItem.count}
          totalDuration={cardItem.totalDurationStr}
        />
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearMonthsScrollContainer}
        >
          {cardValidMonths.map(month => renderSingleMonthCalendar(month, cardItem))}
        </ScrollView>
      </View>
    );
  };
  
  if (validMonths.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>暂无数据</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={items}
      renderItem={renderYearCard}
      keyExtractor={item => `year-card-${item.title}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
      removeClippedSubviews={true}
      extraData={items}
    />
  );
}, (prev, next) => {
  return prev.year === next.year &&
    prev.items.length === next.items.length;
});
YearView.displayName = 'YearView';

// === 主组件 ===
const CheckStat = memo(({ data = [], viewType = VIEW_TYPES.WEEK, dateRange }) => {
  const { theme } = useTheme();
  
  // 排序相关状态
  const [currentSort, setCurrentSort] = useState(SORT_TYPES.DEFAULT);
  const [customOrder, setCustomOrder] = useState([]);
  
  // 初始化读取本地排序配置
  useEffect(() => {
    const initSortConfig = async () => {
      const config = await getSortConfig();
      setCurrentSort(config.sortType || SORT_TYPES.DEFAULT);
      setCustomOrder(config.customOrder || []);
    };
    initSortConfig().then();
  }, []);
  
  // 首次加载保存默认顺序
  useEffect(() => {
    if (Array.isArray(viewData) && viewData.length > 0 && Array.isArray(customOrder) && customOrder.length === 0) {
      const initialOrder = viewData.map(item => item.title);
      setCustomOrder(initialOrder);
      saveSortConfig(SORT_TYPES.DEFAULT, initialOrder).catch(e => console.error('保存默认排序失败:', e));
    }
  }, [viewData, customOrder]);
  
  // 清理缓存（组件卸载时）
  useEffect(() => {
    return () => {
      calendarLayoutCache.clear();
    };
  }, []);
  
  // 排序变更处理
  const handleSortChange = async (sortType) => {
    setCurrentSort(sortType);
    // 保存排序配置到本地
    await saveSortConfig(sortType, customOrder);
  };
  
  
  // 解析当前年月
  const { currentYear, currentMonth } = useMemo(() => {
    const currentDate = dayjs(dateRange?.startDate);
    return {
      currentYear: dateRange?.startDate ? currentDate.year() : dayjs().year(),
      currentMonth: dateRange?.startDate ? currentDate.month() + 1 : dayjs().month() + 1
    };
  }, [dateRange]);
  
  // 处理视图数据
  const viewData = useMemo(() => {
    const eventMap = new Map();
    
    data.forEach(event => {
      const eventKey = event.title || getCategoryName(event.category);
      if (!eventKey || !event.start_datetime) return;
      
      if (!eventMap.has(eventKey)) {
        const baseData = {
          title: eventKey,
          color: event.color || getRandomColor(),
          count: 0,
          totalMinutes: 0,
          totalDurationStr: ''
        };
        
        switch (viewType) {
          case VIEW_TYPES.DAY:
            eventMap.set(eventKey, { ...baseData, timeRanges: [], date: '' });
            break;
          case VIEW_TYPES.WEEK:
            eventMap.set(eventKey, { ...baseData, weeklyCounts: new Array(7).fill(0) });
            break;
          case VIEW_TYPES.MONTH:
            eventMap.set(eventKey, { ...baseData, dailyCounts: {} });
            break;
          case VIEW_TYPES.YEAR:
            eventMap.set(eventKey, { ...baseData, dailyCounts: {}, monthlyCounts: {} });
            break;
          default:
            eventMap.set(eventKey, { ...baseData, weeklyCounts: new Array(7).fill(0) });
        }
      }
      
      const eventData = eventMap.get(eventKey);
      eventData.count++;
      
      const startDatetime = dayjs(event.start_datetime);
      const endDatetime = dayjs(event.end_datetime || event.start_datetime);
      const totalMinutes = getTotalMinutes(event.start_datetime, event.end_datetime || event.start_datetime);
      eventData.totalMinutes += totalMinutes;
      
      switch (viewType) {
        case VIEW_TYPES.DAY:
          eventData.timeRanges.push({
            startTime: startDatetime.format('HH:mm'),
            endTime: endDatetime.format('HH:mm'),
            durationStr: formatDurationByMinutes(totalMinutes),
            startDatetime: event.start_datetime,
            endDatetime: event.end_datetime || event.start_datetime
          });
          eventData.date = eventData.date || startDatetime.format('YYYY-MM-DD');
          break;
        
        case VIEW_TYPES.WEEK:
          const weekIndex = startDatetime.day() === 0 ? 6 : startDatetime.day() - 1;
          if (weekIndex >= 0 && weekIndex < 7) {
            eventData.weeklyCounts[weekIndex]++;
          }
          break;
        
        case VIEW_TYPES.MONTH:
          const dateStr = startDatetime.format('YYYY-MM-DD');
          eventData.dailyCounts[dateStr] = (eventData.dailyCounts[dateStr] || 0) + 1;
          break;
        
        case VIEW_TYPES.YEAR:
          const yearDateStr = startDatetime.format('YYYY-MM-DD');
          const monthStr = startDatetime.format('YYYY-MM');
          eventData.dailyCounts[yearDateStr] = (eventData.dailyCounts[yearDateStr] || 0) + 1;
          eventData.monthlyCounts[monthStr] = (eventData.monthlyCounts[monthStr] || 0) + 1;
          break;
      }
    });
    
    let result = Array.from(eventMap.values()).map(item => {
      item.totalDurationStr = formatDurationByMinutes(item.totalMinutes);
      
      if (viewType === VIEW_TYPES.DAY && item.timeRanges) {
        item.timeRanges.sort((a, b) =>
          dayjs(a.startDatetime).isBefore(dayjs(b.startDatetime)) ? -1 : 1
        );
        item.date = item.date || dayjs().format('YYYY-MM-DD');
      }
      
      return item;
    });
    
    // 1. 应用排序
    const sortedResult = sortViewData([...result], currentSort); // 解构生成新数组
    
    // 2. 如果是默认排序且有自定义顺序，再次生成新数组
    let finalResult = sortedResult;
    if (currentSort === SORT_TYPES.DEFAULT && customOrder?.length > 0) {
      finalResult = [...sortedResult].sort((a, b) => { // 再次解构
        const indexA = customOrder.indexOf(a.title);
        const indexB = customOrder.indexOf(b.title);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    
    // 3. 为每个项添加唯一 key（确保引用变化）
    return finalResult.map(item => ({
      ...item,
      _sortVersion: currentSort // 绑定当前排序类型，强制项引用变化
    }));
    
  }, [currentSort, customOrder, data, viewType]);
  
  // 排序选项配置
  const sortOptions = useMemo(() => [
    { label: '默认排序', value: SORT_TYPES.DEFAULT },
    { label: '名称升序', value: SORT_TYPES.NAME_ASC },
    { label: '名称降序', value: SORT_TYPES.NAME_DESC },
    { label: '次数升序', value: SORT_TYPES.COUNT_ASC },
    { label: '次数降序', value: SORT_TYPES.COUNT_DESC },
    { label: '时长升序', value: SORT_TYPES.DURATION_ASC },
    { label: '时长降序', value: SORT_TYPES.DURATION_DESC }
  ], []);
  
  // 渲染对应视图
  const renderView = useMemo(() => {
    switch (viewType) {
      case VIEW_TYPES.DAY:
        return <DayView items={viewData} theme={theme} />;
      case VIEW_TYPES.WEEK:
        return <WeekView items={viewData} theme={theme} />;
      case VIEW_TYPES.MONTH:
        return <MonthView items={viewData} year={currentYear} month={currentMonth} theme={theme} />;
      case VIEW_TYPES.YEAR:
        return <YearView items={viewData} year={currentYear} theme={theme} />;
      default:
        return <WeekView items={viewData} theme={theme} />;
    }
  }, [viewData, viewType, currentYear, currentMonth, theme]);
  
  // 空状态
  if (viewData.length === 0) {
    return (
      <EmptyContainer
        model="box"
        iconLib="MaterialIcons"
        iconName="insights"
        style={styles.emptyContainer}
      />
    );
  }
  
  return (
    <View style={[
      styles.rootContainer,
      { backgroundColor: theme.colors.background }
    ]}>
      <SortBar
        currentSort={currentSort}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
      />
      
      {renderView}
    </View>
  );
});
CheckStat.displayName = 'CheckStat';

// === 样式定义 ===
const styles = StyleSheet.create({
  // 排序弹窗样式
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContainer: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    padding: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  optionsList: {
    maxHeight: 300,
  },
  sortOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 14,
  },
  checkIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  
  // 排序栏
  sortBarContainer: {
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 5,
    borderRadius: 10,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4
  },
  
  rootContainer: {
    flex: 1,
    borderRadius: 5
  },
  
  scrollContainer: {
    flexGrow: 1,
    padding: 10,
    paddingTop: 0,
    paddingBottom: 0
  },
  
  cardContainer: {
    marginBottom: 8,
    padding: 10,
    paddingTop: 0,
    borderRadius: 10
  },
  
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '600'
  },
  count: {
    fontSize: 12,
    textAlign: 'right'
  },
  duration: {
    fontSize: 12,
    textAlign: 'right'
  },
  
  statBox: {
    minWidth: 36,
    height: 36,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyStatBox: {
    backgroundColor: 'transparent',
    borderColor: '#E8E8E8'
  },
  boxText: {
    marginHorizontal: 2,
    fontSize: 12,
    color: '#fff',
    fontWeight: '600'
  },
  emptyBoxText: {
    color: '#86909C'
  },
  
  dayBoxesContainer: {
    flexDirection: 'row',
    paddingVertical: 4
  },
  timeRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  timeRangeConnector: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 65,
    height: 36,
    marginHorizontal: 2
  },
  connectLine: {
    height: 4,
    width: '100%',
    borderRadius: 2
  },
  durationText: {
    position: 'absolute',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontSize: 8,
    color: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.2)'
  },
  
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 5
  },
  weekDayLabel: {
    width: 36,
    marginBottom: 2,
    fontSize: 12,
    color: '#86909C',
    textAlign: 'center'
  },
  weekDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  
  calendarGridContainer: {
    width: 36 * 7,
    alignItems: 'center',
  },
  monthGrid: {
    width: '100%',
    rowGap: 3
  },
  emptyBox: {
    width: 36,
    height: 36
  },
  monthStatBox: {
    position: 'relative'
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF'
  },
  countText: {
    position: 'absolute',
    top: 0,
    right: 0,
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF'
  },
  
  yearMonthsScrollContainer: {
    flexDirection: 'row',
    gap: 12,
    minHeight: 36 * 6 + 20,
    paddingVertical: 8,
    paddingHorizontal: 2
  },
  yearMonthCard: {
    width: 36 * 7 + 16,
    minHeight: 36 * 6 + 30,
    padding: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    color: '#333'
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    width: '100%'
  },
  noDataText: {
    fontSize: 12,
    color: '#86909C'
  },
  
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  }
});

export default CheckStat;