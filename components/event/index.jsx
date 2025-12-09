import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet, Alert } from 'react-native';
import CategoryTab from '@/components/common/CategoryTab';
import TimelineList from './TimelineList';
import AddEventButton from '../common/AddButton';
import EventModal from './EventModal';
import { getEventsByDateRange } from '@/db/eventDB';
import { categories } from "@/constants/commonConstans";
import ThemeCard from "@/components/Theme/ThemeCard";

const TimelinePanel = ({ selectedDate }) => {
  const [currentTab, setCurrentTab] = useState('all');
  const [timelineData, setTimelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 弹窗相关状态
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // 过滤当前分类的事件
  const categorizedData = useMemo(() => {
    return currentTab === 'all'
      ? timelineData
      : timelineData.filter(item => item.category === currentTab);
  }, [timelineData, currentTab]);
  
  // 拉取事件数据
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const events = await getEventsByDateRange(selectedDate.startOf('day'));
      
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
    <ThemeCard style={styles.container}>
      <CategoryTab
        categories={categories}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />
      
      {/* 分类标签栏 */}
      <ThemeCard innerCard={true} style={{flex: 1}}>
        {/* 事件列表 */}
        <TimelineList
          categorizedData={categorizedData}
          isLoading={isLoading}
          currentTab={currentTab}
          openEditModal={openEditModal} // 传递编辑回调
        />
      </ThemeCard>
      
      {/* 导入的独立组件：浮动添加按钮 */}
      <AddEventButton onPress={openAddModal} />
      
      {/* 导入的独立组件：事件弹窗 */}
      <EventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentEvent={currentEvent}
        selectedDate={selectedDate}
        currentTab={currentTab}
        onRefresh={fetchEvents}
      />
    </ThemeCard>
  );
};

// 主组件样式（仅保留与时间线、列表相关的样式）
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0
  }
});

export default TimelinePanel;