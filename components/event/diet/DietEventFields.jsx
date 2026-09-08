import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  DIET_RECORD_TYPES,
  DIET_RECORD_TYPE_OPTIONS,
  MEAL_SLOT_OPTIONS,
  WATER_MODES,
  WATER_MODE_OPTIONS,
} from '@/constants/dietConstants';
import {
  normalizeDietExtras,
  suggestIconForDietExtras,
  suggestTimeKindForDietExtras,
} from '@/utils/dietExtrasUtils';
import { getWaterContainers } from '@/utils/waterContainerStorage';
import ThemeSubTitleText from '@/components/theme/ThemeSubTitleText';
import ThemeButton from '@/components/theme/ThemeButton';
import ThemeTextInput from '@/components/theme/ThemeTextInput';
import WaterContainerManager from '@/components/event/diet/WaterContainerManager';

export default function DietEventFields({
  extras,
  onExtrasChange,
  onSuggestTimeKind,
  onSuggestIcon,
}) {
  const dietExtras = normalizeDietExtras(extras);
  const [containers, setContainers] = useState([]);
  const [showContainerManager, setShowContainerManager] = useState(false);

  const loadContainers = async () => {
    const list = await getWaterContainers();
    setContainers(list);
  };

  useEffect(() => {
    loadContainers().then();
  }, []);

  const applyExtras = (patch) => {
    const next = normalizeDietExtras({ ...dietExtras, ...patch });
    onExtrasChange(next);
    onSuggestTimeKind?.(suggestTimeKindForDietExtras(next));
    onSuggestIcon?.(suggestIconForDietExtras(next));
  };

  const isWater = dietExtras.recordType === DIET_RECORD_TYPES.WATER;
  const isMeal = dietExtras.recordType === DIET_RECORD_TYPES.MEAL;

  return (
    <View style={styles.wrap}>
      <ThemeSubTitleText style={styles.label}>饮食类型</ThemeSubTitleText>
      <View style={styles.chipRow}>
        {DIET_RECORD_TYPE_OPTIONS.map((opt) => (
          <ThemeButton
            key={opt.id}
            title={`${opt.emoji} ${opt.label}`}
            active={dietExtras.recordType === opt.id}
            onPress={() => applyExtras({ recordType: opt.id })}
            style={styles.chip}
          />
        ))}
      </View>

      {isMeal ? (
        <>
          <ThemeSubTitleText style={styles.label}>餐次</ThemeSubTitleText>
          <View style={styles.chipRow}>
            {MEAL_SLOT_OPTIONS.map((opt) => (
              <ThemeButton
                key={opt.id}
                title={opt.label}
                active={dietExtras.mealSlot === opt.id}
                onPress={() => applyExtras({ mealSlot: opt.id })}
                style={styles.chip}
              />
            ))}
          </View>
        </>
      ) : null}

      {isWater ? (
        <>
          <ThemeSubTitleText style={styles.label}>喝水方式</ThemeSubTitleText>
          <View style={styles.chipRow}>
            {WATER_MODE_OPTIONS.map((opt) => (
              <ThemeButton
                key={opt.id}
                title={opt.label}
                active={dietExtras.waterMode === opt.id}
                onPress={() => applyExtras({ waterMode: opt.id })}
                style={styles.chip}
              />
            ))}
          </View>

          <ThemeSubTitleText style={styles.label}>容器</ThemeSubTitleText>
          <View style={styles.chipRow}>
            {containers.map((c) => (
              <ThemeButton
                key={c.id}
                title={`${c.name} ${c.volumeMl}ml`}
                active={dietExtras.containerId === c.id}
                onPress={() => applyExtras({ containerId: c.id })}
                style={styles.chip}
              />
            ))}
            <ThemeButton
              title="管理"
              onPress={() => setShowContainerManager(true)}
              style={styles.chip}
            />
          </View>

          {dietExtras.waterMode === WATER_MODES.SIP ? (
            <View style={styles.sipRow}>
              <ThemeSubTitleText style={styles.label}>喝了几口</ThemeSubTitleText>
              <ThemeTextInput
                style={styles.sipInput}
                keyboardType="number-pad"
                value={String(dietExtras.sipCount)}
                onChangeText={(val) => {
                  const num = parseInt(val, 10);
                  applyExtras({ sipCount: Number.isFinite(num) && num > 0 ? num : 1 });
                }}
              />
            </View>
          ) : null}
        </>
      ) : null}

      <WaterContainerManager
        visible={showContainerManager}
        onClose={() => setShowContainerManager(false)}
        onUpdated={(list) => {
          setContainers(list);
          if (dietExtras.containerId && !list.find((c) => c.id === dietExtras.containerId)) {
            applyExtras({ containerId: list[0]?.id || null });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sipRow: {
    marginBottom: 8,
  },
  sipInput: {
    minHeight: 40,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    maxWidth: 120,
  },
});
