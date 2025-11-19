import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView
} from "react-native";
import { useRoute, useNavigation } from '@react-navigation/native';
import { getNoteById, updateNote, createNote } from '@/db/notesDB';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { formatDatetime } from "@/utils/formatTimeUtils";
import Icon from "@/components/common/Icon";
import { useTheme } from "@/context/ThemeContext";
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";

export default function DiaryEdit() {
  const { theme } = useTheme();
  
  const route = useRoute();
  const navigation = useNavigation();
  const nodeId = route.params?.nodeId;
  
  const [diary, setDiary] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  
  // 用于实现 撤销/前进 操作
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  
  // 加载日记内容或初始化新日记
  useEffect(() => {
    const initializePage = async () => {
      if(nodeId) {
        setIsLoading(true);
        const data = await getNoteById(nodeId);
        setIsLoading(false);
        
        if(data) {
          setDiary({
            title: data.title,
            content: data.content,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          });
          setContent(data.content);
          setTitle(data.title || '');
          
          setHistory([data.content]);
          setHistoryIndex(0);
          
          setOriginalTitle(data.title || '');
          setOriginalContent(data.content || '');
        } else {
          Alert.alert('错误', '未找到指定的日记');
          navigation.goBack();
        }
      } else {
        const today = new Date().toISOString();
        setDiary({
          title: '',
          content: '',
          createdAt: today,
          updatedAt: today
        });
        setTitle('');
        
        setHistory(['']);
        setHistoryIndex(0);
        
        setOriginalTitle('');
        setOriginalContent('');
      }
    };
    
    initializePage().catch(err => {
      console.error("Failed to initialize page:", err);
      Alert.alert('错误', '页面加载失败');
    });
  }, [nodeId, navigation]);
  
  useEffect(() => {
    if(content !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(content);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [content, history, historyIndex]);
  
  // 撤销功能
  const handleUndo = () => {
    if(historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setContent(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };
  
  // 重做功能
  const handleRedo = () => {
    if(historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setContent(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };
  
  const isContentChanged = () => {
    const trimmedContent = content.trim();
    return title.trim() !== originalTitle.trim() || trimmedContent !== originalContent.trim();
  };
  // 保存日记（新建或更新）
  const handleSave = async () => {
    if(!title.trim()) {
      Alert.alert('提示', '标题不能为空');
      return;
    }
    
    const trimmedContent = content.trim();
    if(!trimmedContent) {
      Alert.alert('提示', '内容不能为空');
      return;
    }
    
    setIsLoading(true);
    let success = false;
    const updatedAt = new Date().toISOString(); // 获取当前时间作为更新时间
    
    try {
      if(nodeId) {
        // 更新日记时，同时更新标题、内容和更新时间
        success = await updateNote(nodeId, {
          title,
          content: trimmedContent
        });
        // 更新本地状态以反映最新变化
        setDiary(prev => ({
          ...prev,
          title,
          content: trimmedContent,
          updatedAt
        }));
      } else {
        const createdAt = new Date().toISOString();
        const newDiaryId = await createNote({
          title,
          content: trimmedContent
        });
        success = !!newDiaryId;
        if(success) {
          setDiary(prev => ({
            ...prev,
            id: newDiaryId,
            title,
            content: trimmedContent,
            createdAt,
            updatedAt
          }));
        }
      }
    } catch(error) {
      console.error("Failed to save diary:", error);
    } finally {
      setIsLoading(false);
    }
    
    if(success) {
      Alert.alert('成功', nodeId ? '日记已更新' : '日记已创建');
      navigation.goBack();
    } else {
      Alert.alert('失败', '保存日记时出错，请稍后重试');
    }
  };
  
  if(isLoading && !diary) { // 调整加载判断，确保日记数据加载完成
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  
  // 计算字数
  const wordCount = content.length || 0;
  
  return (
    <ThemeSafeAreaView style={styles.container}>
      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Icon lib="Ionicons" name="arrow-back" size={24} />
        </TouchableOpacity>
        
        <View style={styles.controls}>
          {/* 撤销 */}
          <TouchableOpacity
            onPress={handleUndo}
            disabled={historyIndex <= 0 || isLoading}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="undo-variant"
              size={24}
              color={
                historyIndex <= 0 || isLoading
                  ? theme.colors.interactiveLight
                  : theme.colors.interactive}
            />
          </TouchableOpacity>
          
          {/* 重做 */}
          <TouchableOpacity
            onPress={handleRedo}
            disabled={historyIndex >= history.length - 1 || isLoading}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="redo-variant"
              size={24}
              color={
                historyIndex >= history.length - 1 || isLoading
                  ? theme.colors.interactiveLight
                  : theme.colors.interactive
              }
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleSave}
            style={styles.iconButton}
          >
            <Ionicons
              name="checkmark"
              size={24}
              color={
                isContentChanged() && !isLoading
                  ? theme.colors.interactive
                  : theme.colors.interactiveLight
              }
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 加载状态指示器 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
      
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContent}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="请输入标题"
            placeholderTextColor="#999"
            editable={!isLoading}
            autoFocus={!nodeId}
            maxLength={100}
          />
          
          <View style={styles.infoBar}>
            {/* 左侧信息：更新时间 | 字数 */}
            <View style={styles.infoLeft}>
              <Text style={styles.infoText}>
                更新: {formatDatetime(diary?.updatedAt)} | {wordCount}字
              </Text>
            </View>
            
            {/* 右侧信息：创建时间 */}
            <View style={styles.infoRight}>
              <Text style={[{ textAlign: 'right' }, styles.infoText]}>
                创建: {formatDatetime(diary?.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* 内容输入区 */}
        <TextInput
          style={styles.contentInput}
          multiline
          value={content}
          onChangeText={setContent}
          placeholder="请输入日记内容..."
          textAlignVertical="top"
          editable={!isLoading}
        />
      </ScrollView>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    zIndex: 10,
  },
  
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  
  contentContainer: {
    flex: 1,
    gap: 12,
  },
  titleContent: {
    paddingBottom: 8,
  },
  titleInput: {
    minHeight: 30,
    lineHeight: 30,
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLeft: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRight: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    numberOfLines: 1,
  },
  infoSeparator: {
    fontSize: 12,
    color: '#666',
  },
  
  contentInput: {
    flex: 1,
    minHeight: '88%',
    fontSize: 16,
    lineHeight: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  }
});