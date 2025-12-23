import React, { memo, useMemo } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import WeekHeader from "@/components/habit-tracking/components/calendar/WeekHeader";
import TitleHeader from "@/components/habit-tracking/components/TitleHeader";
import {
  generateMonthCells, padZero, renderCalendarCell
} from "@/components/habit-tracking/components/calendar/CalendarLayout";
import { useTheme } from "@/context/ThemeContext";

const YearView = memo(({ items, year }) => {
  const { theme } = useTheme();
  
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
    const cellSize = 24; // 年视图使用更小的格子大小
    const monthCells = allMonthCells[month];
    if (!monthCells) return null;
    
    // 校验当前卡片项在该月份是否有数据
    const monthKey = `${year}-${padZero(month)}`;
    const hasMonthData = cardItem.monthlyCounts[monthKey] > 0;
    if (!hasMonthData) return null;
    
    // 基于cellSize动态计算月份卡片的宽度和高度
    const padding = 10;
    const monthCardWidth = cellSize * 7 + padding * 2;
    const monthCardHeight = (cellSize * 6) + 30 + padding * 2; // 6行日历格子 + 标题高度 + 内边距
    
    return (
      <View
        key={`${cardItem.title}-${month}`}
        style={[styles.yearMonthCard, {
          width: monthCardWidth,
          minHeight: monthCardHeight
        }]}
      >
        <Text style={styles.monthTitle}>{year}年{month}月</Text>
        <WeekHeader size={cellSize} />
        
        <View style={[styles.calendarGridContainer, { width: cellSize * 7 + 10 }]}>
          <FlatList
            data={monthCells}
            renderItem={(props) => renderCalendarCell({ ...props, cardItem, size: cellSize })}  
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
              length: cellSize,
              offset: cellSize * index,
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
    
    const cellSize = 24; // 年视图使用更小的格子大小
    // 基于cellSize动态计算滚动容器的最小高度
    const scrollContainerMinHeight = (cellSize * 6) + 50; // 6行日历格子 + 足够的额外空间
    
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
          contentContainerStyle={[styles.yearMonthsScrollContainer, {
            minHeight: scrollContainerMinHeight
          }]}
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

export default YearView;

const styles = StyleSheet.create({
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
    
    calendarGridContainer: {
      alignItems: 'center',
    },
  monthGrid: {
    width: '100%',
    rowGap: 2
  },
  
  yearMonthsScrollContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 2
  },
  yearMonthCard: {
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
  }
});