/**
 * 事件仓库类，处理事件相关的数据访问
 */
import { BaseMapper } from './BaseMapper';

export class EventMapper extends BaseMapper {
  constructor() {
    super('event');
  }

  /**
   * 根据日期范围和分类获取事件
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} category - 事件分类，'all' 表示所有分类
   * @param {string} sortOrder - 排序方向，'asc' 或 'desc'
   * @returns {Promise<Array>} 数据库查询结果数组
   */
  async getByDateRangeAndCategory(startDate, endDate, category = 'all', sortOrder = 'desc') {
    const db = await this.getDB();
    let query = `SELECT * FROM event 
       WHERE deleted_at IS NULL 
       AND (
         (DATE(start_datetime) BETWEEN ? AND ?) 
         OR (DATE(end_datetime) BETWEEN ? AND ?) 
         OR (DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?)
       )`;

    const params = [
      startDate, endDate,
      startDate, endDate,
      startDate, endDate
    ];

    if (category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ` ORDER BY start_datetime ${sortOrder}`;

    return await db.getAllAsync(query, params);
  }
  
  /**
   * 根据结束日期范围获取事件（所有事件都按结束日筛选）
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} category - 事件分类，'all' 表示所有分类
   * @param {string} sortOrder - 排序方向，'asc' 或 'desc'
   * @returns {Promise<Array>} 数据库查询结果数组
   */
  async getByEndDateRange(startDate, endDate, category = 'all', sortOrder = 'desc') {
    const db = await this.getDB();
    let query = `SELECT * FROM event
       WHERE deleted_at IS NULL
       AND DATE(end_datetime) BETWEEN ? AND ?`;
    
    const params = [startDate, endDate];
    
    if (category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    
    query += ` ORDER BY start_datetime ${sortOrder}`;
    
    return await db.getAllAsync(query, params);
  }

  /**
   * 按标题和描述搜索事件
   * @param {string} keyword - 搜索关键词
   * @param {string} searchTerm - 格式化后的搜索关键词
   * @returns {Promise<Array>} 数据库查询结果数组
   */
  async searchByKeyword(keyword, searchTerm) {
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT *, 
       CASE 
         WHEN title = ? THEN 1 
         WHEN title LIKE ? THEN 2 
         WHEN title LIKE ? THEN 3 
         WHEN description = ? THEN 4 
         WHEN description LIKE ? THEN 5 
         WHEN description LIKE ? THEN 6 
         ELSE 7 
         END AS search_priority 
       FROM event 
       WHERE deleted_at IS NULL 
       AND (title LIKE ? OR description LIKE ?) 
       ORDER BY search_priority ASC, start_datetime DESC`,
      [
        keyword,
        `${keyword}%`,
        searchTerm,
        keyword,
        `${keyword}%`,
        searchTerm,
        searchTerm,
        searchTerm
      ]
    );
  }

  /**
   * 按分类获取常用标题
   * @param {string} category - 事件分类
   * @param {number} limit - 最多返回数量
   * @returns {Promise<Array>} 常用标题数组
   */
  async getCommonTitlesByCategory(category, limit = 5) {
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT title, COUNT(title) AS useCount 
       FROM event 
       WHERE title IS NOT NULL 
       AND title != '' AND category = ? AND deleted_at IS NULL 
       GROUP BY title 
       ORDER BY useCount DESC LIMIT ?`,
      [category, limit]
    );
  }

  /**
   * 获取事件统计数据
   * @returns {Promise<Object>} 统计数据
   */
  async getTotalStats() {
    const db = await this.getDB();

    // 事件总数（按标题去重后的不同事件数量）
    const [totalEventsResult] = await db.getAllAsync(
      `SELECT COUNT(DISTINCT title) AS count FROM event WHERE deleted_at IS NULL AND title IS NOT NULL AND title != ''`
    );
    const totalEvents = totalEventsResult.count;

    // 记录次数（所有事件记录的总数）
    const [totalRecordsResult] = await db.getAllAsync(
      'SELECT COUNT(*) AS count FROM event WHERE deleted_at IS NULL'
    );
    const totalRecords = totalRecordsResult.count;

    // 总时长（小时）
    const [totalDurationResult] = await db.getAllAsync(`
      SELECT SUM(
        (JULIANDAY(end_datetime) - JULIANDAY(start_datetime)) * 24
      ) AS totalHours FROM event WHERE deleted_at IS NULL
    `);
    const totalHours = totalDurationResult.totalHours;

    // 记录天数
    const [recordDaysResult] = await db.getAllAsync(`
      SELECT COUNT(DISTINCT DATE(start_datetime)) AS count
      FROM event WHERE deleted_at IS NULL
    `);
    const recordDays = recordDaysResult.count;

    return {
      totalEvents,
      totalRecords,
      totalHours,
      recordDays
    };
  }

  /**
   * 按条件筛选搜索事件（支持搜索类型、日期范围、排序方式）
   * @param {Object} options - 筛选选项
   * @param {string} options.keyword - 搜索关键词
   * @param {'title' | 'description' | 'both'} options.searchType - 搜索类型：标题/描述/全部
   * @param {string} options.startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} options.endDate - 结束日期，格式：YYYY-MM-DD
   * @param {'asc' | 'desc'} options.sortOrder - 排序方式：升序/降序
   * @returns {Promise<Array>} 匹配的事件数组
   */
  async getByFilters(options) {
    const {
      keyword,
      searchType = 'both',
      startDate,
      endDate,
      sortOrder = 'desc'
    } = options;

    const db = await this.getDB();
    const validSortOrders = ['asc', 'desc'];
    const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
      ? sortOrder.toLowerCase()
      : 'desc';

    let whereConditions = ['deleted_at IS NULL'];
    let params = [];

    if (keyword && keyword.trim()) {
      const trimmedKeyword = keyword.trim();
      if (searchType === 'title') {
        whereConditions.push('(title LIKE ?)');
        params.push(`%${trimmedKeyword}%`);
      } else if (searchType === 'description') {
        whereConditions.push('(description LIKE ?)');
        params.push(`%${trimmedKeyword}%`);
      } else {
        whereConditions.push('(title LIKE ? OR description LIKE ?)');
        params.push(`%${trimmedKeyword}%`, `%${trimmedKeyword}%`);
      }
    }

    if (startDate) {
      const formattedStartDate = startDate;
      const formattedEndDate = endDate || formattedStartDate;
      whereConditions.push(`
        (
          (DATE(start_datetime) BETWEEN ? AND ?)
          OR
          (DATE(end_datetime) BETWEEN ? AND ?)
          OR
          (DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?)
        )
      `);
      params.push(
        formattedStartDate, formattedEndDate,
        formattedStartDate, formattedEndDate,
        formattedStartDate, formattedEndDate
      );
    }

    const sql = `
      SELECT *
      FROM event
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY start_datetime ${finalSortOrder}
    `;

    return await db.getAllAsync(sql, params);
  }
}