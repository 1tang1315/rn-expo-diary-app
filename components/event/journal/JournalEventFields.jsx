import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  DAILY_RECORD_TYPES,
  DAILY_RECORD_TYPE_OPTIONS,
  JOURNAL_PERIOD_OPTIONS,
} from '@/constants/journalConstants';
import {
  normalizeJournalExtras,
  suggestIconForJournalExtras,
  suggestTimeKindForJournalExtras,
} from '@/utils/journalExtrasUtils';
import ThemeSubTitleText from '@/components/theme/ThemeSubTitleText';
import ThemeButton from '@/components/theme/ThemeButton';

export default function JournalEventFields({
  extras,
  onExtrasChange,
  onSuggestTimeKind,
  onSuggestIcon,
}) {
  const journalExtras = normalizeJournalExtras(extras);

  const applyExtras = (patch) => {
    const next = normalizeJournalExtras({ ...journalExtras, ...patch });
    onExtrasChange(next);
    onSuggestTimeKind?.(suggestTimeKindForJournalExtras(next));
    onSuggestIcon?.(suggestIconForJournalExtras(next));
  };

  const isJournal = journalExtras.recordType === DAILY_RECORD_TYPES.JOURNAL;

  return (
    <View style={styles.wrap}>
      <ThemeSubTitleText style={styles.label}>记录类型</ThemeSubTitleText>
      <View style={styles.chipRow}>
        {DAILY_RECORD_TYPE_OPTIONS.map((opt) => (
          <ThemeButton
            key={opt.id}
            title={`${opt.emoji} ${opt.label}`}
            active={journalExtras.recordType === opt.id}
            onPress={() => applyExtras({ recordType: opt.id })}
            style={styles.chip}
          />
        ))}
      </View>

      {isJournal ? (
        <>
          <ThemeSubTitleText style={styles.label}>时段（可选）</ThemeSubTitleText>
          <View style={styles.chipRow}>
            {JOURNAL_PERIOD_OPTIONS.map((opt) => (
              <ThemeButton
                key={opt.id}
                title={opt.label}
                active={journalExtras.journalPeriod === opt.id}
                onPress={() => applyExtras({ journalPeriod: opt.id })}
                style={styles.chip}
              />
            ))}
          </View>
          <ThemeSubTitleText style={styles.hint}>
            随手记会自动记录当前时刻，在下方描述框写内容即可。
          </ThemeSubTitleText>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 10, paddingVertical: 6 },
  hint: { fontSize: 12, marginBottom: 8, opacity: 0.75 },
});
