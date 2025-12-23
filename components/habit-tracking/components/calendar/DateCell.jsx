import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

const styles = StyleSheet.create({
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
  }
});

export default DateCell;
