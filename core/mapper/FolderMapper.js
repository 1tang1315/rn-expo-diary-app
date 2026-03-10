/**
 * 文件夹映射器类，处理文件夹的数据库操作
 */
import { BaseMapper } from '@/core/mapper';

export class FolderMapper extends BaseMapper {
  constructor() {
    super('folders');
  }

  /**
   * 检查文件夹名称是否存在
   * @param {string} name - 文件夹名称
   * @param {number|null} excludeId - 排除的文件夹ID（用于更新时）
   * @returns {Promise<boolean>} 是否存在
   */
  async existsByName(name, excludeId = null) {
    try {
      const db = await this.getDB();
      let query = 'SELECT COUNT(*) as count FROM folders WHERE name = ? AND deleted_at IS NULL';
      const params = [name];
      
      if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
      }
      
      const result = await db.getFirstAsync(query, ...params);
      return result.count > 0;
    } catch (error) {
      console.error('检查文件夹名称失败:', error);
      return false;
    }
  }
}
