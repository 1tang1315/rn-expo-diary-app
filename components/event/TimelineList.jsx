import React, { useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { statusColors, statusTextMap, categories } from '@/constants/commonConstans';
import { updateEventStatus } from "@/db/eventDB";
import { formatDurationByMinutes, getTotalMinutes } from "@/utils/formatTimeUtils";
import { useTheme } from "@/context/ThemeContext";
import EmptyContainer from "@/components/common/EmptyContainer";
import ThemeTouchableOpacity from "@/components/Theme/ThemeTouchableOpacity";
import { LinearGradient } from "expo-linear-gradient";
import ThemeText from "@/components/Theme/ThemeText";
import ThemeSubTitleText from "@/components/Theme/ThemeSubTitleText";
import ThemeCard from "@/components/Theme/ThemeCard";

// 判断两个日期是否为同一天（只比较年/月/日）
const isSameDate = (date1, date2) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const getFinalStatus = (item) => {
  const ONE_HOUR = 60 * 60 * 1000;
  const now = new Date();
  const startTime = new Date(item.startDatetime);
  const endTime = new Date(item.endDatetime);
  const timeToStart = startTime - now;
  
  // 若用户手动设置为「未完成（notCompleted）」，直接返回，不允许自动修改
  if(item.status === 'notCompleted') {
    return item.status;
  }
  
  // 提取核心日期判断结果（避免重复计算）
  const isStartToday = isSameDate(startTime, now);
  const isEndToday = isSameDate(endTime, now);
  const isStartFuture = startTime > now && !isStartToday; // 开始日期在未来（非今天）
  const isEndPast = endTime < now && !isEndToday; // 结束日期在过去（非今天）
  
  let finalStatus = item.status;
  
  // 事件已完全结束（结束日期在过去，或今天已结束）→ 自动设为 completed
  if(
    (isEndPast) || // 结束日期在昨天及之前
    (isEndToday && now > endTime) // 结束日期是今天，但当前时间已过结束时间
  ) {
    finalStatus = 'completed';
  }
  
  // 事件正在进行（跨天事件/今天内事件）→ 自动设为 inProgress
  else if(
    (startTime < now && endTime > now) || // 跨天事件（如昨天开始→今天结束）
    (isStartToday && isEndToday && now >= startTime && now <= endTime) // 今天内事件，且在时间范围内
  ) {
    finalStatus = 'inProgress';
  }
  
  // 事件未开始（今天/未来）→ 按时间差细分 early/upcoming
  else if(timeToStart > 0) {
    // 今天的事件，1小时内开始 → upcoming
    if(isStartToday && timeToStart <= ONE_HOUR) {
      finalStatus = 'upcoming';
    }
    // 未来日期事件，或今天超过1小时后开始 → early
    else if(isStartFuture || (isStartToday && timeToStart > ONE_HOUR)) {
      finalStatus = 'early';
    }
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
 * @props {Function} openEditModal - 打开编辑弹窗的回调
 */
const TimelineList = ({
  categorizedData,
  isLoading,
  currentTab,
  openEditModal,
}) => {
  const { theme } = useTheme();
  
  const handleStatusUpdate = useCallback(async (item) => {
    const newStatus = getFinalStatus(item);
    if(item.status !== newStatus) {
      try {
        await updateEventStatus(item.id, newStatus);
      } catch(err) {
        console.error('更新失败:', err);
      }
    }
  }, []);
  
  // 优化状态更新逻辑：使用 requestAnimationFrame 减少更新频率
  useEffect(() => {
    const updateQueue = categorizedData.map(item => () => handleStatusUpdate(item));
    
    // 批量处理更新，避免同时触发多个更新
    const processUpdates = async () => {
      for(const update of updateQueue) {
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
      if(item.status !== newStatus) {
        updateEventStatus(item.id, newStatus).then()
      }
    });
  }, [categorizedData]);
  
  // 渲染单个事件项
  const renderTimelineItem = ({ item }) => {
    const tabName = categories.find(cat => cat.id === item.category)?.name || '未分类';
    const displayTitle = item.title || tabName;
    const finalStatus = getFinalStatus(item);
    const finalStatusColor = statusColors[finalStatus] || statusColors.upcoming;
    const statusText = statusTextMap[finalStatus];
    
    const startDate = new Date(item.startDatetime);
    const endDate = new Date(item.endDatetime);
    const isDifferentDate = startDate.getDate() !== endDate.getDate();
    
    return (
      <View style={styles.timelineItemContainer}>
        {/* 左侧时间线 */}
        <View style={styles.timelineColumn}>
          <View style={[styles.timelineDot, { backgroundColor: theme.colors .interactive }]}>
            <MaterialIcons name={item.icon} size={14} color="white" />
          </View>
          {isDifferentDate ? (
            <Text style={styles.endTimeText}>{(item.endDatetime).slice(5)} </Text>
          ) : (
            <Text style={styles.endTimeText}>{item.endTime}</Text>
          )}
          <View style={[styles.timelineLine, { backgroundColor: theme.colors .interactive }]} />
          {isDifferentDate ? (
            <Text style={styles.startTimeText}>{(item.startDatetime).slice(5)} </Text>
          ) : (
            <Text style={styles.startTimeText}>{item.startTime}</Text>
          )}
        </View>
        
        {/* 事件内容卡片（点击触发编辑） */}
        <ThemeTouchableOpacity
          style={styles.contentCard}
          onPress={() => openEditModal(item)}
        >
          <LinearGradient
            colors={[theme.colors.interactive, theme.colors.interactiveLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{padding: 16}}
          >
            <ThemeText style={[styles.title, {color: theme.colors.textInverse}]}>{displayTitle}</ThemeText>
            <Text style={[styles.description, theme.colors.dim]}>{item.description}</Text>
            
            {isDifferentDate ? (
              <ThemeSubTitleText style={styles.timeRange}>
                {item.startDatetime.slice(8)} - {item.endDatetime.slice(8)}({formatDuration(item)})
              </ThemeSubTitleText>
            ) : (
              <ThemeSubTitleText style={styles.timeRange}>
                {item.startTime} - {item.endTime}({formatDuration(item)})
              </ThemeSubTitleText>
            )}
            
            <ThemeCard style={styles.statusBadge}>
              <Text style={[styles.statusText, { color: finalStatusColor }]}>
                {statusText}
              </Text>
            </ThemeCard>
          </LinearGradient>
        </ThemeTouchableOpacity>
      </View>
    );
  };
  
  // 渲染 FlatList 核心
  return (
    <FlatList
      data={categorizedData}
      renderItem={renderTimelineItem}
      keyExtractor={item => item.id} // 确保唯一标识
      contentContainerStyle={styles.timelineList}
      showsVerticalScrollIndicator={false} // 隐藏垂直滚动条
      ListEmptyComponent={() => {
        // 加载状态
        if(isLoading) {
          return (
            <View style={styles.loadingState}>
              <FontAwesome name="hourglass-half" size={32} color="#ccc" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>);
        }
        
        // 根据当前标签页（currentTab）动态决定图标和文本
        let iconName, emptyText;
        
        if(currentTab === 'all') {
          iconName = 'event';
          emptyText = '今日暂无任何日程';
        } else {
          // 找到当前分类
          const currentCategory = categories.find(tab => tab.id === currentTab);
          // 安全取值，如果找不到分类则提供默认值
          iconName = currentCategory?.icon || 'event';
          emptyText = `当前「${currentCategory?.name || '未知分类'}」分类无日程`;
        }
        
        return (
          <EmptyContainer
            iconLib="MaterialIcons"
            iconName={iconName}
            text={emptyText}
          />
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
    borderRadius: 12,
    overflow: 'hidden'
  },
  // 事件标题
  title: {
    marginBottom: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 事件描述
  description: {
    marginBottom: 8,
    fontSize: 14,
  },
  // 时间范围
  timeRange: {
    marginBottom: 12,
    fontSize: 13,
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
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default TimelineList;