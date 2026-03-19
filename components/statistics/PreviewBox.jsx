import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PreviewBox = forwardRef(({
  isLoading,
  previewData,
  showCopyBtn,
  onCopy,
  plainTextContent
}, ref) => {
  const { theme } = useTheme();
  
  const styles = StyleSheet.create({
    sectionCard: {
      marginBottom: 25,
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
    previewContainer: {
      minHeight: 200,
      padding: 16,
      borderRadius: 8,
      backgroundColor: theme.colors.innerCard,
    },
    previewText: {
      fontSize: 14,
      color: theme.colors.text,
      lineHeight: 22,
      whiteSpace: 'pre-wrap',
    },
    copyBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.innerCard,
    },
    copyBtnIcon: {
      color: theme.colors.interactive,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.subText,
    },
  });
  
  const renderPreviewContent = (previewData) => {
    // 是否为纯字符串
    const isPureText = typeof previewData === 'string';
    
    // 纯字符串内容：居中显示（水平+垂直）
    if (isPureText) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.previewText}>{previewData}</Text>
        </View>
      );
    }
    
    // 非纯字符串
    return <View style={styles.previewContainer}>{previewData}</View>;
  };
  
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>内容预览</Text>
      
      {showCopyBtn && !isLoading && plainTextContent ? (
      <TouchableOpacity
        style={[styles.copyBtn, {
          position: 'absolute',
          top: 8,
          right: 16,
        }]}
        onPress={onCopy}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="copy-outline"
          size={20}
          style={styles.copyBtnIcon}
        />
      </TouchableOpacity>
      ) : null}
      
      <View ref={ref} style={styles.previewContainer} collapsable={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.colors.interactive} />
            <Text style={styles.loadingText}>生成预览中...</Text>
          </View>
        ) : (
          renderPreviewContent(previewData)
        )}
      </View>
    </View>
  );
});

PreviewBox.displayName = "PreviewBox";
export default PreviewBox;