/**
 * 事件服务类，处理事件相关的业务逻辑
 */
import { BASE_IMAGE_DIR } from '@/constants/commonConstans';
import { deleteLocalImage } from '@/core/db/imageDB';
import { EventMapper } from '@/core/mapper';
import { BaseService } from '@/core/service';
import { snakeToCamelObject } from '@/core/utils';
import {
  applyInstantDatetimes,
  hydrateEventRow,
  serializeEventExtras,
  serializeEventImages,
} from '@/utils/eventPayloadUtils';
import { toEventImageUri } from '@/utils/eventImageUtils';

export class EventService extends BaseService {
  constructor() {
    super(new EventMapper());
  }

  mapEvent(po) {
    if (!po) return po;
    return hydrateEventRow(snakeToCamelObject(po));
  }

  prepareWrite(data) {
    let next = { ...data };
    if (!next.timeKind && !next.time_kind) {
      next.timeKind = 'interval';
    }
    next = applyInstantDatetimes(next);
    const extrasObj = next.extras && typeof next.extras === 'object' && !Array.isArray(next.extras)
      ? next.extras
      : {};
    const imagesArr = Array.isArray(next.images) ? next.images : [];
    next.extras = serializeEventExtras(extrasObj);
    next.images = serializeEventImages(imagesArr);
    return next;
  }

  async deleteEventImages(images) {
    if (!Array.isArray(images)) return;
    for (const key of images) {
      if (typeof key === 'string' && key) {
        await deleteLocalImage(toEventImageUri(BASE_IMAGE_DIR, key));
      }
    }
  }

  async getById(id) {
    const po = await this.mapper.getById(id);
    return po ? this.mapEvent(po) : null;
  }

  async getAll() {
    const pos = await this.mapper.getAll();
    return pos.map((po) => this.mapEvent(po));
  }

  async create(data) {
    return super.create(this.prepareWrite(data));
  }

  async update(id, data) {
    const existing = await this.getById(id);
    const result = await super.update(id, this.prepareWrite(data));
    if (result && existing?.images?.length) {
      const nextImages = Array.isArray(data.images) ? data.images : [];
      const removed = existing.images.filter((key) => !nextImages.includes(key));
      await this.deleteEventImages(removed);
    }
    return result;
  }

  async delete(id) {
    const existing = await this.getById(id);
    const result = await super.delete(id);
    if (result && existing?.images?.length) {
      await this.deleteEventImages(existing.images);
    }
    return result;
  }

  /**
   * 根据日期范围获取事件
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Promise<Array>} 转换后的对象数组
   */
  async getByDateRange(startDate, endDate) {
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    const results = await this.mapper.getByDateRangeAndCategory(start, end, 'all', 'desc');
    return results.map((result) => this.mapEvent(result));
  }

  /**
   * 根据日期范围和分类获取事件
   */
  async getByDateRangeAndCategory(startDate, endDate, category = 'all', sortOrder = 'desc') {
    const results = await this.mapper.getByDateRangeAndCategory(startDate, endDate ?? startDate, category, sortOrder);
    return results.map((result) => this.mapEvent(result));
  }

  /**
   * 根据结束日期范围获取事件（所有事件都按结束日筛选）
   */
  async getByEndDateRange(startDate, endDate, category = 'all', sortOrder = 'desc') {
    const results = await this.mapper.getByEndDateRange(startDate, endDate ?? startDate, category, sortOrder);
    return results.map((result) => this.mapEvent(result));
  }

  /**
   * 按关键词搜索事件
   */
  async searchByKeyword(keyword) {
    const searchTerm = `%${keyword}%`;
    const results = await this.mapper.searchByKeyword(keyword, searchTerm);
    return results.map((result) => this.mapEvent(result));
  }

  /**
   * 按分类获取常用标题
   */
  async getCommonTitlesByCategory(category, limit = 5) {
    const results = await this.mapper.getCommonTitlesByCategory(category, limit) ?? [];
    return results.map((item) => item.title);
  }

  /**
   * 获取事件统计数据
   */
  async getTotalStats() {
    const rawStats = await this.mapper.getTotalStats();
    const totalEvents = rawStats.totalEvents || 0;
    const totalRecords = rawStats.totalRecords || 0;
    const totalDuration = rawStats.totalHours
      ? `${rawStats.totalHours.toFixed(1)}小时`
      : '0小时';
    const recordDays = `${rawStats.recordDays || 0}天`;

    return {
      totalEvents: `${totalEvents}个`,
      totalRecords: `${totalRecords}次`,
      totalDuration,
      recordDays
    };
  }

  /**
   * 更新事件状态
   */
  async updateStatus(id, status) {
    const event = await this.getById(id);
    if (!event) {
      return false;
    }

    event.status = status;
    return await this.update(id, event);
  }

  /**
   * 按条件筛选搜索事件
   */
  async getByFilters(options) {
    const results = await this.mapper.getByFilters(options);
    return results.map((result) => this.mapEvent(result));
  }
}
