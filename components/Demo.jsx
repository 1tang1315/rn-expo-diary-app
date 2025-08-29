import React, { useState } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function Demo() {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('date'); // 'date' or 'time'
  
  const onChange = (event, selectedDate) => {
    // Android 点击取消时 selectedDate 为 undefined
    const current = selectedDate || date;
    setShow(Platform.OS === 'ios'); // iOS 保持展示，Android 选择后自动隐藏
    setDate(current);
  };
  
  const showMode = (m) => {
    setMode(m);
    setShow(true);
  };
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text>选择的日期时间：</Text>
      <Text style={{ marginVertical: 8 }}>{date.toLocaleString()}</Text>
      
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="选择日期" onPress={() => showMode('date')} />
        <Button title="选择时间" onPress={() => showMode('time')} />
        <Button title="选择日期和时间" onPress={() => showMode('datetime')} />
      </View>
      
      {show && (
        <DateTimePicker
          value={date}
          mode={mode}
          display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
          onChange={onChange}
          maximumDate={new Date(2100, 12, 31)}
          minimumDate={new Date(2000, 0, 1)}
        />
      )}
    </View>
  );
};
