import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Platform, Alert,
  TouchableOpacity, StyleSheet
} from 'react-native';
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
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import Icon from "@/components/common/Icon";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import { useTheme } from "@/context/ThemeContext";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeTextInput from "@/components/theme/ThemeTextInput";
import ThemeButton from "@/components/theme/ThemeButton";
import BaseModal from '@/components/common/BaseModal';

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
  const { theme } = useTheme();
  
  // 固定默认标题和按钮文字
  const modalTitle = currentEvent ? '编辑日程' : '添加新日程';
  const confirmButtonText = currentEvent ? '更新' : '保存';
  
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
    if(formData?.category) {
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
    if(startDatetime > endDatetime) {
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
        <ThemeSubTitleText style={styles.formLabel}>所属分类</ThemeSubTitleText>
        <ThemeButton
          style={styles.categoryDisplay}
          iconLib="MaterialIcons"
          iconName={categories.find(cat => cat.id === formData.category)?.icon || 'category'}
          iconSize={18}
          title={categories.find(cat => cat.id === formData.category)?.name || '未选择分类'}
          textStyle={styles.categoryText}
          onPress={() => onShowDatetimePicker(false, 'category')}
        ></ThemeButton>
      </View>
    </>
  );
  
  // 内部渲染：图标选择器
  const renderIconSelector = () => (
    <View style={styles.formGroup}>
      <ThemeSubTitleText style={styles.formLabel}>选择图标</ThemeSubTitleText>
      <View style={styles.iconGrid}>
        {currentIconOptions.map(icon => (
          <ThemeButton
            key={icon}
            active={formData.icon === icon}
            style={[styles.iconOption]}
            iconLib="MaterialIcons"
            iconName={icon}
            iconSize={24}
            onPress={() => handleInputChange('icon', icon)}
          ></ThemeButton>
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
  
  // 渲染表单内容
  const renderFormContent = () => (
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
          <ThemeSubTitleText
            style={[styles.formLabel, { marginBottom: 0 }]}
          >事件标题（可选，不填显示分类名）</ThemeSubTitleText>
          
          <ThemeCard margin={0} padding={0} style={[styles.countControl, { borderColor: theme.colors.interactive }]}>
            <ThemeTouchableOpacity
              disabled={titleCount === 5}
              onPress={() => {
                setTitleCount(prev => Math.max(prev - 5, 5));
              }}>
              <Icon
                lib="MaterialIcons"
                name="arrow-drop-up"
                size={20}
                color={titleCount === 5 ? theme.colors.interactiveLight : theme.colors.interactive}
              />
            </ThemeTouchableOpacity>
            <Text style={[
              styles.countText,
              { color: theme.colors.interactive }
            ]}>{titleCount}</Text>
            <TouchableOpacity onPress={() => {
              setTitleCount(prev => prev + 5, 5);
            }}>
              <Icon lib="MaterialIcons" name="arrow-drop-down" size={20} color={theme.colors.interactive} />
            </TouchableOpacity>
          </ThemeCard>
        </View>
        
        {commonTitles.length > 0 && (
          <View style={styles.commonTitlesContainer}>
            <View style={styles.commonTitlesTags}>
              {commonTitles.map((title, index) => (
                <ThemeButton
                  style={styles.commonTitleTag}
                  key={index}
                  active={false}
                  title={title}
                  textStyle={styles.commonTitleTagText}
                  onPress={() => handleInputChange('title', title)}
                ></ThemeButton>
              ))}
            </View>
          </View>
        )}
        
        <ThemeTextInput
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
        <ThemeSubTitleText style={styles.formLabel}>描述</ThemeSubTitleText>
        <ThemeTextInput
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
        <ThemeSubTitleText style={styles.formLabel}>
          开始时间:
          <Text style={[
            styles.datetimeDisplayText,
            { color: theme.colors.interactive }
          ]}>
            {formatDatetime(formData.startDatetime)}
          </Text>
        </ThemeSubTitleText>
        <View style={styles.datetimeButtonGroup}>
          <ThemeButton
            title={"当前时间"}
            onPress={() => handleResetToCurrentTime('start')}
          />
          <ThemeButton
            title={"选择日期"}
            onPress={() => onShowDatetimePicker('start', 'date')}
          />
          <ThemeButton
            title={"选择时间"}
            onPress={() => onShowDatetimePicker('start', 'time')}
          />
        </View>
      </View>
      
      {/* 结束时间选择 */}
      <View style={styles.formGroup}>
        <ThemeSubTitleText style={styles.formLabel}>
          结束时间:
          <Text style={[styles.datetimeDisplayText, { color: theme.colors.interactive }]}>
            {formatDatetime(formData.endDatetime)}
          </Text>
        </ThemeSubTitleText>
        <View style={styles.datetimeButtonGroup}>
          <ThemeButton
            title={"当前时间"}
            onPress={() => handleResetToCurrentTime('end')}
          />
          <ThemeButton
            title={"选择日期"}
            onPress={() => onShowDatetimePicker('end', 'date')}
          />
          <ThemeButton
            title={"选择时间"}
            onPress={() => onShowDatetimePicker('end', 'time')}
          />
        </View>
      </View>
      
      {/* 事件状态选择 */}
      <View style={styles.formGroup}>
        <ThemeSubTitleText style={styles.formLabel}>事件状态</ThemeSubTitleText>
        <View style={styles.statusSelector}>
          {Object.entries(statusTextMap).map(([value, label]) => (
            <ThemeButton
              key={value}
              active={formData.status === value}
              style={[styles.statusOption]}
              title={label}
              textStyle={[
                styles.statusOptionText,
                { color: statusColors[value] || '#333' },
                formData.status === value && ({color: theme.colors.interactive, borderColor: theme.colors.interactive}),
              ]}
              onPress={() => handleInputChange('status', value)}
            />
          ))}
        </View>
      </View>
      
      {renderIconSelector()}
      
      {/* 日期时间选择器 */}
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
    </ScrollView>
  );
  
  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={modalTitle}
      onConfirm={handleSave}
      confirmText={confirmButtonText}
      showDelete={!!currentEvent}
      onDelete={handleDelete}
    >
      {renderFormContent()}
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  // 表单滚动容器
  formScrollView: {
    flexGrow: 1
  },
  
  // 表单通用样式
  formGroup: {
    marginBottom: 10
  },
  formLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500'
  },
  formInput: {
    minHeight: 30,
    lineHeight: 30,
    padding: 12,
    borderWidth: 1,
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
    fontSize: 16
  },
  datetimeButtonGroup: {
    flexDirection: 'row',
    gap: 10
  },
  
  // 常用标题样式
  commonTitlesContainer: {
    marginBottom: 10
  },
  commonTitlesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  commonTitleTag: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 16,
    borderWidth: 1
  },
  commonTitleTagText: {
    height: 15,
    padding: 0,
    lineHeight: 15,
    fontSize: 14
  },
  countControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 5,
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden'
  },
  countText: {
    fontSize: 14,
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
    borderWidth: 1
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500'
  },
  
  // 分类选择样式
  categoryDisplay: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  categoryText: {
    height: 16,
    lineHeight: 16,
    fontSize: 16
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
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default EventModal;