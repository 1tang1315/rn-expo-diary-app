import { useTheme } from "@/context/ThemeContext";
import RNDateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Platform,
  StyleSheet,
  Text, TouchableOpacity,
  View
} from 'react-native';

// 扩展 dayjs 能力
dayjs.extend(weekOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const TimeRangePicker = ({
  onRangeChange
}) => {
  const { theme } = useTheme();
  
  const [activeType, setActiveType] = useState('day');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const isPickerShowing = useRef(false);
  
  // 计算当前选中的时间范围（开始/结束时间）
  const currentRange = useMemo(() => {
    let start, end;
    
    switch(activeType) {
      case 'day':
        start = currentDate;
        end = currentDate;
        break;
      case 'week':
        start = currentDate.startOf('week');
        end = currentDate.endOf('week');
        break;
      case 'month':
        start = currentDate.startOf('month');
        end = currentDate.endOf('month');
        break;
      case 'year':
        start = currentDate.startOf('year');
        end = currentDate.endOf('year');
        break;
      default:
        start = currentDate;
        end = currentDate;
    }
    
    return {
      start,
      end,
      startText: start.format('YYYY年MM月DD日'),
      endText: end.format('YYYY年MM月DD日')
    };
  }, [activeType, currentDate]);
  
  // 时间范围变化时触发外部回调
  useEffect(() => {
    if(onRangeChange) {
      onRangeChange({
        type: activeType,
        startDate: currentRange.start.toDate(),
        endDate: currentRange.end.toDate(),
        startText: currentRange.startText,
        endText: currentRange.endText,
        startDayjs: currentRange.start,
        endDayjs: currentRange.end
      });
    }
  }, [activeType, currentRange, onRangeChange]);
  
  // 上一个时间周期
  const handlePrev = useCallback(() => {
    let newDate;
    switch(activeType) {
      case 'day':
        newDate = currentDate.subtract(1, 'day');
        break;
      case 'week':
        newDate = currentDate.subtract(1, 'week');
        break;
      case 'month':
        newDate = currentDate.subtract(1, 'month');
        break;
      case 'year':
        newDate = currentDate.subtract(1, 'year');
        break;
      default:
        newDate = currentDate;
    }
    setCurrentDate(newDate);
  }, [activeType, currentDate]);
  
  // 下一个时间周期
  const handleNext = useCallback(() => {
    let newDate;
    switch(activeType) {
      case 'day':
        newDate = currentDate.add(1, 'day');
        break;
      case 'week':
        newDate = currentDate.add(1, 'week');
        break;
      case 'month':
        newDate = currentDate.add(1, 'month');
        break;
      case 'year':
        newDate = currentDate.add(1, 'year');
        break;
      default:
        newDate = currentDate;
    }
    setCurrentDate(newDate);
  }, [activeType, currentDate]);
  
  // 打开日期选择器
  const openPicker = useCallback(() => {
    if(isPickerShowing.current) return;
    
    isPickerShowing.current = true;
    setShowDatePicker(true);
  }, []);
  
  // 日期选择器值变化处理 - 统一忽略不需要的日期部分
  const handleDateChange = useCallback((_event, selectedDate) => {
    if(!selectedDate) {
      setShowDatePicker(false);
      isPickerShowing.current = false;
      return;
    }
    
    const selectedDayjs = dayjs(selectedDate);
    let newDate;
    
    // 根据不同类型处理日期选择，忽略不需要的部分
    switch(activeType) {
      case 'year':
        // 只保留年份，忽略月/日，设置为该年的第一天
        newDate = selectedDayjs.startOf('year');
        break;
      case 'month':
        // 只保留年/月，忽略日，设置为该月的第一天
        newDate = selectedDayjs.startOf('month');
        break;
      case 'week':
        // 保留选择的日期（周范围会自动计算）
        newDate = selectedDayjs;
        break;
      case 'day':
        // 保留完整日期
        newDate = selectedDayjs;
        break;
      default:
        newDate = selectedDayjs;
    }
    
    setCurrentDate(newDate);
    setShowDatePicker(false);
    isPickerShowing.current = false;
  }, [activeType]);
  
  // 获取日期选择器配置
  const getPickerConfig = useMemo(() => {
    return {
      value: currentDate.toDate(),
      mode: 'date',
      display: Platform.OS === 'ios' ? 'inline' : 'spinner',
      minimumDate: new Date(1900, 0, 1), // 最小日期
      maximumDate: new Date(2100, 11, 31), // 最大日期
    };
  }, [currentDate]);
  
  // 选择器关闭时重置状态
  useEffect(() => {
    if(!showDatePicker) {
      isPickerShowing.current = false;
    }
  }, [showDatePicker]);
  
  // 固定显示 tab 栏
  const tabList = [
    {
      key: 'day',
      label: '日'
    },
    {
      key: 'week',
      label: '周'
    },
    {
      key: 'month',
      label: '月'
    },
    {
      key: 'year',
      label: '年'
    },
  ];
  
  // 渲染周显示的文本
  const renderWeekText = useCallback(() => {
    const { start, end } = currentRange;
    
    // 如果跨年
    if(start.year() !== end.year()) {
      return `${start.format('YYYY年MM月DD日')} - ${end.format('YYYY年MM月DD日')}`;
    }
    // 如果跨月
    else if(start.month() !== end.month()) {
      return `${start.format('YYYY年MM月DD日')} - ${end.format('MM月DD日')}`;
    }
    // 同月
    else {
      return `${start.format('YYYY年MM月DD日')} - ${end.format('DD日')}`;
    }
  }, [currentRange]);
  
  // 渲染显示的文本
  const renderDisplayText = useCallback(() => {
    switch(activeType) {
      case 'day':
        return currentDate.format('YYYY年MM月DD日');
      case 'week':
        return renderWeekText();
      case 'month':
        return currentDate.format('YYYY年MM月');
      case 'year':
        return currentDate.format('YYYY年');
      default:
        return currentDate.format('YYYY年MM月DD日');
    }
  }, [activeType, currentDate, renderWeekText]);
  
  return (
    <View style={styles.container}>
      {/* 固定显示 tab 栏 */}
      <View style={styles.tabBar}>
        {tabList.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.tabItem,
              activeType === item.key && {
                borderBottomWidth: 2,
                borderColor: theme.colors.interactive
              }
            ]}
            onPress={() => {
              setActiveType(item.key);
            }}
          >
            <Text style={[
              styles.tabText,
              activeType === item.key && {
                color: theme.colors.interactive,
                fontWeight: '600'
              }
            ]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 时间范围操作栏 */}
      <View style={styles.rangeBar}>
        <TouchableOpacity style={styles.arrowBtn} onPress={handlePrev}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.interactive
          }}>{'<'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.rangeTextContainer} onPress={openPicker}>
          <Text style={{
            fontSize: 14,
            color: theme.colors.interactive,
            textAlign: 'center'
          }}>{renderDisplayText()}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.arrowBtn} onPress={handleNext}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.colors.interactive
          }}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* 日期选择器 - 统一使用date模式 */}
      {showDatePicker && (
        <RNDateTimePicker
          {...getPickerConfig}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: -10,
    paddingVertical: 5
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 5
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10
  },
  tabText: {
    fontSize: 16,
    color: '#666'
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  rangeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5
  },
  arrowBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 25,
    height: 25,
    borderRadius: 50
  },
  rangeTextContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  rangeText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center'
  }
});

export default TimeRangePicker;