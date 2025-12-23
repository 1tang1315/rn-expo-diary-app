import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DAYS = ['一', '二', '三', '四', '五', '六', '日'];

const WeekHeader = () => (
  <View style={styles.row}>
    {DAYS.map(d => (
      <Text key={d} style={styles.text}>{d}</Text>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  text: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    color: '#86909C',
  },
});

export default WeekHeader;