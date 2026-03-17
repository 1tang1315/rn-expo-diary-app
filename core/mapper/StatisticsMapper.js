import { BaseMapper } from '@/core/mapper/BaseMapper';

const OVERLAP_CONDITION = `
  (
    (DATE(start_datetime) BETWEEN ? AND ?)
    OR (DATE(end_datetime) BETWEEN ? AND ?)
    OR (DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?)
  )
`;

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
        CASE WHEN e.category = 'sleep' AND DATE(e.end_datetime) = d.stat_date THEN
          (JULIANDAY(e.end_datetime) - JULIANDAY(e.start_datetime)) * 24 * 60
        ELSE 0 END
      ), 0)) AS sleep_duration,
      
      -- 运动：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.category IN ('exercise', 'sports') THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS sport_duration,
      
      -- 娱乐：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.category = 'entertainment' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS entertainment_duration,
      
      -- 学习/工作：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.category IN ('study', 'work') THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS study_duration,
      
      -- 用餐：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.category = 'diet' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS diet_duration,
      
      -- 日常：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.category = 'daily' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS daily_duration,
      
      -- 购物：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.category = 'shopping' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS shopping_duration,
      
      -- 出行：自然日拆分时长
      ROUND(IFNULL(SUM(
        CASE WHEN e.category = 'travel' THEN
          (JULIANDAY(MIN(e.end_datetime, DATE(d.stat_date, '+1 day'))) - JULIANDAY(MAX(e.start_datetime, d.stat_date))) * 24 * 60
        ELSE 0 END
      ), 0)) AS travel_duration

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
  
  async getCategoryStatistics(startDate, endDate) {
    const db = await this.getDB();
    return db.getAllAsync(
      `
      SELECT
        category,
        ROUND(SUM((JULIANDAY(end_datetime) - JULIANDAY(start_datetime)) * 24 * 60), 0) AS total_minutes,
        COUNT(*) AS event_count
      FROM event
      WHERE deleted_at IS NULL
        AND status = 'completed'
        AND ${OVERLAP_CONDITION}
      GROUP BY category
      ORDER BY total_minutes DESC
      `,
      [startDate, endDate, startDate, endDate, startDate, endDate]
    );
  }
}
