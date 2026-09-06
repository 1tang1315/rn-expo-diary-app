import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EVENT_TIME_KIND } from '@/constants/eventTimeKindPolicy';
import ThemeSubTitleText from '@/components/theme/ThemeSubTitleText';
import ThemeButton from '@/components/theme/ThemeButton';
import { formatDatetime } from '@/utils/formatTimeUtils';
import { useTheme } from '@/context/ThemeContext';

export default function EventTimeFields({
  timeKind,
  allowSwitch,
  startDatetime,
  endDatetime,
  onChangeTimeKind,
  onResetToCurrentTime,
  onShowDatetimePicker,
}) {
  const { theme } = useTheme();
  const isInstant = timeKind === EVENT_TIME_KIND.INSTANT;

  return (
    <View>
      {allowSwitch ? (
        <View style={styles.formGroup}>
          <ThemeSubTitleText style={styles.formLabel}>时间类型</ThemeSubTitleText>
          <View style={styles.switchRow}>
            <ThemeButton
              title="时刻"
              active={isInstant}
              onPress={() => onChangeTimeKind(EVENT_TIME_KIND.INSTANT)}
            />
            <ThemeButton
              title="时间段"
              active={!isInstant}
              onPress={() => onChangeTimeKind(EVENT_TIME_KIND.INTERVAL)}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.formGroup}>
        <ThemeSubTitleText style={styles.formLabel}>
          {isInstant ? '时间:' : '开始时间:'}
          <Text style={[styles.datetimeDisplayText, { color: theme.colors.interactive }]}>
            {formatDatetime(startDatetime)}
          </Text>
        </ThemeSubTitleText>
        <View style={styles.datetimeButtonGroup}>
          <ThemeButton title="当前时间" onPress={() => onResetToCurrentTime('start')} />
          <ThemeButton title="选择日期" onPress={() => onShowDatetimePicker('start', 'date')} />
          <ThemeButton title="选择时间" onPress={() => onShowDatetimePicker('start', 'time')} />
        </View>
      </View>

      {!isInstant ? (
        <View style={styles.formGroup}>
          <ThemeSubTitleText style={styles.formLabel}>
            结束时间:
            <Text style={[styles.datetimeDisplayText, { color: theme.colors.interactive }]}>
              {formatDatetime(endDatetime)}
            </Text>
          </ThemeSubTitleText>
          <View style={styles.datetimeButtonGroup}>
            <ThemeButton title="当前时间" onPress={() => onResetToCurrentTime('end')} />
            <ThemeButton title="选择日期" onPress={() => onShowDatetimePicker('end', 'date')} />
            <ThemeButton title="选择时间" onPress={() => onShowDatetimePicker('end', 'time')} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  formGroup: {
    marginBottom: 10,
  },
  formLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  datetimeDisplayText: {
    marginLeft: 5,
    fontSize: 16,
  },
  datetimeButtonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
