import React, { useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { statusColors, statusTextMap } from '@/constants/timelineConstants';
import { updateEventStatus } from "@/db/eventDB";
import { formatDurationByMinutes, getTotalMinutes } from "@/utils/formatTimeUtils";

const getFinalStatus = (item) => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = new Date();
  const startTime = new Date(item.startDatetime);
  const endTime = new Date(item.endDatetime);
  const timeToStart = startTime - now;
  
  let finalStatus = item.status;
  
  if (now > endTime && finalStatus !== 'completed') {
    finalStatus = 'completed';
  } else if (now >= startTime && now <= endTime && finalStatus !== 'inProgress') {
    finalStatus = 'inProgress';
  } else if (
    timeToStart > 0 &&
    timeToStart <= ONE_HOUR &&
    !['upcoming', 'inProgress', 'completed'].includes(finalStatus)
  ) {
    finalStatus = 'upcoming';
  } else if (
    timeToStart > ONE_HOUR &&
    !['early', 'upcoming', 'inProgress', 'completed'].includes(finalStatus)
  ) {
    finalStatus = 'early';
  }
  
  return finalStatus;
};

const formatDuration = (item) => {
  const totalMinutes = getTotalMinutes(item.startDatetime, item.endDatetime);
  return formatDurationByMinutes(totalMinutes);
}

/**
 * 时间线列表组件
 * @props {Array} categorizedData - 过滤后的事件数据
 * @props {boolean} isLoading - 加载状态
 * @props {string} currentTab - 当前选中分类
 * @props {Array} tabOrder - 分类标签顺序
 * @props {Function} openEditModal - 打开编辑弹窗的回调
 */
const TimelineList = ({
  categorizedData,
  isLoading,
  currentTab,
  tabOrder,
  openEditModal,
}) => {
  const handleStatusUpdate = useCallback(async (item) => {
    const newStatus = getFinalStatus(item);
    if (item.status !== newStatus) {
      try {
        await updateEventStatus(item.id, newStatus);
        console.log(`事件 ${item.id} 状态更新为：${newStatus}`);
      } catch (err) {
        console.error('更新失败:', err);
      }
    }
  }, []);
  
  // 优化状态更新逻辑：使用 requestAnimationFrame 减少更新频率
  useEffect(() => {
    const updateQueue = categorizedData.map(item => () => handleStatusUpdate(item));
    
    // 批量处理更新，避免同时触发多个更新
    const processUpdates = async () => {
      for (const update of updateQueue) {
        await update();
        // 每处理一个更新，给一点时间让UI呼吸
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    };
    
    const animationFrameId = requestAnimationFrame(processUpdates);
    return () => cancelAnimationFrame(animationFrameId);
  }, [categorizedData, handleStatusUpdate]);
  
  useEffect(() => {
    categorizedData.forEach(item => {
      const newStatus = getFinalStatus(item);
      if (item.status !== newStatus) {
        updateEventStatus(item.id, newStatus)
          .then(() => console.log(`事件 ${item.id} 状态更新为：${newStatus}`))
          .catch(err => console.error('更新失败:', err));
      }
    });
  }, [categorizedData]);
  
  // 渲染单个事件项
  const renderTimelineItem = ({ item }) => {
    const tabName = tabOrder.find(cat => cat.id === item.category)?.name || '未分类';
    const displayTitle = item.title || tabName;
    const finalStatus = getFinalStatus(item);
    const finalStatusColor = statusColors[finalStatus] || statusColors.upcoming;
    const statusText = statusTextMap[finalStatus];
    
    return (
      <View style={styles.timelineItemContainer}>
        {/* 左侧时间线 */}
        <View style={styles.timelineColumn}>
          <View style={[styles.timelineDot, { backgroundColor: finalStatusColor }]}>
            <MaterialIcons name={item.icon} size={14} color="white" />
          </View>
          <Text style={styles.endTimeText}>{item.endTime}</Text>
          <View style={[styles.timelineLine, { backgroundColor: finalStatusColor }]} />
          <Text style={styles.startTimeText}>{item.startTime}</Text>
        </View>

        {/* 事件内容卡片（点击触发编辑） */}
        <TouchableOpacity
          style={[styles.contentCard, { borderLeftColor: finalStatusColor }]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.title}>{displayTitle}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.timeRange}>
            {item.startTime} - {item.endTime}({formatDuration(item)})
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${finalStatusColor}20` }]}>
            <Text style={[styles.statusText, { color: finalStatusColor }]}>
              {statusText}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  // 渲染加载状态
  const renderLoading = () => (
    <View style={styles.loadingState}>
      <FontAwesome name="hourglass-half" size={32} color="#ccc" />
      <Text style={styles.loadingText}>加载中...</Text>
    </View>
  );
  
  // 渲染 FlatList 核心
  return (
    <FlatList
      data={categorizedData}
      renderItem={renderTimelineItem}
      keyExtractor={item => item.id} // 确保唯一标识
      contentContainerStyle={styles.timelineList}
      showsVerticalScrollIndicator={false} // 隐藏垂直滚动条
      // 空状态处理（加载中/无数据）
      ListEmptyComponent={() => {
        if (isLoading) return renderLoading();
        return (
          <View style={styles.emptyState}>
            <MaterialIcons
              name={currentTab === 'all' ? 'event' : tabOrder.find(tab => tab.id === currentTab)?.icon}
              size={48} color="#ccc"
            />
            <Text style={styles.emptyText}>
              {currentTab === 'all'
                ? '今日暂无任何日程'
                : `当前「${tabOrder.find(tab => tab.id === currentTab)?.name}」分类无日程`}
            </Text>
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  // 列表容器
  timelineList: {
    padding: 20,
    paddingTop: 10,
    flexGrow: 1, // 占满父容器剩余空间
  },
  // 单个事件项容器
  timelineItemContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  // 左侧时间线列
  timelineColumn: {
    alignItems: 'center',
    marginRight: 16,
    width: 40,
    alignSelf: 'stretch',
    position: 'relative',
  },
  // 时间线圆点
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2, // 确保圆点在时间线上方
  },
  // 结束时间文本
  endTimeText: {
    position: 'absolute',
    top: 25,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  // 开始时间文本
  startTimeText: {
    position: 'absolute',
    bottom: 5,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  // 时间线竖线
  timelineLine: {
    position: 'absolute',
    top: 44,
    bottom: 25,
    width: 2,
    zIndex: 1,
  },
  // 事件内容卡片
  contentCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    elevation: 5,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  },
  // 事件标题
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  // 事件描述
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  // 时间范围
  timeRange: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  // 状态标签
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  // 状态文本
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // 加载状态容器
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  // 加载文本
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  // 空状态容器
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  // 空状态文本
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default TimelineList;