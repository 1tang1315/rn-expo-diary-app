import { BaseMapper } from '@/core/mapper/BaseMapper';

export class ScoreMapper extends BaseMapper {
  constructor() {
    super('daily_score');
  }

  async getByDate(date) {
    const db = await this.getDB();
    return db.getFirstAsync('SELECT * FROM daily_score WHERE date = ? LIMIT 1', [date]);
  }

  async getByDateRange(startDate, endDate) {
    const db = await this.getDB();
    return db.getAllAsync(
      `
      SELECT * FROM daily_score
      WHERE date BETWEEN ? AND ?
      ORDER BY date ASC
      `,
      [startDate, endDate]
    );
  }

  async upsertDailyScore(payload) {
    const db = await this.getDB();
    return db.runAsync(
      `
      INSERT INTO daily_score (
        date,
        sleep_score,
        diet_score,
        sport_score,
        productivity_score,
        emotion_score,
        balance_score,
        total_score,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(date) DO UPDATE SET
        sleep_score = excluded.sleep_score,
        diet_score = excluded.diet_score,
        sport_score = excluded.sport_score,
        productivity_score = excluded.productivity_score,
        emotion_score = excluded.emotion_score,
        balance_score = excluded.balance_score,
        total_score = excluded.total_score,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        payload.date,
        payload.sleepScore,
        payload.dietScore,
        payload.sportScore,
        payload.productivityScore,
        payload.emotionScore,
        payload.balanceScore,
        payload.totalScore
      ]
    );
  }
}
