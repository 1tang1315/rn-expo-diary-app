import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  SPORTS_RECORD_TYPES,
  SPORTS_RECORD_TYPE_OPTIONS,
  ROUTINE_TEMPLATES,
} from '@/constants/sportsConstants';
import {
  normalizeSportsExtras,
  suggestIconForSportsExtras,
  suggestTimeKindForSportsExtras,
} from '@/utils/sportsExtrasUtils';
import ThemeSubTitleText from '@/components/theme/ThemeSubTitleText';
import ThemeButton from '@/components/theme/ThemeButton';
import ThemeTextInput from '@/components/theme/ThemeTextInput';

export default function SportsEventFields({
  extras,
  onExtrasChange,
  onSuggestTimeKind,
  onSuggestIcon,
}) {
  const sportsExtras = normalizeSportsExtras(extras);

  const applyExtras = (patch) => {
    const next = normalizeSportsExtras({ ...sportsExtras, ...patch });
    if (patch.routineId) {
      const template = ROUTINE_TEMPLATES.find((t) => t.id === patch.routineId);
      if (template) next.routineName = template.name;
    }
    onExtrasChange(next);
    onSuggestTimeKind?.(suggestTimeKindForSportsExtras(next));
    onSuggestIcon?.(suggestIconForSportsExtras(next));
  };

  const isSingle = sportsExtras.recordType === SPORTS_RECORD_TYPES.SINGLE;
  const isRoutine = sportsExtras.recordType === SPORTS_RECORD_TYPES.ROUTINE;

  return (
    <View style={styles.wrap}>
      <ThemeSubTitleText style={styles.label}>运动类型</ThemeSubTitleText>
      <View style={styles.chipRow}>
        {SPORTS_RECORD_TYPE_OPTIONS.map((opt) => (
          <ThemeButton
            key={opt.id}
            title={`${opt.emoji} ${opt.label}`}
            active={sportsExtras.recordType === opt.id}
            onPress={() => applyExtras({ recordType: opt.id })}
            style={styles.chip}
          />
        ))}
      </View>

      {isSingle ? (
        <>
          <ThemeSubTitleText style={styles.label}>动作名称</ThemeSubTitleText>
          <ThemeTextInput
            style={styles.input}
            placeholder="如：俯卧撑、深蹲"
            value={sportsExtras.actionName}
            onChangeText={(val) => applyExtras({ actionName: val })}
          />
          <ThemeSubTitleText style={styles.label}>次数</ThemeSubTitleText>
          <ThemeTextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(sportsExtras.reps)}
            onChangeText={(val) => {
              const num = parseInt(val, 10);
              applyExtras({ reps: Number.isFinite(num) && num > 0 ? num : 1 });
            }}
          />
          <ThemeSubTitleText style={styles.label}>组数</ThemeSubTitleText>
          <ThemeTextInput
            style={styles.input}
            keyboardType="number-pad"
            value={String(sportsExtras.sets)}
            onChangeText={(val) => {
              const num = parseInt(val, 10);
              applyExtras({ sets: Number.isFinite(num) && num > 0 ? num : 1 });
            }}
          />
        </>
      ) : null}

      {isRoutine ? (
        <>
          <ThemeSubTitleText style={styles.label}>套路模板</ThemeSubTitleText>
          <View style={styles.chipRow}>
            {ROUTINE_TEMPLATES.map((t) => (
              <ThemeButton
                key={t.id}
                title={t.name}
                active={sportsExtras.routineId === t.id}
                onPress={() => applyExtras({ routineId: t.id })}
                style={styles.chip}
              />
            ))}
          </View>
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
  input: {
    minHeight: 44,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 16,
  },
});
