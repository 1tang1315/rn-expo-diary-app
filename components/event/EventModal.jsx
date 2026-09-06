import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Platform, Alert,
  TouchableOpacity, StyleSheet
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { categories, categoryIcons, statusColors, statusTextMap } from '@/constants/commonConstans';
import {
  EVENT_TIME_KIND,
  getTimeKindPolicy,
  resolveDefaultTimeKind,
} from '@/constants/eventTimeKindPolicy';
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
import EventTimeFields from '@/components/event/EventTimeFields';
import EventImagePicker from '@/components/event/EventImagePicker';
import EventCategoryFields from '@/components/event/EventCategoryFields';
import { saveImageToLocal, ImageDirType } from '@/core/db/imageDB';
import { toEventImageKey } from '@/utils/eventImageUtils';
import { eventApi } from "@/api";
import { parseInt } from "lodash/string";

const EventModal = ({
  visible,
  onClose,
  currentTab,
  currentEvent,
  selectedDate,
  onRefresh
}) => {
  const { theme } = useTheme();
  const timeKindTouchedRef = useRef(false);

  const modalTitle = currentEvent ? '编辑日程' : '添加新日程';
  const confirmButtonText = currentEvent ? '更新' : '保存';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDatetime: new Date(),
    endDatetime: new Date(new Date().getTime() + 10 * 60 * 1000),
    icon: 'event-note',
    category: 'daily',
    status: 'upcoming',
    timeKind: EVENT_TIME_KIND.INTERVAL,
    extras: {},
    images: [],
    pendingImageUris: [],
  });

  useEffect(() => {
    if (!visible) return;

    if (currentEvent) {
      timeKindTouchedRef.current = true;
      setFormData({
        title: currentEvent.title || '',
        description: currentEvent.description || '',
        startDatetime: new Date(currentEvent.startDatetime || currentEvent.start_datetime),
        endDatetime: new Date(currentEvent.endDatetime || currentEvent.end_datetime),
        icon: currentEvent.icon,
        category: currentEvent.category,
        status: currentEvent.status || 'upcoming',
        timeKind: currentEvent.timeKind || EVENT_TIME_KIND.INTERVAL,
        extras: currentEvent.extras || {},
        images: currentEvent.images || [],
        pendingImageUris: [],
      });
    } else {
      timeKindTouchedRef.current = false;
      const defaultCategory = currentTab && currentTab !== 'all'
        ? currentTab
        : categories?.find(tab => !tab.isFixed)?.id || 'daily';
      const defaultIcon = categoryIcons[defaultCategory]?.[0] || 'event-note';
      const baseDate = new Date(selectedDate);
      const now = new Date();
      const defaultStart = new Date(baseDate);
      defaultStart.setHours(now.getHours(), now.getMinutes(), 0, 0);
      const defaultEnd = new Date(defaultStart.getTime() + 10 * 60 * 1000);

      setFormData({
        title: '',
        description: '',
        startDatetime: defaultStart,
        endDatetime: defaultEnd,
        icon: defaultIcon,
        category: defaultCategory,
        status: 'upcoming',
        timeKind: resolveDefaultTimeKind(defaultCategory),
        extras: {},
        images: [],
        pendingImageUris: [],
      });
    }
  }, [visible, currentEvent, selectedDate, currentTab]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const timeKindPolicy = useMemo(
    () => getTimeKindPolicy(formData.category),
    [formData.category]
  );

  const handleTimeKindChange = (kind) => {
    timeKindTouchedRef.current = true;
    setFormData((prev) => {
      const next = { ...prev, timeKind: kind };
      if (kind === EVENT_TIME_KIND.INTERVAL && prev.endDatetime <= prev.startDatetime) {
        next.endDatetime = new Date(prev.startDatetime.getTime() + 10 * 60 * 1000);
      }
      return next;
    });
  };

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const confirmCategorySelect = (categoryId) => {
    if (categoryId) {
      const defaultIcon = categoryIcons[categoryId]?.[0] || 'event-note';
      setFormData((prev) => {
        const next = {
          ...prev,
          icon: defaultIcon,
          category: categoryId,
        };
        if (!currentEvent && !timeKindTouchedRef.current) {
          next.timeKind = resolveDefaultTimeKind(categoryId);
        }
        return next;
      });
      fetchCommonTitles(categoryId).then();
    }
    setShowCategoryPicker(false);
  };

  const [titleCount, setTitleCount] = useState(5);
  const [commonTitles, setCommonTitles] = useState([]);
  const fetchCommonTitles = useCallback(async (category) => {
    const titles = await eventApi.getCommonTitles(category, titleCount);
    setCommonTitles(titles);
  }, [titleCount]);

  useEffect(() => {
    if (formData?.category) {
      fetchCommonTitles(formData.category).then();
    }
  }, [titleCount, formData.category, fetchCommonTitles]);

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

  const handleDatetimeChange = (_, selectedDate) => {
    const currentTarget = targetDatetime === 'start' ? 'startDatetime' : 'endDatetime';
    handleInputChange(currentTarget, selectedDate);
    setShowDatetimePicker(false);
  };

  const currentIconOptions = useMemo(() => {
    return formData.category && categoryIcons[formData.category]
      ? categoryIcons[formData.category]
      : ['group', 'video-call', 'code', 'design-services', 'event-note'];
  }, [formData.category]);

  const handleSave = async () => {
    const startDatetime = new Date(formData.startDatetime);
    const endDatetime = new Date(formData.endDatetime);
    const isInstant = formData.timeKind === EVENT_TIME_KIND.INSTANT;

    if (!isInstant) {
      if (startDatetime >= endDatetime) {
        Alert.alert('时间错误', '结束时间必须晚于开始时间');
        return;
      }
    }

    let newImageKeys = [];
    try {
      for (const uri of formData.pendingImageUris) {
        const localPath = await saveImageToLocal(uri, ImageDirType.EVENT);
        const key = toEventImageKey(localPath);
        if (key) newImageKeys.push(key);
      }
    } catch (error) {
      console.error('保存图片失败:', error);
      Alert.alert('保存失败', '图片保存失败，请重试');
      return;
    }

    const images = [...formData.images, ...newImageKeys];

    const eventParams = {
      startDatetime: formatDatetime(startDatetime),
      endDatetime: isInstant
        ? formatDatetime(startDatetime)
        : formatDatetime(endDatetime),
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim(),
      status: formData.status,
      icon: formData.icon,
      timeKind: formData.timeKind,
      extras: formData.extras || {},
      images,
    };

    if (currentEvent) {
      await eventApi.update(parseInt(currentEvent.id), eventParams);
      Alert.alert('成功', '日程更新完成');
    } else {
      await eventApi.create(eventParams);
      Alert.alert('成功', '新日程添加完成');
    }
    onRefresh();
    onClose();
  };

  const handleDelete = async () => {
    if (!currentEvent) return;
    Alert.alert('确认删除', '此操作不可恢复，确定要删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await eventApi.delete(parseInt(currentEvent.id));
          Alert.alert('成功', '日程已删除');
          onRefresh();
          onClose();
        }
      }
    ]);
  };

  const renderCategorySelector = () => (
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
      />
    </View>
  );

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
          />
        ))}
      </View>
    </View>
  );

  const handleResetToCurrentTime = (target) => {
    const currentTime = new Date();
    const targetKey = target === 'start' ? 'startDatetime' : 'endDatetime';
    handleInputChange(targetKey, currentTime);
  };

  const renderFormContent = () => (
    <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={false}>
      {renderCategorySelector()}

      <CategoryModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        selectedCategory={formData.category}
        categories={categories}
        onSelect={confirmCategorySelect}
      />

      <View style={styles.formGroup}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <ThemeSubTitleText style={[styles.formLabel, { marginBottom: 0 }]}>
            事件标题（可选，不填显示分类名）
          </ThemeSubTitleText>
          <ThemeCard margin={0} padding={0} style={[styles.countControl, { borderColor: theme.colors.interactive }]}>
            <ThemeTouchableOpacity
              style={{ minHeight: 0, padding: 0 }}
              disabled={titleCount === 5}
              onPress={() => setTitleCount(prev => Math.max(prev - 5, 5))}
            >
              <Icon
                lib="MaterialIcons"
                name="arrow-drop-up"
                size={20}
                color={titleCount === 5 ? theme.colors.interactiveLight : theme.colors.interactive}
              />
            </ThemeTouchableOpacity>
            <Text style={[styles.countText, { color: theme.colors.interactive }]}>{titleCount}</Text>
            <TouchableOpacity onPress={() => setTitleCount(prev => prev + 5)}>
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
                />
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

      <EventImagePicker
        images={formData.images}
        pendingImageUris={formData.pendingImageUris}
        onChangeImages={(images) => handleInputChange('images', images)}
        onChangePendingUris={(uris) => handleInputChange('pendingImageUris', uris)}
      />

      <EventTimeFields
        timeKind={formData.timeKind}
        allowSwitch={timeKindPolicy.allowSwitch}
        startDatetime={formData.startDatetime}
        endDatetime={formData.endDatetime}
        onChangeTimeKind={handleTimeKindChange}
        onResetToCurrentTime={handleResetToCurrentTime}
        onShowDatetimePicker={onShowDatetimePicker}
      />

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
                formData.status === value && ({ color: theme.colors.interactive, borderColor: theme.colors.interactive }),
              ]}
              onPress={() => handleInputChange('status', value)}
            />
          ))}
        </View>
      </View>

      {renderIconSelector()}

      <EventCategoryFields
        category={formData.category}
        extras={formData.extras}
        onExtrasChange={(extras) => handleInputChange('extras', extras)}
      />

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
  formScrollView: {
    flexGrow: 1
  },
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
