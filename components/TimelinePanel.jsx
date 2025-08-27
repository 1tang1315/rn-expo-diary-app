import React, { useState, useMemo } from 'react';
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
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 导入抽离的「导航栏+拖拽」组件
import CategoryTab from './CategoryTab';

// 基础配置
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

// 示例数据
const initialTimelineData = [
  {
    id: '1',
    startTime: '08:30',
    endTime: '09:15',
    title: '团队晨会',
    description: '讨论今日工作安排和进度',
    status: 'completed',
    icon: 'group',
    category: 'work'
  },
  {
    id: '2',
    startTime: '10:15',
    endTime: '11:30',
    title: '客户视频会议',
    description: '讨论新项目需求和预算',
    status: 'completed',
    icon: 'video-call',
    category: 'work'
  },
  {
    id: '3',
    startTime: '13:45',
    endTime: '15:00',
    title: '',
    description: '前端组件架构评审',
    status: 'inProgress',
    icon: 'code',
    category: 'work'
  },
  {
    id: '4',
    startTime: '15:30',
    endTime: '16:30',
    title: '产品原型讨论',
    description: '与产品经理确认新功能原型',
    status: 'upcoming',
    icon: 'design-services',
    category: 'work'
  },
  {
    id: '5',
    startTime: '19:00',
    endTime: '20:30',
    title: '',
    description: '跑步3公里+拉伸',
    status: 'upcoming',
    icon: 'directions-run',
    category: 'sports'
  }
];

// 状态颜色映射
const statusColors = {
  completed: '#4CAF50',
  inProgress: '#FF9800',
  upcoming: '#9E9E9E'
};

// 图标列表
const iconOptions = [
  'group', 'video-call', 'code', 'design-services', 'event-note',
  'meeting-room', 'task', 'email', 'phone', 'file-copy', 'directions-run'
];

const TimelinePanel = () => {
  // 核心状态管理（分类数据与选中状态）
  const [tabOrder, setTabOrder] = useState(() => [
    { id: 'all', name: '全部', icon: 'view-list', isFixed: true },
    ...baseTabCategories
  ]);
  const [currentTab, setCurrentTab] = useState('all');
  
  // 其他状态
  const [timelineData, setTimelineData] = useState(initialTimelineData);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    icon: 'event-note',
    category: 'daily'
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // 数据过滤逻辑
  const categorizedData = useMemo(() => {
    if (currentTab === 'all') return timelineData;
    return timelineData.filter(item => item.category === currentTab);
  }, [timelineData, currentTab]);
  
  // 处理分类排序更新（接收子组件回调）
  const handleTabOrderUpdate = (sortedTabs) => {
    setTabOrder([
      { id: 'all', name: '全部', icon: 'view-list', isFixed: true },
      ...sortedTabs
    ]);
  };
  
  // 表单相关逻辑
  const openAddModal = () => {
    setCurrentEvent(null);
    const defaultCategory = tabOrder.find(tab => !tab.isFixed)?.id || 'daily';
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      icon: 'event-note',
      category: defaultCategory
    });
    setModalVisible(true);
  };
  
  const openEditModal = (event) => {
    setCurrentEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startTime: event.startTime,
      endTime: event.endTime,
      icon: event.icon,
      category: event.category
    });
    setModalVisible(true);
  };
  
  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTimeChange = (event, selectedTime, isStartTime = true) => {
    if (isStartTime) setShowStartTimePicker(Platform.OS === 'ios');
    else setShowEndTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      setSelectedDate(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      handleInputChange(isStartTime ? 'startTime' : 'endTime', `${hours}:${minutes}`);
    }
  };
  
  const saveEvent = () => {
    if (!formData.startTime || !formData.endTime) {
      Alert.alert('输入错误', '请填写时间信息');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      Alert.alert('时间错误', '结束时间应晚于开始时间');
      return;
    }
    
    if (currentEvent) {
      setTimelineData(prev =>
        prev.map(item => item.id === currentEvent.id ? { ...item, ...formData } : item)
      );
    } else {
      const newEvent = {
        id: Date.now().toString(),
        ...formData,
        status: 'upcoming'
      };
      const updatedData = [...timelineData, newEvent].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
      setTimelineData(updatedData);
    }
    
    setModalVisible(false);
  };
  
  const deleteEvent = (id) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个事件吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            setTimelineData(prev => prev.filter(item => item.id !== id));
            setModalVisible(false);
          }
        }
      ]
    );
  };
  
  // 渲染日程项
  const renderTimelineItem = ({ item }) => {
    const tabName = tabOrder.find(cat => cat.id === item.category)?.name || '未分类';
    
    return (
      <View style={styles.timelineItemContainer}>
        <View style={styles.timelineColumn}>
          <View style={[styles.timelineDot, { backgroundColor: statusColors[item.status] }]}>
            <MaterialIcons name={item.icon} size={14} color="white" />
          </View>
          <Text style={styles.startTimeText}>{item.startTime}</Text>
          <View style={[styles.timelineLine, { backgroundColor: statusColors[item.status] }]} />
          <Text style={[styles.endTimeText, { marginTop: 'auto' }]}>{item.endTime}</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.contentCard, { borderLeftColor: statusColors[item.status] }]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.title}>{item.title || tabName}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.timeRange}>{item.startTime} - {item.endTime}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColors[item.status]}20` }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {item.status === 'completed' && '已完成'}
              {item.status === 'inProgress' && '进行中'}
              {item.status === 'upcoming' && '即将开始'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  // 渲染图标选择器
  const renderIconSelector = () => {
    return (
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
  };
  
  return (
    <GestureHandlerRootView style={styles.container}>
      {/* 抽离的核心组件：「分类Tab导航栏 + 拖拽排序弹窗」 */}
      <CategoryTab
        tabOrder={tabOrder}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onTabOrderUpdate={handleTabOrderUpdate}
      />
      
      {/* 日程列表 */}
      <FlatList
        data={categorizedData}
        renderItem={renderTimelineItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.timelineList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <MaterialIcons
              name={currentTab === 'all' ? 'event' : tabOrder.find(tab => tab.id === currentTab)?.icon}
              size={48}
              color="#ccc"
            />
            <Text style={styles.emptyText}>
              {currentTab === 'all'
                ? '今日暂无任何日程'
                : `当前「${tabOrder.find(tab => tab.id === currentTab)?.name}」分类无日程`
              }
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Text style={styles.addButtonText}>
                {currentTab === 'all'
                  ? '添加第一个日程'
                  : `添加「${tabOrder.find(tab => tab.id === currentTab)?.name}」日程`
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      
      {/* 添加/编辑事件弹窗 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{currentEvent ? '编辑事件' : '添加新事件'}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formScrollView}>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>事件标题（可选，不填显示分类名）</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.title}
                    onChangeText={(value) => handleInputChange('title', value)}
                    placeholder="输入事件标题（可选）"
                  />
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>描述</Text>
                  <TextInput
                    style={[styles.formInput, styles.multilineInput]}
                    value={formData.description}
                    onChangeText={(value) => handleInputChange('description', value)}
                    placeholder="输入事件描述"
                    multiline
                    numberOfLines={4}
                  />
                </View>
                
                <View style={styles.timeInputsContainer}>
                  <View style={[styles.formGroup, styles.timeInputGroup, styles.firstTimeInputGroup]}>
                    <Text style={styles.formLabel}>开始时间 *</Text>
                    <TouchableOpacity style={styles.timeInput} onPress={() => setShowStartTimePicker(true)}>
                      <Text>{formData.startTime || '选择开始时间'}</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={[styles.formGroup, styles.timeInputGroup]}>
                    <Text style={styles.formLabel}>结束时间 *</Text>
                    <TouchableOpacity style={styles.timeInput} onPress={() => setShowEndTimePicker(true)}>
                      <Text>{formData.endTime || '选择结束时间'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>所属分类</Text>
                  <View style={styles.categoryDisplay}>
                    <MaterialIcons
                      name={tabOrder.find(cat => cat.id === formData.category)?.icon}
                      size={18}
                      color="#2196F3"
                      style={styles.categoryIcon}
                    />
                    <Text style={styles.categoryText}>
                      {tabOrder.find(cat => cat.id === formData.category)?.name}
                    </Text>
                  </View>
                </View>
                
                {renderIconSelector()}
                
                {showStartTimePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, time) => handleTimeChange(event, time, true)}
                  />
                )}
                
                {showEndTimePicker && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, time) => handleTimeChange(event, time, false)}
                  />
                )}
              </ScrollView>
              
              <View style={styles.modalFooter}>
                {currentEvent && (
                  <TouchableOpacity style={styles.deleteButton} onPress={() => deleteEvent(currentEvent.id)}>
                    <Text style={styles.deleteButtonText}>删除</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.saveButton} onPress={saveEvent}>
                  <Text style={styles.saveButtonText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
};

// 主组件样式（保留顶部标题区+日程列表+表单弹窗样式）
const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#fff'
  },
  
  // 日程列表样式
  timelineList: {
    padding: 20,
    paddingTop: 10
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
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
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  
  // 空状态样式
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
    marginBottom: 24
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
  
  // 表单弹窗样式
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
    justifyContent: 'space-between'
  },
  timeInputGroup: {
    flex: 1,
    marginBottom: 20
  },
  firstTimeInputGroup: {
    marginRight: 10
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white'
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

export default TimelinePanel;