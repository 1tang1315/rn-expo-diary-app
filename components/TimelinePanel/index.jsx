import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, Alert
} from 'react-native';
import CategoryTab from './CategoryTab';
import TimelineList from './TimelineList';
import AddEventButton from './AddEventButton';
import EventModal from './EventModal';
import { getEventsByDateRange } from '@/db/eventDB';
import { categories } from "@/constants/commonConstans";

const TimelinePanel = ({ selectedDate }) => {
  // 状态管理
  const [tabOrder, setTabOrder] = useState(() => [
    { id: 'all', name: '全部', icon: 'view-list', isFixed: true },
    ...categories
  ]);
  const [currentTab, setCurrentTab] = useState('all');
  const [timelineData, setTimelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 弹窗相关状态
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
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
  
  // 拉取事件数据
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const events = await getEventsByDateRange(selectedDate);
      
      // 格式化事件
      const formattedEvents = events.map(event => ({
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
      
      setTimelineData(formattedEvents);
    } catch (error) {
      console.error('拉取日程失败:', error);
      Alert.alert('错误', '获取日程数据失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);
  
  // 选中日期变化时重新拉取事件
  useEffect(() => {
    fetchEvents().then();
  }, [fetchEvents, selectedDate]);
  
  // 打开添加弹窗
  const openAddModal = () => {
    setCurrentEvent(null);
    setModalVisible(true);
  };
  
  // 打开编辑弹窗
  const openEditModal = (event) => {
    setCurrentEvent(event);
    setModalVisible(true);
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
      />
      
      {/* 导入的独立组件：浮动添加按钮 */}
      <AddEventButton onPress={openAddModal} />
      
      {/* 导入的独立组件：事件弹窗 */}
      <EventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentEvent={currentEvent}
        tabOrder={tabOrder}
        selectedDate={selectedDate}
        onRefresh={fetchEvents}
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