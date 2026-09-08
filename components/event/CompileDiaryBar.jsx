import React, { useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import ThemeButton from '@/components/theme/ThemeButton';
import { compileDailyDiary } from '@/utils/dailyDiaryCompileUtils';

export default function CompileDiaryBar({ selectedDate }) {
  const [loading, setLoading] = useState(false);
  const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');

  const handleCompile = async () => {
    setLoading(true);
    try {
      const result = await compileDailyDiary(dateStr);
      Alert.alert(result.ok ? '完成' : '提示', result.message);
    } catch (e) {
      Alert.alert('失败', e?.message || '整理日记时出错');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.bar}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <ThemeButton
          title={`整理 ${dateStr} 日记`}
          onPress={handleCompile}
          style={styles.btn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
