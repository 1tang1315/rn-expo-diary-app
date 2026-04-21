import { BaseMapper } from './BaseMapper';

/**
 * AI分析缓存仓库类，处理分析相关的数据访问
 */
export class AnalyseMapper extends BaseMapper {
  constructor() {
    super('daily_analysis');
  }

  /**
   * 检查缓存
   * @param {string} date - 日期
   * @param {string} eventHash - 事件哈希
   * @returns {Promise<Object|null>} 缓存数据
   */
  async checkCache(date, eventHash) {
    const db = await this.getDB();
    const existing = await db.getFirstAsync(
      `SELECT * FROM daily_analysis WHERE date = ? AND event_hash = ?`,
      [date, eventHash]
    );

    if (existing) {
      return {
        reportText: existing.ai_text || '', // 返回原始 AI 文本
        structured: {
          total: {
            score: existing.total_score || 0,
            text: existing.total_text || ''
          },
          sleep: {
            score: existing.sleep_score || 0,
            text: existing.sleep_text || ''
          },
          diet: {
            score: existing.diet_score || 0,
            text: existing.diet_text || ''
          },
          exercise: {
            score: existing.exercise_score || 0,
            text: existing.exercise_text || ''
          },
          efficiency: {
            score: existing.efficiency_score || 0,
            text: existing.efficiency_text || ''
          },
          balance: {
            score: existing.balance_score || 0,
            text: existing.balance_text || ''
          },
          emotion: {
            score: existing.emotion_score || 0,
            text: existing.emotion_text || ''
          },
          overallSummary: existing.overall_summary || ''
        }
      };
    }

    return null;
  }

  /**
   * 写入结构化分析数据
   * @param {string} date - 日期
   * @param {string} eventHash - 事件哈希
   * @param {Object} structuredData - 结构化分析数据
   * @param {string} aiText - 原始 AI 文本
   */
  async writeStructuredData(date, eventHash, structuredData, aiText) {
    const db = await this.getDB();
    await db.runAsync(
      `
      INSERT INTO daily_analysis 
      (date, ai_text, total_score, total_text, 
       sleep_score, sleep_text, 
       diet_score, diet_text, 
       exercise_score, exercise_text, 
       efficiency_score, efficiency_text, 
       balance_score, balance_text, 
       emotion_score, emotion_text, 
       overall_summary, event_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        ai_text = excluded.ai_text,
        total_score = excluded.total_score,
        total_text = excluded.total_text,
        sleep_score = excluded.sleep_score,
        sleep_text = excluded.sleep_text,
        diet_score = excluded.diet_score,
        diet_text = excluded.diet_text,
        exercise_score = excluded.exercise_score,
        exercise_text = excluded.exercise_text,
        efficiency_score = excluded.efficiency_score,
        efficiency_text = excluded.efficiency_text,
        balance_score = excluded.balance_score,
        balance_text = excluded.balance_text,
        emotion_score = excluded.emotion_score,
        emotion_text = excluded.emotion_text,
        overall_summary = excluded.overall_summary,
        event_hash = excluded.event_hash,
        updated_at = CURRENT_TIMESTAMP
    `,
      [
        date,
        aiText,
        structuredData.total.score,
        structuredData.total.text,
        structuredData.sleep.score,
        structuredData.sleep.text,
        structuredData.diet.score,
        structuredData.diet.text,
        structuredData.exercise.score,
        structuredData.exercise.text,
        structuredData.efficiency.score,
        structuredData.efficiency.text,
        structuredData.balance.score,
        structuredData.balance.text,
        structuredData.emotion.score,
        structuredData.emotion.text,
        structuredData.overallSummary,
        eventHash
      ]
    );
  }

  /**
   * 读取结构化分析数据
   * @param {string} date - 日期
   * @returns {Promise<Object|null>} 结构化分析数据
   */
  async readStructuredData(date) {
    const db = await this.getDB();
    const existing = await db.getFirstAsync(
      `SELECT * FROM daily_analysis WHERE date = ?`,
      [date]
    );

    if (existing) {
      return {
        total: {
          score: existing.total_score || 0,
          text: existing.total_text || ''
        },
        sleep: {
          score: existing.sleep_score || 0,
          text: existing.sleep_text || ''
        },
        diet: {
          score: existing.diet_score || 0,
          text: existing.diet_text || ''
        },
        exercise: {
          score: existing.exercise_score || 0,
          text: existing.exercise_text || ''
        },
        efficiency: {
          score: existing.efficiency_score || 0,
          text: existing.efficiency_text || ''
        },
        balance: {
          score: existing.balance_score || 0,
          text: existing.balance_text || ''
        },
        emotion: {
          score: existing.emotion_score || 0,
          text: existing.emotion_text || ''
        },
        overallSummary: existing.overall_summary || ''
      };
    }

    return null;
  }

  /**
   * 读取完整的 AI 分析报告（原始 Markdown 格式）
   * @param {string} date - 日期
   * @returns {Promise<string|null>} 原始 AI 文本
   */
  async readFullAiReport(date) {
    const db = await this.getDB();
    const existing = await db.getFirstAsync(
      `SELECT ai_text FROM daily_analysis WHERE date = ?`,
      [date]
    );

    return existing?.ai_text || null;
  }

  /**
   * 获取指定日期的分数数据
   * @param {string} date - 日期（YYYY-MM-DD）
   * @returns {Promise<Object|null>} 分数数据
   */
  async getScoresByDate(date) {
    const db = await this.getDB();
    const existing = await db.getFirstAsync(
      `SELECT total_score, sleep_score, diet_score, exercise_score, efficiency_score, balance_score, emotion_score 
       FROM daily_analysis WHERE date = ?`,
      [date]
    );

    if (existing) {
      return {
        total: {
          score: existing.total_score || 0
        },
        sleep: {
          score: existing.sleep_score || 0
        },
        diet: {
          score: existing.diet_score || 0
        },
        exercise: {
          score: existing.exercise_score || 0
        },
        efficiency: {
          score: existing.efficiency_score || 0
        },
        balance: {
          score: existing.balance_score || 0
        },
        emotion: {
          score: existing.emotion_score || 0
        }
      };
    }

    return null;
  }

  /**
   * 获取昨日的分析数据
   * @param {string} date - 当前日期（YYYY-MM-DD）
   * @returns {Promise<Object|null>} 昨日的分数数据
   */
  async getYesterdayData(date) {
    // 计算昨日日期
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    return await this.getScoresByDate(yesterdayStr);
  }

  /**
   * 更新分析数据
   * @param {string} date - 日期
   * @param {Object} data - 要更新的数据对象
   * @returns {Promise<boolean>} 是否更新成功
   */
  async update(date, data) {
    const db = await this.getDB();
    const fields = Object.keys(data);
    const setClause = fields.map(field => `${field} = ?`).join(',');
    const values = fields.map(key => data[key]);
    values.push(date);

    const result = await db.runAsync(
      `UPDATE ${this.tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE date = ?`,
      values
    );
    return result.changes > 0;
  }

  /**
   * 获取日期范围内的评分趋势数据
   * @param {string} startDate - 开始日期（YYYY-MM-DD）
   * @param {string} endDate - 结束日期（YYYY-MM-DD）
   * @returns {Promise<Array>} 每日评分数据数组
   */
  async getScoreTrend(startDate, endDate) {
    const db = await this.getDB();
    const results = await db.getAllAsync(
      `SELECT date, total_score, sleep_score, diet_score, exercise_score, efficiency_score, balance_score, emotion_score
       FROM daily_analysis
       WHERE date >= ? AND date <= ?
       ORDER BY date ASC`,
      [startDate, endDate]
    );

    return results.map(item => ({
      date: item.date,
      total: {
        score: item.total_score || 0
      },
      sleep: {
        score: item.sleep_score || 0
      },
      diet: {
        score: item.diet_score || 0
      },
      exercise: {
        score: item.exercise_score || 0
      },
      efficiency: {
        score: item.efficiency_score || 0
      },
      balance: {
        score: item.balance_score || 0
      },
      emotion: {
        score: item.emotion_score || 0
      }
    }));
  }
}

