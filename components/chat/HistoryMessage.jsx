import React, { useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const HistoryMessage = ({ message }) => {
  const [isThoughtCollapsed, setIsThoughtCollapsed] = useState(true);
  
  if (message.role === 'user') {
    return (
      <View key={message.id} style={styles.userMessageContainer}>
        <View style={styles.userMessageBubble}>
          <Text style={styles.userMessageText}>{message.content}</Text>
        </View>
      </View>
    );
  }
  
  if (message.role === 'assistant') {
    const hasThought = !!message.thought?.trim();
    return (
      <View key={message.id} style={styles.aiMessageContainer}>
        <View style={styles.aiMessageBubble}>
          {hasThought && (
            <View style={styles.thoughtContainer}>
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
            </View>
          )}
          
          <View style={styles.outputContainer}>
            <Text style={styles.outputText}>
              {message.content.trim()}
            </Text>
          </View>
        </View>
      </View>
    );
  }
  
  // 未知角色消息默认空渲染
  return null;
};

const styles = StyleSheet.create({
  // 用户消息
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userMessageBubble: {
    maxWidth: '80%',
    padding: 12,
    marginRight: 8,
    backgroundColor: '#2196F3',
    borderRadius: 16
  },
  userMessageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  
  // AI消息
  aiMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aiMessageBubble: {
    maxWidth: '80%',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  thoughtContainer: {
    backgroundColor: '#f4f4f4',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#828181',
    marginBottom: 10,
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
  outputContainer: {
    padding: 10,
    minHeight: 20,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  outputText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
})