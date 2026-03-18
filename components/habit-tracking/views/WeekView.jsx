import React from 'react';
import {
  FlatList, StyleSheet, View
} from 'react-native';
import TitleHeader from '../components/TitleHeader';
import WeekHeader from '../components/calendar/WeekHeader';
import DateCell from "@/components/habit-tracking/components/calendar/DateCell";
import ThemeCard from "@/components/theme/ThemeCard";
import dayjs from "dayjs";

const WeekView = ({ items, weekStartDate }) => {
  const generateWeekCells = (dailyData) => {
    const cells = [];
    const firstDayOfWeek = weekStartDate || dayjs().startOf('week');
    
    for (let i = 0; i < 7; i++) {
      const currentDay = firstDayOfWeek.add(i, 'day');
      const dayNum = currentDay.date();
      const dateKey = currentDay.format('YYYY-MM-DD');
      const count = dailyData?.[dateKey] || 0;
      
      cells.push({
        type: 'date',
        key: `week-cell-${dateKey}`,
        dayNum,
        dateKey,
        count
      });
    }
    return cells;
  };
  
  return (
    <FlatList
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      data={items}
      keyExtractor={i => i.title}
      renderItem={({ item }) => {
        const cellSize = 38; // 周视图使用标准大小
        
        return (
          <ThemeCard innerCard={true}>
            <TitleHeader
              title={item.title}
              count={item.count}
              totalDuration={item.totalDurationStr}
            />
          
            <WeekHeader size={cellSize} />
          
            <View style={styles.row}>
              {generateWeekCells(item.dailyData).map((cell) => {
                if (cell.type === 'empty') {
                  return <View key={cell.key} style={{ width: cellSize, height: cellSize }} />;
                }
                return (
                  <DateCell
                    key={cell.key}
                    dayNum={cell.dayNum}
                    count={cell.count}
                    color={item.color}
                    size={cellSize}
                  />
                );
              })}
            </View>
          </ThemeCard>
        )
      }}
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4
  },
});

export default WeekView;