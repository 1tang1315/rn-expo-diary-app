import Platform, { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

const DateSelector = ({
  onDataChange,
  hasRadius = true
}) => {
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
      onDataChange(startDate, startDate);
    } else {
      onDataChange(startDate, endDate);
    }
  }, [dateType, startDate, endDate, onDataChange]);
  
  return (
    <View style={[
      styles.sectionCard,
      { borderRadius: hasRadius ? 8 : 0 }
    ]}>
      <Text style={styles.sectionTitle}>选择日期范围</Text>
      <View style={styles.dateTypeSwitcher}>
        <TouchableOpacity
          style={[styles.dateTypeBtn, dateType === 'single' && styles.dateTypeBtnActive]}
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
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateTypeBtn, dateType === 'range' && styles.dateTypeBtnActive]}
          onPress={() => setDateType('range')}
        >
          <Text style={[styles.dateTypeText, dateType === 'range' && styles.dateTypeTextActive]}>日期范围</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.datePickerContainer}>
        {dateType === 'single' ? (
          <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('start')}>
            <Ionicons name="calendar-outline" size={18} color="#666" style={styles.dateIcon} />
            <Text style={styles.dateText}>{dayjs(startDate).format('YYYY-MM-DD')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('start')}>
              <Ionicons name="calendar-outline" size={18} color="#666" style={styles.dateIcon} />
              <Text style={styles.dateText}>开始：{startDate.format('YYYY-MM-DD')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('end')}>
              <Ionicons name="calendar-outline" size={18} color="#666" style={styles.dateIcon} />
              <Text style={styles.dateText}>结束：{endDate.format('YYYY-MM-DD')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={datePickerTarget === 'start' ? startDate.toDate() : endDate.toDate()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // 禁止选择未来日期
        />
      )}
    </View>
  );
};

export default DateSelector;

const styles = StyleSheet.create({
  sectionCard: {
    marginTop: 1,
    marginBottom: 10,
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  dateTypeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTypeBtnActive: {
    backgroundColor: '#4A6CF7',
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
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
});