import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef } from "react";

const PreviewBox = forwardRef(({
  styles,
  isLoading,
  previewData,
  showCopyBtn,
  onCopy,
  plainTextContent
}, ref) => {
  const renderPreviewContent = (previewData, styles) => {
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
            <ActivityIndicator size="small" color="#4A6CF7" />
            <Text style={styles.loadingText}>生成预览中...</Text>
          </View>
        ) : (
          renderPreviewContent(previewData, styles)
        )}
      </View>
    </View>
  );
});


PreviewBox.displayName = "PreviewBox";
export default PreviewBox;
