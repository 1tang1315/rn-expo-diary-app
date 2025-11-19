import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import AiDiaryService from '@/db/services/AiDiaryService';
import dayjs from 'dayjs';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  checkDiaryExists, createNote, getFolderById, getFoldersWithNoteCount, createFolder
} from "@/db/notesDB";
import DateSelector from "@/components/statistics/DateSelector";
import { getEventsByDateRange } from "@/db/eventDB";
import { getPlainTextContent } from "@/utils/previewFormatter";
import ExpandableCard from "@/components/common/ExpandableCard";
import { AsyncStorage } from "expo-sqlite/kv-store";
import AIStreamText from "@/components/common/AIStreamText";
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";

export default function AiDiaryGenerator() {
  const [aiDiaryService, setAiDiaryService] = useState(null);
  const navigation = useNavigation();
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  
  const [prompt, setPrompt] = useState(`请按分类逐一总结：
  1.当日核心事件（简要）
  2.存在的问题与不足
  3.次日改进建议
  返回纯文本格式，无需markdown，语言简洁明了。`);
  const [summaryPrompt, setSummaryPrompt] = useState(`基于以下时间范围的所有事件数据，按分类生成阶段总结：
  1.整体成果与进展
  2.高频问题汇总
  3.阶段性改进建议
  返回纯文本格式，无需markdown，结构清晰。`);
  
  const [currentAction, setCurrentAction] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [completedDiaries, setCompletedDiaries] = useState([]);
  const [currentGeneratingDiary, setCurrentGeneratingDiary] = useState(null);
  const [summaryContent, setSummaryContent] = useState({
    thought: "",
    output: "",
    isContentFinalized: false
  });
  const [processMessages, setProcessMessages] = useState([]);
  
  const [activeDiaryIndex, setActiveDiaryIndex] = useState(0);
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedApiKey = await AsyncStorage.getItem('AI_DIARY_API_KEY');
        const savedModel = await AsyncStorage.getItem('AI_DIARY_MODEL');
        const savedApiBaseUrl = await AsyncStorage.getItem('AI_DIARY_API_BASE_URL');
        
        const newConfig = {
          apiKey: savedApiKey || '',
          model: savedModel || 'Qwen/Qwen3-8B',
          apiBaseUrl: savedApiBaseUrl || 'https://api.siliconflow.cn/v1'
        };
        setAiDiaryService(new AiDiaryService(newConfig));
      } catch(err) {
        console.error('加载配置失败：', err);
        setAiDiaryService(new AiDiaryService());
      }
    };
    loadConfig().then();
  }, []);
  
  useEffect(() => {
    if (completedDiaries.length > 0 && !currentGeneratingDiary) {
      setActiveDiaryIndex(completedDiaries.length - 1);
    }
  }, [completedDiaries, currentGeneratingDiary]);
  
  const getOrCreateFolder = async (folderName) => {
    const folders = await getFoldersWithNoteCount();
    let targetFolder = folders.find(f => f.name === folderName);
    if (!targetFolder) {
      const folderId = await createFolder({ name: folderName });
      targetFolder = await getFolderById(folderId);
    }
    return targetFolder;
  };
  
  const getDateRangeArray = (start, end) => {
    const startDay = dayjs(start);
    const endDay = dayjs(end);
    const dateArray = [];
    let currentDay = startDay;
    
    while (currentDay.isBefore(endDay) || currentDay.isSame(endDay)) {
      dateArray.push(currentDay.format('YYYY-MM-DD'));
      currentDay = currentDay.add(1, 'day');
    }
    return dateArray;
  };
  
  const handleDateChange = useCallback(async (selectedStart, selectedEnd) => {
    setIsLoading(true);
    const start = dayjs(selectedStart);
    const end = dayjs(selectedEnd);
    
    if (end.isBefore(start)) {
      Alert.alert('提示', '结束日期不能早于开始日期');
      setIsLoading(false);
      return;
    }
    
    setStartDate(selectedStart);
    setEndDate(selectedEnd);
    
    const allEvents = await getEventsByDateRange(selectedStart, selectedEnd, "asc");
    const eventText = getPlainTextContent("txt", allEvents);
    setEvents(allEvents);
    setEventText(eventText || "所选时间范围内无事件数据");
    
    const dateArray = getDateRangeArray(selectedStart, selectedEnd);
    setTotalDays(dateArray.length);
    setProcessedCount(0);
    setGeneratedCount(0);
    setSummaryContent({
      thought: "",
      output: "",
      isContentFinalized: false
    });
    setCompletedDiaries([]);
    setCurrentGeneratingDiary(null);
    setProcessMessages([]);
    
    setIsLoading(false);
  }, []);
  
  const batchGenerateDiaries = async (dateArray, diaryFolder) => {
    let successCount = 0;
    setCompletedDiaries([]);
    setProcessMessages([]);
    setProcessedCount(0);
    
    for (const date of dateArray) {
      const exists = await checkDiaryExists(date, diaryFolder.id);
      if (exists) {
        setProcessMessages(prev => [...prev, { type: 'skip', msg: `日期 ${date} 已存在日记，跳过` }]);
        setProcessedCount(prev => prev + 1);
        continue;
      }
      
      try {
        const dailyEvents = await getEventsByDateRange(date, date, "asc");
        if (dailyEvents.length === 0) {
          setProcessMessages(prev => [...prev, { type: 'skip', msg: `日期 ${date} 无事件数据，跳过` }]);
          setProcessedCount(prev => prev + 1);
          continue;
        }
        
        const diaryId = `${date}-${Date.now()}`;
        const newGeneratingDiary = {
          id: diaryId,
          date,
          thought: '',
          output: '',
          isContentFinalized: false
        };
        setCurrentGeneratingDiary(newGeneratingDiary);
        
        const currentTotalDiaryCount = completedDiaries.length + 1;
        setActiveDiaryIndex(currentTotalDiaryCount - 1);
        
        const dailyEventsText = getPlainTextContent("txt", dailyEvents);
        const dailyPrompt = aiDiaryService.generateDiaryPrompt(
          date, date, dailyEventsText, prompt
        );
        
        await aiDiaryService.generateContent(dailyPrompt, {
          onThought: (thought) => {
            setCurrentGeneratingDiary(prev => prev?.id === diaryId ? { ...prev, thought } : prev);
          },
          onOutput: (chunk) => {
            setCurrentGeneratingDiary(prev => prev?.id === diaryId ? { ...prev, output: chunk } : prev);
          }
        }).then(async ({ thought, output }) => {
          const finalizedDiary = {
            id: diaryId,
            date,
            thought: thought.trim(),
            output: output.trim(),
            isContentFinalized: true
          };
          setCurrentGeneratingDiary(finalizedDiary);
          setCompletedDiaries(prev => [...prev, finalizedDiary]);
          
          await createNote({
            folder_id: diaryFolder.id,
            title: date,
            content: output.trim()
          });
          
          successCount++;
          setGeneratedCount(successCount);
          setProcessMessages(prev => [...prev, { type: 'success', msg: `日期 ${date} 生成成功` }]);
          setProcessedCount(prev => prev + 1);
        });
        
      } catch (error) {
        console.error(`生成 ${date} 日记失败：`, error);
        const errorDiary = {
          id: `${date}-${Date.now()}`,
          date,
          thought: '',
          output: `生成失败：${error.message}`,
          isContentFinalized: true
        };
        setCurrentGeneratingDiary(errorDiary);
        setCompletedDiaries(prev => [...prev, errorDiary]);
        setProcessMessages(prev => [...prev, { type: 'error', msg: `日期 ${date} 生成失败：${error.message}` }]);
        setProcessedCount(prev => prev + 1);
      }
    }
    
    return successCount;
  };
  
  const generateSummary = async (dateArray) => {
    try {
      const summaryTitle = `${startDate}~${endDate}`;
      const summaryFolder = await getOrCreateFolder('阶段总结');
      const exists = await checkDiaryExists(summaryTitle, summaryFolder.id);
      if (exists) {
        Alert.alert('提示', '该时间范围的阶段总结已存在，跳过生成');
        return false;
      }
      
      const allSummaryEvents = await getEventsByDateRange(startDate, endDate, "asc");
      if (allSummaryEvents.length === 0) {
        Alert.alert('提示', '该时间范围内无事件数据，无法生成阶段总结');
        return false;
      }
      
      setSummaryContent({
        thought: "",
        output: "",
        isContentFinalized: false
      });
      
      const dateGroupedEvents = {};
      for (const date of dateArray) {
        const dailyEvents = await getEventsByDateRange(date, date, "asc");
        if (dailyEvents.length > 0) {
          dateGroupedEvents[date] = getPlainTextContent("txt", dailyEvents);
        }
      }
      
      const diariesText = Object.entries(dateGroupedEvents).map(([date, content]) => `【${date}】\n${content}`).join('\n\n');
      const finalSummaryPrompt = `${summaryPrompt}\n\n时间范围：${startDate}~${endDate}\n\n事件内容：\n${diariesText}`;
      
      await aiDiaryService.generateContent(finalSummaryPrompt, {
        onThought: (chunk) => {
          setSummaryContent(prev => ({ ...prev, thought: chunk }));
        },
        onOutput: (chunk) => {
          setSummaryContent(prev => ({ ...prev, output: chunk }));
        }
      }).then(async ({ output: summaryContentText }) => {
        setSummaryContent(prev => ({
          ...prev,
          thought: prev.thought,
          output: summaryContentText.trim(),
          isContentFinalized: true
        }));
        
        await createNote({
          folder_id: summaryFolder.id,
          title: summaryTitle,
          content: summaryContentText.trim()
        });
      });
      
      return true;
    } catch (error) {
      console.error('生成阶段总结失败：', error);
      setSummaryContent({
        thought: "",
        output: `生成失败：${error.message}`,
        isContentFinalized: true
      });
      Alert.alert('错误', '阶段总结生成失败：' + error.message);
      return false;
    }
  };
  
  const handleGenerateDiaries = async () => {
    if (!aiDiaryService) {
      Alert.alert('错误', 'AI服务未初始化完成，请稍候');
      return;
    }
    
    if (events.length === 0) {
      Alert.alert('提示', '所选时间范围内无事件数据，无法生成日记');
      return;
    }
    
    try {
      setCurrentAction('diary');
      const diaryFolder = await getOrCreateFolder('日记');
      const dateArray = getDateRangeArray(startDate, endDate);
      setTotalDays(dateArray.length);
      
      const successCount = await batchGenerateDiaries(dateArray, diaryFolder);
      
      Alert.alert(
        '日记生成完成',
        `共处理 ${dateArray.length} 天，成功生成 ${successCount} 篇日记`
      );
    } catch (error) {
      console.error('日记生成失败：', error);
      Alert.alert('错误', '日记生成异常：' + error.message);
    } finally {
      setCurrentAction(null);
    }
  };
  
  const handleGenerateSummary = async () => {
    if (!aiDiaryService) {
      Alert.alert('错误', 'AI服务未初始化完成，请稍候');
      return;
    }
    
    if (events.length === 0) {
      Alert.alert('提示', '所选时间范围内无事件数据，无法生成阶段总结');
      return;
    }
    
    try {
      setCurrentAction('summary');
      const dateArray = getDateRangeArray(startDate, endDate);
      const summarySuccess = await generateSummary(dateArray);
      
      if (summarySuccess) {
        Alert.alert('成功', '阶段总结生成完成');
      }
    } catch (error) {
      console.error('总结生成失败：', error);
      Alert.alert('错误', '总结生成异常：' + error.message);
    } finally {
      setCurrentAction(null);
    }
  };
  
  const CustomProgressBar = ({ progress }) => (
    <View style={styles.progressBarContainer}>
      <View
        style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
      />
    </View>
  );
  
  const activeDiary = completedDiaries[activeDiaryIndex] || currentGeneratingDiary;
  
  const DiaryNavigator = ({
    completedDiaries,
    currentGeneratingDiary,
    activeDiaryIndex,
    setActiveDiaryIndex
  }) => {
    const totalDiaryCount = completedDiaries.length + (currentGeneratingDiary ? 1 : 0);
    
    if (totalDiaryCount <= 1) return null;
    
    return (
      <View style={styles.diaryNavContainer}>
        <TouchableOpacity
          style={styles.navArrow}
          onPress={() => setActiveDiaryIndex(prev => Math.max(0, prev - 1))}
          disabled={activeDiaryIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={activeDiaryIndex === 0 ? '#ccc' : '#007AFF'}
          />
        </TouchableOpacity>
        
        <View style={styles.navPageInfo}>
          <Text style={styles.currentPage}>{activeDiaryIndex + 1}</Text>
          <Text style={styles.pageSeparator}>/</Text>
          <Text style={styles.totalPage}>{totalDiaryCount}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.navArrow}
          onPress={() => setActiveDiaryIndex(prev => Math.min(totalDiaryCount - 1, prev + 1))}
          disabled={activeDiaryIndex === totalDiaryCount - 1}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={activeDiaryIndex === totalDiaryCount - 1 ? '#ccc' : '#007AFF'}
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <ThemeSafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>批量日记生成</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.scrollContent}>
        <DateSelector
          onDataChange={handleDateChange}
          defaultStartDate={startDate}
          defaultEndDate={endDate}
          isRangeRequired={true}
          isLoading={isLoading}
        />
        
        <ExpandableCard title="事件数据" isExpanded={true}>
          <Text style={styles.eventText}>{eventText}</Text>
        </ExpandableCard>
        
        <ExpandableCard title="每日日记生成规则">
          <TextInput
            style={styles.textInput}
            multiline
            value={prompt}
            onChangeText={setPrompt}
            editable={!currentAction && !isLoading}
            placeholder="请输入每日日记的生成要求..."
            textAlignVertical="top"
          />
        </ExpandableCard>
        
        <ExpandableCard title="阶段总结生成规则">
          <TextInput
            style={styles.textInput}
            multiline
            value={summaryPrompt}
            onChangeText={setSummaryPrompt}
            editable={!currentAction && !isLoading}
            placeholder="请输入阶段总结的生成要求..."
            textAlignVertical="top"
          />
        </ExpandableCard>
        
        <ExpandableCard title="提示消息">
          <Text style={styles.progressText}>
            进度：{processedCount}/{totalDays} 天处理完成（成功生成 {generatedCount} 篇）
          </Text>
          <CustomProgressBar progress={totalDays > 0 ? processedCount / totalDays : 0} />
          
          {processMessages.length > 0 && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>处理信息：</Text>
              {processMessages.map((item, index) => (
                <Text
                  key={index}
                  style={
                    item.type === 'success' ? styles.messageSuccessText :
                      item.type === 'skip' ? styles.messageSkipText :
                        styles.messageErrorText
                  }
                >
                  • {item.msg}
                </Text>
              ))}
            </View>
          )}
        </ExpandableCard>
        
        <ExpandableCard title={`AI日记预览（${activeDiary?.date || '未生成'}）`}>
          {!activeDiary ? (
            <View style={styles.emptyDiaryContainer}>
              <Text style={styles.emptyDiaryText}>{'暂无生成的日记，点击下方"生成日记"按钮开始'}</Text>
            </View>
          ) : (
            <AIStreamText
              content={activeDiary}
              isContentFinalized={activeDiary.isContentFinalized}
            />
          )}
          
          <DiaryNavigator
            completedDiaries={completedDiaries}
            currentGeneratingDiary={currentGeneratingDiary}
            activeDiaryIndex={activeDiaryIndex}
            setActiveDiaryIndex={setActiveDiaryIndex}
          />
        </ExpandableCard>
        
        <ExpandableCard title="阶段总结预览" isExpanded={true}>
          <AIStreamText
            content={summaryContent}
            isContentFinalized={summaryContent.isContentFinalized}
          />
        </ExpandableCard>
        
        <View style={styles.blank}></View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.generateBtn, currentAction === 'summary' && styles.btnDisabled]}
          onPress={handleGenerateDiaries}
          disabled={currentAction === 'summary' || isLoading}
        >
          {currentAction === 'diary' ? (
            <View style={styles.btnLoadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateBtnText}>生成中...</Text>
            </View>
          ) : (
            <Text style={styles.generateBtnText}>生成日记</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.generateBtn, styles.summaryBtn, currentAction === 'diary' && styles.btnDisabled]}
          onPress={handleGenerateSummary}
          disabled={currentAction === 'diary' || isLoading || events.length === 0}
        >
          {currentAction === 'summary' ? (
            <View style={styles.btnLoadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateBtnText}>生成中...</Text>
            </View>
          ) : (
            <Text style={styles.generateBtnText}>生成阶段总结</Text>
          )}
        </TouchableOpacity>
      </View>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold'
  },
  scrollContent: {
    flex: 1,
    width: '100%',
    padding: 16
  },
  progressText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#007AFF'
  },
  messageContainer: {
    marginTop: 12,
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f9f9f9'
  },
  messageTitle: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4
  },
  messageSuccessText: {
    fontSize: 12,
    color: '#34C759',
    lineHeight: 16,
    marginBottom: 2
  },
  messageSkipText: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
    marginBottom: 2
  },
  messageErrorText: {
    fontSize: 12,
    color: '#d32f2f',
    lineHeight: 16,
    marginBottom: 2
  },
  textInput: {
    width: '100%',
    height: 180,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    fontSize: 14,
    color: '#333',
    marginVertical: 8
  },
  eventText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    padding: 8
  },
  emptyDiaryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 8
  },
  emptyDiaryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center'
  },
  diaryNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    marginTop: 16,
    paddingVertical: 8
  },
  navArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f5f5f5'
  },
  navPageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  currentPage: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600'
  },
  pageSeparator: {
    fontSize: 16,
    color: '#999'
  },
  totalPage: {
    fontSize: 16,
    color: '#666'
  },
  blank: {
    width: '100%',
    height: 20
  },
  footer: {
    gap: 10,
    padding: 16,
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#f8f3f3'
  },
  generateBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF'
  },
  summaryBtn: {
    backgroundColor: '#34C759'
  },
  btnDisabled: {
    opacity: 0.6
  },
  btnLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  generateBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500'
  }
});