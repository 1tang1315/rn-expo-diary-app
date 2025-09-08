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
  Alert, Button
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CategoryTab from './CategoryTab';
import {
  createEvent,
  getEventsByDate,
  updateEvent,
  deleteEvent as deleteEventApi,
  getCommonTitlesByCategory
} from '@/db/eventDB';

// 分类与图标列表（固定配置）
const baseTabCategories = [
  {
    id: 'daily',
    name: '日常',
    icon: 'access-time'
  },
  {
    id: 'work',
    name: '工作',
    icon: 'work'
  },
  {
    id: 'study',
    name: '学习',
    icon: 'book'
  },
  {
    id: 'entertainment',
    name: '娱乐',
    icon: 'gamepad'
  },
  {
    id: 'sports',
    name: '运动健康',
    icon: 'fitness-center'
  },
  {
    id: 'sleep',
    name: '睡眠',
    icon: 'bed'
  },
  {
    id: 'diet',
    name: '饮食',
    icon: 'restaurant'
  },
  {
    id: 'shopping',
    name: '购物',
    icon: 'shopping-cart'
  },
  {
    id: 'travel',
    name: '出行',
    icon: 'flight'
  }
];

// 状态颜色映射
const statusColors = {
  early: '#9E9E9E',        // 时间还早
  upcoming: '#4CAF50',     // 即将开始
  inProgress: '#FF9800',   // 进行中
  completed: '#2196F3',    // 已完成
  notCompleted: '#F44336', // 未完成
};

// 事件图标选择
const categoryIcons = {
  // 日常分类图标（具体生活场景）
  daily: [
    'access-time',           // 日常
    'face',                  // 洗漱（刷牙+洗脸）
    'bathtub',               // 洗澡
    'bathroom',              // 上厕所
    'local-laundry-service', // 洗衣服
    'cleaning-services',     // 搞卫生
    'home',                  // 居家
    'air',                   // 开窗通风
    'child-care',            // 照顾孩子
    'pets',                  // 照顾宠物
    'smoke-free',            // 抽烟
    'free-breakfast',        // 吃零食
    'mood',                  // 发呆
    'sentiment-very-satisfied' // 摸鱼
  ],
  // 工作分类图标
  work: [
    'work',                  // 工作
    'meeting-room',          // 开会
    'file-copy',             // 处理文件
    'task',                  // 任务
    'business',              // 商务
    'call',                  // 工作电话
    'email',                 // 处理邮件
    'present-to-all',        // 汇报
    'group',                 // 团队协作
    'laptop',                // 写代码
    'print',                 // 打印
    'event-available',       // 加班
    'logout'                 // 下班
  ],
  // 学习分类图标
  study: [
    'book',                  // 看书
    'school',                // 上课
    'code',                  // 编程学习
    'quiz',                  // 做题
    'library-books',         // 图书馆
    'edit',                  // 做笔记
    'record-voice-over',     // 听课程
    'ondemand-video',        // 看教学视频
    'assignment',            // 写作业
    'language',              // 学外语
    'lightbulb',             // 思考
    'grade'                  // 考试
  ],
  // 娱乐分类图标
  entertainment: [
    'gamepad',               // 玩游戏
    'movie',                 // 看电影
    'music-note',            // 听音乐
    'sports-esports',        // 电竞
    'party-mode',            // 聚会
    'photo-camera',          // 拍照
    'tv',                    // 看电视
    'newspaper',             // 看新闻
    'book-online',           // 看小说
    'videogame-asset',       // 玩手游
    'pool',                  // 打台球
  ],
  // 运动健康分类图标
  sports: [
    'fitness-center',        // 健身
    'directions-run',        // 跑步
    'pool',                  // 游泳
    'sports-tennis',         // 网球
    'self-improvement',      // 锻炼
    'directions-bike',       // 骑车
    'sports-golf',           // 高尔夫
    'directions-walk',       // 散步
    'medication',            // 吃药
    'spa'                    // 按摩
  ],
  // 睡眠分类图标
  sleep: [
    'bed',                   // 睡觉
    'nightlight',            // 睡前准备
    'do-not-disturb',        // 勿扰
    'hotel',                 // 酒店住宿
    'schedule',              // 作息时间
    'alarm',                 // 闹钟
    'brightness-3',          // 关灯
    'brightness-5',          // 开灯
  ],
  // 饮食分类图标
  diet: [
    'breakfast-dining',      // 吃早餐
    'lunch-dining',          // 吃午餐
    'dinner-dining',         // 吃晚餐
    'restaurant',            // 餐厅吃饭
    'fastfood',              // 快餐
    'emoji-food-beverage',   // 食物饮料
    'water-drop',            // 喝水
    'local-drink',           // 奶茶
    'coffee',                // 喝咖啡
    'liquor',                // 饮酒
    'cake',                  // 甜点
    'icecream',              // 冰淇淋
  ],
  // 购物分类图标
  shopping: [
    'shopping-cart',         // 购物车
    'local-mall',            // 商场购物
    'shopping-bag',          // 购物袋
    'attach-money',          // 花钱
    'store',                 // 线下商店
    'local-grocery-store',   // 买水果
    'fastfood',              // 买零食
    'local-cafe',            // 买奶茶
    'local-drink',           // 买饮料
    'add-shopping-cart',     // 加入购物车
    'paid'                   // 付款
  ],
  // 出行分类图标
  travel: [
    'flight',                // 飞机
    'directions-car',        // 开车
    'train',                 // 火车
    'navigation',            // 导航
    'subway',                // 地铁
    'directions-bike',       // 骑行
    'directions-walk',       // 步行
    'hotel',                 // 酒店
    'local-gas-station',     // 加油
  ]
};

const formatDbDate = (date) => date?.toISOString().split('T')[0];

const TimelinePanel = ({ selectedDate }) => {
  const [tabOrder, setTabOrder] = useState(() => [
    {
      id: 'all',
      name: '全部',
      icon: 'view-list',
      isFixed: true
    },
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
    startDatetime: new Date(), // 默认开始时间：当前时间
    endDatetime: new Date(new Date().getTime() + 10 * 60 * 1000), // 默认结束时间：当前时间+10分钟
    icon: 'event-note',
    category: 'daily'
  });
  
  // 存储常用标题
  const [commonTitles, setCommonTitles] = useState([]);
  
  // 日期/时间选择器显示状态
  const [showDatetimePicker, setShowDatetimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date'); // 'date'/'time'
  const [targetDatetime, setTargetDatetime] = useState('start'); // 标记当前修改的是开始/结束时间
  
  // 分类选择相关
  const [showCategoryPicker, setShowCategoryPicker] = useState(false); // 控制分类选择弹窗显示
  const [tempSelectedCategory, setTempSelectedCategory] = useState(''); // 分类选择临时值
  
  // 图标相关
  const currentIconOptions = useMemo(() => {
    // 处理分类切换的情况
    if (formData.category && categoryIcons[formData.category]) {
      return categoryIcons[formData.category];
    }
    // 默认为全部分类时的图标集
    return [
      'group', 'video-call', 'code', 'design-services', 'event-note',
      'meeting-room', 'task', 'email', 'phone', 'file-copy', 'directions-run'
    ];
  }, [formData.category]); // 仅依赖表单中的分类字段
  
  // 根据日期获取每日事件数据
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const dbDate = formatDbDate(selectedDate);
      const rawEvents = await getEventsByDate(dbDate);
      const formattedEvents = rawEvents.map(event => ({
        id: event.id.toString(),
        // 从start_datetime中提取时间（格式：HH:MM）
        startTime: event.start_datetime.split(' ')[1] || '00:00',
        // 从end_datetime中提取时间（格式：HH:MM）
        endTime: event.end_datetime.split(' ')[1] || '00:00',
        // 保留完整datetime用于后续编辑（可选，方便回显）
        startDatetime: event.start_datetime,
        endDatetime: event.end_datetime,
        title: event.title,
        description: event.description,
        status: event.status || 'upcoming',
        icon: event.icon,
        category: event.category
      }));
      
      // 按开始时间降序排序（晚的时间在前）
      const sortedEvents = formattedEvents.sort((a, b) => {
        // 比较完整的startDatetime（格式：YYYY-MM-DD HH:MM），将晚的时间排在前面
        return new Date(b.startDatetime) - new Date(a.startDatetime);
      });
      
      setTimelineData(sortedEvents);
    } catch(error) {
      console.error('拉取日程失败:', error);
      Alert.alert('错误', '获取日程数据失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * 拉取常用标题
   */
  const fetchCommonTitles = async (category) => {
    try {
      // 使用当前选中的分类获取对应的常用标题
      const titles = await getCommonTitlesByCategory(category, 5);
      setCommonTitles(titles);
    } catch (error) {
      console.error('获取常用标题失败:', error);
    }
  };
  
  // 监听分类变化，同步更新常用标题和图标
  useEffect(() => {
    // 当弹窗打开且分类发生变化时
    if (modalVisible) {
      // 更新常用标题
      fetchCommonTitles(formData.category);
      
      // 自动选择该分类的第一个图标作为默认图标
      if (categoryIcons[formData.category]?.length) {
        // 只有当当前图标不在新分类图标列表中时才自动切换
        if (!categoryIcons[formData.category].includes(formData.icon)) {
          setFormData(prev => ({
            ...prev,
            icon: categoryIcons[formData.category][0]
          }));
        }
      }
    }
  }, [formData.category, modalVisible]);
  
  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);
  
  // 打开日期时间选择器（指定目标：开始/结束时间 + 选择模式）
  const showDatetimePickerHandler = (target, mode) => {
    setTargetDatetime(target); // 'start' 或 'end'
    setPickerMode(mode); // 'date'/'time'
    setShowDatetimePicker(true);
  };
  
  // 日期时间选择变更处理
  const handleDatetimeChange = (event, selectedDate) => {
    // Android 取消时 selectedDate 为 undefined，保留原时间
    const currentDate = selectedDate || (targetDatetime === 'start' ? formData.startDatetime : formData.endDatetime);
    
    // iOS 选择后保持弹窗显示，Android 自动隐藏
    setShowDatetimePicker(Platform.OS === 'ios');
    
    // 更新对应目标（开始/结束时间）的datetime
    if(targetDatetime === 'start') {
      setFormData(prev => ({
        ...prev,
        startDatetime: currentDate
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        endDatetime: currentDate
      }));
    }
  };
  
  // 格式化日期显示（YYYY-MM-DD）
  const formatDateDisplay = (date) => {
    return date?.toISOString()?.split('T')[0];
  };
  
  // 格式化时间显示（HH:MM）
  const formatTimeDisplay = (date) => {
    return date?.toTimeString()?.slice(0, 5);
  };
  
  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const saveEvent = async () => {
    // 检查必要字段是否存在
    if (!formData.startDatetime || !formData.endDatetime) {
      Alert.alert('数据不完整', '请填写完整的日期和时间信息');
      return;
    }
    
    // 验证日期时间：开始日期时间必须早于结束日期时间
    const startDatetime = new Date(formData.startDatetime);
    const endDatetime = new Date(formData.endDatetime);
    
    if (startDatetime >= endDatetime) {
      Alert.alert('时间错误', '结束日期时间必须晚于开始日期时间');
      return;
    }
    
    // 格式化日期时间为 "YYYY-MM-DD HH:MM" 格式
    const formatDatetime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    
    // 事件参数
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
    if(!currentEvent) return;
    Alert.alert('确认删除', '此操作不可恢复，确定要删除这个日程吗？', [
      {
        text: '取消',
        style: 'cancel'
      },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            const eventId = parseInt(currentEvent.id);
            const isSuccess = await deleteEventApi(eventId);
            if(!isSuccess) throw new Error('删除失败');
            Alert.alert('成功', '日程已删除');
            fetchEvents();
            setModalVisible(false);
          } catch(error) {
            console.error('删除事件失败:', error);
            Alert.alert('错误', '删除日程失败，请稍后再试');
          }
        }
      }
    ]);
  };
  
  // 分类相关
  const categorizedData = useMemo(() => {
    return currentTab === 'all' ? timelineData : timelineData.filter(item => item.category === currentTab);
  }, [timelineData, currentTab]);

  const confirmCategorySelect = () => {
    if (tempSelectedCategory) {
      // 更新表单分类
      setFormData(prev => ({
        ...prev,
        category: tempSelectedCategory
      }));
      // 立即更新常用标题（无需等待useEffect，提升响应速度）
      fetchCommonTitles(tempSelectedCategory);
    }
    setShowCategoryPicker(false);
  };
  
  const openAddModal = () => {
    const defaultCategory = currentTab !== 'all'
      ? currentTab
      : tabOrder.find(tab => !tab.isFixed)?.id || 'daily';
    
    setCurrentEvent(null);
    // 初始化默认时间：开始=当前时间，结束=当前时间+10分钟
    const now = new Date();
    const defaultEnd = new Date(now.getTime() + 10 * 60 * 1000);
    const defaultIcon = categoryIcons[defaultCategory]?.[0] || 'event-note';
    
    setFormData({
      title: '',
      description: '',
      startDatetime: now,
      endDatetime: defaultEnd,
      icon: defaultIcon,
      category: defaultCategory,
      status: 'upcoming'
    });
    setTempSelectedCategory(defaultCategory);
    setModalVisible(true);
    fetchCommonTitles(defaultCategory);
  };
  
  const openEditModal = (event) => {
    setCurrentEvent(event);
    // 直接使用事件原有的完整datetime（无需拆分）
    setFormData({
      title: event.title,
      description: event.description,
      // 从事件数据中解析完整Date对象
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
  
  // 单个事件内容item
  const renderTimelineItem = ({ item }) => {
    const tabName = tabOrder.find(cat => cat.id === item.category)?.name || '未分类';
    const displayTitle = item.title || tabName;
    
    // 状态自动判断逻辑
    const ONE_HOUR = 60 * 60 * 1000; // 1小时的毫秒数
    const now = new Date();          // 当前时间
    const startTime = new Date(item.startDatetime); // 事件开始时间
    const endTime = new Date(item.endDatetime);     // 事件结束时间
    const timeToStart = startTime - now;            // 距离开始时间的差值（毫秒）
    
    // 计算最终显示的状态文本和颜色
    let finalStatus;
    if (item.status === 'notCompleted') {
      // 手动标记的「未完成」优先
      finalStatus = 'notCompleted';
    } else if (now > endTime) {
      finalStatus = 'completed';
    } else if (now >= startTime && now <= endTime) {
      finalStatus = 'inProgress';
    } else if (timeToStart > 0 && timeToStart <= ONE_HOUR) {
      finalStatus = 'upcoming';
    } else if (timeToStart > ONE_HOUR) {
      finalStatus = 'early';
    } else {
      finalStatus = 'upcoming';
    }
    
    const finalStatusColor = statusColors[finalStatus] || statusColors.upcoming;
    // 根据最终状态获取文本
    const statusTextMap = {
      completed: '已完成',
      inProgress: '进行中',
      upcoming: '即将开始',
      notCompleted: '未完成',
      early: '时间还早着呢~'
    };
    const statusText = statusTextMap[finalStatus];
    
    
    return (
      <View style={styles.timelineItemContainer}>
        {/* 左侧时间线 */}
        <View style={styles.timelineColumn}>
          {/* 时间点图标颜色 */}
          <View style={[styles.timelineDot, { backgroundColor: finalStatusColor }]}>
            <MaterialIcons name={item.icon} size={14} color="white" />
          </View>
          <Text style={styles.startTimeText}>{item.startTime}</Text>
          {/* 时间线颜色 */}
          <View style={[styles.timelineLine, { backgroundColor: finalStatusColor }]} />
          <Text style={styles.endTimeText}>{item.endTime}</Text>
        </View>
        
        {/* 事件内容 */}
        <TouchableOpacity
          style={[styles.contentCard, { borderLeftColor: finalStatusColor }]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.timeRange}>{item.startTime} - {item.endTime}</Text>
          
          {/* 状态标签：颜色同步 */}
          <View style={[styles.statusBadge, { backgroundColor: `${finalStatusColor}20` }]}>
            <Text style={[styles.statusText, { color: finalStatusColor }]}>
              {statusText}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderCategorySelector = () => (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>所属分类</Text>
        <TouchableOpacity
          style={styles.categoryDisplay}
          onPress={() => setShowCategoryPicker(true)}
        >
          <MaterialIcons
            name={tabOrder.find(cat => cat.id === formData.category)?.icon || 'category'}
            size={18}
            color="#2196F3"
            style={styles.categoryIcon}
          />
          <Text style={styles.categoryText}>
            {tabOrder.find(cat => cat.id === formData.category)?.name || '未选择分类'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* 新增：分类选择弹窗（底部弹出） */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCategoryPicker}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <View style={styles.categoryModalOverlay}>
          <View style={styles.categoryModalContent}>
            {/* 分类弹窗头部 */}
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>选择分类</Text>
              <TouchableOpacity
                style={styles.categoryModalClose}
                onPress={() => setShowCategoryPicker(false)}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* 分类列表（滚动显示所有非固定分类） */}
            <ScrollView style={styles.categoryList}>
              {tabOrder
                .filter(tab => !tab.isFixed) // 排除"全部"固定分类
                .map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      // 选中状态样式（临时值匹配时高亮）
                      tempSelectedCategory === category.id && styles.selectedCategoryItem
                    ]}
                    onPress={() => setTempSelectedCategory(category.id)}
                  >
                    <MaterialIcons
                      name={category.icon}
                      size={20}
                      color={tempSelectedCategory === category.id ? "#2196F3" : "#666"}
                      style={styles.categoryItemIcon}
                    />
                    <Text style={[
                      styles.categoryItemText,
                      tempSelectedCategory === category.id && styles.selectedCategoryItemText
                    ]}>
                      {category.name}
                    </Text>
                    {/* 新增：选中状态图标 */}
                    {tempSelectedCategory === category.id && (
                      <MaterialIcons
                        name="check"
                        size={18}
                        color="#2196F3"
                      />
                    )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            
            {/* 分类弹窗底部确认按钮 */}
            <TouchableOpacity
              style={styles.categoryConfirmButton}
              onPress={confirmCategorySelect}
            >
              <Text style={styles.categoryConfirmText}>确认选择</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
  
  const renderIconSelector = () => (
    <View>
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
        onTabOrderUpdate={(sortedTabs) => setTabOrder([
          {
            id: 'all',
            name: '全部',
            icon: 'view-list',
            isFixed: true
          }, ...sortedTabs
        ])}
      />
      
      <FlatList
        data={categorizedData}
        renderItem={renderTimelineItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.timelineList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => {
          if(isLoading) return renderLoading();
          return (
            <View style={styles.emptyState}>
              <MaterialIcons
                name={currentTab === 'all' ? 'event' : tabOrder.find(tab => tab.id === currentTab)?.icon}
                size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                {currentTab === 'all' ? '今日暂无任何日程' : `当前「${tabOrder.find(tab => tab.id === currentTab)?.name}」分类无日程`}
              </Text>
            </View>
          );
        }}
      />
      
      {/* 右下角的浮动加号按钮 */}
      <TouchableOpacity
        style={styles.floatingAddButton}
        onPress={openAddModal}
        accessibilityLabel="添加新日程"
      >
        <MaterialIcons name="add" size={24} color="white" />
      </TouchableOpacity>
      
      {/* 添加/编辑 事件弹窗 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
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
                {/* 标题 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>事件标题（可选，不填显示分类名）</Text>
                  
                  {commonTitles.length > 0 && (
                    <View style={styles.commonTitlesContainer}>
                      <View style={styles.commonTitlesTags}>
                        {commonTitles.map((title, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.commonTitleTag}
                            onPress={() => handleInputChange('title', title)} // 点击填充标题
                          >
                            <Text style={styles.commonTitleTagText}>{title}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  <TextInput
                    style={styles.formInput}
                    value={formData.title}
                    onChangeText={(val) => handleInputChange('title', val)} placeholder="输入事件标题（可选）"
                  />
                </View>
                
                {/* 描述 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>描述</Text>
                  <TextInput
                    style={[styles.formInput, styles.multilineInput]}
                    value={formData.description}
                    onChangeText={(val) => handleInputChange('description', val)}
                    placeholder="请输入日程详情（如：会议主题、任务内容）" multiline numberOfLines={4}
                  />
                </View>
                
                {/* 开始时间日期 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>开始时间:
                    <Text style={styles.datetimeDisplayText}>
                      {formatDateDisplay(formData.startDatetime)} {formatTimeDisplay(formData.startDatetime)}
                    </Text>
                  </Text>
                  
                  <View style={{
                    flexDirection: 'row',
                    gap: 10
                  }}>
                    <Button
                      title={"选择日期"}
                      onPress={() => showDatetimePickerHandler('start', 'date')}
                    />
                    
                    <Button
                      title={"选择时间"}
                      onPress={() => showDatetimePickerHandler('start', 'time')}
                    />
                  </View>
                  
                  
                  {showDatetimePicker && targetDatetime === 'start' && (
                    <DateTimePicker
                      value={formData.startDatetime}
                      mode={pickerMode}
                      display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                      onChange={handleDatetimeChange}
                      maximumDate={new Date(2100, 11, 31)} // 最大可选日期（防止无效时间）
                      minimumDate={new Date(1900, 0, 1)}   // 最小可选日期
                    />
                  )}
                </View>
                {/* 结束时间日期 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>结束时间:
                    <Text style={styles.datetimeDisplayText}>
                      {formatDateDisplay(formData.endDatetime)} {formatTimeDisplay(formData.endDatetime)}
                    </Text>
                  </Text>
                  {/* 日期时间选择按钮组 */}
                  <View style={{
                    flexDirection: 'row',
                    gap: 10
                  }}>
                    <Button
                      title={"选择日期"}
                      onPress={() => showDatetimePickerHandler('end', 'date')}
                    />
                    <Button
                      title={"选择时间"}
                      onPress={() => showDatetimePickerHandler('end', 'time')}
                    />
                  </View>
                  {/* 日期时间选择器组件 */}
                  {showDatetimePicker && targetDatetime === 'end' && (
                    <DateTimePicker
                      value={formData.endDatetime}
                      mode={pickerMode}
                      display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                      onChange={handleDatetimeChange}
                      maximumDate={new Date(2100, 11, 31)}
                      minimumDate={new Date(1900, 0, 1)}
                    />
                  )}
                </View>
                
                {/* 新增：状态手动选择表单组 */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>事件状态</Text>
                  <View style={styles.statusSelector}>
                    {[
                      { value: 'upcoming', label: '即将开始' },
                      { value: 'inProgress', label: '进行中' },
                      { value: 'completed', label: '已完成' },
                      { value: 'notCompleted', label: '未完成' }
                    ].map(status => (
                      <TouchableOpacity
                        key={status.value}
                        style={[
                          styles.statusOption,
                          formData.status === status.value && styles.selectedStatusOption
                        ]}
                        onPress={() => handleInputChange('status', status.value)}
                      >
                        <Text style={[
                          styles.statusOptionText,
                          formData.status === status.value && styles.selectedStatusOptionText,
                          { color: statusColors[status.value] || '#333' }
                        ]}>
                          {status.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* 分类选择 */}
                {renderCategorySelector()}
                
                {/* 图标选择 */}
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
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    elevation: 4,
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  
  // 添加按钮
  floatingAddButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
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
    // 让时间线列占据内容卡片的高度
    alignSelf: 'stretch',
    position: 'relative'
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2
  },
  startTimeText: {
    position: 'absolute',
    top: 25,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center'
  },
  endTimeText: {
    position: 'absolute',
    bottom: 5,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center'
  },
  timelineLine: {
    position: 'absolute',
    top: 44,
    bottom: 25,
    width: 2,
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
  // 常用标题
  commonTitlesContainer: {
    marginBottom: 10,
  },
  commonTitlesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commonTitleTag: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    alignItems: 'center',
  },
  commonTitleTagText: {
    fontSize: 14,
    color: '#333',
  },
  // 日期时间
  datetimeDisplayText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#1396ff'
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
    borderWidth: 1,
    borderColor: '#ddd'
  },
  selectedStatusOption: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD'
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500'
  },
  selectedStatusOptionText: {
    fontWeight: 'bold'
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
  // 分类选择弹窗
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryModalClose: {
    padding: 4,
  },
  categoryList: {
    flexGrow: 1,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    justifyContent: 'space-between',
  },
  selectedCategoryItem: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  categoryItemIcon: {
    marginRight: 12,
  },
  categoryItemText: {
    fontSize: 16,
    color: '#333',
    flexGrow: 1, // 让文字占据中间空间
  },
  selectedCategoryItemText: {
    color: '#2196F3',
    fontWeight: '500',
  },
  categoryConfirmButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  categoryConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
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
