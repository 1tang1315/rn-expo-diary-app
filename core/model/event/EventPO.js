/**
 * 事件持久化对象（对应数据库表结构）
 * 注意：当前已使用通用转换工具，此类仅作为历史兼容保留
 */
export class EventPO {
  constructor() {
    this.id = null;
    this.start_datetime = null;
    this.end_datetime = null;
    this.title = null;
    this.category = null;
    this.description = null;
    this.status = null;
    this.icon = null;
    this.updated_at = null;
    this.deleted_at = null;
  }

  /**
   * 从数据库结果创建EventPO实例
   * @param {Object} dbResult - 数据库查询结果
   * @returns {EventPO} EventPO实例
   */
  static fromDBResult(dbResult) {
    const eventPO = new EventPO();
    Object.assign(eventPO, dbResult);
    return eventPO;
  }

  /**
   * 转换为数据库插入/更新参数
   * @returns {Array} 数据库操作参数数组
   */
  toDBParams() {
    return [
      this.start_datetime,
      this.end_datetime,
      this.title,
      this.category,
      this.description,
      this.status,
      this.icon,
      this.updated_at,
      this.deleted_at
    ];
  }
}