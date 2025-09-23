import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

// 支持的导出格式配置
const formats = [
  {
    id: 'txt',
    name: '纯文本 (TXT)',
    icon: 'envelope-open-text'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    icon: 'markdown'
  },
  {
    id: 'image',
    name: '图片 (PNG)',
    icon: 'image'
  }
];

const FormatSelector = ({ selectedFormat, setSelectedFormat }) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>选择导出格式</Text>
      <View style={styles.formatGrid}>
        {formats.map((format) => (
          <TouchableOpacity
            key={format.id}
            style={[styles.formatCard, selectedFormat === format.id && styles.formatCardActive]}
            onPress={() => setSelectedFormat(format.id)}
          >
            <FontAwesome5
              name={format.icon}
              size={24}
              color={selectedFormat === format.id ? '#fff' : '#4A6CF7'}
            />
            <Text style={[styles.formatText, selectedFormat === format.id && styles.formatTextActive]}>
              {format.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default FormatSelector;

const styles = StyleSheet.create({
  sectionCard: {
    marginBottom: 10,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatCard: {
    width: '46%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formatCardActive: {
    backgroundColor: '#4A6CF7',
  },
  formatText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  formatTextActive: {
    color: '#fff',
  },
});