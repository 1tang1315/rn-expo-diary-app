import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import TitleHeader from '../components/TitleHeader';
import WeekHeader from '../components/calendar/WeekHeader';
import {
  generateMonthCells, renderCalendarCell
} from "@/components/habit-tracking/components/calendar/CalendarLayout";
import { useTheme } from "@/context/ThemeContext";

const MonthView = ({ items, year, month }) => {
  const { theme } = useTheme();
  
  // 预生成日历格子数据
  const calendarCells = useMemo(() => generateMonthCells(year, month), [year, month]);
  
  // 渲染单个卡片
  const renderMonthCard = ({ item: cardItem }) => {
    const cellSize = 38; // 月视图使用标准大小
    
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
        
        <WeekHeader size={cellSize} />
        
        <FlatList
          style={styles.monthGrid}
          data={calendarCells}
          renderItem={(props) => renderCalendarCell({ ...props, cardItem, size: cellSize })}
          keyExtractor={(item) => item.key}
          numColumns={7}
          scrollEnabled={false}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            columnGap: 4
          }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={7}
          windowSize={3}
          getItemLayout={(data, index) => ({
            length: cellSize,
            offset: cellSize * index,
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
};

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
  
  monthGrid: {
    width: '100%',
    rowGap: 4
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

export default MonthView;
