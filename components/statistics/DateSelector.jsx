import Platform, { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import ThemeCard from "@/components/Theme/ThemeCard";
import ThemeTitleText from "@/components/Theme/ThemeTitleText";
import { useTheme } from "@/context/ThemeContext";
import ThemeTouchableOpacity from "@/components/Theme/ThemeTouchableOpacity";

const DateSelector = ({ onDataChange }) => {
  const { theme } = useTheme();
  
  const [dateType, setDateType] = useState('single');
  const [startDate, setStartDate] = useState(dayjs().startOf('day'));
  const [endDate, setEndDate] = useState(dayjs().startOf('day'));
  const [lastSingleClickTime, setLastSingleClickTime] = useState(0);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('single');
  const handleShowDatePicker = (target) => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };
  
  const handleDateChange = (event, newDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if(!newDate) return;
    
    // 转换为dayjs对象处理
    const dayjsDate = dayjs(newDate);
    
    if(datePickerTarget === 'start') {
      setStartDate(dayjsDate);
    } else if(datePickerTarget === 'end') {
      setEndDate(dayjsDate);
    }
  };
  
  useEffect(() => {
    if(dateType === 'single') {
      onDataChange(dayjs(startDate).format('YYYY-MM-DD'), dayjs(startDate).format('YYYY-MM-DD'));
    } else {
      onDataChange(dayjs(startDate).format('YYYY-MM-DD'), dayjs(endDate).format('YYYY-MM-DD'));
    }
  }, [dateType, startDate, endDate, onDataChange]);
  
  return (
    <ThemeCard>
      <ThemeTitleText style={styles.sectionTitle}>选择日期范围</ThemeTitleText>
      
      <View style={styles.dateTypeSwitcher}>
        <ThemeTouchableOpacity
          style={[styles.dateTypeBtn, dateType === 'single' && ({backgroundColor: theme.colors.interactive})]}
          onPress={() => {
            const currentTime = new Date().getTime();
            if(currentTime - lastSingleClickTime < 300) {
              // 双击操作：重置为当天（300ms内连续点击）
              setStartDate(dayjs(new Date()));
            }
            setDateType('single');
            setLastSingleClickTime(currentTime);
          }}
        >
          <View style={styles.dateTypeTextContainer}>
            <Text style={[styles.dateTypeText, dateType === 'single' && styles.dateTypeTextActive]}>单个日期</Text>
            <Text
              style={[styles.dateTypeHint, dateType === 'single' && styles.dateTypeHintActive]}>(快速双击回到今日)</Text>
          </View>
        </ThemeTouchableOpacity>
        <TouchableOpacity
          style={[styles.dateTypeBtn, dateType === 'range' && ({backgroundColor: theme.colors.interactive})]}
          onPress={() => setDateType('range')}
        >
          <Text style={[styles.dateTypeText, dateType === 'range' && styles.dateTypeTextActive]}>日期范围</Text>
        </TouchableOpacity>
      </View>
      
      <ThemeCard padding={0} style={styles.datePickerContainer}>
        {dateType === 'single' ? (
          <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('start')}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.interactive} style={styles.dateIcon} />
            <Text style={[styles.dateText, [{color: theme.colors.interactive}]]}>{dayjs(startDate).format('YYYY-MM-DD')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('start')}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.interactive} style={styles.dateIcon} />
              <Text style={[styles.dateText, [{color: theme.colors.interactive}]]}>开始: {dayjs(startDate).format('YYYY-MM-DD')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('end')}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.interactive} style={styles.dateIcon} />
              <Text style={[styles.dateText, [{color: theme.colors.interactive}]]}>结束: {dayjs(endDate).format('YYYY-MM-DD')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ThemeCard>
      
      {showDatePicker && (
        <DateTimePicker
          value={datePickerTarget === 'start' ? startDate.toDate() : endDate.toDate()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // 禁止选择未来日期
        />
      )}
    </ThemeCard>
  );
};

export default DateSelector;

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  dateTypeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTypeTextContainer: {
    alignItems: 'center',
  },
  dateTypeHint: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  dateTypeHintActive: {
    color: '#e0e0e0',
  },
  dateTypeText: {
    fontSize: 14,
    color: '#666',
  },
  dateTypeTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  datePickerContainer: {
    gap: 8,
  },
  dateSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 15
  },
});