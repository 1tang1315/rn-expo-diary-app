import dayjs from 'dayjs';
import { formatDurationByMinutes, getTotalMinutes } from '@/utils/formatTimeUtils';

/**
 * DataService：把原始事件变成 AI 友好的统计数据
 *
 * 只关心「一天」的数据结构：
 * {
 *   date: 'YYYY-MM-DD',
 *   stats: {...},
 *   keyEvents: [...],
 *   events: [...],
 *   eventHash: '22_23:57'
 * }
 */
export class DataService {
  /**
   * 构建 AI 分析输入数据
   * @param {Object} params
   * @param {string} params.date - 目标日期 YYYY-MM-DD
   * @param {Array} params.events - 当天事件（camelCase）
   * @param {Object} params.stats - 统计数据（来自 StatisticsService.getDayStatistics）
   */
  buildDailyAnalysisInput({ date, events = [], stats = {} }) {
    const safeEvents = Array.isArray(events) ? events : [];

    const {
      sleepDuration = 0,
      studyDuration = 0,
      sportDuration = 0,
      entertainmentDuration = 0,
      mealCount = 0
    } = stats || {};

    // 1. 统计指标（分钟 → 可读字符串）
    const statsView = {
      sleepDuration: formatDurationByMinutes(sleepDuration || 0),
      studyDuration: formatDurationByMinutes(studyDuration || 0),
      // 暂时没有单独的工作时长统计，用「学习 + 运动之外的专注类事件」可以在后续版本细化
      workDuration: '0分钟',
      entertainmentDuration: formatDurationByMinutes(entertainmentDuration || 0),
      exerciseDuration: formatDurationByMinutes(sportDuration || 0),
      dietCount: Number(mealCount || 0),
      totalEvents: safeEvents.length
    };

    // 2. 关键事件：按时长从大到小挑选 5-10 条
    const eventsWithDuration = safeEvents.map((e) => {
      const start = dayjs(e.startDatetime || e.start_datetime);
      const end = dayjs(
        e.endDatetime ||
        e.end_datetime ||
        e.startDatetime ||
        e.start_datetime
      );
      const durationMinutes = Math.max(
        0,
        getTotalMinutes(
          e.startDatetime || e.start_datetime,
          e.endDatetime || e.end_datetime || e.startDatetime || e.start_datetime
        )
      );

      return {
        raw: e,
        start,
        end,
        durationMinutes
      };
    });

    const sortedByDuration = [...eventsWithDuration].sort(
      (a, b) => b.durationMinutes - a.durationMinutes
    );

    const keyEvents = sortedByDuration.slice(0, 10).map((item) => {
      const { raw, start, end, durationMinutes } = item;
      const title = raw.title || raw.category || '';
      const description = raw.description || raw.content || '';

      return {
        timeRange: `${start.format('HH:mm')}~${end.format('HH:mm')}`,
        title,
        category: raw.category || '',
        duration: formatDurationByMinutes(durationMinutes),
        description,
        // 给 AI 用的紧凑文本
        line: `${start.format('HH:mm')}~${end.format('HH:mm')} ${title || raw.category || ''} ${formatDurationByMinutes(durationMinutes)} ${description || ''}`.trim()
      };
    });

    // 3. 原始事件（简化版）
    const simpleEvents = eventsWithDuration.map((item) => {
      const { raw, start, end, durationMinutes } = item;
      return {
        category: raw.category || '',
        title: raw.title || raw.category || '',
        time: `${start.format('HH:mm')}~${end.format('HH:mm')}`,
        duration: formatDurationByMinutes(durationMinutes),
        description: raw.description || raw.content || ''
      };
    });

    // 4. 事件 hash：数量 + 最后更新时间（HH:mm）
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
      events: simpleEvents,
      eventHash
    };
  }
}

