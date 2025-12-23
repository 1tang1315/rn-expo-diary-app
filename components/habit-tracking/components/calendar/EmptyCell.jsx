import React from 'react';
import { View, StyleSheet } from 'react-native';

const EmptyCell = () => <View style={styles.empty} />;

const styles = StyleSheet.create({
  empty: {
    width: 36,
    height: 36,
  },
});

export default EmptyCell;
