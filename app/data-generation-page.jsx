import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Alert, ActivityIndicator
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { getEventsByDateRange } from '@/db/eventDB';
import { useNavigation } from "expo-router";
import { formatPreviewContent, getPlainTextContent } from "@/utils/previewFormatter";
import DateSelector from "@/components/statistics/DateSelector";
import FormatSelector from "@/components/statistics/FormatSelector";
import PreviewBox from "@/components/statistics/PreviewBox";
import { captureRef } from 'react-native-view-shot';

const DataGenerationPage = () => {
  const navigation = useNavigation();
  
  // 状态管理
  const [selectedFormat, setSelectedFormat] = useState('txt');
  const [previewData, setPreviewData] = useState('请选择日期和格式生成预览...');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: dayjs(new Date()),
    end: dayjs(new Date())
  });
  const [events, setEvents] = useState([]);
  
  const handleDateChange = useCallback(async (startDate, endDate) => {
    setIsLoading(true);
    setDateRange({
      start: dayjs(startDate),
      end: dayjs(endDate)
    });
    const events = (await getEventsByDateRange(startDate, endDate, "asc"));
    
    setEvents(events);
    setIsLoading(false);
  }, [])
  
  // 存储纯文本内容（用于TXT/Markdown文件生成）
  const [plainTextContent, setPlainTextContent] = useState('');
  
  const previewRef = useRef(null);
  
  // 生成预览数据（调用事件查询接口）
  const generatePreview = useCallback(async () => {
    try {
      const { start: queryStart, end: queryEnd } = dateRange;
      const dateRangeText = queryStart.isSame(queryEnd, 'day')
        ? queryStart.format('YYYY-MM-DD')
        : `${queryStart.format('YYYY-MM-DD')} 至 ${queryEnd.format('YYYY-MM-DD')}`;
      
      // 无事件数据处理
      if(!events || events.length === 0) {
        setPreviewData(`⚠️ ${dateRangeText} 暂无数据`);
        setPlainTextContent('');
        return;
      }
      
      // 按格式生成预览内容
      let previewContent;
      if(['txt', 'markdown'].includes(selectedFormat)) {
        // 生成纯文本内容
        const plainContent = getPlainTextContent(
          selectedFormat,
          events,
          queryStart,
          queryEnd,
          dateRangeText
        );
        setPlainTextContent(plainContent);
        // 生成预览用的Text组件
        previewContent = <Text style={styles.previewText}>{plainContent}</Text>;
      } else {
        // Image
        previewContent = formatPreviewContent(
          selectedFormat,
          queryStart,
          queryEnd,
          events,
          styles,
          dateRangeText
        );
        setPlainTextContent(''); // 清空纯文本
      }
      
      setPreviewData(previewContent);
    } catch(error) {
      setPreviewData('❌ 预览生成失败，请重试');
      Alert.alert('错误', '获取事件数据失败：' + (error.message || '未知错误'));
      console.error('预览生成错误:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, events, selectedFormat]);
  
  // 内容到剪贴板
  const copyToClipboard = async (text) => {
    try {
      // 将预览数据写入剪贴板
      await Clipboard.setStringAsync(String(text));
      Alert.alert('成功', '内容已复制到剪贴板');
    } catch(error) {
      // 复制失败提示
      Alert.alert('失败', '复制内容出错，请重试');
      console.error('剪贴板复制错误:', error);
    }
  };
  
  // 触发数据导出
  const handleExport = async () => {
    try {
      if(['txt', 'markdown'].includes(selectedFormat)) {
        // 生成带日期的文件名
        const currentDate = dayjs().format('YYYYMMDD');
        const baseFileName = `事件数据_${currentDate}`;
        const fileExt = selectedFormat === 'markdown' ? 'md' : selectedFormat;
        const fileName = `${baseFileName}.${fileExt}`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        // 写入文件内容
        await FileSystem.writeAsStringAsync(fileUri, '\ufeff' + plainTextContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        await Sharing.shareAsync(fileUri, {
          mimeType: selectedFormat === 'txt' ? 'text/plain' : 'text/markdown',
          dialogTitle: `分享${selectedFormat === 'txt' ? 'TXT' : 'Markdown'}文件`,
          filename: fileName,
        });
      }
      // 图片导出逻辑
      else if(selectedFormat === 'image') {
        if(!previewRef.current) {
          throw new Error('预览区域未正确加载');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 捕获预览区域为图片
        const uri = await captureRef(previewRef.current, {
          format: 'png',
          quality: 1,
          result: 'tmpfile'
        });
        
        const targetPath = FileSystem.documentDirectory + `screenshot_${Date.now()}.png`;
        await FileSystem.copyAsync({
          from: uri,
          to: targetPath
        });
        
        // 分享
        await Sharing.shareAsync(targetPath, {
          mimeType: 'image/png',
          dialogTitle: '分享图片',
          UTI: 'public.png',
        });
      }
    } catch(error) {
      Alert.alert('错误', '导出失败：' + (error.message || '未知错误'));
      console.error('导出错误:', error);
    }
  };
  
  // 依赖变化时自动生成预览
  useEffect(() => {
    generatePreview().then();
  }, [dateRange, generatePreview, selectedFormat]);
  
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>数据生成与导出</Text>
      </View>
      
      {/* 主内容区 */}
      <ScrollView style={styles.content}>
        {/* 日期选择区域 */}
        <DateSelector onDataChange={ handleDateChange } />
        
        {/* 格式选择区域 */}
        <FormatSelector
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
        />
        
        {/* 预览区域 */}
        <PreviewBox
          ref={previewRef}
          isLoading={isLoading}
          previewData={previewData}
          showCopyBtn={['txt', 'markdown'].includes(selectedFormat)}
          onCopy={() => copyToClipboard(plainTextContent)}
          plainTextContent={plainTextContent}
        />
      </ScrollView>
      
      {/* 导出按钮 */}
      <TouchableOpacity
        style={styles.exportBtnContainer}
        onPress={handleExport}
        disabled={isLoading}
      >
        <View style={[styles.exportBtn, isLoading && styles.exportBtnDisabled]}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#fff" style={styles.exportIcon} />
              <Text style={styles.exportText}>导出数据</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8EBF2',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    marginRight: 12,
    padding: 8,
    zIndex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16
  },
  
  // Image 格式预览样式
  imagePreviewContainer: {
    gap: 20,
    paddingVertical: 8,
  },
  imageDailyBlock: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EBF2',
  },
  imageDailyHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  imageDailySubHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  imageDailyEvents: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    whiteSpace: 'pre-wrap',
    marginBottom: 12,
  },
  imageDailyChart: {
    marginTop: 8,
    height: 180,
  },
  imageTotalBlock: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#4A6CF7',
  },
  imageTotalHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6CF7',
    marginBottom: 4,
  },
  imageTotalSubHeader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  imageTotalChart: {
    marginTop: 8,
    height: 200,
  },
  
  exportBtnContainer: {
    padding: 10,
    paddingBottom: 25,
    elevation: 3,
    backgroundColor: '#fff',
    boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#4A6CF7'
  },
  exportBtnDisabled: {
    backgroundColor: '#A3B7FF',
  },
  exportIcon: {
    marginRight: 8,
  },
  exportText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default DataGenerationPage;