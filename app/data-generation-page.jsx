import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform, Alert, ActivityIndicator
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { getEventsByDateRange } from '@/db/eventDB';
import { useNavigation } from "expo-router";
import { formatPreviewContent, getPlainTextContent } from "@/utils/statisticsUtils/previewFormatter";
import DateSelector from "@/components/statistics/DateSelector";
import FormatSelector from "@/components/statistics/FormatSelector";
import PreviewBox from "@/components/statistics/PreviewBox";
import { captureRef } from 'react-native-view-shot';

// 支持的导出格式配置
const SUPPORTED_FORMATS = [
  {
    id: 'txt',
    name: '纯文本 (TXT)',
    icon: 'envelope-open-text'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    icon: 'markdown'
  },
  {
    id: 'image',
    name: '图片 (PNG)',
    icon: 'image'
  }
];

const DataGenerationPage = () => {
  const navigation = useNavigation();
  
  // 状态管理
  const [dateType, setDateType] = useState('single');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('single');
  const [selectedFormat, setSelectedFormat] = useState('txt');
  const [previewData, setPreviewData] = useState('请选择日期和格式生成预览...');
  const [isLoading, setIsLoading] = useState(false);
  
  // 存储纯文本内容（用于TXT/Markdown文件生成）
  const [plainTextContent, setPlainTextContent] = useState('');
  
  const previewRef = useRef(null);
  
  // 显示日期选择器
  const handleShowDatePicker = (target) => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };
  
  // 处理日期选择变更
  const handleDateChange = (event, newDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // iOS保持显示，Android选择后关闭
    if(!newDate) return;
    
    // 更新对应日期状态
    if(datePickerTarget === 'single') {
      setSelectedDate(newDate);
    } else if(datePickerTarget === 'start') {
      setStartDate(newDate);
    } else if(datePickerTarget === 'end') {
      setEndDate(newDate);
    }
  };
  
  // 生成预览数据（调用事件查询接口）
  const generatePreview = async () => {
    setIsLoading(true);
    try {
      // 直接传递day.js对象到查询接口
      const queryStart = dateType === 'single'
        ? dayjs(selectedDate)
        : dayjs(startDate);
      const queryEnd = dateType === 'single'
        ? dayjs(selectedDate)
        : dayjs(endDate);
      
      // 查询事件数据
      const originalEvents = await getEventsByDateRange(queryStart, queryEnd);
      const events = originalEvents.filter(item => item.status === 'completed')
      const dateRangeText = queryStart.isSame(queryEnd, 'day')
        ? queryStart.format('YYYY-MM-DD')
        : `${queryStart.format('YYYY-MM-DD')} 至 ${queryEnd.format('YYYY-MM-DD')}`;
      
      // 无事件数据处理
      if(!events || events.length === 0) {
        setPreviewData(`⚠️ ${dateRangeText} 暂无数据`);
        setPlainTextContent('');
        return;
      }
      
      // 按日期分组事件
      const eventsByDate = events.reduce((acc, event) => {
        // 提取事件的「年月日」作为分组键
        const eventDate = dayjs(event.start_datetime).format('YYYY-MM-DD');
        if(!acc[eventDate]) {
          acc[eventDate] = []; // 初始化该日期的事件数组
        }
        acc[eventDate].push(event); // 归并当天事件
        return acc;
      }, {});
      
      // 按格式生成预览内容
      let previewContent;
      if(['txt', 'markdown'].includes(selectedFormat)) {
        // 生成纯文本内容
        const plainContent = getPlainTextContent(
          selectedFormat,
          eventsByDate,
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
          eventsByDate,
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
  };
  
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
  }, [dateType, selectedDate, startDate, endDate, selectedFormat]);
  
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
        <DateSelector
          dateType={dateType}
          setDateType={setDateType}
          selectedDate={selectedDate}
          startDate={startDate}
          endDate={endDate}
          handleShowDatePicker={handleShowDatePicker}
          styles={styles}
        />
        
        {/* 格式选择区域 */}
        <FormatSelector
          formats={SUPPORTED_FORMATS}
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
          styles={styles}
        />
        
        {/* 预览区域 */}
        <PreviewBox
          ref={previewRef}
          isLoading={isLoading}
          previewData={previewData}
          styles={styles}
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
      
      {/* 日期选择器（跨平台兼容） */}
      {showDatePicker && (
        <DateTimePicker
          value={
            datePickerTarget === 'single' ? selectedDate :
              datePickerTarget === 'start' ? startDate : endDate
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // 禁止选择未来日期（可根据需求调整）
        />
      )}
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
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  copyBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  copyBtnIcon: {
    color: '#4A6CF7',
  },
  dateTypeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
  },
  dateTypeBtnActive: {
    backgroundColor: '#4A6CF7',
  },
  dateTypeText: {
    fontSize: 14,
    color: '#666',
  },
  dateTypeTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  datePickerContainer: {
    gap: 8,
  },
  dateSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatCard: {
    width: '46%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  formatCardActive: {
    backgroundColor: '#4A6CF7',
  },
  formatText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  formatTextActive: {
    color: '#fff',
  },
  
  previewContainer: {
    minHeight: 200,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  previewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    whiteSpace: 'pre-wrap', // 保留换行符
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
  
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
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