import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";
import Icon from "@/components/common/Icon";
import ExpandableCard from "@/components/common/ExpandableCard";

const MODE_LIST = [
  {
    key: 'light',
    label: '浅色'
  },
  {
    key: 'dark',
    label: '深色'
  },
  {
    key: 'blue',
    label: '蓝色'
  },
  {
    key: 'green',
    label: '绿色'
  },
  {
    key: 'purple',
    label: '紫色'
  }
];

const PRIMARY_SCENE_LIST = [
  {
    key: 'minimal',
    label: '极简模式',
    desc: '仅关键按钮用主色',
    icon: 'moon',
    iconLib: 'Ionicons'
  },
  {
    key: 'interactive',
    label: '突出交互',
    desc: '按钮、开关等交互元素用主色',
    icon: 'cursor-pointer',
    iconLib: 'MaterialCommunityIcons'
  },
  {
    key: 'emphasis',
    label: '强调重点',
    desc: '标题、关键数据也用主色',
    icon: 'star',
    iconLib: 'Ionicons'
  },
  {
    key: 'detail',
    label: '点缀细节',
    desc: '图标、边框等细节用主色',
    icon: 'color-palette',
    iconLib: 'Ionicons'
  }
];

export default function Mine() {
  const {
    mode,
    theme,
    primaryColor,
    primaryApplication,
    setThemeMode,
    setPrimaryColor,
    setPrimaryApplicationScene,
    PRESET_COLORS,
  } = useTheme();
  
  return (
    <ThemeSafeAreaView>
      <ScrollView contentContainerStyle={styles.container}>
        <ExpandableCard title="主题设置" style={styles.card}>
          {/* 主题风格 */}
          <Text style={[styles.subTitle, { color: theme.colors.text }]}>主题风格</Text>
          <View style={styles.colorRow}>
            {MODE_LIST?.map(m => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.modeBtn, {
                    borderColor: mode === m.key ? theme.colors.interactive : theme.colors.border,
                  }
                ]}
                onPress={() => setThemeMode(m.key)}
              >
                <Text style={{ color: mode === m.key ? theme.colors.interactive : theme.colors.text }}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={[styles.divider, { borderBottomColor: theme.colors.dim }]} />
          
          {/* 主色调选择 */}
          <Text style={[styles.subTitle, { color: theme.colors.text }]}>主色调</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS?.map(color => (
              <TouchableOpacity
                key={color}
                style={[styles.colorBtn, { backgroundColor: color }]}
                onPress={() => setPrimaryColor(color)}
              >
                {primaryColor === color && (
                  <Icon lib="MaterialIcons" name="check" size={20} color="white" style={styles.colorCheck} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={[styles.divider, { borderBottomColor: theme.colors.dim }]} />
          
          {/* 主色应用范围 */}
          <Text style={[styles.subTitle, { marginTop: 10, color: theme.colors.text }]}>主色应用范围</Text>
          <View style={styles.sceneList}>
            {PRIMARY_SCENE_LIST?.map(scene => (
              <TouchableOpacity
                key={scene.key}
                style={[
                  styles.sceneItem, {
                    borderColor: primaryApplication === scene.key ? theme.colors.interactive : theme.colors.border
                  }
                ]}
                onPress={() => setPrimaryApplicationScene(scene.key)}
              >
                <Icon lib={scene.iconLib} name={scene.icon} size={24} color={theme.colors.interactive} />
                <View style={styles.sceneTextContainer}>
                  <Text style={[styles.sceneLabel, { color: theme.colors.text }]}>{scene.label}</Text>
                  <Text style={[styles.sceneDesc, { color: theme.colors.subText }]}>{scene.desc}</Text>
                </View>
                {primaryApplication === scene.key && (
                  <View style={[styles.sceneCheck, { backgroundColor: theme.colors.interactive }]}>
                    <Text style={{ color: theme.colors.interactiveContrast }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ExpandableCard>
      </ScrollView>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  label: {
    fontSize: 16,
    fontWeight: '600'
  },
  divider: {
    borderBottomWidth: 1,
    marginVertical: 8
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5
  },
  
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 6
  },
  
  // 主色选择按钮样式
  colorBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.2,
  },
  colorCheck: {
    textShadowColor: '#000',
    textShadowOffset: {
      width: 0,
      height: 1
    },
    textShadowRadius: 1,
  },
  
  sceneList: { gap: 8 },
  sceneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 12
  },
  sceneTextContainer: { flex: 1 },
  sceneLabel: {
    fontSize: 15,
    fontWeight: '600'
  },
  sceneDesc: {
    fontSize: 12,
    marginTop: 2
  },
  sceneCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
});