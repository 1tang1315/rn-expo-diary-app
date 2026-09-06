import React, { useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { statusColors, statusTextMap, categories, BASE_IMAGE_DIR } from '@/constants/commonConstans';
import { formatDurationByMinutes } from "@/utils/formatTimeUtils";
import { getEventDurationMinutes, isInstantEvent } from '@/utils/eventDurationUtils';
import { getFinalStatus } from '@/utils/eventStatusUtils';
import { toEventImageUri } from '@/utils/eventImageUtils';
import { useTheme } from "@/context/ThemeContext";
import EmptyContainer from "@/components/common/EmptyContainer";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import { LinearGradient } from "expo-linear-gradient";
import ThemeText from "@/components/theme/ThemeText";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import ThemeCard from "@/components/theme/ThemeCard";
import { eventApi } from "@/api";

const formatDuration = (item) => {
  const totalMinutes = getEventDurationMinutes(item);
  return formatDurationByMinutes(totalMinutes);
};

/**
 * 时间线列表组件
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
    if (item.status !== newStatus) {
      await eventApi.updateStatus(item.id, newStatus);
    }
  }, []);

  useEffect(() => {
    const updateQueue = categorizedData.map(item => () => handleStatusUpdate(item));

    const processUpdates = async () => {
      for (const update of updateQueue) {
        await update();
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
        eventApi.updateStatus(item.id, newStatus).then();
      }
    });
  }, [categorizedData]);

  const renderTimelineItem = ({ item }) => {
    const tabName = categories.find(cat => cat.id === item.category)?.name || '未分类';
    const displayTitle = item.title || tabName;
    const finalStatus = getFinalStatus(item);
    const finalStatusColor = statusColors[finalStatus] || statusColors.upcoming;
    const statusText = statusTextMap[finalStatus];
    const instant = isInstantEvent(item);

    const startDate = new Date(item.startDatetime);
    const endDate = new Date(item.endDatetime);
    const isDifferentDate = !instant && startDate.getDate() !== endDate.getDate();
    const thumbKey = item.images?.[0];
    const thumbUri = thumbKey ? toEventImageUri(BASE_IMAGE_DIR, thumbKey) : null;

    return (
      <View style={styles.timelineItemContainer}>
        <View style={styles.timelineColumn}>
          <View style={[styles.timelineDot, { backgroundColor: theme.colors.interactive }]}>
            <MaterialIcons name={item.icon} size={14} color="white" />
          </View>
          {instant ? (
            <Text style={styles.endTimeText}>{item.startTime}</Text>
          ) : (
            <>
              {isDifferentDate ? (
                <Text style={styles.endTimeText}>{(item.endDatetime).slice(5)} </Text>
              ) : (
                <Text style={styles.endTimeText}>{item.endTime}</Text>
              )}
              <View style={[styles.timelineLine, { backgroundColor: theme.colors.interactive }]} />
              {isDifferentDate ? (
                <Text style={styles.startTimeText}>{(item.startDatetime).slice(5)} </Text>
              ) : (
                <Text style={styles.startTimeText}>{item.startTime}</Text>
              )}
            </>
          )}
        </View>

        <ThemeTouchableOpacity
          style={{ flex: 1, paddingTop: 0, paddingHorizontal: 5 }}
          onPress={() => openEditModal(item)}
        >
          <LinearGradient
            colors={[theme.colors.interactive, theme.colors.interactiveLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.contentCard}
          >
            <View style={styles.titleRow}>
              <ThemeText style={[styles.title, { color: theme.colors.textInverse, flex: 1 }]}>{displayTitle}</ThemeText>
              {thumbUri ? (
                <Image source={{ uri: thumbUri }} style={styles.thumbnail} />
              ) : null}
            </View>
            <Text style={[styles.description, theme.colors.dim]}>{item.description}</Text>

            {instant ? (
              <ThemeSubTitleText style={styles.timeRange}>{item.startTime}</ThemeSubTitleText>
            ) : isDifferentDate ? (
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

  return (
    <FlatList
      data={categorizedData}
      renderItem={renderTimelineItem}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.timelineList}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={() => {
        if (isLoading) {
          return (
            <View style={styles.loadingState}>
              <FontAwesome name="hourglass-half" size={32} color="#ccc" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>);
        }

        let iconName, emptyText;

        if (currentTab === 'all') {
          iconName = 'event';
          emptyText = '今日暂无任何日程';
        } else {
          const currentCategory = categories.find(tab => tab.id === currentTab);
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
  timelineList: {
    flexGrow: 1,
  },
  timelineItemContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    position: 'relative',
  },
  timelineColumn: {
    alignItems: 'center',
    width: 40,
    alignSelf: 'stretch',
    position: 'relative',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  endTimeText: {
    position: 'absolute',
    top: 25,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  startTimeText: {
    position: 'absolute',
    bottom: 5,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 44,
    bottom: 25,
    width: 2,
    zIndex: 1,
  },
  contentCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginLeft: 8,
  },
  description: {
    marginBottom: 8,
    fontSize: 14,
  },
  timeRange: {
    marginBottom: 12,
    fontSize: 13,
    fontStyle: 'italic',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});

export default TimelineList;
