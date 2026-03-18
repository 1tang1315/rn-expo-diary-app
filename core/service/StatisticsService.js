/**
 * 统计服务类，处理统计相关的业务逻辑
 */
import { EventMapper, StatisticsMapper } from '@/core/mapper';
import { BaseService } from '@/core/service';
import { formatDate, snakeToCamelObject } from '@/core/utils';
import { getCategoryName } from '@/utils/categoryUtils';
import { formatDurationByMinutes } from '@/utils/formatTimeUtils';

export class StatisticsService extends BaseService {
  constructor() {
    super(new EventMapper());
    this.statisticsMapper = new StatisticsMapper();
  }

  async getRangeStatistics(startDate, endDate) {
    const start = formatDate(startDate);
    const end = formatDate(endDate ?? startDate);
    const raw = await this.statisticsMapper.getStatisticsByDateRange(start, end);
    return raw.map(item => snakeToCamelObject(item));
  }

  async getDayStatistics(date) {
    const target = formatDate(date);
    return this.getRangeStatistics(target, target);
  }

  /**
   * 获取统计数据
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} category - 事件分类，'all' 表示所有分类
   * @returns {Promise<Object>} 统计数据
   */
  async getStatistics(startDate, endDate, category = 'all') {
    const categoryStats = await this.statisticsMapper.getCategoryDetailStatistics(startDate, endDate ?? startDate, category);
    
    // 处理统计数据
    return this.processStatistics(categoryStats, category);
  }

  /**
   * 处理统计数据
   * @param {Object} categoryStats - 分类统计数据
   * @param {string} category - 事件分类 (all/sleep/entertainment等)
   * @returns {Object} 处理后的统计数据（适配前端展示）
   */
  processStatistics(categoryStats, category) {
    // 颜色缓存映射表（避免重复生成）
    const colorCache = new Map();

    // 生成高对比度随机颜色（复用processStatsData中的逻辑）
    const getRandomColor = (key) => {
      if (colorCache.has(key)) {
        return colorCache.get(key);
      }

      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }

      // 计算亮度，确保文字显示清晰
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      // 确保颜色偏暗，提升文字对比度
      const finalColor = brightness < 128
        ? color
        : `#${(0xFFFFFF - parseInt(color.slice(1), 16)).toString(16).padStart(6, '0')}`;

      colorCache.set(key, finalColor);
      return finalColor;
    };

    // 构建基础分组数据
    const groupedData = {};

    // 1. 处理 "all" 分类（按大分类统计）
    if (category === 'all') {
      categoryStats.category_statistics.forEach(item => {
        // 过滤掉total_minutes为null或0的无效数据
        if (item.total_minutes && item.total_minutes > 0) {
          const key = getCategoryName(item.category);
          groupedData[key] = {
            durationMinutes: item.total_minutes,
            useCount: item.event_count,
            durationStr: formatDurationByMinutes(item.total_minutes)
          };
        }
      });
    }
    // 2. 处理具体分类（按标题统计）
    else {
      categoryStats.title_statistics.forEach(item => {
        // 过滤掉total_minutes为null或0的无效数据
        if (item.total_minutes && item.total_minutes > 0) {
          const key = item.title;
          groupedData[key] = {
            durationMinutes: item.total_minutes,
            useCount: item.event_count,
            durationStr: formatDurationByMinutes(item.total_minutes)
          };
        }
      });
    }

    // 生成前端图表所需的标准化数据
    const chartData = Object.keys(groupedData).map((key) => ({
      label: key,                  // 显示名称
      value: groupedData[key].durationMinutes, // 时长（分钟）
      useCount: groupedData[key].useCount,     // 使用次数
      durationStr: groupedData[key].durationStr, // 格式化时长字符串
      color: getRandomColor(key),  // 高对比度颜色
      percentage: categoryStats.total_minutes > 0
        ? ((groupedData[key].durationMinutes / categoryStats.total_minutes) * 100).toFixed(1)
        : '0.0' // 占总时长百分比
    }))
      // 按时长降序排序（便于前端展示）
      .sort((a, b) => b.value - a.value);

    // 计算总计的格式化字符串
    const totalDurationStr = formatDurationByMinutes(categoryStats.total_minutes);

    return {
      chartData,                  // 图表核心数据
      totalMinutes: categoryStats.total_minutes, // 总时长（分钟）
      totalEvents: categoryStats.total_events,   // 总事件数
      totalDurationStr,           // 格式化总时长
      completedEvents: [],        // 预留字段（可根据业务补充）
      stats: categoryStats,       // 原始统计数据
      category: category          // 当前分类标识
    };
  }
}