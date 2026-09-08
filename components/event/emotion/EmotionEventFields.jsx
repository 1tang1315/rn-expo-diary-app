import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  EMOTION_TRIGGER_OPTIONS,
  EMOTION_FEELING_OPTIONS,
  EMOTION_TRIGGER_TYPES,
} from '@/constants/emotionConstants';
import {
  normalizeEmotionExtras,
  suggestIconForEmotionExtras,
  suggestTimeKindForEmotionExtras,
} from '@/utils/emotionExtrasUtils';
import ThemeSubTitleText from '@/components/theme/ThemeSubTitleText';
import ThemeButton from '@/components/theme/ThemeButton';
import ThemeTextInput from '@/components/theme/ThemeTextInput';

export default function EmotionEventFields({
  extras,
  onExtrasChange,
  onSuggestTimeKind,
  onSuggestIcon,
}) {
  const emotionExtras = normalizeEmotionExtras(extras);

  const applyExtras = (patch) => {
    const next = normalizeEmotionExtras({ ...emotionExtras, ...patch });
    onExtrasChange(next);
    onSuggestTimeKind?.(suggestTimeKindForEmotionExtras(next));
    onSuggestIcon?.(suggestIconForEmotionExtras(next));
  };

  const isBecause = emotionExtras.triggerType === EMOTION_TRIGGER_TYPES.BECAUSE;

  return (
    <View style={styles.wrap}>
      <ThemeSubTitleText style={styles.label}>触发方式</ThemeSubTitleText>
      <View style={styles.chipRow}>
        {EMOTION_TRIGGER_OPTIONS.map((opt) => (
          <ThemeButton
            key={opt.id}
            title={opt.label}
            active={emotionExtras.triggerType === opt.id}
            onPress={() => applyExtras({ triggerType: opt.id })}
            style={styles.chip}
          />
        ))}
      </View>

      <ThemeSubTitleText style={styles.label}>
        {isBecause ? '看到什么' : '关于什么'}
      </ThemeSubTitleText>
      <ThemeTextInput
        style={styles.input}
        placeholder="如：那条消息、加班的事"
        value={emotionExtras.triggerSubject}
        onChangeText={(val) => applyExtras({ triggerSubject: val })}
      />

      {isBecause ? (
        <>
          <ThemeSubTitleText style={styles.label}>因为谁</ThemeSubTitleText>
          <ThemeTextInput
            style={styles.input}
            placeholder="某人"
            value={emotionExtras.personName}
            onChangeText={(val) => applyExtras({ personName: val })}
          />
          <ThemeSubTitleText style={styles.label}>具体原因</ThemeSubTitleText>
          <ThemeTextInput
            style={styles.input}
            placeholder="说了什么、做了什么"
            value={emotionExtras.causeDetail}
            onChangeText={(val) => applyExtras({ causeDetail: val })}
          />
        </>
      ) : null}

      <ThemeSubTitleText style={styles.label}>感受</ThemeSubTitleText>
      <View style={styles.chipRow}>
        {EMOTION_FEELING_OPTIONS.map((feeling) => (
          <ThemeButton
            key={feeling}
            title={feeling}
            active={emotionExtras.feeling === feeling}
            onPress={() => applyExtras({ feeling })}
            style={styles.chip}
          />
        ))}
      </View>
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
