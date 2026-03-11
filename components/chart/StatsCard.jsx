import React from 'react';
import { StyleSheet, FlatList } from 'react-native';
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import ThemeText from "@/components/theme/ThemeText";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";

const StatsCard = ({ stats = [], onStatPress }) => {
  const renderStats = stats.length > 0
    ? stats
    : [
        { label: '事件总数', value: 0, unit: '个' },
        { label: '记录次数', value: 0, unit: '次' },
        { label: '总时长', value: 0, unit: '小时' },
        { label: '记录天数', value: 0, unit: '天' },
      ];

  const renderItem = ({ item, index }) => (
    <ThemeTouchableOpacity 
      style={styles.statItem}
      onPress={() => onStatPress && onStatPress(item, index)}
    >
      <ThemeText style={styles.statValue}>
        {item.value}
        {item.unit && <ThemeText style={styles.statUnit}>{item.unit}</ThemeText>}
      </ThemeText>
      <ThemeSubTitleText style={styles.statLabel}>{item.label}</ThemeSubTitleText>
    </ThemeTouchableOpacity>
  );
  
  return (
    <FlatList
      data={renderStats}
      renderItem={renderItem}
      keyExtractor={(_, index) => index.toString()}
      numColumns={2}
      columnWrapperStyle={styles.row}
      scrollEnabled={false}
      contentContainerStyle={styles.cardContainer}
    />
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingBottom: 10
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '49%',
    height: 70
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '400',
    marginLeft: 4
  },
  statLabel: {
    fontSize: 12
  },
});

export default StatsCard;