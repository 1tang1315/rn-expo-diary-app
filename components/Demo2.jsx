import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CategoryTab from './CategoryTab';
import {
  createEvent,
  getEventsByDate,
  updateEvent,
  deleteEvent as deleteEventApi
} from '@/db/eventDB';

// 分类与图标列表（固定配置）
const baseTabCategories = [
  { id: 'daily', name: '日常', icon: 'access-time' },
  { id: 'work', name: '工作', icon: 'work' },
  { id: 'study', name: '学习', icon: 'book' },
  { id: 'entertainment', name: '娱乐', icon: 'gamepad' },
  { id: 'sports', name: '运动健康', icon: 'fitness-center' },
  { id: 'sleep', name: '睡眠', icon: 'bed' },
  { id: 'diet', name: '饮食', icon: 'restaurant' },
  { id: 'shopping', name: '购物', icon: 'shopping-cart' },
  { id: 'travel', name: '出行', icon: 'flight' }
];

// 状态颜色映射
const statusColors = {
  completed: '#4CAF50',
  inProgress: '#FF9800',
  upcoming: '#9E9E9E'
};

// 图标选择
const iconOptions = [
  'group', 'video-call', 'code', 'design-services', 'event-note',
  'meeting-room', 'task', 'email', 'phone', 'file-copy', 'directions-run'
];

const formatDbDate = (date) => date.toISOString().split('T')[0];

const TimelinePanel = ({ selectedDate }) => {
  const [tabOrder, setTabOrder] = useState(() => [
    { id: 'all', name: '全部', icon: 'view-list', isFixed: true },
    ...baseTabCategories
  ]);
  const [currentTab, setCurrentTab] = useState('all');
  const [timelineData, setTimelineData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 默认+1小时
    icon: 'event-note',
    category: 'daily'
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const dbDate = formatDbDate(selectedDate.toDate());
      const rawEvents = await getEventsByDate(dbDate);
      const formattedEvents = rawEvents.map(event => ({
        id: event.id.toString(),
        startTime: event.start_time,
        endTime: event.end_time,
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
  };
  
  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);
  
  const openAddModal = () => {
    const defaultCategory = tabOrder.find(tab => !tab.isFixed)?.id || 'daily';
    setCurrentEvent(null);
    setFormData({
      title: '',
      description: '',
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
      icon: 'event-note',
      category: defaultCategory
    });
    setModalVisible(true);
  };
  
  const openEditModal = (event) => {
    setCurrentEvent(event);
    const today = selectedDate.toDate();
    setFormData({
      title: event.title,
      description: event.description,
      startTime: new Date(`${formatDbDate(today)}T${event.startTime}`),
      endTime: new Date(`${formatDbDate(today)}T${event.endTime}`),
      icon: event.icon,
      category: event.category
    });
    setModalVisible(true);
  };
  
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const saveEvent = async () => {
    if (!formData.startTime || !formData.endTime) {
      Alert.alert('输入错误', '请选择开始时间和结束时间');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      Alert.alert('时间错误', '结束时间必须晚于开始时间');
      return;
    }
    
    const eventParams = {
      date: formatDbDate(selectedDate.toDate()),
      start_time: formData.startTime.toTimeString().slice(0, 5),
      end_time: formData.endTime.toTimeString().slice(0, 5),
      title: formData.title,
      category: formData.category,
      description: formData.description,
      status: currentEvent ? currentEvent.status : 'upcoming',
      icon: formData.icon
    };
    
    try {
      if (currentEvent) {
        const eventId = parseInt(currentEvent.id);
        const isSuccess = await updateEvent(eventId, eventParams);
        if (!isSuccess) throw new Error('更新失败');
        Alert.alert('成功', '日程更新完成');
      } else {
        await createEvent(eventParams);
        Alert.alert('成功', '新日程添加完成');
      }
      fetchEvents();
      setModalVisible(false);
    } catch (error) {
      console.error(currentEvent ? '更新事件失败:' : '新增事件失败:', error);
      Alert.alert('错误', currentEvent ? '更新日程失败' : '添加日程失败');
    }
  };
  
  const handleDeleteEvent = async () => {
    if (!currentEvent) return;
    Alert.alert('确认删除','此操作不可恢复，确定要删除这个日程吗？',[
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
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
  
  const categorizedData = useMemo(() => {
    return currentTab === 'all' ? timelineData : timelineData.filter(item => item.category === currentTab);
  }, [timelineData, currentTab]);
  
  const renderTimelineItem = ({ item }) => {
    const tabName = tabOrder.find(cat => cat.id === item.category)?.name || '未分类';
    const displayTitle = item.title || tabName;
    return (
      <View style={styles.timelineItemContainer}>
        <View style={styles.timelineColumn}>
          <View style={[styles.timelineDot, { backgroundColor: statusColors[item.status] }]}>
            <MaterialIcons name={item.icon} size={14} color="white" />
          </View>
          <Text style={styles.startTimeText}>{item.startTime}</Text>
          <View style={[styles.timelineLine, { backgroundColor: statusColors[item.status] }]} />
          <Text style={styles.endTimeText}>{item.endTime}</Text>
        </View>
        <TouchableOpacity
          style={[styles.contentCard, { borderLeftColor: statusColors[item.status] }]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.timeRange}>{item.startTime} - {item.endTime}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status]}20` }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {item.status === 'completed' ? '已完成' : item.status === 'inProgress' ? '进行中' : '即将开始'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderIconSelector = () => (
    <View>
      <Text style={styles.formLabel}>选择图标</Text>
      <View style={styles.iconGrid}>
        {iconOptions.map(icon => (
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
  
  const renderLoading = () => (
    <View style={styles.loadingState}>
      <FontAwesome name="hourglass-half" size={32} color="#ccc" />
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  );
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <CategoryTab
        tabOrder={tabOrder}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onTabOrderUpdate={(sortedTabs) => setTabOrder([{ id: 'all', name: '全部', icon: 'view-list', isFixed: true }, ...sortedTabs])}
      />
      
      <FlatList
        data={categorizedData}
        renderItem={renderTimelineItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.timelineList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => {
          if (isLoading) return renderLoading();
          return (
            <View style={styles.emptyState}>
              <MaterialIcons name={currentTab === 'all' ? 'event' : tabOrder.find(tab => tab.id === currentTab)?.icon} size={48} color="#ccc" />
              <Text style={styles.emptyText}>{currentTab === 'all' ? '今日暂无任何日程' : `当前「${tabOrder.find(tab => tab.id === currentTab)?.name}」分类无日程`}</Text>
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>{currentTab === 'all' ? '添加第一个日程' : `添加「${tabOrder.find(tab => tab.id === currentTab)?.name}」日程`}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListFooterComponent={() => !isLoading && categorizedData.length > 0 && (
          <View style={styles.listFooter}>
            <TouchableOpacity style={styles.listAddButton} onPress={openAddModal}>
              <MaterialIcons name="add" size={20} color="white" style={styles.addIcon} />
              <Text style={styles.listAddButtonText}>添加新日程</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{currentEvent ? '编辑日程' : '添加新日程'}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formScrollView}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>事件标题（可选，不填显示分类名）</Text>
                  <TextInput style={styles.formInput} value={formData.title} onChangeText={(val) => handleInputChange('title', val)} placeholder="输入事件标题（可选）" />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>描述（必填）</Text>
                  <TextInput style={[styles.formInput, styles.multilineInput]} value={formData.description} onChangeText={(val) => handleInputChange('description', val)} placeholder="请输入日程详情（如：会议主题、任务内容）" multiline numberOfLines={4} />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>开始时间 *</Text>
                  <TouchableOpacity style={styles.timeInput} onPress={() => setShowStartPicker(true)}>
                    <Text>{formData.startTime.toLocaleString()}</Text>
                  </TouchableOpacity>
                  {showStartPicker && (
                    <DateTimePicker
                      value={formData.startTime}
                      mode="datetime"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(e, date) => {
                        setShowStartPicker(false);
                        if (date) handleInputChange('startTime', date);
                      }}
                    />
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>结束时间 *</Text>
                  <TouchableOpacity style={styles.timeInput} onPress={() => setShowEndPicker(true)}>
                    <Text>{formData.endTime.toLocaleString()}</Text>
                  </TouchableOpacity>
                  {showEndPicker && (
                    <DateTimePicker
                      value={formData.endTime}
                      mode="datetime"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(e, date) => {
                        setShowEndPicker(false);
                        if (date) handleInputChange('endTime', date);
                      }}
                    />
                  )}
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>所属分类</Text>
                  <View style={styles.categoryDisplay}>
                    <MaterialIcons name={tabOrder.find(cat => cat.id === formData.category)?.icon} size={18} color="#2196F3" style={styles.categoryIcon} />
                    <Text style={styles.categoryText}>{tabOrder.find(cat => cat.id === formData.category)?.name}</Text>
                  </View>
                </View>
                
                {renderIconSelector()}
              </ScrollView>
              
              <View style={styles.modalFooter}>
                {currentEvent && (
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteEvent}>
                    <Text style={styles.deleteButtonText}>删除</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveEvent}>
                  <Text style={styles.saveButtonText}>{currentEvent ? '更新' : '保存'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  /** 组件容器基础样式 */
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  
  /** 日程列表相关样式 */
  timelineList: {
    padding: 20,
    paddingTop: 10,
    flexGrow: 1
  },
  timelineItemContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative'
  },
  timelineColumn: {
    alignItems: 'center',
    marginRight: 16,
    width: 40,
    paddingVertical: 8,
    position: 'relative'
  },
  startTimeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4
  },
  endTimeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
    top: 58,
    bottom: 25,
    zIndex: 1
  },
  contentCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    elevation: 2,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)'
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333'
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  timeRange: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic'
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  
  /** 列表底部新增按钮样式 */
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  listAddButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  addIcon: {
    marginRight: 8
  },
  listAddButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16
  },
  
  /** 加载状态样式 */
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999'
  },
  
  /** 空数据状态样式 */
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center'
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500'
  },
  
  /** 模态框基础样式 */
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
  
  /** 表单组件样式 */
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
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top'
  },
  timeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  timeInputGroup: {
    flex: 1
  },
  firstTimeInputGroup: {
    marginRight: 0 // 用gap替代margin
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
  },
  
  /** react-native-date-picker 专属样式 */
  iosTimePicker: {
    width: 300,
    height: 200,
    marginVertical: 10,
    alignSelf: 'center' // 居中显示
  },
  androidTimePicker: {
    width: 300,
    height: 150,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignSelf: 'center' // 居中显示
  },
  
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
  
  /** 图标选择器样式 */
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
  
  /** 模态框底部按钮样式 */
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


export default TimelinePanel
