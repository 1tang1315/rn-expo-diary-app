import React, { useState, useMemo, useEffect } from 'react';
import {
  View, StyleSheet, Alert, Platform
} from 'react-native';
import CategoryTab from './CategoryTab';
import TimelineList from './TimelineList';
import AddEventButton from './AddEventButton';
import EventModal from './EventModal';
import {
  createEvent,
  getEventsByDate,
  updateEvent,
  deleteEvent as deleteEventApi,
  getCommonTitlesByCategory
} from '@/db/eventDB';
import {
  baseTabCategories,
  categoryIcons,
} from '@/constants/timelineConstants';

// 工具函数：合并日期和时间
const mergeDateAndTime = (baseDate, timeDate) => {
  const newDate = new Date(baseDate);
  newDate.setHours(timeDate.getHours());
  newDate.setMinutes(timeDate.getMinutes());
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
};

// 工具函数：格式化数据库日期（YYYY-MM-DD）
const formatDbDate = (date) => date?.toISOString().split('T')[0];

// 格式化持续时间（总分钟数 -> xx小时 xx分钟 或者 xx分钟）
const formatDuration = (event) => {
  const start = new Date(event.displayStartDatetime || event.startDatetime);
  const end = new Date(event.displayEndDatetime || event.endDatetime);
  const durationMs = end - start;
  const totalMinutes = Math.floor(durationMs / (1000 * 60)); // 转总分钟数
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
  return `${minutes}分钟`;
};

const TimelinePanel = ({ selectedDate }) => {
  // 状态管理
  const [tabOrder, setTabOrder] = useState(() => [
    { id: 'all', name: '全部', icon: 'view-list', isFixed: true },
    ...baseTabCategories
  ]);
  const [currentTab, setCurrentTab] = useState('all');
  const [timelineData, setTimelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 弹窗相关状态
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // 表单数据状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDatetime: new Date(),
    endDatetime: new Date(new Date().getTime() + 10 * 60 * 1000),
    icon: 'event-note',
    category: 'daily',
    status: 'upcoming'
  });
  
  // 常用标题状态
  const [commonTitles, setCommonTitles] = useState([]);
  
  // 日期选择器状态
  const [showDatetimePicker, setShowDatetimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // date/time
  const [targetDatetime, setTargetDatetime] = useState('start'); // start/end
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [tempSelectedCategory, setTempSelectedCategory] = useState('');
  
  // 工具函数：仅在显示层处理跨日事件，返回当前选中日期应显示的事件片段（不修改原始数据）
  const getEventForCurrentDate = (event, currentViewDate) => {
    const eventStart = new Date(event.startDatetime);
    const eventEnd = new Date(event.endDatetime);
    const viewDate = new Date(currentViewDate);
    viewDate.setHours(0, 0, 0, 0); // 当前查看日期的0点
    
    const nextDay = new Date(viewDate);
    nextDay.setDate(nextDay.getDate() + 1); // 下一天的0点
    
    // 情况1：事件完全在当前查看日期内 → 直接返回原事件
    if (eventStart >= viewDate && eventEnd < nextDay) {
      return event;
    }
    
    // 情况2：事件开始于前一天，结束于当前查看日期 → 显示当前日期部分
    if (eventStart < viewDate && eventEnd >= viewDate && eventEnd < nextDay) {
      const displayStart = new Date(viewDate);
      return {
        ...event,
        displayOnlyId: `${event.id}_${displayStart.getTime()}`,
        startTime: "00:00",
        endTime: eventEnd.toTimeString().slice(0, 5),
        displayStartDatetime: displayStart.toISOString().slice(0, 16).replace('T', ' '),
        displayEndDatetime: eventEnd.toISOString().slice(0, 16).replace('T', ' ')
      };
    }
    
    // 情况3：事件开始于当前查看日期，结束于第二天 → 显示当前日期部分
    if (eventStart >= viewDate && eventStart < nextDay && eventEnd >= nextDay) {
      const displayEnd = new Date(nextDay);
      displayEnd.setMilliseconds(-1); // 当天23:59:59
      return {
        ...event,
        displayOnlyId: `${event.id}_${displayEnd.getTime()}`,
        startTime: eventStart.toTimeString().slice(0, 5),
        endTime: "23:59",
        displayStartDatetime: eventStart.toISOString().slice(0, 16).replace('T', ' '),
        displayEndDatetime: displayEnd.toISOString().slice(0, 16).replace('T', ' ')
      };
    }
    
    // 情况4：事件跨越多天且包含当前查看日期 → 显示完整的当前日期
    if (eventStart < viewDate && eventEnd >= nextDay) {
      const displayStart = new Date(viewDate);
      const displayEnd = new Date(nextDay);
      displayEnd.setMilliseconds(-1); // 当天23:59:59
      return {
        ...event,
        displayOnlyId: `${event.id}_${displayStart.getTime()}`,
        startTime: "00:00",
        endTime: "23:59",
        displayStartDatetime: displayStart.toISOString().slice(0, 16).replace('T', ' '),
        displayEndDatetime: displayEnd.toISOString().slice(0, 16).replace('T', ' ')
      };
    }
    
    // 不匹配当前日期的事件，返回null
    return null;
  };
  
  // 过滤当前分类的事件
  const categorizedData = useMemo(() => {
    // 处理跨日事件，生成当前日期应显示的片段
    const eventsForCurrentDate = timelineData
      .map(event => getEventForCurrentDate(event, selectedDate))
      .filter(Boolean);
    
    return currentTab === 'all'
      ? eventsForCurrentDate
      : eventsForCurrentDate.filter(item => item.category === currentTab);
  }, [timelineData, currentTab, selectedDate]);
  
  // 当前分类的图标列表
  const currentIconOptions = useMemo(() => {
    return formData.category && categoryIcons[formData.category]
      ? categoryIcons[formData.category]
      : ['group', 'video-call', 'code', 'design-services', 'event-note'];
  }, [formData.category]);
  
  // 拉取事件数据
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const baseDate = new Date(selectedDate);
      
      // 获取当前日期
      const currentDate = formatDbDate(baseDate);
      
      // 获取前一天
      const prevDate = new Date(baseDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDbDate = formatDbDate(prevDate);
      
      // 获取后一天
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDbDate = formatDbDate(nextDate);
      
      // 并行获取三天的数据
      const [currentEvents, prevEvents, nextEvents] = await Promise.all([
        getEventsByDate(currentDate),
        getEventsByDate(prevDbDate),
        getEventsByDate(nextDbDate)
      ]);
      
      // 合并所有事件并去重
      const allEvents = [...currentEvents, ...prevEvents, ...nextEvents];
      const uniqueEvents = Array.from(new Map(allEvents.map(item => [item.id, item])).values());
      
      // 格式化事件
      const formattedEvents = uniqueEvents.map(event => ({
        id: event.id.toString(),
        startTime: event.start_datetime.split(' ')[1]?.slice(0, 5) || '00:00',
        endTime: event.end_datetime.split(' ')[1]?.slice(0, 5) || '00:00',
        startDatetime: event.start_datetime,
        endDatetime: event.end_datetime,
        title: event.title,
        description: event.description,
        status: event.status || 'upcoming',
        icon: event.icon,
        category: event.category
      }));
      
      // 按开始时间排序
      const sortedEvents = formattedEvents.sort((a, b) => {
        return new Date(b.startDatetime) - new Date(a.startDatetime);
      });
      setTimelineData(sortedEvents);
    } catch (error) {
      console.error('拉取日程失败:', error);
      Alert.alert('错误', '获取日程数据失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 拉取常用标题
  const fetchCommonTitles = async (category) => {
    try {
      const titles = await getCommonTitlesByCategory(category, 5);
      setCommonTitles(titles);
    } catch (error) {
      console.error('获取常用标题失败:', error);
    }
  };
  
  // 选中日期变化时重新拉取事件
  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);
  
  // 分类变化时更新常用标题和默认图标
  useEffect(() => {
    if (modalVisible) {
      fetchCommonTitles(formData.category);
      // 切换分类时自动选择第一个图标（如果当前图标不在新分类中）
      if (categoryIcons[formData.category]?.length &&
        !categoryIcons[formData.category].includes(formData.icon)) {
        setFormData(prev => ({
          ...prev,
          icon: categoryIcons[formData.category][0]
        }));
      }
    }
  }, [formData.category, modalVisible]);
  
  // 日期选择变更
  const handleDatetimeChange = (event, selectedDate) => {
    // iOS取消逻辑
    if (!selectedDate) {
      setShowDatetimePicker(Platform.OS === 'ios');
      return;
    }
    
    const currentTarget = targetDatetime === 'start' ? 'startDatetime' : 'endDatetime';
    const originalDate = new Date(formData[currentTarget]);
    let newDate;
    
    if (pickerMode === 'date') {
      // 仅修改日期，保留时间
      newDate = mergeDateAndTime(selectedDate, originalDate);
    } else {
      // 仅修改时间，保留日期
      newDate = new Date(originalDate);
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }
    
    setFormData(prev => ({ ...prev, [currentTarget]: newDate }));
    setShowDatetimePicker(Platform.OS === 'ios');
  };
  
  // 表单值修改
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // 保存/更新事件
  const saveEvent = async () => {
    // 校验时间
    const startDatetime = new Date(formData.startDatetime);
    const endDatetime = new Date(formData.endDatetime);
    if (startDatetime >= endDatetime) {
      Alert.alert('时间错误', '结束日期时间必须晚于开始日期时间');
      return;
    }
    
    // 格式化时间为数据库格式（YYYY-MM-DD HH:MM）
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
        // 更新事件
        const eventId = parseInt(currentEvent.id);
        const isSuccess = await updateEvent(eventId, eventParams);
        if (!isSuccess) throw new Error('更新失败');
        Alert.alert('成功', '日程更新完成');
      } else {
        // 新增事件
        await createEvent(eventParams);
        Alert.alert('成功', '新日程添加完成');
      }
      fetchEvents(); // 重新拉取数据
      setModalVisible(false);
    } catch (error) {
      console.error(currentEvent ? '更新事件失败:' : '新增事件失败:', error);
      Alert.alert('错误', currentEvent ? '更新日程失败' : '添加日程失败');
    }
  };
  
  // 删除事件
  const handleDeleteEvent = async () => {
    if (!currentEvent) return;
    Alert.alert('确认删除', '此操作不可恢复，确定要删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const eventId = parseInt(currentEvent.id);
            const isSuccess = await deleteEventApi(eventId);
            if (!isSuccess) throw new Error('删除失败');
            Alert.alert('成功', '日程已删除');
            fetchEvents();
            setModalVisible(false);
          } catch (error) {
            console.error('删除事件失败:', error);
            Alert.alert('错误', '删除日程失败，请稍后再试');
          }
        }
      }
    ]);
  };
  
  // 确认分类选择
  const confirmCategorySelect = () => {
    if (tempSelectedCategory) {
      setFormData(prev => ({ ...prev, category: tempSelectedCategory }));
      fetchCommonTitles(tempSelectedCategory); // 立即更新常用标题
    }
    setShowCategoryPicker(false);
  };
  
  // 打开添加弹窗
  const openAddModal = () => {
    const defaultCategory = currentTab !== 'all'
      ? currentTab
      : tabOrder.find(tab => !tab.isFixed)?.id || 'daily';
    const defaultIcon = categoryIcons[defaultCategory]?.[0] || 'event-note';
    
    // 初始化表单（日期为selectedDate，时间为当前）
    const baseDate = new Date(selectedDate);
    const now = new Date();
    const defaultStart = mergeDateAndTime(baseDate, now);
    const defaultEnd = mergeDateAndTime(baseDate, new Date(now.getTime() + 10 * 60 * 1000));
    
    setCurrentEvent(null);
    setFormData({
      title: '',
      description: '',
      startDatetime: defaultStart,
      endDatetime: defaultEnd,
      icon: defaultIcon,
      category: defaultCategory,
      status: 'upcoming'
    });
    setTempSelectedCategory(defaultCategory);
    setModalVisible(true);
    fetchCommonTitles(defaultCategory);
  };
  
  // 打开编辑弹窗
  const openEditModal = (event) => {
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDatetime: new Date(event.startDatetime),
      endDatetime: new Date(event.endDatetime),
      icon: event.icon,
      category: event.category,
      status: event.status || 'upcoming'
    });
    setTempSelectedCategory(event.category);
    setModalVisible(true);
    fetchCommonTitles(event.category);
  };
  
  return (
    <View style={styles.container}>
      {/* 分类标签栏 */}
      <CategoryTab
        tabOrder={tabOrder}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onTabOrderUpdate={(sortedTabs) => setTabOrder([
          { id: 'all', name: '全部', icon: 'view-list', isFixed: true },
          ...sortedTabs
        ])}
      />
      
      {/* 事件列表 */}
      <TimelineList
        categorizedData={categorizedData}
        isLoading={isLoading}
        currentTab={currentTab}
        tabOrder={tabOrder}
        openEditModal={openEditModal} // 传递编辑回调
        formatDuration={formatDuration} // 传递时长格式化工具
      />
      
      {/* 导入的独立组件：浮动添加按钮 */}
      <AddEventButton onPress={openAddModal} />
      
      {/* 导入的独立组件：事件弹窗 */}
      <EventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentEvent={currentEvent}
        formData={formData}
        onFormChange={handleInputChange}
        onSave={saveEvent}
        onDelete={handleDeleteEvent}
        tabOrder={tabOrder}
        commonTitles={commonTitles}
        showDatetimePicker={showDatetimePicker}
        pickerMode={pickerMode}
        targetDatetime={targetDatetime}
        onShowDatetimePicker={(target, mode) => {
          setShowDatetimePicker(mode !== 'category');
          setPickerMode(mode);
          setTargetDatetime(target);
          setShowCategoryPicker(mode === 'category');
        }}
        onDatetimeChange={handleDatetimeChange}
        showCategoryPicker={showCategoryPicker}
        tempSelectedCategory={tempSelectedCategory}
        onTempCategoryChange={setTempSelectedCategory}
        onConfirmCategory={confirmCategorySelect}
        currentIconOptions={currentIconOptions}
        selectedDate={selectedDate}
      />
    </View>
  );
};

// 主组件样式（仅保留与时间线、列表相关的样式）
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    elevation: 4,
    backgroundColor: '#fff',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)'
  }
});

export default TimelinePanel;