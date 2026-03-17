import { analyseApi } from "@/api";
import AIStreamText from "@/components/common/AIStreamText";
import Icon from "@/components/common/Icon";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import { useTheme } from "@/context/ThemeContext";
import dayjs from "dayjs";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";

export default function AiAnalysisPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { startDate: startParam, endDate: endParam } = params;

  const [streamContent, setStreamContent] = useState({ thought: "", output: "" });
  const [aiStreamKey] = useState(0);
  const [aiContentFinalized, setAiContentFinalized] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (forceRefresh = false) => {
    let startDate;
    let endDate;
    if (startParam && endParam) {
      startDate = dayjs(startParam).startOf("day").toDate();
      endDate = dayjs(endParam).endOf("day").toDate();
    } else {
      startDate = dayjs().startOf("day").toDate();
      endDate = dayjs().endOf("day").toDate();
    }

    setLoading(true);
    setStreamContent({ thought: "", output: "" });
    setAiContentFinalized(false);

    try {
      const streamPromise = analyseApi.generateAiReport(
        { startDate, endDate, forceRefresh },
        {
          onThought: (partialThought) => {
            setStreamContent((prev) => ({ ...prev, thought: partialThought }));
          },
          onOutput: (partialOutput) => {
            setStreamContent((prev) => ({ ...prev, output: partialOutput }));
          }
        }
      );
      
      // 立即设置 loading 为 false，让 AIStreamText 组件开始渲染以展示流式效果
      setLoading(false);
      
      // 等待流式传输完成
      await streamPromise;
    } catch (error) {
      console.error("Error loading AI analysis:", error);
      setStreamContent({
        thought: "",
        output: "暂无 AI 分析内容（请检查 AI 配置或网络连接）"
      });
      setLoading(false);
    } finally {
      setAiContentFinalized(true);
    }
  }, [startParam, endParam]);

  useFocusEffect(
    useCallback(() => {
      loadData().then();
    }, [loadData])
  );

  const content = {
    thought: streamContent.thought || "",
    output: streamContent.output || "暂无 AI 分析内容"
  };

  const handleCopy = async () => {
    const text = streamContent.output || streamContent.thought || "";
    if (!text) {
      Alert.alert("提示", "暂无可复制的内容");
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert("提示", "AI 分析内容已复制");
  };
  
  const handleRegenerate = () => {
    loadData(true).then();
  };

  // 动态样式
  const dynamicStyles = {
    aiActionButtonSecondary: {
      backgroundColor: theme.colors.card,
    },
    aiActionSecondaryText: {
      color: theme.colors.text,
    },
    aiActionButtonPrimary: {
      backgroundColor: theme.colors.primary,
    },
    aiActionPrimaryText: {
      color: theme.colors.primaryContrast,
    },
  };

  return (
    <ThemeSafeAreaView>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon
            lib="Ionicons"
            name="arrow-back"
            color={theme.colors.subText}
            size={24}
          />
        </TouchableOpacity>
        
        <ThemeSubTitleText style={styles.headerTitle}>
          AI 健康分析
        </ThemeSubTitleText>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemeSubTitleText>正在生成 AI 分析...</ThemeSubTitleText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AIStreamText
            key={aiStreamKey}
            content={content}
            speed={30}
            isContentFinalized={aiContentFinalized}
          />
          
          <View style={styles.aiActionsContainer}>
            <ThemeTouchableOpacity
              style={[styles.aiActionButtonPrimary, dynamicStyles.aiActionButtonPrimary]}
              onPress={handleRegenerate}
            >
              <ThemeSubTitleText style={[styles.aiActionPrimaryText, dynamicStyles.aiActionPrimaryText]}>
                重新生成
              </ThemeSubTitleText>
            </ThemeTouchableOpacity>
            
            <TouchableOpacity
              style={[styles.aiActionButtonSecondary, dynamicStyles.aiActionButtonSecondary]}
              onPress={handleCopy}
            >
              <ThemeSubTitleText style={[styles.aiActionSecondaryText, dynamicStyles.aiActionSecondaryText]}>
                复制 AI 分析全文
              </ThemeSubTitleText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10
  },
  backButton: {
    position: "absolute",
    left: 16,
    marginRight: 12,
    padding: 8,
    zIndex: 1
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600"
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 10
  },
  aiActionsContainer: {
    gap: 8
  },
  aiActionButtonSecondary: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  aiActionSecondaryText: {
    fontSize: 14
  },
  aiActionButtonPrimary: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center"
  },
  aiActionPrimaryText: {
    fontSize: 14,
    fontWeight: "500"
  }
});
