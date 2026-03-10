/**
 * 笔记仓库类，处理笔记相关的数据访问
 */
import { BaseMapper } from './BaseMapper';

export class NoteMapper extends BaseMapper {
  constructor() {
    super('notes');
  }

  /**
   * 根据文件夹 ID 获取笔记列表
   * @param {number|null} folderId - 文件夹 ID，null 表示获取未分类笔记
   * @returns {Promise<Array>} 笔记列表
   */
  async getByFolderId(folderId) {
    const db = await this.getDB();
    return await db.getAllAsync(
      `SELECT * FROM notes
       WHERE folder_id = ? AND deleted_at IS NULL
       ORDER BY updated_at DESC`,
      [folderId]
    );
  }

  /**
   * 检查文件夹是否为空（没有未删除的笔记）
   * @param {number} folderId - 文件夹 ID
   * @returns {Promise<boolean>} 如果为空返回 true
   */
  async isFolderEmpty(folderId) {
    const db = await this.getDB();
    const count = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM notes
       WHERE folder_id = ? AND deleted_at IS NULL`,
      [folderId]
    );
    return count.count === 0;
  }

  /**
   * 批量软删除笔记
   * @param {number[]} noteIds - 笔记 ID 数组
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteBatch(noteIds) {
    if (!noteIds || noteIds.length === 0) {
      return false;
    }
    
    const db = await this.getDB();
    const now = new Date().toISOString();
    const placeholders = noteIds.map(() => '?').join(',');
    
    const result = await db.runAsync(
      `UPDATE notes SET
        deleted_at = ?,
        updated_at = ?
       WHERE id IN (${placeholders})
       AND deleted_at IS NULL`,
      [now, now, ...noteIds]
    );
    
    return result.changes > 0;
  }

  /**
   * 搜索笔记（按标题和内容）
   * @param {string} query - 搜索关键词
   * @param {number|null} folderId - 可选，指定文件夹 ID 进行搜索
   * @returns {Promise<Array>} 匹配的笔记列表
   */
  async search(query, folderId = null) {
    const db = await this.getDB();
    const searchTerm = `%${query}%`;
    
    let sql = `
      SELECT * FROM notes
      WHERE (title LIKE ? OR content LIKE ?) AND deleted_at IS NULL
    `;
    const params = [searchTerm, searchTerm];
    
    if (folderId !== null) {
      sql += ' AND folder_id = ?';
      params.push(folderId);
    }
    
    sql += ' ORDER BY updated_at DESC';
    
    return await db.getAllAsync(sql, params);
  }

  /**
   * 检查指定日期的日记是否存在
   * @param {string} dateStr - 日期字符串
   * @returns {Promise<boolean>} 是否存在
   */
  async checkDiaryExists(dateStr) {
    const db = await this.getDB();
    const result = await db.getFirstAsync(
      `SELECT id FROM notes
       WHERE title = ?
         AND folder_id = (SELECT id FROM folders
           WHERE name = '日记'
           AND deleted_at IS NULL
         )
         AND deleted_at IS NULL`,
      [dateStr]
    );
    return !!result;
  }

  /**
   * 验证文件夹是否存在
   * @param {number} folderId - 文件夹 ID
   * @returns {Promise<boolean>} 是否存在
   */
  async folderExists(folderId) {
    const db = await this.getDB();
    const result = await db.getFirstAsync(
      `SELECT id FROM folders
       WHERE id = ? AND deleted_at IS NULL`,
      [folderId]
    );
    return !!result;
  }
}
