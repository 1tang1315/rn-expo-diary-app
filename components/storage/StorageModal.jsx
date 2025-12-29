import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Platform, Alert,
  Image, StyleSheet
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { createStorageItem, updateStorageItem, deleteStorageItem } from '@/db/storageDB';
import { formatDate } from "@/utils/formatTimeUtils";
import { storageCategoryIcons, storageCategories } from "@/constants/commonConstans";
import CategoryModal from "@/components/common/CategoryModal";
import { ImageDirType, saveImageToLocal } from "@/db/imageDB";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import ThemeTextInput from "@/components/theme/ThemeTextInput";
import ThemeTouchableOpacity from "@/components/theme/ThemeView";
import ThemeButton from "@/components/theme/ThemeButton";
import BaseModal from "@/components/common/BaseModal";
import ThemeCard from "@/components/theme/ThemeCard";
import Icon from "@/components/common/Icon";

/**
 * 储物项添加/编辑弹窗（基于通用 BaseModal 封装）
 */
const StorageItemModal = ({
  visible,
  onClose,
  currentTab = storageCategories[0].id,
  currentItem,
  onRefresh
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: currentTab,
    icon: '',
    price: '',
    detail: '',
    image: '',
    startDate: new Date(),
    endDate: null
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
      const defaultIcon = getDefaultIcon(currentItem.category || currentTab);
      
      setFormData({
        name: currentItem.name || '',
        category: currentItem.category || currentTab,
        icon: currentItem.icon || defaultIcon,
        price: currentItem.price ? currentItem.price : '',
        detail: currentItem.detail || '',
        image: currentItem.image || '',
        startDate: currentItem.startDate ? new Date(currentItem.startDate) : new Date(),
        endDate: currentItem.endDate ? new Date(currentItem.endDate) : null
      });
    } else {
      const defaultIcon = getDefaultIcon(storageCategories[0].id);
      setFormData({
        name: '',
        category: currentTab,
        icon: defaultIcon,
        price: '',
        detail: '',
        image: '',
        startDate: new Date(),
        endDate: null
      });
    }
  }, [visible, currentItem, currentTab]);
  
  // 通用输入处理
  const handleInputChange = (key, value) => {
    if(key === 'price') {
      let formatted = value.replace(/[^0-9.]/g, '');
      const decimalIndex = formatted.indexOf('.');
      
      if(decimalIndex !== -1) {
        formatted = formatted.slice(0, decimalIndex + 1) + formatted.slice(decimalIndex + 1).replace(/\./g, '');
      }
      
      if(decimalIndex !== -1 && formatted.length - decimalIndex > 3) {
        formatted = formatted.slice(0, decimalIndex + 3);
      }
      
      if(formatted !== priceRef.current) {
        priceRef.current = formatted;
        setFormData(prev => ({
          ...prev,
          [key]: formatted
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [key]: value
      }));
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
    const targetKey = selectors.datetimeTarget === 'start' ? 'startDate' : 'endDate';
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
      <ThemeSubTitleText style={styles.formLabel}>选择图标</ThemeSubTitleText>
      <View style={styles.iconGrid}>
        {currentIconOptions.map(icon => (
          <ThemeButton
            key={icon}
            iconLib="MaterialIcons"
            iconName={icon}
            active={formData.icon === icon}
            style={styles.iconOption}
            onPress={() => handleInputChange('icon', icon)}
          ></ThemeButton>
        ))}
      </View>
    </View>
  );
  
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(status !== 'granted') {
      Alert.alert('权限不足', '需要获取相册权限才能选择图片');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true
    });
    
    if(!result.canceled && result.assets.length > 0) {
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
    
    if(formData.endDate && formData.startDate > formData.endDate) {
      Alert.alert('时间错误', '结束日期不能早于开始日期');
      return;
    }
    
    let imageData = formData.image;
    if(imageData && imageData.startsWith('data:image/')) {
      imageData = imageData.split(',')[1];
    }
    
    const itemParams = {
      name: formData.name.trim(),
      category: formData.category,
      icon: formData.icon,
      price: price,
      detail: formData.detail.trim(),
      image: imageData,
      startDate: formatDate(formData.startDate),
      endDate: formData.endDate ? formatDate(formData.endDate) : null
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
        <ThemeSubTitleText style={styles.formLabel}>物品分类</ThemeSubTitleText>
        <ThemeButton
          style={styles.categoryDisplay}
          iconLib="MaterialIcons"
          iconName={category.icon || 'layers'}
          iconSize={18}
          title={category.name || '未选择分类'}
          textStyle={styles.categoryText}
          onPress={() => setSelectors(prev => ({
            ...prev,
            showCategory: true
          }))}></ThemeButton>
      </View>
    );
  };
  
  // 核心内容区域（作为 BaseModal 的 children 传入）
  const renderContent = () => (
    <ScrollView
      style={styles.formScrollView}
      showsVerticalScrollIndicator={false}
    >
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
        <ThemeSubTitleText style={styles.formLabel}>物品名称（必填）</ThemeSubTitleText>
        <ThemeTextInput
          style={styles.formInput}
          value={formData.name}
          onChangeText={(val) => handleInputChange('name', val)}
          placeholder="请输入物品名称"
          maxLength={50}
        />
      </View>
      
      <View style={styles.formGroup}>
        <ThemeSubTitleText style={styles.formLabel}>物品价格（必填）</ThemeSubTitleText>
        <ThemeTextInput
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
        <ThemeSubTitleText style={styles.formLabel}>物品图片</ThemeSubTitleText>
        <ThemeTouchableOpacity
          onPress={pickImage}
          style={styles.imagePickerContainer}
        >
          {formData.image ? (
            <Image
              source={{ uri: formData.image }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          ) : null}
          
          <ThemeCard padding={0} margin={0} style={styles.imagePickerOverlay}>
            <Icon lib="Ionicons" name="camera-outline" size={24} />
            <Text style={styles.imagePickerText}>选择图片</Text>
          </ThemeCard>
        </ThemeTouchableOpacity>
      </View>
      
      <View style={styles.formGroup}>
        <ThemeSubTitleText style={styles.formLabel}>物品详情</ThemeSubTitleText>
        <ThemeTextInput
          style={[styles.formInput, styles.multilineInput]}
          value={formData.detail}
          onChangeText={(val) => handleInputChange('detail', val)}
          placeholder="请输入物品详情"
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.formGroup}>
        <ThemeSubTitleText style={styles.formLabel}>
          启用日期:
          <Text style={styles.dateDisplayText}>{formatDate(formData.startDate)}</Text>
        </ThemeSubTitleText>
        <View style={styles.dateButtonGroup}>
          <ThemeButton title="修改日期" onPress={() => toggleDatetimePicker('start')}></ThemeButton>
        </View>
        {selectors.showDatetime && selectors.datetimeTarget === 'start' && (
          <DateTimePicker
            value={formData.startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
            onChange={handleDateChange}
            maximumDate={new Date(2100, 11, 31)}
            minimumDate={new Date(2000, 0, 1)}
          />
        )}
      </View>
      
      <View style={styles.formGroup}>
        <ThemeSubTitleText style={styles.formLabel}>
          退役日期（可选）:
          <Text style={styles.dateDisplayText}>
            {formData.endDate ? formatDate(formData.endDate) : '未设置'}
          </Text>
        </ThemeSubTitleText>
        <View style={styles.dateButtonGroup}>
          <ThemeButton title="选择日期" onPress={() => toggleDatetimePicker('end')}></ThemeButton>
          {formData.endDate && (
            <ThemeButton
              style={styles.clearButton}
              textStyle={styles.clearButtonText}
              title="清除"
              onPress={() => handleInputChange('endDate', null)}>
            </ThemeButton>
          )}
        </View>
        {selectors.showDatetime && selectors.datetimeTarget === 'end' && (
          <DateTimePicker
            value={formData.endDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
            onChange={handleDateChange}
            maximumDate={new Date(2100, 11, 31)}
            minimumDate={formData.startDate}
          />
        )}
      </View>
    </ScrollView>
  );
  
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={currentItem ? '编辑物品' : '添加新物品'}
      onConfirm={handleSave}
      confirmText={currentItem ? '更新' : '保存'}
      showDelete={!!currentItem}
      onDelete={handleDelete}
    >
      {renderContent()}
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  formScrollView: {
    flexGrow: 1
  },
  formGroup: {
    marginBottom: 10
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8
  },
  formInput: {
    minHeight: 30,
    lineHeight: 30,
    padding: 12,
    borderWidth: 1,
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
    gap: 8
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imagePickerContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
    borderRadius: 10,
    overflow: 'hidden'
  },
  imagePreview: {
    width: '100%',
    height: '100%'
  },
  imagePickerOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: '#fff'
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8
  },
  categoryText: {
    fontSize: 16
  },
  dateButtonGroup: {
    flexDirection: 'row',
    gap: 10
  },
  dateDisplayText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#3498db'
  },
  clearButton: {
    borderWidth: 0,
    backgroundColor: '#ff3b30'
  },
  clearButtonText: {
    color: '#fff'
  }
});

export default StorageItemModal;