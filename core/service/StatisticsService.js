/**
 * 统计服务类，处理统计相关的业务逻辑
 */
import { EventMapper, StatisticsMapper } from '@/core/mapper';
import { BaseService } from '@/core/service';
import { formatDate, getMonthRange, getWeekRange, snakeToCamelObject } from '@/core/utils';
import { getTotalMinutes, formatDurationByMinutes } from '@/utils/formatTimeUtils';
import { getCategoryName } from '@/utils/categoryUtils';
import { statisticsColors as colors } from '@/constants/commonConstans';
import dayjs from 'dayjs';

export class StatisticsService extends BaseService {
  constructor() {
    super(new EventMapper());
    this.statisticsMapper = new StatisticsMapper();
  }

  normalizeStatistics(raw = {}) {
    return {
      sleepDuration: Number(raw.sleepDuration ?? raw.sleep_duration ?? 0),
      sportDuration: Number(raw.sportDuration ?? raw.sport_duration ?? 0),
      entertainmentDuration: Number(raw.entertainmentDuration ?? raw.entertainment_duration ?? 0),
      studyDuration: Number(raw.studyDuration ?? raw.study_duration ?? 0),
      mealCount: Number(raw.mealCount ?? raw.meal_count ?? 0)
    };
  }

  async getRangeStatistics(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate ?? startDate);
    const raw = await this.statisticsMapper.getStatisticsByDateRange(start, end);
    return this.normalizeStatistics(raw);
  }

  async getDayStatistics(date) {
    const target = formatDate(date);
    return this.getRangeStatistics(target, target);
  }

  async getWeekStatistics(date) {
    const range = getWeekRange(date);
    return this.getRangeStatistics(range.start, range.end);
  }

  async getMonthStatistics(date) {
    const range = getMonthRange(date);
    return this.getRangeStatistics(range.start, range.end);
  }

  async getEventsByDateRange(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate ?? startDate);
    const rows = await this.statisticsMapper.getEventsByDateRange(start, end);
    return rows.map((row) => snakeToCamelObject(row));
  }

  /**
   * 获取统计数据
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} category - 事件分类，'all' 表示所有分类
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(startDate, endDate, category = 'all') {
    // 获取事件数据
    const events = await this.mapper.getByDateRangeAndCategory(startDate, endDate ?? startDate, category);
    const camelEvents = events.map(event => snakeToCamelObject(event));
    
    // 处理统计数据
    return this.processStatistics(camelEvents, category === 'all');
  }

  /**
   * 处理统计数据
   * @param {Array} data - 事件数据
   * @param {boolean} groupByCategory - 是否按分类分组
   * @returns {Object} 处理后的统计数据
   */
  processStatistics(data, groupByCategory = false) {
    // 确保data是数组
    const safeData = Array.isArray(data) ? data : [];
    
    const completedEvents = safeData.filter(item => item.status === 'completed');
    
    const groupedData = {};
    completedEvents.forEach(item => {
      const key = groupByCategory
        ? getCategoryName(item.category) // all时用分类名称作为key
        : (item.title && item.title.trim() !== '' ? item.title : getCategoryName(item.category));
      
      // 计算时长（分钟）
      const durationMinutes = getTotalMinutes(item.startDatetime, item.endDatetime);
      
      // 第一次groupedData[key]没有, 进行初始化
      if (!groupedData[key]) {
        groupedData[key] = {
          durationMinutes: 0,
          useCount: 0
        };
      }
      // groupedData有了, 进行累加
      groupedData[key].durationMinutes += durationMinutes > 0 ? durationMinutes : 0;
      groupedData[key].useCount += 1;
    });
    
    const chartData = Object.keys(groupedData).map((key, index) => ({
      label: key,
      value: groupedData[key].durationMinutes,
      color: colors[index % colors.length],
      useCount: groupedData[key].useCount
    }));
    
    const totalMinutes = completedEvents.reduce((sum, e) => {
      const duration = getTotalMinutes(e.startDatetime, e.endDatetime);
      return sum + (duration > 0 ? duration : 0);
    }, 0);
    
    return { chartData, totalMinutes, completedEvents };
  }

  /**
   * 获取统计数据，按视图类型处理
   * @param {Array} events - 事件数据
   * @param {string} viewType - 视图类型：day, week, month, year
   * @param {Object} dateRange - 日期范围
   * @returns {Array} 处理后的统计数据
   */
  processStatsData(events, viewType, dateRange) {
    const eventMap = new Map();

    // 过滤有效数据
    const validData = events.filter(item => item.title || getCategoryName(item.category) && item.startDatetime);

    // 颜色缓存映射表
    const colorCache = new Map();

    // 高对比度随机颜色
    const getRandomColor = (eventKey) => {
      if (colorCache.has(eventKey)) {
        return colorCache.get(eventKey);
      }
      
      const letters = '0123456789ABCDEF';
      let color = '#';
      
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      
      // 确保颜色对比度足够（偏暗，文字显示清晰）
      const finalColor = brightness < 128
        ? color
        : `#${(0xFFFFFF - parseInt(color.slice(1), 16)).toString(16).padStart(6, '0')}`;
      
      // 将生成的颜色存入缓存
      colorCache.set(eventKey, finalColor);
      
      return finalColor;
    };

    // 初始化不同视图类型的基础数据
    const initEventBaseData = (eventKey, viewType, event) => {
      const baseData = {
        title: eventKey,
        color: event.color || getRandomColor(eventKey),
        count: 0,
        totalMinutes: 0,
        totalDurationStr: ''
      };
      
      switch (viewType) {
        case 'day':
          return { ...baseData, timeRanges: [], date: '' };
        case 'week':
          return { ...baseData, weeklyCounts: new Array(7).fill(0) };
        case 'month':
          return { ...baseData, dailyCounts: {} };
        case 'year':
          return { ...baseData, dailyCounts: {}, monthlyCounts: {} };
        default:
          return { ...baseData, weeklyCounts: new Array(7).fill(0) };
      }
    };

    // 处理单条事件数据的聚合逻辑
    const processSingleEvent = (event, eventMap, viewType, dateRange) => {
      const eventKey = event.title || getCategoryName(event.category);
      if (!eventKey) return;
      
      // 初始化数据（不存在则创建）
      if (!eventMap.has(eventKey)) {
        eventMap.set(eventKey, initEventBaseData(eventKey, viewType, event));
      }
      
      const eventData = eventMap.get(eventKey);
      eventData.count++;
      
      const startDatetime = dayjs(event.startDatetime);
      const endDatetime = dayjs(event.endDatetime || event.startDatetime);
      const totalMinutes = getTotalMinutes(event.startDatetime, event.endDatetime || event.startDatetime);
      eventData.totalMinutes += totalMinutes;
      
      // 按视图类型补充数据
      switch (viewType) {
        case 'day':
          eventData.timeRanges.push({
            startTime: startDatetime.format('HH:mm'),
            endTime: endDatetime.format('HH:mm'),
            durationStr: formatDurationByMinutes(totalMinutes),
            startDatetime: event.startDatetime,
            endDatetime: event.endDatetime || event.startDatetime
          });
          eventData.date = eventData.date || startDatetime.format('YYYY-MM-DD');
          break;
        case 'week':
          const weekStart = dateRange?.startDate
            ? dayjs(dateRange.startDate).startOf('week')
            : dayjs().startOf('week');
          const dayDiff = startDatetime.diff(weekStart, 'day');
          const weekIndex = dayDiff >= 0 && dayDiff < 7 ? dayDiff : -1;
          if (weekIndex >= 0 && weekIndex < 7) {
            eventData.weeklyCounts[weekIndex]++;
          }
          break;
        case 'month':
          const dateStr = startDatetime.format('YYYY-MM-DD');
          eventData.dailyCounts[dateStr] = (eventData.dailyCounts[dateStr] || 0) + 1;
          break;
        case 'year':
          const yearDateStr = startDatetime.format('YYYY-MM-DD');
          const monthStr = startDatetime.format('YYYY-MM');
          eventData.dailyCounts[yearDateStr] = (eventData.dailyCounts[yearDateStr] || 0) + 1;
          eventData.monthlyCounts[monthStr] = (eventData.monthlyCounts[monthStr] || 0) + 1;
          break;
      }
    };

    // 格式化聚合后的数据
    const formatEventData = (eventMap, viewType) => {
      return Array.from(eventMap.values()).map(item => {
        item.totalDurationStr = formatDurationByMinutes(item.totalMinutes);
        
        if (viewType === 'day' && item.timeRanges) {
          item.timeRanges.sort((a, b) =>
            dayjs(a.startDatetime).isBefore(dayjs(b.startDatetime)) ? -1 : 1
          );
          item.date = item.date || dayjs().format('YYYY-MM-DD');
        }
        
        return item;
      });
    };

    // 聚合每条事件数据
    validData.forEach(event => {
      processSingleEvent(event, eventMap, viewType, dateRange);
    });
    
    // 格式化数据
    return formatEventData(eventMap, viewType);
  }
}