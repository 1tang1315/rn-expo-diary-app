import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, ScrollView, Alert,
} from 'react-native';
import ThemeButton from '@/components/theme/ThemeButton';
import ThemeTextInput from '@/components/theme/ThemeTextInput';
import ThemeSubTitleText from '@/components/theme/ThemeSubTitleText';
import ThemeTitleText from '@/components/theme/ThemeTitleText';
import ThemeTouchableOpacity from '@/components/theme/ThemeTouchableOpacity';
import Icon from '@/components/common/Icon';
import { useTheme } from '@/context/ThemeContext';
import { getWaterContainers, saveWaterContainers } from '@/utils/waterContainerStorage';

function makeId() {
  return `wc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export default function WaterContainerManager({ visible, onClose, onUpdated }) {
  const { theme } = useTheme();
  const [containers, setContainers] = useState([]);
  const [name, setName] = useState('');
  const [volumeMl, setVolumeMl] = useState('300');

  const reload = async () => {
    const list = await getWaterContainers();
    setContainers(list);
    onUpdated?.(list);
  };

  useEffect(() => {
    if (visible) reload().then();
  }, [visible]);

  const handleAdd = async () => {
    const trimmed = name.trim();
    const vol = Number(volumeMl);
    if (!trimmed) {
      Alert.alert('提示', '请填写容器名称');
      return;
    }
    if (!Number.isFinite(vol) || vol <= 0) {
      Alert.alert('提示', '请填写有效容量（ml）');
      return;
    }
    const next = [...containers, { id: makeId(), name: trimmed, volumeMl: vol }];
    await saveWaterContainers(next);
    setContainers(next);
    setName('');
    setVolumeMl('300');
    onUpdated?.(next);
  };

  const handleDelete = async (id) => {
    const next = containers.filter((c) => c.id !== id);
    await saveWaterContainers(next);
    setContainers(next);
    onUpdated?.(next);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <ThemeTitleText>饮水容器</ThemeTitleText>
            <ThemeTouchableOpacity onPress={onClose}>
              <Icon lib="MaterialIcons" name="close" size={24} color={theme.colors.text} />
            </ThemeTouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {containers.map((c) => (
              <View key={c.id} style={[styles.item, { borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, flex: 1 }}>
                  {c.name} · {c.volumeMl}ml
                </Text>
                <ThemeButton
                  title="删除"
                  onPress={() => handleDelete(c.id)}
                />
              </View>
            ))}
          </ScrollView>

          <ThemeSubTitleText style={styles.label}>新增容器</ThemeSubTitleText>
          <ThemeTextInput
            style={styles.input}
            placeholder="名称，如 水杯"
            value={name}
            onChangeText={setName}
          />
          <ThemeTextInput
            style={styles.input}
            placeholder="容量 ml"
            keyboardType="number-pad"
            value={volumeMl}
            onChangeText={setVolumeMl}
          />
          <ThemeButton title="添加" onPress={handleAdd} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    maxHeight: '80%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  list: {
    maxHeight: 200,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    minHeight: 44,
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    fontSize: 16,
  },
});
