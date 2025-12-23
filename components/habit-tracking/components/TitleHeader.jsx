import React from 'react';
import { View, StyleSheet } from 'react-native';
import ThemeTitleText from "@/components/theme/ThemeTitleText";
import ThemeText from "@/components/theme/ThemeText";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";

const TitleHeader = ({ title, count, totalDuration }) => (
  <View style={styles.titleContainer}>
    <ThemeTitleText style={styles.title}>{title}</ThemeTitleText>
    <View style={{ width: '50%' }}>
      <ThemeText style={styles.count}>总次数: {count}</ThemeText>
      <ThemeSubTitleText style={styles.duration}>总时长: {totalDuration}</ThemeSubTitleText>
    </View>
  </View>
);

export default TitleHeader;

const styles = StyleSheet.create({
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
    color: '#86909C',
    textAlign: 'right'
  }
});
