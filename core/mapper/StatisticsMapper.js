import { BaseMapper } from '@/core/mapper/BaseMapper';
import { sqlEventDurationMinutes } from '@/core/db/eventDurationSql';

export class StatisticsMapper extends BaseMapper {
  constructor() {
    super('event');
  }

  // 获取各分类的总时长数据
  async getStatisticsByDateRange(startDate, endDate) {
    const db = await this.getDB();
    // 入参要求：YYYY-MM-DD 纯日期格式（如2024-02-02）
    const result = await db.getAllAsync(
      `
    -- 生成查询范围内的所有自然日（解决跨日拆分核心）
    WITH date_series AS (
      SELECT DATE(?, '+' || (t.i) || ' days') AS stat_date
      FROM (
        -- 支持7天内查询，如需更长时间范围，继续追加 UNION ALL SELECT n
        SELECT 0 AS i UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
      ) AS t
      WHERE DATE(?, '+' || (t.i) || ' days') <= ?
    )
    SELECT
      d.stat_date, -- 统计日期（YYYY-MM-DD）
      -- 睡眠：特殊规则→按起床日整段统计，不拆分
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'sleep' AND DATE(e.end_datetime) = d.stat_date THEN
          (JULIANDAY(e.end_datetime) - JULIANDAY(e.start_datetime)) * 24 * 60
        ELSE 0 END
      ), 0)) AS sleep_duration,
      
      -- 运动：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category IN ('sports') THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS sport_duration,
      
      -- 娱乐：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'entertainment' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS entertainment_duration,
      
      -- 学习：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'study' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS study_duration,
      
      -- 工作：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'work' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS work_duration,
      
      -- 用餐：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'diet' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS diet_duration,
      
      -- 日常：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'daily' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS daily_duration,
      
      -- 购物：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'shopping' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS shopping_duration,
      
      -- 出行：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.time_kind = 'instant' THEN 0
        WHEN e.category = 'travel' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS travel_duration,
      
      -- 总时长：所有分类时长之和
      ROUND(IFNULL(SUM(
        CASE 
          WHEN e.time_kind = 'instant' THEN 0
          -- 睡眠：特殊规则→按起床日整段统计，不拆分
          WHEN e.category = 'sleep' AND DATE(e.end_datetime) = d.stat_date THEN
            (JULIANDAY(e.end_datetime) - JULIANDAY(e.start_datetime)) * 24 * 60
          -- 其他分类：自然日拆分时长
          ELSE
            (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        END
      ), 0)) AS total_duration

    FROM date_series d
    -- 左连接事件表，确保查询范围内的每一天都有数据（无事件则为0）
    LEFT JOIN event e ON (
      e.deleted_at IS NULL
      AND e.status = 'completed'
      -- 只关联与当前统计日有时间交集的事件（提升查询性能）
      AND e.end_datetime >= d.stat_date
      AND e.start_datetime < DATE(d.stat_date, '+1 day')
    )
    -- 按统计日分组，返回每日明细
    GROUP BY d.stat_date
    -- 按日期升序排序，前端可直接遍历展示
    ORDER BY d.stat_date
    `,
      // SQL参数：严格对应3个? → startDate, startDate, endDate
      [startDate, startDate, endDate]
    );

    // 无数据时返回空数组，避免后续取值报错
    return result || [];
  }

  /**
   * 根据日期范围和分类查询事件统计信息
   * @param {string} startDate - 开始日期，格式为 YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式为 YYYY-MM-DD
   * @param {string} category - 分类名称，'all' 表示所有分类
   * @returns {Object} 统计结果对象，包含总时长、总事件数、按标题统计和按分类统计
   */
  async getCategoryStatistics(startDate, endDate, category) {
    const db = await this.getDB();

    // 构建日期条件：睡眠分类使用结束日期作为归属日期，其他分类使用开始日期
    // 当 category 为 'all' 时，使用开始日期作为归属日期（除了睡眠事件）
    const dateCondition = category === 'sleep'
      ? `DATE(end_datetime) BETWEEN ? AND ?`
      : `DATE(start_datetime) BETWEEN ? AND ?`;

    // 构建分类条件：当 category 为 'all' 时不添加分类过滤
    const categoryCondition = category === 'all' ? '' : 'AND category = ?';

    // 构建参数数组：根据是否为 'all' 分类调整参数顺序
    const params = category === 'all' ? [startDate, endDate] : [category, startDate, endDate];

    // 获取分类下的总时长和总次数
    const totalStats = await db.getFirstAsync(
      `
    SELECT
      ROUND(SUM(${sqlEventDurationMinutes()}), 0) AS total_minutes,
      COUNT(*) AS event_count
    FROM event
    WHERE deleted_at IS NULL
      AND status = 'completed'
      ${categoryCondition}
      AND ${dateCondition}
    `,
      params
    );

    // 获取按标题划分的统计信息，按总时长降序排序
    const titleStats = await db.getAllAsync(
      `
    SELECT
      COALESCE(title, '无标题') AS title,
      ROUND(SUM(${sqlEventDurationMinutes()}), 0) AS total_minutes,
      COUNT(*) AS event_count
    FROM event
    WHERE deleted_at IS NULL
      AND status = 'completed'
      ${categoryCondition}
      AND ${dateCondition}
    GROUP BY title
    ORDER BY total_minutes DESC
    `,
      params
    );

    // 获取各分类的统计信息（当 category 为 'all' 时）
    let categoryStats = [];
    if (category === 'all') {
      // 对于睡眠分类，使用结束日期作为归属日期
      const sleepStats = await db.getFirstAsync(
        `
      SELECT
        'sleep' AS category,
        ROUND(SUM(${sqlEventDurationMinutes()}), 0) AS total_minutes,
        COUNT(*) AS event_count
      FROM event
      WHERE deleted_at IS NULL
        AND status = 'completed'
        AND category = 'sleep'
        AND DATE(end_datetime) BETWEEN ? AND ?
      `,
        [startDate, endDate]
      );

      // 对于其他分类，使用开始日期作为归属日期
      const otherCategories = await db.getAllAsync(
        `
      SELECT
        category,
        ROUND(SUM(${sqlEventDurationMinutes()}), 0) AS total_minutes,
        COUNT(*) AS event_count
      FROM event
      WHERE deleted_at IS NULL
        AND status = 'completed'
        AND category != 'sleep'
        AND DATE(start_datetime) BETWEEN ? AND ?
      GROUP BY category
      ORDER BY total_minutes DESC
      `,
        [startDate, endDate]
      );

      // 合并睡眠和其他分类的统计信息
      if (sleepStats) {
        categoryStats.push(sleepStats);
      }
      categoryStats = [...categoryStats, ...otherCategories];
    }

    // 返回统计结果，确保默认值为 0
    return {
      total_minutes: totalStats?.total_minutes || 0,
      total_events: totalStats?.event_count || 0,
      title_statistics: titleStats,
      category_statistics: categoryStats
    };
  }

  /**
   * 获取打卡页面所需的详细事件数据
   * @param {string} startDate - 开始日期，格式为 YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式为 YYYY-MM-DD
   * @param {string} category - 分类名称，'all' 表示所有分类
   * @returns {Array} 详细的事件数据数组
   */
  async getHabitTrackingData(startDate, endDate, category = 'all') {
    const db = await this.getDB();

    // 构建日期条件：睡眠分类使用结束日期作为归属日期，其他分类使用开始日期
    const dateCondition = category === 'sleep'
      ? `DATE(end_datetime) BETWEEN ? AND ?`
      : `DATE(start_datetime) BETWEEN ? AND ?`;

    // 构建分类条件：当 category 为 'all' 时不添加分类过滤
    const categoryCondition = category === 'all' ? '' : 'AND category = ?';

    // 构建参数数组：根据是否为 'all' 分类调整参数顺序
    const params = category === 'all' ? [startDate, endDate] : [category, startDate, endDate];

    // 获取详细的事件数据
    const events = await db.getAllAsync(
      `
    SELECT
      COALESCE(title, '无标题') AS title,
      start_datetime,
      end_datetime,
      ROUND(${sqlEventDurationMinutes()}, 0) AS duration_minutes,
      category
    FROM event
    WHERE deleted_at IS NULL
      AND status = 'completed'
      ${categoryCondition}
      AND ${dateCondition}
    ORDER BY start_datetime ASC
    `,
      params
    );

    // 按标题分组并计算统计信息
    const groupedEvents = events.reduce((acc, event) => {
      if (!acc[event.title]) {
        acc[event.title] = {
          title: event.title,
          count: 0,
          totalMinutes: 0,
          timeRanges: []
        };
      }

      acc[event.title].count++;
      acc[event.title].totalMinutes += event.duration_minutes;
      acc[event.title].timeRanges.push({
        start: event.start_datetime,
        end: event.end_datetime,
        duration: event.duration_minutes
      });

      return acc;
    }, {});

    // 转换为数组并返回
    return Object.values(groupedEvents);
  }
}
