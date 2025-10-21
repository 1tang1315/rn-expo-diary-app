import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Modal, Alert,
  TouchableWithoutFeedback, Image, StyleSheet
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { createStorageItem, updateStorageItem, deleteStorageItem } from '@/db/storageDB';
import { formatDate } from "@/utils/formatTimeUtils";
import { storageCategoryIcons, storageCategories } from "@/constants/commonConstans";
import CategoryModal from "@/components/common/CategoryModal";
import { ImageDirType, saveImageToLocal } from "@/db/imageDB";

/**
 * 储物项添加/编辑弹窗
 */
const StorageItemModal = ({
  visible,
  onClose,
  currentItem,
  onRefresh
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: storageCategories[0].id,
    icon: '',
    price: '',
    details: '',
    image: '',
    startDatetime: new Date(),
    endDatetime: null
  });
  const priceRef = useRef(formData.price);
  
  const [selectors, setSelectors] = useState({
    showCategory: false,
    showDatetime: false,
    datetimeTarget: 'start'
  });
  
  // 初始化表单（新增/编辑）
  useEffect(() => {
    if(!visible) return;
    
    const getDefaultIcon = (categoryId) => {
      return storageCategoryIcons[categoryId]?.[0] || 'inventory';
    };
    
    if(currentItem) {
      const defaultIcon = getDefaultIcon(currentItem.category || storageCategories[0].id);
      
      setFormData({
        name: currentItem.name || '',
        category: currentItem.category || storageCategories[0].id,
        icon: currentItem.icon || defaultIcon,
        price: currentItem.price ? currentItem.price : '',
        details: currentItem.details || '',
        image: currentItem.image || '',
        startDatetime: currentItem.start_time ? new Date(currentItem.start_time) : new Date(),
        endDatetime: currentItem.end_time ? new Date(currentItem.end_time) : null
      });
    } else {
      const defaultIcon = getDefaultIcon(storageCategories[0].id);
      setFormData({
        name: '',
        category: storageCategories[0].id,
        icon: defaultIcon,
        price: '',
        details: '',
        image: '',
        startDatetime: new Date(),
        endDatetime: null
      });
    }
  }, [visible, currentItem]);
  
  // 通用输入处理
  const handleInputChange = (key, value) => {
    if (key === 'price') {
      let formatted = value.replace(/[^0-9.]/g, '');
      const decimalIndex = formatted.indexOf('.');
      
      if (decimalIndex !== -1) {
        formatted = formatted.slice(0, decimalIndex + 1) + formatted.slice(decimalIndex + 1).replace(/\./g, '');
      }
      
      if (decimalIndex !== -1 && formatted.length - decimalIndex > 3) {
        formatted = formatted.slice(0, decimalIndex + 3);
      }
      
      if (formatted !== priceRef.current) {
        priceRef.current = formatted;
        setFormData(prev => ({ ...prev, [key]: formatted }));
      }
    } else {
      setFormData(prev => ({ ...prev, [key]: value }));
    }
  };
  
  // 分类确认
  const confirmCategory = (tabId) => {
    if(tabId) {
      handleInputChange('category', tabId);
      const defaultIcon = storageCategoryIcons[tabId]?.[0] || 'inventory';
      handleInputChange('icon', defaultIcon);
    }
    setSelectors(prev => ({
      ...prev,
      showCategory: false
    }));
  };
  
  // 日期选择器开关
  const toggleDatetimePicker = (target) => {
    setSelectors(prev => ({
      ...prev,
      showDatetime: !prev.showDatetime,
      datetimeTarget: target
    }));
  };
  
  // 日期变更
  const handleDateChange = (event, selectedDate) => {
    const targetKey = selectors.datetimeTarget === 'start' ? 'startDatetime' : 'endDatetime';
    handleInputChange(targetKey, selectedDate);
    setSelectors(prev => ({
      ...prev,
      showDatetime: false
    }));
  };
  
  const currentIconOptions = useMemo(() => {
    return formData.category && storageCategoryIcons[formData.category]
      ? storageCategoryIcons[formData.category]
      : ['inventory', 'lunch-dining', 'devices', 'checkroom', 'luggage', 'electrical-services', 'kitchen', 'build'];
  }, [formData.category]);
  
  // 图标选择器
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
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(status !== 'granted') {
      Alert.alert('权限不足', '需要相册权限才能选择图片');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true
    });
    
    if (!result.canceled && result.assets.length > 0) {
      const [localImagePath] = await Promise.all([saveImageToLocal(result.assets[0].uri, ImageDirType.STORAGE)]);

      handleInputChange('image', localImagePath);
    }
  };
  
  // 保存逻辑
  const handleSave = async () => {
    if(!formData.name.trim()) {
      Alert.alert('输入错误', '请填写物品名称');
      return;
    }
    
    const price = Number(formData.price);
    if(isNaN(price) || price < 0) {
      Alert.alert('输入错误', '请填写有效的价格');
      return;
    }
    
    if(formData.endDatetime && formData.startDatetime > formData.endDatetime) {
      Alert.alert('时间错误', '结束日期不能早于开始日期');
      return;
    }
    
    let imageData = formData.image;
    if (imageData && imageData.startsWith('data:image/')) {
      imageData = imageData.split(',')[1];
    }
    
    const itemParams = {
      name: formData.name.trim(),
      category: formData.category,
      icon: formData.icon,
      price: price,
      details: formData.details.trim(),
      image: imageData,
      start_time: formatDate(formData.startDatetime),
      end_time: formData.endDatetime ? formatDate(formData.endDatetime) : null
    };
    
    try {
      if(currentItem) {
        const success = await updateStorageItem(parseInt(currentItem.id), itemParams);
        Alert.alert('成功', success ? '物品信息已更新' : '更新物品失败');
      } else {
        await createStorageItem(itemParams);
        Alert.alert('成功', '新物品已添加');
      }
      onRefresh();
      onClose();
    } catch(error) {
      console.error('保存失败:', error);
      Alert.alert('错误', '保存失败，请稍后再试');
    }
  };
  
  // 删除逻辑
  const handleDelete = async () => {
    if(!currentItem) return;
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
            const success = await deleteStorageItem(parseInt(currentItem.id));
            if(success) {
              Alert.alert('成功', '物品已删除');
              onRefresh();
              onClose();
            } else Alert.alert('失败', '删除物品失败');
          } catch(error) {
            console.error('删除失败:', error);
            Alert.alert('错误', '删除物品失败，请稍后再试');
          }
        }
      }
    ]);
  };
  
  // 分类展示
  const renderCategorySelector = () => {
    const category = storageCategories.find(cat => cat.id === formData.category) || {};
    return (
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>物品分类</Text>
        <TouchableOpacity
          style={styles.categoryDisplay}
          onPress={() => setSelectors(prev => ({
            ...prev,
            showCategory: true
          }))}>
          <MaterialIcons name={category.icon || 'layers'} size={18} color="#3498db" style={styles.categoryIcon} />
          <Text style={styles.categoryText}>{category.name || '未选择分类'}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{currentItem ? '编辑物品' : '添加新物品'}</Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close-outline" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
                  {renderCategorySelector()}
                  <CategoryModal
                    visible={selectors.showCategory}
                    onClose={() => setSelectors(prev => ({
                      ...prev,
                      showCategory: false
                    }))}
                    selectedCategory={formData.category}
                    categories={storageCategories}
                    onSelect={confirmCategory}
                  />
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>物品名称（必填）</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.name}
                      onChangeText={(val) => handleInputChange('name', val)}
                      placeholder="请输入物品名称"
                      maxLength={50}
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>物品价格（必填）</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.price}
                      onChangeText={(val) => handleInputChange('price', val)}
                      placeholder="请输入价格"
                      keyboardType="decimal-pad"
                      maxLength={12}
                    />
                    <Text style={styles.priceHintText}>单位：元，支持两位小数</Text>
                  </View>
                  
                  {renderIconSelector()}
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>物品图片</Text>
                    <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
                      <Image
                        source={{ uri: formData.image }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />

                      <View style={styles.imagePickerOverlay}>
                        <Ionicons name="camera-outline" size={24} color="#fff" />
                        <Text style={styles.imagePickerText}>选择图片</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>物品详情</Text>
                    <TextInput
                      style={[styles.formInput, styles.multilineInput]}
                      value={formData.details}
                      onChangeText={(val) => handleInputChange('details', val)}
                      placeholder="请输入物品详情"
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>
                      启用日期:
                      <Text style={styles.dateDisplayText}> {formatDate(formData.startDatetime)}</Text>
                    </Text>
                    <View style={styles.dateButtonGroup}>
                      <TouchableOpacity style={styles.dateButton} onPress={() => toggleDatetimePicker('start')}>
                        <Text style={styles.dateButtonText}>修改日期</Text>
                      </TouchableOpacity>
                    </View>
                    {selectors.showDatetime && selectors.datetimeTarget === 'start' && (
                      <DateTimePicker
                        value={formData.startDatetime}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                        onChange={handleDateChange}
                        maximumDate={new Date(2100, 11, 31)}
                        minimumDate={new Date(2000, 0, 1)}
                      />
                    )}
                  </View>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>
                      退役日期（可选）:
                      <Text style={styles.dateDisplayText}>
                        {formData.endDatetime ? formatDate(formData.endDatetime) : '未设置'}
                      </Text>
                    </Text>
                    <View style={styles.dateButtonGroup}>
                      <TouchableOpacity style={styles.dateButton} onPress={() => toggleDatetimePicker('end')}>
                        <Text style={styles.dateButtonText}>选择日期</Text>
                      </TouchableOpacity>
                      {formData.endDatetime && (
                        <TouchableOpacity
                          style={styles.dateButton}
                          onPress={() => handleInputChange('endDatetime', null)}>
                          <Text style={styles.dateButtonText}>清除</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {selectors.showDatetime && selectors.datetimeTarget === 'end' && (
                      <DateTimePicker
                        value={formData.endDatetime || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                        onChange={handleDateChange}
                        maximumDate={new Date(2100, 11, 31)}
                        minimumDate={formData.startDatetime}
                      />
                    )}
                  </View>
                </ScrollView>
                
                <View style={styles.modalFooter}>
                  {currentItem && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                      <Text style={styles.deleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelButtonText}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>{currentItem ? '更新' : '保存'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  formScrollView: { flexGrow: 1 },
  formGroup: { marginBottom: 20 },
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
    fontSize: 16
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  priceHintText: {
    marginTop: 6,
    fontSize: 12,
    color: '#999'
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
  imagePickerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    position: 'relative'
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  imagePickerOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#fff'
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white'
  },
  categoryIcon: { marginRight: 8 },
  categoryText: {
    fontSize: 16,
    color: '#333'
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3498db'
  },
  dateButtonGroup: {
    flexDirection: 'row',
    gap: 10
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  dateDisplayText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#3498db'
  },
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
    backgroundColor: '#3498db'
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

export default StorageItemModal;
