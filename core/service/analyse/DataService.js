import { formatDurationByMinutes } from '@/utils/formatTimeUtils';
import { getEventDurationMinutes } from '@/utils/eventDurationUtils';
import dayjs from 'dayjs';

/**
 * DataService：把原始事件变成 AI 友好的统计数据
 *
 */
export class DataService {
  /**
   * 构建 AI 分析输入数据
   * @param {Object} params
   * @param {string} params.date - 目标日期 YYYY-MM-DD
   * @param {Array} params.events - 当天事件（camelCase）
   * @param {Object} params.stats - 统计数据（来自 StatisticsService.getDayStatistics）
   */
  buildDailyAnalysisInput({ date, events = [], stats = [] }) {
    const safeEvents = Array.isArray(events) ? events : [];
    const safeStats = Array.isArray(stats) ? stats : [];

    // 获取当天的统计数据
    const dayStats = safeStats.find(item => item.statDate === date || item.stat_date === date) || {};

    // 只处理 SQL 查询中指定的分类
    const sleepDuration = Number(dayStats.sleepDuration || 0);
    const sportDuration = Number(dayStats.sportDuration || 0);
    const entertainmentDuration = Number(dayStats.entertainmentDuration || 0);
    const studyDuration = Number(dayStats.studyDuration || 0);
    const dietDuration = Number(dayStats.dietDuration || 0);
    const dailyDuration = Number(dayStats.dailyDuration || 0);
    const shoppingDuration = Number(dayStats.shoppingDuration || 0);
    const travelDuration = Number(dayStats.travelDuration || 0);

    // 计算用餐次数（基于饮食事件数量）
    const dietEvents = safeEvents.filter(event => event.category === 'diet');
    const mealCount = dietEvents.length;

    // 1. 统计指标（分钟 → 可读字符串）
    const statsView = {
      sleepDuration: formatDurationByMinutes(sleepDuration),
      studyDuration: formatDurationByMinutes(studyDuration),
      entertainmentDuration: formatDurationByMinutes(entertainmentDuration),
      exerciseDuration: formatDurationByMinutes(sportDuration),
      dietDuration: formatDurationByMinutes(dietDuration),
      dailyDuration: formatDurationByMinutes(dailyDuration),
      shoppingDuration: formatDurationByMinutes(shoppingDuration),
      travelDuration: formatDurationByMinutes(travelDuration),
      dietCount: mealCount,
      totalEvents: safeEvents.length
    };

    // 2. 处理事件数据，添加持续时间
    const processedEvents = safeEvents.map((e) => {
      const durationMinutes = Math.max(0, getEventDurationMinutes(e));

      return {
        category: e.category || '',
        title: e.title || e.category || '',
        startTime: e.startDatetime || '',
        endTime: e.endDatetime,
        duration: durationMinutes,
        description: e.description || ''
      };
    });

    // 3. 按分类对事件进行分组
    const eventsByCategory = processedEvents.reduce((acc, event) => {
      const category = event.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      const start = dayjs(event.startTime);
      const end = dayjs(event.endTime);
      acc[category].push({
        ...event,
        line: `${start.format('HH:mm')}~${end.format('HH:mm')} ${event.title} ${formatDurationByMinutes(event.duration)} ${event.description}`.trim()
      });
      return acc;
    }, {});

    // 4. 关键事件：按时长从大到小挑选 5-10 条
    const sortedByDuration = [...processedEvents].sort(
      (a, b) => b.duration - a.duration
    );

    const keyEvents = sortedByDuration.slice(0, 10).map((event) => {
      const start = dayjs(event.startTime);
      const end = dayjs(event.endTime);
      return {
        timeRange: `${start.format('HH:mm')}~${end.format('HH:mm')}`,
        title: event.title,
        category: event.category,
        duration: formatDurationByMinutes(event.duration),
        description: event.description,
        // 给 AI 用的紧凑文本
        line: `${start.format('HH:mm')}~${end.format('HH:mm')} ${event.title} ${formatDurationByMinutes(event.duration)} ${event.description}`.trim()
      };
    });

    // 6. 事件 hash：数量 + 最后更新时间（HH:mm）
    let latestUpdate = null;
    safeEvents.forEach((e) => {
      const ts = dayjs(
        e.updatedAt ||
        e.updated_at ||
        e.endDatetime ||
        e.end_datetime ||
        e.startDatetime ||
        e.start_datetime
      );
      if (!ts.isValid()) return;
      if (!latestUpdate || ts.isAfter(latestUpdate)) {
        latestUpdate = ts;
      }
    });

    const eventHash = `${safeEvents.length}_${(latestUpdate || dayjs(date)).format('HH:mm')}`;
    
    return {
      dateRange: date,
      stats: statsView,
      keyEvents,
      eventsByCategory,
      eventHash
    };
  }
}

