import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

const FormatSelector = ({ formats, selectedFormat, setSelectedFormat, styles }) => {
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
