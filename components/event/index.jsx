import { eventApi } from "@/api";
import CategoryTab from '@/components/common/CategoryTab';
import ThemeCard from "@/components/theme/ThemeCard";
import { categories } from "@/constants/commonConstans";
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import AddEventButton from '../common/AddButton';
import EventModal from './EventModal';
import TimelineList from './TimelineList';
import CompileDiaryBar from './CompileDiaryBar';

const TimelinePanel = ({ selectedDate }) => {
  const [currentTab, setCurrentTab] = useState('all');
  const [timelineData, setTimelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 弹窗相关状态
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  // 拉取事件数据
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    
    const events = await eventApi.getByDateRangeAndCategory({
      startDate: selectedDate.startOf('day'),
      category: currentTab
    });
    
    // 格式化事件
    const formattedEvents = events?.map(event => ({
      ...event,
      startTime: event.startDatetime?.split(' ')[1]?.slice(0, 5) || '00:00',
      endTime: event.endDatetime?.split(' ')[1]?.slice(0, 5) || '00:00',
      status: event.status || 'upcoming'
    }));
    
    setTimelineData(formattedEvents);
    
    setIsLoading(false);
  }, [selectedDate, currentTab]);
  
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
      
      <CompileDiaryBar selectedDate={selectedDate} />

      {/* 事件列表 */}
      <TimelineList
        categorizedData={timelineData}
        isLoading={isLoading}
        currentTab={currentTab}
        openEditModal={openEditModal} // 传递编辑回调
      />
      
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
    flex: 1
  }
});

export default TimelinePanel;