import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DateCell = memo(({ dayNum, count, color, size = 38 }) => {
  const isHasData = count > 0;
  const cellStyles = [
    styles.statBox,
    styles.monthStatBox,
    {
      width: size,
      height: size,
      backgroundColor: isHasData ? color : 'transparent',
      borderColor: isHasData ? color : '#E8E8E8'
    }
  ];
  
  // 根据size动态计算字体大小
  const dateFontSize = size * 0.35; // 约占格子大小的35%
  const countFontSize = size * 0.25; // 约占格子大小的25%

  return (
    <View style={cellStyles}>
      <Text style={[
        styles.dateText,
        !isHasData && styles.emptyBoxText,
        { fontSize: dateFontSize }
      ]}>
        {dayNum}
      </Text>
      {isHasData && (
        <Text style={[
          styles.countText,
          !isHasData && styles.emptyBoxText,
          { fontSize: countFontSize }
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
    margin: 2,
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
    fontWeight: '500',
    color: '#FFF'
  },
  countText: {
    position: 'absolute',
    top: 0,
    right: 2,
    fontWeight: '600',
    color: '#FFF'
  }
});

export default DateCell;
