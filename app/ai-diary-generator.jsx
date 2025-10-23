import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AiDiaryService from '@/db/services/AiDiaryService';
import dayjs from 'dayjs';
import Ionicons from '@expo/vector-icons/Ionicons';
import DiaryPreviewModal from "@/components/DiaryPreviewModal";
import { hasDiary, insertDiary, updateDiary } from "@/db/notesDB";
import DateSelector from "@/components/statistics/DateSelector";
import { getEventsByDateRange } from "@/db/eventDB";
import { getPlainTextContent } from "@/utils/previewFormatter";
import EmptyContainer from "@/components/common/EmptyContainer";
import ExpandableCard from "@/components/common/ExpandableCard";
import AIStreamText from "@/components/common/AIStreamText";

export default function AiDiaryGenerator() {
  const navigation = useNavigation();
  const [prompt, setPrompt] = useState(`请按分类逐一总结：
  1.简要内容
  2.存在的问题
  3.优化建议
  返回纯文本text格式而不是markdown格式
  最后给出整体总结和改进建议。`);
  
  const aiDiaryService = new AiDiaryService();
  
  const [events, setEvents] = useState([]);
  const [eventsText, setEventsText] = useState([]);
  
  // 处理日期选择
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState('');
  
  const handleDateChange = useCallback(async (startDate, endDate) => {
    setIsLoading(true);
    setStartDate(startDate);
    setEndDate(endDate);
    const events = await getEventsByDateRange(startDate, endDate, "asc");
    setEvents(events);
    const eventsText = getPlainTextContent("txt", events);
    setEventsText(eventsText);
    setIsLoading(false);
  }, []);
  
  // 弹窗相关状态
  const [modalVisible, setModalVisible] = useState(false);
  const [content, setContent] = useState({
    thought: '',
    output: ''
  });
  const [hasExisting, setHasExisting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isContentFinalized, setIsContentFinalized] = useState(false);
  
  // 生成日记
  const handleGenerateDiary = async () => {
    if(!prompt.trim()) {
      Alert.alert('提示', '请输入日记生成要求');
      return;
    }
    
    if(events.length <= 0) {
      Alert.alert('提示', '暂无数据哦');
      return;
    }
    
    try {
      // 开始加载
      setIsLoading(true);
      
      // 检查当前日期是否已有日记（用于弹窗提示）
      const existingDiary = await hasDiary(startDate);
      setHasExisting(existingDiary);
      
      // 最终AI提示词
      const finalPrompt = aiDiaryService.generateDiaryPrompt(startDate, endDate, eventsText, prompt);
      
      // 重置内容状态
      setContent({
        thought: '',
        output: ''
      });
      
      // AI数据生成（流式）
      await aiDiaryService.generateContent(finalPrompt, {
        onThought: (chunk) => {
          setIsLoading(false);
          setContent(prev => ({
            ...prev,
            thought: chunk
          }));
        },
        onOutput: (chunk) => {
          setIsLoading(false);
          setContent(prev => ({
            ...prev,
            output: chunk
          }));
        }
      });
      
      setIsContentFinalized(true);
      setIsLoading(false);
      
      // 生成完成后自动尝试保存或提示覆盖
      setTimeout(async () => {
        if(existingDiary) {
          Alert.alert(
            "日记已存在",
            "当天已有日记，是否覆盖更新？",
            [
              {
                text: "取消",
                style: "cancel"
              },
              {
                text: "覆盖",
                onPress: () => saveGeneratedDiary()
              }
            ]
          );
        } else {
          // 没有日记，直接保存
          await saveGeneratedDiary();
        }
      }, 500);
    } catch(error) {
      Alert.alert('异常', error.message || '生成预览时发生错误');
      setIsLoading(false);
    }
  };
  
  // 弹窗取消回调
  const handleModalCancel = () => {
    aiDiaryService.pauseRequest();
    setModalVisible(false);
    setContent({
      thought: '',
      output: ''
    });
    setIsLoading(false);
  };
  
  // 弹窗确认后的回调（如刷新日记列表）
  const handleAfterConfirm = () => {
    setModalVisible(false);
    setContent('');
    Alert.alert('操作成功', '日记已保存');
    navigation.goBack();
  };
  
  // 保存生成的日记
  const saveGeneratedDiary = async () => {
    if(!content.output) {
      Alert.alert("提示", "没有生成内容可保存");
      return;
    }
    
    try {
      setIsLoading(true);
      const diaryContent = content.output; // 使用生成的内容
      
      if(await hasDiary(startDate)) {
        // 更新现有日记
        await updateDiary(startDate, diaryContent);
        Alert.alert("成功", "日记已更新");
      } else {
        // 插入新日记
        await insertDiary(startDate, diaryContent);
        Alert.alert("成功", "日记已保存");
        setIsLoading(false);
      }
    } catch(error) {
      Alert.alert("保存失败", error.message || "保存日记时发生错误");
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>日记生成</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollContent}>
        {/* 日期选择 */}
        <DateSelector onDataChange={handleDateChange} />
        
        {events.length > 0 ? (
          <>
            <ExpandableCard title="事件数据">
              <Text>{eventsText}</Text>
            </ExpandableCard>
            
            <ExpandableCard title="ai提示词">
              <TextInput
                multiline
                value={prompt}
                onChangeText={setPrompt}
                textAlignVertical="top"
                editable={!isLoading}
                placeholder="请输入日记生成要求..."
              />
            </ExpandableCard>
            
            <ExpandableCard title="日记预览">
              {
                (content.thought || content.output) ? (
                  <AIStreamText
                    content={content}
                    isContentFinalized={isContentFinalized}
                  />
                ) : <Text>暂无数据, 请先点击生成日记按钮</Text>
              }
            </ExpandableCard>
          </>
        ) : <EmptyContainer model="box" />}
        
        <View style={styles.blank}></View>
      </ScrollView>
      
      {/* 生成按钮 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerateDiary}
          disabled={isLoading} // 加载中禁用按钮
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.generateBtnText}>生成并预览日记</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <DiaryPreviewModal
        targetDate={startDate}
        visible={modalVisible}
        newDiaryContent={content}
        hasExistingDiary={hasExisting}
        isLoading={isLoading}
        onCancel={handleModalCancel}
        onAfterConfirm={handleAfterConfirm}
        isContentFinalized={isContentFinalized}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  blank: {
    width: '100%',
    height: 20,
  },
  footer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#f8f3f3'
  },
  generateBtn: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});