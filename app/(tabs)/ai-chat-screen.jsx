import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Ionicons } from '@expo/vector-icons';
import {
  createConversation,
  createMessage,
  deleteConversation,
  getAllConversations,
  getMessagesForConversation, updateConversation
} from '@/db/aiDialogueDB';
import AIStreamText from "@/components/common/AIStreamText";
import EmptyContainer from "@/components/common/EmptyContainer";
import { HistoryMessage } from "@/components/chat/HistoryMessage";
import { flushSync } from "react-dom";
import { getLocalDateTimeByDayjs } from "@/utils/formatTimeUtils";
import FunctionBar from "@/components/chat/FuntionBar";
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";
import ThemeCard from "@/components/Theme/ThemeCard";
import Icon from "@/components/common/Icon";
import { useTheme } from "@/context/ThemeContext";
import ThemeTextInput from "@/components/Theme/ThemeTextInput";
import AISettingsModal from "@/components/chat/AISettingsModal";
import { useAIConfig } from "@/context/AIConfigContext";
import AiDiaryService from "@/db/services/AiDiaryService";

const AiChatScreen = () => {
  const { theme } = useTheme();
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { aiConfig } = useAIConfig();
  const aiDiaryService = new AiDiaryService(
    aiConfig.apiKey,
    aiConfig.model,
    aiConfig.apiBaseUrl
  );
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [currentAIContent, setCurrentAIContent] = useState({
    thought: '',
    output: ''
  });
  const [isContentFinalized, setIsContentFinalized] = useState(false);
  
  const messageScrollRef = useRef(null);
  const inputRef = useRef(null);
  
  // 新建对话
  const handleCreateNewConversation = useCallback(async () => {
    const title = getLocalDateTimeByDayjs();
    
    try {
      const latestConversations = await getAllConversations();
      
      // 判断最新对话是否为空消息, 空消息 -> 更新标题; 非空消息 -> 新建对话
      if(latestConversations.length > 0) {
        const latestConversation = latestConversations[0];
        const latestMessages = await getMessagesForConversation(latestConversation.id);
        
        if(latestMessages.length === 0) {
          await updateConversation(latestConversation.id, {
            title
          });
          setConversations(prev =>
            prev.map(convo =>
              convo.id === latestConversation.id
                ? {
                  ...convo,
                  title
                }
                : convo
            )
          );
          
          setCurrentConversationId(latestConversation.id);
          setSidebarVisible(false);
          return;
        }
      }
      
      const newConversationId = await createConversation({ title });
      setCurrentConversationId(newConversationId);
      await fetchConversationList();
      setMessages([]);
      setSidebarVisible(false);
    } catch(err) {
      console.error('创建新对话失败：', err);
      Alert.alert('错误', '创建对话失败，请重试');
    }
  }, []);
  
  // 初始化聊天窗口
  useEffect(() => {
    const initChat = async () => {
      try {
        const fetchedConversations = await getAllConversations();
        setConversations(fetchedConversations);
        
        // 若有历史对话，默认选择最新的；若无，创建默认对话
        if(fetchedConversations.length > 0) {
          const latestConversation = fetchedConversations[0];
          setCurrentConversationId(latestConversation.id);
          await loadConversationMessages(latestConversation.id);
        } else {
          await handleCreateNewConversation();
        }
      } catch(err) {
        console.error('初始化聊天失败：', err);
        Alert.alert('错误', '加载历史对话失败，请重试');
      }
    };
    
    initChat().then();
  }, [handleCreateNewConversation]);
  
  // 滚动到底部
  useEffect(() => {
    if(messages.length > 0) {
      messageScrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);
  
  const fetchConversationList = async () => {
    // 1. 先获取最新数据
    const latestConversations = await getAllConversations();
    // 2. 更新状态
    setConversations(latestConversations);
    // 3. 直接使用这个返回值（它就是最新的）
    return latestConversations;
  };
  
  // 加载指定对话的消息
  const loadConversationMessages = async (conversationId) => {
    try {
      const fetchedMessages = await getMessagesForConversation(conversationId);
      setMessages(fetchedMessages);
      setIsAIGenerating(false);
      setCurrentAIContent({
        thought: '',
        output: ''
      });
      setIsContentFinalized(false);
    } catch(err) {
      console.error('加载对话消息失败：', err);
      Alert.alert('错误', '无法加载当前对话内容');
    }
  };
  
  // 切换对话
  const handleSwitchConversation = async (conversationId) => {
    setCurrentConversationId(conversationId);
    await loadConversationMessages(conversationId);
    setSidebarVisible(false);
  };
  
  // 删除对话
  const handleDeleteConversation = async (conversationId, e) => {
    e.stopPropagation();
    
    // 记录是否是最后一个对话
    const isLastConversation = conversations.length === 1;
    
    Alert.alert(
      '确认删除',
      '此对话及所有消息将被永久删除，是否继续？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConversation(conversationId);
              // 更新对话列表
              const latestConversations = await fetchConversationList();
              // 若删除的是当前对话，切换到最新对话
              if(currentConversationId === conversationId) {
                // 如果是最后一个对话，删除后创建新对话
                if(isLastConversation) {
                  await handleCreateNewConversation();
                } else {
                  // 否则切换到最新对话
                  const latestConversation = latestConversations[0];
                  setCurrentConversationId(latestConversation.id);
                  await loadConversationMessages(latestConversation.id);
                }
              }
            } catch(err) {
              console.error('删除对话失败：', err);
              Alert.alert('错误', '删除对话失败，请重试');
            }
          }
        }
      ]
    );
  };
  
  const handleSendMessage = async () => {
    const userInput = inputText.trim();
    if(!userInput || !currentConversationId) {
      return;
    }
    
    try {
      if(isAIGenerating) {
        await handleStop();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setInputText('');
      setIsAIGenerating(true);
      setCurrentAIContent({
        thought: '',
        output: ''
      });
      setIsContentFinalized(false);
      
      const userMessage = {
        conversation_id: currentConversationId,
        role: 'user',
        content: userInput
      };
      const userMessageId = await createMessage(userMessage);
      
      flushSync(() => {
        setMessages(prev => [
          ...prev, {
            id: userMessageId || Date.now(),
            ...userMessage,
            created_at: new Date().toISOString()
          }
        ]);
      });
      
      const aiResult = await aiDiaryService.generateContent(userInput, {
        onThought: (partialThought) => {
          setCurrentAIContent(prev => ({
            ...prev,
            thought: partialThought
          }));
        },
        onOutput: (partialOutput) => {
          setCurrentAIContent(prev => ({
            ...prev,
            output: partialOutput
          }));
        }
      });
      
      const aiMessage = {
        conversation_id: currentConversationId,
        role: 'assistant',
        thought: aiResult.thought,
        content: aiResult.output
      };
      const aiMessageId = await createMessage(aiMessage);
      setMessages(prev => [
        ...prev, {
          id: aiMessageId || Date.now(),
          ...aiMessage,
          created_at: new Date().toISOString()
        }
      ]);
      setCurrentAIContent({
        thought: '',
        output: ''
      });
      setIsContentFinalized(true);
      
      // 标题生成
      const isFirstUserMessage = messages.length === 0;
      if(isFirstUserMessage) {
        const newTitle = await aiDiaryService.updateConversationTitle(userInput);
        await updateConversation(currentConversationId, { title: newTitle });
        setConversations(prev =>
          prev.map(convo =>
            convo.id === currentConversationId
              ? {
                ...convo,
                title: newTitle
              }
              : convo
          )
        );
      }
    } catch(err) {
      console.error('发送消息失败：', err);
      Alert.alert('错误', err.message || '发送消息失败，请检查网络');
      setIsAIGenerating(false);
      setIsContentFinalized(true);
    } finally {
      setIsAIGenerating(false);
    }
  };
  
  // 停止 ai 回复
  const handleStop = async () => {
    aiDiaryService.pauseRequest();
    
    const updatedAIContent = {
      ...currentAIContent,
      output: `${currentAIContent.output} [已停止]`
    };
    setCurrentAIContent(updatedAIContent);
    
    if(currentConversationId) {
      try {
        const aiMessage = {
          conversation_id: currentConversationId,
          role: 'assistant',
          thought: updatedAIContent.thought,
          content: updatedAIContent.output
        };
        
        const messageId = await createMessage(aiMessage);
        flushSync(() => {
          setMessages(prev => [
            ...prev,
            {
              id: messageId || Date.now(),
              ...aiMessage,
              created_at: new Date().toISOString()
            }
          ]);
        });
      } catch(err) {
        console.error('暂停时保存AI消息失败：', err);
        Alert.alert('错误', '保存已停止的AI内容失败，请重试');
      }
    }
    
    flushSync(() => {
      setIsAIGenerating(false);
      setIsContentFinalized(true);
    });
    
    
    return Promise.resolve();
  };
  
  // 渲染正在生成的 ai 消息
  const renderPendingAIMessage = () => {
    if(!isAIGenerating) return null;
    
    return (
      <View key="pending-ai-message" style={styles.aiMessageContainer}>
        <View style={styles.aiMessageBubble}>
          <AIStreamText
            content={currentAIContent}
            speed={30}
            isContentFinalized={isContentFinalized}
          />
          {!isContentFinalized && (
            <TouchableOpacity onPress={handleStop}>
              <View style={styles.loadingIndicator}>
                <FontAwesome5 name="pause-circle" size={16} color="666" style={styles.loadingIcon} />
                <Text style={styles.loadingText}>AI正在回复 ...</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  
  return (
    <ThemeSafeAreaView style={styles.container} edges={['top']}>
      <ThemeCard style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconContainer}
          onPress={() => setSidebarVisible(true)}
        >
          <Icon lib="Ionicons" name="menu" size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: theme.colors.interactive }]}>
            {conversations.find(c => c.id === currentConversationId)?.title || '新对话'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.headerIconContainer}
          onPress={() => setShowSettingsModal(true)}
        >
          <Icon lib="Ionicons" name="settings" size={24} />
        </TouchableOpacity>
      </ThemeCard>
      
      {/* 聊天消息区域 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          ref={messageScrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* 空状态提示 */}
          {messages.length === 0 && !isAIGenerating && (
            <EmptyContainer
              icon="chatbubbles"
              IconComponent={Ionicons}
              text="开始与AI对话吧~"
            />
          )}
          
          {/* 历史消息 */}
          {messages.map(message => (
            <React.Fragment key={message.id}>
              <HistoryMessage message={message} />
            </React.Fragment>
          ))}
          
          {renderPendingAIMessage()}
        </ScrollView>
        
        {/* 底部输入框区域 */}
        <FunctionBar
          onEventDataSelected={(data) => {
            setInputText(prev => prev ? `${prev}\n${data}` : data);
          }}
          onPromptSelected={(prompt) => {
            setInputText(prev => prev ? `${prev}\n\n${prompt}` : prompt);
          }}
        />
        <View style={styles.inputContainer}>
          <ThemeTextInput
            ref={inputRef}
            style={styles.input}
            placeholder="输入消息..."
            value={inputText}
            onChangeText={setInputText}
            multiline={true}
            maxHeight={120} // 输入框最大高度（防止过长）
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: theme.colors.interactive }]}
            onPress={handleSendMessage}
          >
            <Icon lib="Ionicons" name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* 历史对话侧边栏 */}
      <Modal
        visible={sidebarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setSidebarVisible(false)}
      >
        <View style={styles.sidebarWrapper}>
          <Pressable
            style={styles.sidebarOverlay}
            onPress={() => setSidebarVisible(false)}
          />
          
          <View style={styles.sidebarContent}>
            <TouchableOpacity
              style={styles.newConversationBtn}
              onPress={() => handleCreateNewConversation()}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.newConversationText}>新建对话</Text>
            </TouchableOpacity>
            
            <ScrollView style={styles.conversationList}>
              {conversations.map(conversation => (
                <TouchableOpacity
                  key={conversation.id}
                  style={[
                    styles.conversationItem,
                    currentConversationId === conversation.id && styles.activeConversation
                  ]}
                  onPress={() => handleSwitchConversation(conversation.id)}
                >
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationTitle} numberOfLines={1}>
                      {conversation.title}
                    </Text>
                    <Text style={styles.conversationTime}>
                      {conversation.updated_at}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteConversationBtn}
                    onPress={(e) => handleDeleteConversation(conversation.id, e)}
                  >
                    <Ionicons name="trash" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      <AISettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  
  // 顶部导航栏
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
  
  // 历史对话侧边栏
  sidebarWrapper: {
    flex: 1,
    position: 'relative',
  },
  sidebarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sidebarContent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // 新建对话按钮
  newConversationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  newConversationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  
  // 对话列表
  conversationList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  activeConversation: {
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  conversationInfo: {
    flex: 1,
    marginRight: 8,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  conversationTime: {
    fontSize: 12,
    color: '#999',
  },
  deleteConversationBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 聊天区域
  chatContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  messageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageListContent: {
    paddingVertical: 16,
  },
  
  // AI加载中提示
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
  },
  loadingIcon: {
    marginRight: 8
  },
  loadingText: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  
  // 底部输入框
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minHeight: 60,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    minHeight: 30,
    maxHeight: 200,
    lineHeight: 30,
    padding: 12,
    marginRight: 8,
    borderRadius: 24,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  sendBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  
  settingLabel: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    fontSize: 14,
    color: '#666'
  },
  modelPresetContainer: {
    marginBottom: 12,
    height: 36,
  },
  modelPresetContent: {
    gap: 8,
    paddingVertical: 4,
  },
  modelPresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeModelPresetBtn: {
    backgroundColor: '#2196F3',
  },
  modelPresetText: {
    fontSize: 14,
    color: '#333',
  },
  activeModelPresetText: {
    color: '#fff',
    fontWeight: '500',
  }
});

export default AiChatScreen;