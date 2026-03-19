import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import { useTheme } from "@/context/ThemeContext";
import { FontAwesome5 } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

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
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    sectionCard: {
      marginBottom: 10,
      borderRadius: 8,
      padding: 16,
      backgroundColor: theme.colors.card,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
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
      backgroundColor: theme.colors.innerCard,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    formatCardActive: {
      backgroundColor: theme.colors.interactive,
    },
    formatText: {
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
      lineHeight: 24,
    },
    formatTextActive: {
      color: '#fff',
    },
  });
  
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>选择导出格式</Text>
      
      <View style={styles.formatGrid}>
        {formats.map((format) => (
          <ThemeTouchableOpacity
            key={format.id}
            style={[styles.formatCard, selectedFormat === format.id && styles.formatCardActive]}
            onPress={() => setSelectedFormat(format.id)}
          >
            <FontAwesome5
              name={format.icon}
              size={24}
              color={selectedFormat === format.id ? '#fff' : theme.colors.interactive}
            />
            <Text numberOfLines={1} style={[styles.formatText, selectedFormat === format.id && styles.formatTextActive]}>
              {format.name}
            </Text>
          </ThemeTouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default FormatSelector;