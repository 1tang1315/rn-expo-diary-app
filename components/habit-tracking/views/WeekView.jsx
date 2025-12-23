import React, { memo } from 'react';
import {
  FlatList, View, StyleSheet
} from 'react-native';
import dayjs from "dayjs";
import TitleHeader from '../components/TitleHeader';
import WeekHeader from '../components/calendar/WeekHeader';
import ThemeCard from "@/components/theme/ThemeCard";
import DateCell from "@/components/habit-tracking/components/calendar/DateCell";
import EmptyCell from "@/components/habit-tracking/components/calendar/EmptyCell";

const WeekView = memo(({ items, weekStartDate }) => {
  const generateWeekCells = (weeklyCounts) => {
    const cells = [];
    const firstDayOfWeek = weekStartDate || dayjs().startOf('week');
    
    for (let i = 0; i < 7; i++) {
      const currentDay = firstDayOfWeek.add(i, 'day');
      const dayNum = currentDay.date();
      const dateKey = currentDay.format('YYYY-MM-DD');
      const count = weeklyCounts?.[i] || 0;
      
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
      renderItem={({ item }) => (
        <ThemeCard innerCard={true}>
          <TitleHeader
            title={item.title}
            count={item.count}
            totalDuration={item.totalDurationStr}
          />
          
          <WeekHeader />
          
          <View style={styles.row}>
            {generateWeekCells(item.weeklyCounts).map((cell) => {
              if (cell.type === 'empty') {
                return <EmptyCell key={cell.key} />;
              }
              return (
                <DateCell
                  key={cell.key}
                  dayNum={cell.dayNum}
                  count={cell.count}
                  color={item.color}
                />
              );
            })}
          </View>
        </ThemeCard>
      )}
    />
  );
}, (prev, next) => {
    return prev.weekStartDate === next.weekStartDate &&
      prev.items.length === next.items.length;
});
WeekView.displayName = 'WeekView';

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