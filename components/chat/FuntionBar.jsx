import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, TextInput, Modal, TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateSelector from "@/components/statistics/DateSelector";
import ExpandableCard from "@/components/common/ExpandableCard";
import { getPlainTextContent } from "@/utils/previewFormatter";
import { getEventsByDateRange } from "@/db/eventDB";
import { AsyncStorage } from "expo-sqlite/kv-store";

const FunctionBar = ({
  onEventDataSelected,
  onPromptSelected
}) => {
  // 事件相关
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventsText, setEventsText] = useState("");
  
  // 根据选择日期获取事件数据
  const handleDateSelect = async (startDate, endDate) => {
    const events = await getEventsByDateRange(startDate, endDate, "asc");
    const eventsText = getPlainTextContent("txt", events);
    
    setEventsText(eventsText);
  };
  
  // 确认事件数据
  const handleConfirmEvent = () => {
    onEventDataSelected(eventsText);
    setShowEventSelector(false);
  };
  
  // 提示词相关
  const [promptTemplates, setPromptTemplates] = useState([]);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  
  // 组件挂载时从本地加载提示词
  useEffect(() => {
    const loadPromptTemplates = async () => {
      try {
        const storedTemplates = await AsyncStorage.getItem('promptTemplates');
        if (storedTemplates) {
          setPromptTemplates(JSON.parse(storedTemplates));
        } else {
          // 设置初始提示词
          const initialTemplates = [
            `请按分类逐一总结：
           1.简要内容
           2.存在的问题
           3.优化建议
           返回纯文本text格式而不是markdown格式
           最后给出整体总结和改进建议。`,
            "分析我的时间分配情况",
            "帮我生成明日计划",
            "统计我本周的工作时长",
            "按类别分析我的事件"
          ];
          setPromptTemplates(initialTemplates);
          await AsyncStorage.setItem('promptTemplates', JSON.stringify(initialTemplates));
        }
      } catch (error) {
        console.error('Failed to load prompt templates:', error);
      }
    };
    
    loadPromptTemplates().then();
  }, []);
  
  // 选择提示词
  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setCustomPrompt(prompt);
  };
  
  // 删除提示词方法
  const handleDeletePrompt = async (index) => {
    const deletedPrompt = promptTemplates[index];
    Alert.alert(
      "确认删除",
      "确定要删除这个提示词吗？",
      [
        {
          text: "取消",
          style: "cancel"
        },
        {
          text: "删除",
          style: "destructive",
          onPress: async () => {
            // 过滤掉要删除的提示词
            const newPromptTemplates = promptTemplates.filter((_, i) => i !== index);
            setPromptTemplates(newPromptTemplates);
            
            try {
              await AsyncStorage.setItem('promptTemplates', JSON.stringify(newPromptTemplates));
            } catch (error) {
              console.error('Failed to delete prompt template:', error);
              Alert.alert("失败", "删除提示词失败");
            }
            
            // 如果删除的是当前选中的提示词，清空选中状态
            if(selectedPrompt === deletedPrompt) {
              setSelectedPrompt("");
              if(customPrompt === deletedPrompt) {
                setCustomPrompt("");
              }
            }
          }
        }
      ]
    );
  };
  
  // 添加提示词方法
  const handleAddNewPrompt = async () => {
    if(promptTemplates.includes(customPrompt.trim())) {
      Alert.alert("警告", "此提示词已存在");
      return;
    }
    
    if (customPrompt.trim()) {
      const newTemplates = [...promptTemplates, customPrompt.trim()];
      setPromptTemplates(newTemplates);
      try {
        await AsyncStorage.setItem('promptTemplates', JSON.stringify(newTemplates));
        Alert.alert("成功", "已添加新的提示词");
      } catch (error) {
        console.error('Failed to save prompt template:', error);
        Alert.alert("失败", "保存提示词失败");
      }
    }
  };
  
  // 确认使用提示词
  const handleConfirmPrompt = () => {
    if(customPrompt.trim()) {
      onPromptSelected(customPrompt);
      setShowPromptModal(false);
    } else {
      Alert.alert("提示", "请输入提示词内容");
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.functionScroll}
      >
        <View style={styles.functionsContainer}>
          <TouchableOpacity
            style={styles.functionButton}
            onPress={() => setShowEventSelector(true)}
          >
            <Ionicons name="calendar" size={20} color="#4A6CF7" />
            <Text style={styles.functionText}>事件数据</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.functionButton}
            onPress={() => setShowPromptModal(true)}
          >
            <Ionicons name="chatbox" size={20} color="#4A6CF7" />
            <Text style={styles.functionText}>提示词</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* 事件选择器模态框 */}
      <Modal
        visible={showEventSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventSelector(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowEventSelector(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>选择事件日期</Text>
                  <TouchableOpacity
                    onPress={() => setShowEventSelector(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView
                  style={{
                    flex: 1,
                    paddingHorizontal: 5
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  <DateSelector onDataChange={handleDateSelect} />
                  
                  <ExpandableCard title="事件数据">
                    <Text>{eventsText || "暂无数据"}</Text>
                  </ExpandableCard>
                </ScrollView>
                
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.cancelButton]}
                    onPress={() => setShowEventSelector(false)}
                  >
                    <Text style={styles.modalCancelText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalConfirmButton]}
                    onPress={handleConfirmEvent}
                  >
                    <Text style={styles.modalConfirmText}>确认</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 提示词选择模态框 */}
      <Modal
        visible={showPromptModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPromptModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPromptModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>选择或编辑提示词</Text>
                  <TouchableOpacity
                    onPress={() => setShowPromptModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView
                  style={{
                    flex: 1,
                    paddingHorizontal: 5
                  }}
                  showsVerticalScrollIndicator={false}
                >
                  <ExpandableCard title="预设提示词">
                    <View style={styles.promptListContent}>
                      {promptTemplates.map((item, index) => (
                        <TouchableOpacity
                          key={index.toString()}
                          style={[
                            styles.promptItem,
                            selectedPrompt === item && styles.selectedPromptItem
                          ]}
                          onPress={() => handleSelectPrompt(item)}
                        >
                          <Text style={styles.promptItemText}>({index
                            + 1}) {item}</Text>
                          
                          <TouchableOpacity
                            style={styles.deletePromptButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeletePrompt(index).then();
                            }}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FF5252" />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ExpandableCard>
                  
                  {/* 编辑提示词卡片 */}
                  <ExpandableCard title="编辑提示词">
                    <View style={styles.promptEditorContent}>
                      <TextInput
                        style={styles.promptInput}
                        multiline
                        value={customPrompt}
                        onChangeText={setCustomPrompt}
                        placeholder="请输入提示词..."
                      />
                    </View>
                  </ExpandableCard>
                </ScrollView>
                
                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={handleAddNewPrompt}
                  >
                    <Text style={styles.modalCancelText}>添加提示词</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.modalConfirmButton]}
                    onPress={handleConfirmPrompt}
                  >
                    <Text style={[styles.modalConfirmText, styles.confirmText]}>
                      确认使用
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff"
  },
  functionScroll: {
    paddingVertical: 8,
  },
  functionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  functionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#F5F7FA",
    borderRadius: 8,
    minWidth: 120,
    justifyContent: "center",
  },
  functionText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  
  // 模态框核心样式
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    flexDirection: "column",
    width: "100%",
    maxHeight: "80%",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  modalHeader: {
    flex: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
    hitSlop: {
      top: 8,
      bottom: 8,
      left: 8,
      right: 8
    }
  },
  modalActionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    flex: 0,
  },
  modalActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    hitSlop: {
      top: 10,
      bottom: 10,
      left: 10,
      right: 10
    },
    backgroundColor: "#eee"
  },
  modalCancelButton: {
    backgroundColor: "#F5F7FA",
    elevation: 5,
  },
  modalConfirmButton: {
    backgroundColor: "#4A6CF7",
    elevation: 5,
  },
  modalCancelText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "500",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  
  // 提示词相关样式
  promptListContent: {
    padding: 16,
  },
  promptEditorContent: {
    padding: 16,
  },
  deletePromptButton: {
    padding: 4,
    backgroundColor: 'transparent'
  },
  promptItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB'
  },
  
  selectedPromptItem: {
    backgroundColor: '#E8EEFF',
    borderLeftWidth: 3,
    borderLeftColor: '#4A6CF7',
  },
  promptItemText: {
    flex: 1,
    marginRight: 24,
    color: '#333',
    fontSize: 14,
    backgroundColor: 'transparent'
  },
  promptInput: {
    minHeight: 100,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    textAlignVertical: "top",
    fontSize: 15,
    color: "#333",
  }
});

export default FunctionBar;