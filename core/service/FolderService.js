/**
 * 文件夹服务类，处理文件夹的业务逻辑
 */
import { FolderMapper } from '@/core/mapper';
import { BaseService, NoteService } from '@/core/service';

export class FolderService extends BaseService {
  constructor() {
    super(new FolderMapper());
  }

  /**
   * 创建文件夹
   * @param {Object} data - 文件夹数据
   * @returns {Promise<number>} 创建的文件夹ID
   */
  async create(data) {
    try {
      // 检查文件夹名称是否已存在
      const exists = await this.mapper.existsByName(data.name.trim());
      if (exists) {
        throw new Error('文件夹名称已存在');
      }

      return await this.mapper.create({ name: data.name.trim() });
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw error;
    }
  }

  /**
   * 更新文件夹
   * @param {number} id - 文件夹ID
   * @param {Object} data - 文件夹数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async update(id, data) {
    try {
      // 检查文件夹名称是否已存在（排除当前文件夹）
      const exists = await this.mapper.existsByName(data.name.trim(), id);
      if (exists) {
        throw new Error('文件夹名称已存在');
      }

      return await this.mapper.update(id, { name: data.name.trim() });
    } catch (error) {
      console.error('更新文件夹失败:', error);
      throw error;
    }
  }
  
  /**
   * 删除文件夹
   * @param {number} id - 文件夹ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async delete(id) {
    try {
      // 获取该文件夹下的所有笔记
      const noteService = new NoteService();
      const notes = await noteService.getByFolderId(id);

      // 批量更新这些笔记的folderId为null
      for (const note of notes) {
        await noteService.update(note.id, { folderId: null });
      }

      // 删除文件夹
      return await this.mapper.delete(id);
    } catch (error) {
      console.error('删除文件夹失败:', error);
      throw error;
    }
  }
  
  /**
   * 检查文件夹是否存在
   * @param {number} id - 文件夹ID
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(id) {
    try {
      const folder = await this.mapper.getById(id);
      return !!folder;
    } catch (error) {
      console.error('检查文件夹存在失败:', error);
      return false;
    }
  }
}
