import { Feather, Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import React, { useState } from "react";
import {
  Alert, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import ThemeCard from "@/components/theme/ThemeCard";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";

export const HistoryMessage = ({ message }) => {
  const [isThoughtCollapsed, setIsThoughtCollapsed] = useState(true);
  
  const [showActionModal, setShowActionModal] = useState(false);
  
  const handleLongPress = () => {
    if (message.content) {
      setShowActionModal(true);
    } else {
      Alert.alert("提示", "没有可操作的内容");
    }
  };
  
  const copyContent = async () => {
    await Clipboard.setStringAsync(message.content);
    setShowActionModal(false);
    Alert.alert("提示", "复制成功");
  };
  
  return (
    <>
      {
        message.role === 'user' ? (
          <Pressable
            onLongPress={() => handleLongPress()}
            key={message.id}
            style={styles.userMessageContainer}
          >
            <View style={styles.userMessageBubble}>
              <Text style={styles.userMessageText}>{message.content}</Text>
            </View>
          </Pressable>
        ) : (
          <Pressable
            onLongPress={() => handleLongPress()}
            key={message.id}
            style={styles.aiMessageContainer}
          >
            <ThemeCard style={styles.aiMessageBubble}>
              {message.thought?.trim() && (
                <ThemeCard innerCard={true}>
                  <TouchableOpacity
                    style={styles.thoughtHeader}
                    onPress={() => setIsThoughtCollapsed(!isThoughtCollapsed)}
                  >
                    <Text style={styles.thoughtLabel}>思考</Text>
                    <Ionicons
                      name={isThoughtCollapsed ? 'chevron-down' : 'chevron-up'}
                      size={16}
                      color="#666"
                    />
                  </TouchableOpacity>
                  {!isThoughtCollapsed && (
                    <Text style={styles.thoughtText}>
                      {message.thought.trim()}
                    </Text>
                  )}
                </ThemeCard>
              )}
              
              <MarkdownRenderer content={message.content.trim()} />
            </ThemeCard>
          </Pressable>
        )
      }
      
      <Modal
        visible={showActionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowActionModal(false)}
      >
        <Pressable
          style={styles.modalBackground}
          onPress={() => setShowActionModal(false)}
        >
          <Pressable
            style={styles.actionContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.actionButton}
              onPress={copyContent}
            >
              <Feather name="copy" size={22} color="black" />
              <Text style={styles.actionText}>复制</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
};

const styles = StyleSheet.create({
  // 用户消息
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 10
  },
  userMessageBubble: {
    maxWidth: '100%',
    padding: 12,
    backgroundColor: '#2196F3',
    borderRadius: 10
  },
  userMessageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24
  },
  
  // AI消息
  aiMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  aiMessageBubble: {
    maxWidth: '100%',
    padding: 12,
    borderRadius: 10
  },
  
  thoughtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thoughtLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  thoughtText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  
  // 弹窗相关样式
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  actionContainer: {
    width: '80%',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
  },
  actionText: {
    marginLeft: 8,
    height: 20,
    lineHeight: 20,
    fontSize: 18,
    color: '#333',
  },
})