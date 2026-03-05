/**
 * 储物仓库类，处理储物相关的数据访问
 */
import { BaseMapper } from './BaseMapper';

export class StorageMapper extends BaseMapper {
  constructor() {
    super('storage');
  }

  /**
   * 根据日期范围获取储物项
   * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
   * @param {string} endDate - 结束日期，格式：YYYY-MM-DD
   * @param {string} sortOrder - 排序方向，'asc' 或 'desc'
   * @returns {Promise<Array>} 数据库查询结果数组
   */
  async getByDateRange(startDate, endDate, sortOrder = 'asc') {
    const db = await this.getDB();
    const sql = `
      SELECT *
      FROM storage
      WHERE
        deleted_at IS NULL
        AND (
          (DATE(start_date) BETWEEN ? AND ?)
          OR
          (DATE(end_date) BETWEEN ? AND ?)
          OR
          (DATE(start_date) <= ? AND DATE(end_date) >= ?)
        )
      ORDER BY start_date ${sortOrder}
    `;
    
    return await db.getAllAsync(
      sql,
      [
        startDate, endDate,
        startDate, endDate,
        startDate, endDate
      ]
    );
  }

  /**
   * 按名称、详情和分类搜索储物项
   * @param {string} keyword - 搜索关键词
   * @param {string} searchTerm - 格式化后的搜索关键词
   * @returns {Promise<Array>} 数据库查询结果数组
   */
  async searchByKeyword(keyword, searchTerm) {
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT *,
              CASE
                  WHEN name = ? THEN 1
                  WHEN name LIKE ? THEN 2
                  WHEN name LIKE ? THEN 3
                  WHEN category = ? THEN 4
                  WHEN category LIKE ? THEN 5
                  WHEN detail = ? THEN 6
                  WHEN detail LIKE ? THEN 7
                  WHEN detail LIKE ? THEN 8
                  ELSE 9
                  END AS search_priority
       FROM storage
       WHERE
           deleted_at IS NULL
         AND (name LIKE ? OR detail LIKE ? OR category LIKE ?)
       ORDER BY search_priority ASC, name ASC`,
      [
        keyword,
        `${keyword}%`,
        searchTerm,
        keyword,
        `${keyword}%`,
        keyword,
        `${keyword}%`,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm
      ]
    );
  }

  /**
   * 获取所有储物项（支持排序）
   * @param {string} sortField - 排序字段
   * @param {string} sortOrder - 排序方向
   * @returns {Promise<Array>} 数据库查询结果数组
   */
  async getAllWithSort(sortField = 'name', sortOrder = 'asc') {
    const validFields = ['name', 'category', 'price', 'start_date', 'end_date'];
    const finalSortField = validFields.includes(sortField) ? sortField : 'name';
    const finalSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase())
      ? sortOrder.toLowerCase()
      : 'asc';
    
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT * FROM storage
       WHERE deleted_at IS NULL
       ORDER BY ${finalSortField} ${finalSortOrder}`
    );
  }
}
