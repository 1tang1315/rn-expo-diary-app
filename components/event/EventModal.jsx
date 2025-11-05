import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Platform, Modal, Button, StyleSheet, Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { categories, categoryIcons, statusColors, statusTextMap } from '@/constants/commonConstans';
import {
  createEvent,
  getCommonTitlesByCategory,
  updateEvent,
  deleteEvent as deleteEventApi,
} from "@/db/eventDB";
import { formatDatetime } from "@/utils/formatTimeUtils";
import CategoryModal from "@/components/common/CategoryModal";

/**
 * 事件添加/编辑弹窗
 * @props {boolean} visible - 弹窗显示状态
 * @props {Function} onClose - 关闭弹窗回调
 * @props {Object|null} currentEvent - 当前编辑的事件（null 为新增）
 * @props {Date} selectedDate - 父组件选中的日期（用于默认日期）
 * @props {Function} onRefresh - 通知父组件刷新数据
 */
const EventModal = ({
  visible,
  onClose,
  currentTab,
  currentEvent,
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
    if(!visible) return;
    if(currentEvent) {
      // 编辑模式初始化
      const initData = {
        title: currentEvent.title,
        description: currentEvent.description,
        startDatetime: new Date(currentEvent.startDatetime || currentEvent.start_datetime),
        endDatetime: new Date(currentEvent.endDatetime || currentEvent.end_datetime),
        icon: currentEvent.icon,
        category: currentEvent.category,
        status: currentEvent.status || 'upcoming'
      };
      setFormData(initData);
    } else {
      // 新增模式初始化
      const defaultCategory = currentTab && currentTab !== 'all'
        ? currentTab
        : categories?.find(tab => !tab.isFixed)?.id || 'daily';
      
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
    }
  }, [visible, currentEvent, selectedDate, currentTab]);
  
  // 表单修改方法
  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 分类
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const confirmCategorySelect = (categoryId) => {
    if(categoryId) {
      const defaultIcon = categoryIcons[categoryId]?.[0] || 'event-note';
      handleInputChange('icon', defaultIcon);
      handleInputChange('category', categoryId);
      fetchCommonTitles(categoryId).then();
    }
    setShowCategoryPicker(false);
  };
  
  // 标题
  const [titleCount, setTitleCount] = useState(5);
  const [commonTitles, setCommonTitles] = useState([]);
  const fetchCommonTitles = useCallback(async (category) => {
    try {
      const titles = await getCommonTitlesByCategory(category, titleCount);
      setCommonTitles(titles);
    } catch(error) {
      console.error('获取常用标题失败:', error);
      setCommonTitles([]); // 失败时重置，避免显示旧数据
    }
  }, [titleCount]);
  
  useEffect(() => {
    if (formData?.category) {
      fetchCommonTitles(formData.category).then();
    }
  }, [titleCount, formData.category, fetchCommonTitles]);
  
  // 日期事件选择
  const [pickerMode, setPickerMode] = useState('date');
  const [targetDatetime, setTargetDatetime] = useState('start');
  const [showDatetimePicker, setShowDatetimePicker] = useState(false);
  const onShowDatetimePicker = (target, mode) => {
    if(mode === 'category') {
      setShowCategoryPicker(true);
      setShowDatetimePicker(false);
    } else {
      setShowDatetimePicker(true);
      setShowCategoryPicker(false);
      setPickerMode(mode);
      setTargetDatetime(target);
    }
  };
  const handleDatetimeChange = (_, selectedDate) => {
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
    if(startDatetime >= endDatetime) {
      Alert.alert('时间错误', '结束日期时间必须晚于开始日期时间');
      return;
    }
    
    const eventParams = {
      start_datetime: formatDatetime(startDatetime),
      end_datetime: formatDatetime(endDatetime),
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim(),
      status: formData.status,
      icon: formData.icon
    };
    
    try {
      if(currentEvent) {
        await updateEvent(parseInt(currentEvent.id), eventParams);
        Alert.alert('成功', '日程更新完成');
      } else {
        await createEvent(eventParams);
        Alert.alert('成功', '新日程添加完成');
      }
      onRefresh();
      onClose();
    } catch(error) {
      console.error('保存事件失败:', error);
      Alert.alert('错误', currentEvent ? '更新日程失败' : '添加日程失败');
    }
  };
  
  // 删除事件逻辑
  const handleDelete = async () => {
    if(!currentEvent) return;
    Alert.alert('确认删除', '此操作不可恢复，确定要删除吗？', [
      {
        text: '取消',
        style: 'cancel'
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEventApi(parseInt(currentEvent.id));
            Alert.alert('成功', '日程已删除');
            onRefresh();
            onClose();
          } catch(error) {
            console.error('删除事件失败:', error);
            Alert.alert('错误', '删除日程失败，请稍后再试');
          }
        }
      }
    ]);
  };
  
  // 内部渲染：分类选择器
  const renderCategorySelector = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>所属分类</Text>
        <TouchableOpacity
          style={styles.categoryDisplay}
          onPress={() => onShowDatetimePicker(false, 'category')}
        >
          <MaterialIcons
            name={categories.find(cat => cat.id === formData.category)?.icon || 'category'}
            size={18}
            color="#2196F3"
            style={styles.categoryIcon}
          />
          <Text style={styles.categoryText}>
            {categories.find(cat => cat.id === formData.category)?.name || '未选择分类'}
          </Text>
        </TouchableOpacity>
      </View>
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
  
  // 回到当前时间处理
  const handleResetToCurrentTime = (target) => {
    const currentTime = new Date();
    const targetKey = target === 'start' ? 'startDatetime' : 'endDatetime';
    handleInputChange(targetKey, currentTime);
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
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
              <ScrollView
                style={styles.formScrollView}
                showsVerticalScrollIndicator={false}
              >
                {renderCategorySelector()}
                
                <CategoryModal
                  visible={showCategoryPicker}
                  onClose={() => setShowCategoryPicker(false)}
                  selectedCategory={formData.category}
                  categories={categories}
                  onSelect={confirmCategorySelect}
                />
                
                {/* 事件标题 + 常用标题 */}
                <View style={styles.formGroup}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: "center",
                    marginBottom: 8
                  }}>
                    <Text
                      style={[styles.formLabel, { marginBottom: 0 }]}
                    >事件标题（可选，不填显示分类名）</Text>

                    <View style={styles.countControl}>
                      <TouchableOpacity
                        disabled={titleCount === 5}
                        onPress={() => {
                          setTitleCount(prev => Math.max(prev - 5, 5));
                      }}>
                        <MaterialIcons
                          name="arrow-drop-up"
                          size={20}
                          color={titleCount === 5 ? "#ccc" : "#666"}
                        />
                      </TouchableOpacity>
                      <Text style={styles.countText}>{titleCount}</Text>
                      <TouchableOpacity onPress={() => {
                        setTitleCount(prev => prev + 5, 5);
                      }}>
                        <MaterialIcons name="arrow-drop-down" size={20} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {commonTitles.length > 0 && (
                    <View style={styles.commonTitlesContainer}>
                      <View style={styles.commonTitlesTags}>
                        {commonTitles.map((title, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.commonTitleTag}
                            onPress={() => handleInputChange('title', title)}
                          >
                            <Text
                              style={styles.commonTitleTagText}
                              numberOfLines={1}
                              ellipsizeMode="tail"
                            >{title}</Text>
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
                      {formatDatetime(formData.startDatetime)}
                    </Text>
                  </Text>
                  <View style={styles.datetimeButtonGroup}>
                    <Button
                      title={"当前时间"}
                      onPress={() => handleResetToCurrentTime('start')}
                    />
                    <Button
                      title={"选择日期"}
                      onPress={() => onShowDatetimePicker('start', 'date')}
                    />
                    <Button
                      title={"选择时间"}
                      onPress={() => onShowDatetimePicker('start', 'time')}
                    />
                  </View>
                </View>
                
                {/* 结束时间选择 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>
                    结束时间:
                    <Text style={styles.datetimeDisplayText}>
                      {formatDatetime(formData.endDatetime)}
                    </Text>
                  </Text>
                  <View style={styles.datetimeButtonGroup}>
                    <Button
                      title={"当前时间"}
                      onPress={() => handleResetToCurrentTime('end')}
                    />
                    <Button
                      title={"选择日期"}
                      onPress={() => onShowDatetimePicker('end', 'date')}
                    />
                    <Button
                      title={"选择时间"}
                      onPress={() => onShowDatetimePicker('end', 'time')}
                    />
                  </View>
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
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '85%',
    minHeight: '85%'
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
    gap: 8,
  },
  commonTitleTag: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    backgroundColor: '#F5F7FA'
  },
  commonTitleTagText: {
    height: 15,
    padding: 0,
    lineHeight: 15,
    fontSize: 14,
    color: '#333',
  },
  countControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6
  },
  countText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
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