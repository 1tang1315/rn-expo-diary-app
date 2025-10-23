import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AIStreamText = ({
  content = {},
  speed = 30,
  isContentFinalized = false
}) => {
  const timerRef = useRef(null);
  
  const [display, setDisplay] = useState({
    thought: '',
    output: ''
  });
  const [collapsed, setCollapsed] = useState(false);
  
  const thoughtText = (content.thought || '').trim();
  const outputText = (content.output || '').trim();
  
  const [showOutput, setShowOutput] = useState(false);
  const displayProgressRef = useRef({
    thought: 0,
    output: 0
  });
  const fullContentRef = useRef({
    thought: '',
    output: ''
  });
  const hasAutoCollapsedRef = useRef(false);
  
  useEffect(() => {
    hasAutoCollapsedRef.current = false;
    
    // 清理上一个计时器
    if(timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const thoughtText = (content.thought || '').trim();
    const outputText = (content.output || '').trim();
    
    // 若最终内容或 speed=0，则直接显示
    if(isContentFinalized || speed <= 0) {
      setDisplay({
        thought: thoughtText,
        output: outputText
      });
      displayProgressRef.current = {
        thought: thoughtText.length,
        output: outputText.length
      };
      fullContentRef.current = {
        thought: thoughtText,
        output: outputText
      };
      return;
    }
    
    // 如果新内容比我们上次记录的完整内容短，说明是全新的内容流，需要重置
    if(thoughtText.length < fullContentRef.current.thought.length || outputText.length < fullContentRef.current.output.length) {
      setDisplay({
        thought: '',
        output: ''
      });
      displayProgressRef.current = {
        thought: 0,
        output: 0
      };
      fullContentRef.current = {
        thought: '',
        output: ''
      };
    }
    
    // 更新完整内容的引用
    fullContentRef.current = {
      thought: thoughtText,
      output: outputText
    };
    
    const chunkSize = 3;
    
    timerRef.current = setInterval(() => {
      setDisplay(prev => {
        const {
          thought: thoughtProgress,
          output: outputProgress
        } = displayProgressRef.current;
        
        let nextThought = prev.thought;
        let nextOutput = prev.output;
        
        // 如果思考部分还没显示完
        if(thoughtProgress < thoughtText.length) {
          const endIndex = Math.min(thoughtProgress + chunkSize, thoughtText.length);
          nextThought = thoughtText.slice(0, endIndex);
          displayProgressRef.current.thought = endIndex;
        }
        // 如果思考部分已显示完，但输出部分还没显示完
        else if(outputProgress < outputText.length) {
          if(!hasAutoCollapsedRef.current) {
            setTimeout(() => {
              setCollapsed(true);
              setShowOutput(true);
            }, 500);
            // 将标志位设为 true，确保此逻辑只执行一次
            hasAutoCollapsedRef.current = true;
          }
          
          const endIndex = Math.min(outputProgress + chunkSize, outputText.length);
          nextOutput = outputText.slice(0, endIndex);
          displayProgressRef.current.output = endIndex;
        }
        
        // 如果全部显示完毕
        if(displayProgressRef.current.thought >= thoughtText.length && displayProgressRef.current.output >= outputText.length) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        return {
          thought: nextThought,
          output: nextOutput
        };
      });
    }, speed);
    
    return () => clearInterval(timerRef.current);
  }, [content, speed, isContentFinalized]);
  
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {thoughtText ? (
          <View style={styles.thoughtContainer}>
            <TouchableOpacity
              style={styles.thoughtHeader}
              onPress={() => setCollapsed(!collapsed)}
            >
              <Text style={styles.thoughtLabel}>思考</Text>
              <Ionicons
                name={collapsed ? 'chevron-down' : 'chevron-up'}
                size={16}
                color="#666"
              />
            </TouchableOpacity>
            {!collapsed && (
              <Text style={styles.thoughtText}>{display.thought}</Text>
            )}
          </View>
        ) : null}
        
        {outputText && showOutput ? (
          <View style={styles.outputContainer}>
            <Text style={styles.outputText}>{display.output}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  scrollView: { flex: 1 },
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
});

export default AIStreamText;
