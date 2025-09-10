import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Modal, Button, StyleSheet
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { statusColors, statusTextMap } from '@/constants/timelineConstants';

/**
 * 事件添加/编辑弹窗
 * @props {boolean} visible - 弹窗显示状态
 * @props {Function} onClose - 关闭弹窗回调
 * @props {Object|null} currentEvent - 当前编辑的事件（null 为新增）
 * @props {Object} formData - 表单数据（标题、时间、分类等）
 * @props {Function} onFormChange - 表单值修改回调（name, value）
 * @props {Function} onSave - 保存/更新事件回调
 * @props {Function} onDelete - 删除事件回调（仅编辑时生效）
 * @props {Array} tabOrder - 分类列表（用于分类选择）
 * @props {Array} commonTitles - 常用标题列表
 * @props {boolean} showDatetimePicker - 日期时间选择器显示状态
 * @props {string} pickerMode - 选择器模式（date/time）
 * @props {string} targetDatetime - 目标时间（start/end）
 * @props {Function} onShowDatetimePicker - 打开选择器回调（target, mode）
 * @props {Function} onDatetimeChange - 时间选择变更回调
 * @props {boolean} showCategoryPicker - 分类选择弹窗显示状态
 * @props {string} tempSelectedCategory - 临时选中的分类
 * @props {Function} onTempCategoryChange - 临时分类修改回调
 * @props {Function} onConfirmCategory - 确认分类选择回调
 * @props {Array} currentIconOptions - 当前分类的图标列表
 * @props {Date} selectedDate - 父组件选中的日期（用于默认日期）
 */
const EventModal = ({
  visible,
  onClose,
  currentEvent,
  formData,
  onFormChange,
  onSave,
  onDelete,
  tabOrder,
  commonTitles,
  showDatetimePicker,
  pickerMode,
  targetDatetime,
  onShowDatetimePicker,
  onDatetimeChange,
  showCategoryPicker,
  tempSelectedCategory,
  onTempCategoryChange,
  onConfirmCategory,
  currentIconOptions,
  selectedDate
}) => {
  // 内部工具函数：本地化日期格式化
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 内部工具函数：本地化时间格式化
  const formatLocalTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };
  
  // 内部工具函数：获取平台本地化标识
  const getLocale = () => Platform.OS === 'ios' ? 'zh-Hans-CN' : 'zh_CN';
  
  // 内部渲染：分类选择器（含子弹窗）
  const renderCategorySelector = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>所属分类</Text>
        <TouchableOpacity
          style={styles.categoryDisplay}
          onPress={() => onShowDatetimePicker(false, 'category')} // 兼容关闭其他选择器
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
                onPress={() => onShowDatetimePicker(false, 'category')}
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
                    onPress={() => onTempCategoryChange(category.id)}
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
              onPress={onConfirmCategory}
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
            onPress={() => onFormChange('icon', icon)}
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
                          onPress={() => onFormChange('title', title)}
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
                  onChangeText={(val) => onFormChange('title', val)}
                  placeholder="请输入事件标题"
                />
              </View>
              
              {/* 事件描述 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>描述</Text>
                <TextInput
                  style={[styles.formInput, styles.multilineInput]}
                  value={formData.description}
                  onChangeText={(val) => onFormChange('description', val)}
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
                    {formatLocalDate(formData.startDatetime)} {formatLocalTime(formData.startDatetime)}
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
                    value={pickerMode === 'date' ? new Date(selectedDate) : formData.startDatetime}
                    mode={pickerMode}
                    display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                    onChange={onDatetimeChange}
                    maximumDate={new Date(2100, 11, 31)}
                    minimumDate={new Date(1900, 0, 1)}
                    locale={getLocale()}
                  />
                )}
              </View>
              
              {/* 结束时间选择 */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  结束时间:
                  <Text style={styles.datetimeDisplayText}>
                    {formatLocalDate(formData.endDatetime)} {formatLocalTime(formData.endDatetime)}
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
                    value={pickerMode === 'date' ? new Date(selectedDate) : formData.endDatetime}
                    mode={pickerMode}
                    display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                    onChange={onDatetimeChange}
                    maximumDate={new Date(2100, 11, 31)}
                    minimumDate={new Date(1900, 0, 1)}
                    locale={getLocale()}
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
                      onPress={() => onFormChange('status', value)}
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
                <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                  <Text style={styles.deleteButtonText}>删除</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={onSave}>
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