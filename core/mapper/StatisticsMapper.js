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

  async getStatisticsByDateRange(startDate, endDate) {
    const db = await this.getDB();
    const [result] = await db.getAllAsync(
      `
      SELECT
        ROUND(SUM(CASE WHEN category = 'sleep' THEN (JULIANDAY(end_datetime) - JULIANDAY(start_datetime)) * 24 * 60 ELSE 0 END), 0) AS sleep_duration,
        ROUND(SUM(CASE WHEN category IN ('exercise', 'sports') THEN (JULIANDAY(end_datetime) - JULIANDAY(start_datetime)) * 24 * 60 ELSE 0 END), 0) AS sport_duration,
        ROUND(SUM(CASE WHEN category = 'entertainment' THEN (JULIANDAY(end_datetime) - JULIANDAY(start_datetime)) * 24 * 60 ELSE 0 END), 0) AS entertainment_duration,
        ROUND(SUM(CASE WHEN category IN ('study', 'work') THEN (JULIANDAY(end_datetime) - JULIANDAY(start_datetime)) * 24 * 60 ELSE 0 END), 0) AS study_duration,
        SUM(CASE WHEN category = 'diet' THEN 1 ELSE 0 END) AS meal_count
      FROM event
      WHERE deleted_at IS NULL
        AND status = 'completed'
        AND ${OVERLAP_CONDITION}
      `,
      [startDate, endDate, startDate, endDate, startDate, endDate]
    );
    return result || {};
  }

  async getEventsByDateRange(startDate, endDate) {
    const db = await this.getDB();
    return db.getAllAsync(
      `
      SELECT * FROM event
      WHERE deleted_at IS NULL
        AND ${OVERLAP_CONDITION}
      ORDER BY start_datetime ASC
      `,
      [startDate, endDate, startDate, endDate, startDate, endDate]
    );
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
