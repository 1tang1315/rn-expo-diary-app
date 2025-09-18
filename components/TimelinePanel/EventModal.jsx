import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Modal, Button, StyleSheet, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { categoryIcons, statusColors, statusTextMap } from '@/constants/timelineConstants';
import {
  createEvent,
  getCommonTitlesByCategory,
  updateEvent,
  deleteEvent as deleteEventApi,
} from "@/db/eventDB";

/**
 * 事件添加/编辑弹窗
 * @props {boolean} visible - 弹窗显示状态
 * @props {Function} onClose - 关闭弹窗回调
 * @props {Object|null} currentEvent - 当前编辑的事件（null 为新增）
 * @props {Array} tabOrder - 分类列表（用于分类选择）
 * @props {Date} selectedDate - 父组件选中的日期（用于默认日期）
 * @props {Function} onRefresh - 通知父组件刷新数据
 */
const EventModal = ({
  visible,
  onClose,
  currentEvent,
  tabOrder,
  selectedDate,
  onRefresh
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDatetime: new Date(),
    endDatetime: new Date(new Date().getTime() + 10 * 60 * 1000),
    icon: 'event-note',
    category: 'daily',
    status: 'upcoming'
  });
  
  // 表单初始化逻辑
  useEffect(() => {
    if (!visible) return;
    
    if (currentEvent) {
      // 编辑模式初始化
      const initData = {
        title: currentEvent.title,
        description: currentEvent.description,
        startDatetime: new Date(currentEvent.startDatetime),
        endDatetime: new Date(currentEvent.endDatetime),
        icon: currentEvent.icon,
        category: currentEvent.category,
        status: currentEvent.status || 'upcoming'
      };
      
      setFormData(initData);
      fetchCommonTitles(initData.category).then();
    } else {
      // 新增模式初始化
      const defaultCategory = tabOrder.find(tab => !tab.isFixed)?.id || 'daily';
      const defaultIcon = categoryIcons[defaultCategory]?.[0] || 'event-note';
      const baseDate = new Date(selectedDate);
      const now = new Date();
      const defaultStart = new Date(baseDate);
      defaultStart.setHours(now.getHours(), now.getMinutes(), 0, 0);
      const defaultEnd = new Date(defaultStart.getTime() + 10 * 60 * 1000);
      
      const initData = {
        title: '',
        description: '',
        startDatetime: defaultStart,
        endDatetime: defaultEnd,
        icon: defaultIcon,
        category: defaultCategory,
        status: 'upcoming'
      };
      setFormData(initData);
      fetchCommonTitles(initData.category).then();
    }
  }, [visible, currentEvent, selectedDate, tabOrder]);
  
  // 表单修改方法
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 分类
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [tempSelectedCategory, setTempSelectedCategory] = useState(formData.category || '');
  const confirmCategorySelect = () => {
    if (tempSelectedCategory) {
      handleInputChange('category', tempSelectedCategory);
      const defaultIcon = categoryIcons[tempSelectedCategory]?.[0] || 'event-note';
      handleInputChange('icon', defaultIcon);
    }
    setShowCategoryPicker(false);
  };
  
  // 标题
  const [commonTitles, setCommonTitles] = useState([]);
  const fetchCommonTitles = async (category) => {
    try {
      const titles = await getCommonTitlesByCategory(category, 5);
      setCommonTitles(titles);
    } catch (error) {
      console.error('获取常用标题失败:', error);
      setCommonTitles([]); // 失败时重置，避免显示旧数据
    }
  };
  useEffect(() => {
    if (visible && formData?.category) {
      fetchCommonTitles(formData.category).then();
    }
  }, [visible, formData.category]);
  
  // 日期事件选择
  const [pickerMode, setPickerMode] = useState('date');
  const [targetDatetime, setTargetDatetime] = useState('start');
  const [showDatetimePicker, setShowDatetimePicker] = useState(false);
  const onShowDatetimePicker = (target, mode) => {
    if (mode === 'category') {
      setShowCategoryPicker(true);
      setShowDatetimePicker(false);
    } else {
      setShowDatetimePicker(true);
      setShowCategoryPicker(false);
      setPickerMode(mode);
      setTargetDatetime(target);
    }
  };
  const handleDatetimeChange = (event, selectedDate) => {
    const currentTarget = targetDatetime === 'start' ? 'startDatetime' : 'endDatetime';
    
    handleInputChange(currentTarget, selectedDate);
    setShowDatetimePicker(false);
  };
  
  // 当前分类的图标列表
  const currentIconOptions = useMemo(() => {
    return formData.category && categoryIcons[formData.category]
      ? categoryIcons[formData.category]
      : ['group', 'video-call', 'code', 'design-services', 'event-note'];
  }, [formData.category]);
  
  // 保存事件逻辑
  const handleSave = async () => {
    // 时间校验
    const startDatetime = new Date(formData.startDatetime);
    const endDatetime = new Date(formData.endDatetime);
    if (startDatetime >= endDatetime) {
      Alert.alert('时间错误', '结束日期时间必须晚于开始日期时间');
      return;
    }
    
    // 格式化时间
    const formatDatetime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    
    const eventParams = {
      start_datetime: formatDatetime(startDatetime),
      end_datetime: formatDatetime(endDatetime),
      title: formData.title,
      category: formData.category,
      description: formData.description,
      status: formData.status,
      icon: formData.icon
    };
    
    try {
      if (currentEvent) {
        await updateEvent(parseInt(currentEvent.id), eventParams);
        Alert.alert('成功', '日程更新完成');
      } else {
        await createEvent(eventParams);
        Alert.alert('成功', '新日程添加完成');
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error('保存事件失败:', error);
      Alert.alert('错误', currentEvent ? '更新日程失败' : '添加日程失败');
    }
  };
  
  // 删除事件逻辑
  const handleDelete = async () => {
    if (!currentEvent) return;
    Alert.alert('确认删除', '此操作不可恢复，确定要删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEventApi(parseInt(currentEvent.id));
            Alert.alert('成功', '日程已删除');
            onRefresh();
            onClose();
          } catch (error) {
            console.error('删除事件失败:', error);
            Alert.alert('错误', '删除日程失败，请稍后再试');
          }
        }
      }
    ]);
  };
  
  // 内部渲染：分类选择器（含子弹窗）
  const renderCategorySelector = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>所属分类</Text>
        <TouchableOpacity
          style={styles.categoryDisplay}
          onPress={() => onShowDatetimePicker(false, 'category')}
        >
          <MaterialIcons
            name={tabOrder.find(cat => cat.id === formData.category)?.icon || 'category'}
            size={18}
            color="#2196F3"
            style={styles.categoryIcon}
          />
          <Text style={styles.categoryText}>
            {tabOrder.find(cat => cat.id === formData.category)?.name || '未选择分类'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 分类选择子弹窗 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCategoryPicker}
        onRequestClose={onClose}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            {/* 弹窗头部 */}
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>选择分类</Text>
              <TouchableOpacity
                style={styles.categoryModalClose}
                onPress={() => setShowCategoryPicker(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* 分类列表 */}
            <ScrollView style={styles.categoryList}>
              {tabOrder
                .filter(tab => !tab.isFixed) // 排除"全部"分类
                .map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      tempSelectedCategory === category.id && styles.selectedCategoryItem
                    ]}
                    onPress={() => setTempSelectedCategory(category.id)}
                  >
                    <MaterialIcons
                      name={category.icon}
                      size={20}
                      color={tempSelectedCategory === category.id ? "#2196F3" : "#666"}
                      style={styles.categoryItemIcon}
                    />
                    <Text style={[
                      styles.categoryItemText,
                      tempSelectedCategory === category.id && styles.selectedCategoryItemText
                    ]}>
                      {category.name}
                    </Text>
                    {tempSelectedCategory === category.id && (
                      <MaterialIcons name="check" size={18} color="#2196F3" />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            
            {/* 确认按钮 */}
            <TouchableOpacity
              style={styles.categoryConfirmButton}
              onPress={confirmCategorySelect}
            >
              <Text style={styles.categoryConfirmText}>确认选择</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
  
  // 内部渲染：图标选择器
  const renderIconSelector = () => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>选择图标</Text>
      <View style={styles.iconGrid}>
        {currentIconOptions.map(icon => (
          <TouchableOpacity
            key={icon}
            style={[styles.iconOption, formData.icon === icon && styles.selectedIcon]}
            onPress={() => handleInputChange('icon', icon)}
          >
            <MaterialIcons name={icon} size={24} color="#333" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            {/* 弹窗头部 */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {currentEvent ? '编辑日程' : '添加新日程'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* 表单内容区 */}
            <ScrollView style={styles.formScrollView}>
              {renderCategorySelector()}
              
              {/* 事件标题 + 常用标题 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  事件标题（可选，不填显示分类名）
                </Text>
                {commonTitles.length > 0 && (
                  <View style={styles.commonTitlesContainer}>
                    <View style={styles.commonTitlesTags}>
                      {commonTitles.map((title, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.commonTitleTag}
                          onPress={() => handleInputChange('title', title)}
                        >
                          <Text style={styles.commonTitleTagText}>{title}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <TextInput
                  style={styles.formInput}
                  scrollEnabled={false}
                  multiline={false}
                  maxLength={50}
                  value={formData.title}
                  onChangeText={(val) => handleInputChange('title', val)}
                  placeholder="请输入事件标题"
                />
              </View>
              
              {/* 事件描述 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>描述</Text>
                <TextInput
                  style={[styles.formInput, styles.multilineInput]}
                  value={formData.description}
                  onChangeText={(val) => handleInputChange('description', val)}
                  placeholder="请输入日程详情（如：会议主题、任务内容）"
                  multiline
                  numberOfLines={4}
                />
              </View>
              
              {/* 开始时间选择 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  开始时间:
                  <Text style={styles.datetimeDisplayText}>
                    {(formData.startDatetime).toLocaleString()}
                  </Text>
                </Text>
                <View style={styles.datetimeButtonGroup}>
                  <Button
                    title={"选择日期"}
                    onPress={() => onShowDatetimePicker('start', 'date')}
                  />
                  <Button
                    title={"选择时间"}
                    onPress={() => onShowDatetimePicker('start', 'time')}
                  />
                </View>
                {showDatetimePicker && targetDatetime === 'start' && (
                  <DateTimePicker
                    value={formData.startDatetime}
                    mode={pickerMode}
                    display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                    onChange={handleDatetimeChange}
                    maximumDate={new Date(2100, 11, 31)}
                    minimumDate={new Date(1900, 0, 1)}
                    is24Hour={true}
                  />
                )}
              </View>
              
              {/* 结束时间选择 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  结束时间:
                  <Text style={styles.datetimeDisplayText}>
                    {(formData.endDatetime).toLocaleString()}
                  </Text>
                </Text>
                <View style={styles.datetimeButtonGroup}>
                  <Button
                    title={"选择日期"}
                    onPress={() => onShowDatetimePicker('end', 'date')}
                  />
                  <Button
                    title={"选择时间"}
                    onPress={() => onShowDatetimePicker('end', 'time')}
                  />
                </View>
                {showDatetimePicker && targetDatetime === 'end' && (
                  <DateTimePicker
                    value={formData.endDatetime}
                    mode={pickerMode}
                    display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                    onChange={handleDatetimeChange}
                    maximumDate={new Date(2100, 11, 31)}
                    minimumDate={new Date(1900, 0, 1)}
                    is24Hour={true}
                  />
                )}
              </View>
              
              {/* 事件状态选择 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>事件状态</Text>
                <View style={styles.statusSelector}>
                  {Object.entries(statusTextMap).map(([value, label]) => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.statusOption,
                        formData.status === value && styles.selectedStatusOption
                      ]}
                      onPress={() => handleInputChange('status', value)}
                    >
                      <Text style={[
                        styles.statusOptionText,
                        formData.status === value && styles.selectedStatusOptionText,
                        { color: statusColors[value] || '#333' }
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {renderIconSelector()}
            </ScrollView>
            
            {/* 弹窗底部按钮 */}
            <View style={styles.modalFooter}>
              {currentEvent && (
                <TouchableOpacity style={styles.deleteButton}  onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>删除</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {currentEvent ? '更新' : '保存'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // 弹窗基础样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  closeButton: {
    padding: 4
  },
  formScrollView: {
    flexGrow: 1
  },
  
  // 表单通用样式
  formGroup: {
    marginBottom: 20
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#555'
  },
  formInput: {
    minHeight: 30,
    lineHeight: 30,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'center'
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  datetimeDisplayText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#1396ff'
  },
  datetimeButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8
  },
  
  // 常用标题样式
  commonTitlesContainer: {
    marginBottom: 10
  },
  commonTitlesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  commonTitleTag: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    alignItems: 'center'
  },
  commonTitleTagText: {
    fontSize: 14,
    color: '#333'
  },
  
  // 状态选择器样式
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  selectedStatusOption: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD'
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500'
  },
  selectedStatusOptionText: {
    fontWeight: 'bold'
  },
  
  // 分类选择样式
  categoryDisplay: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center'
  },
  categoryIcon: {
    marginRight: 8
  },
  categoryText: {
    fontSize: 16,
    color: '#333'
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  categoryModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%'
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  categoryModalClose: {
    padding: 4
  },
  categoryList: {
    flexGrow: 1,
    marginBottom: 16
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    justifyContent: 'space-between'
  },
  selectedCategoryItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3'
  },
  categoryItemIcon: {
    marginRight: 12
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
    flexGrow: 1
  },
  selectedCategoryItemText: {
    color: '#2196F3',
    fontWeight: '500'
  },
  categoryConfirmButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  categoryConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  
  // 图标选择器样式
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedIcon: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1
  },
  
  // 弹窗底部按钮样式
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 10
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500'
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2196F3'
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500'
  },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F44336'
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '500'
  }
});

export default EventModal;