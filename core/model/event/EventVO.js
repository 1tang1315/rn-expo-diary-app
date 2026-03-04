/**
 * 事件值对象（用于前端展示）
 * 注意：当前已使用通用转换工具，此类仅作为历史兼容保留
 */
export class EventVO {
  constructor() {
    this.id = null;
    this.startDatetime = null;
    this.endDatetime = null;
    this.title = null;
    this.category = null;
    this.description = null;
    this.status = null;
    this.icon = null;
    this.updatedAt = null;
    this.deletedAt = null;
  }

  /**
   * 从PO创建VO实例
   * @param {Object} eventPO - 事件持久化对象
   * @returns {EventVO} EventVO实例
   */
  static fromPO(eventPO) {
    const eventVO = new EventVO();
    Object.assign(eventVO, eventPO);
    return eventVO;
  }

  /**
   * 从前端请求数据创建VO实例
   * @param {Object} requestData - 前端请求数据
   * @returns {EventVO} EventVO实例
   */
  static fromRequest(requestData) {
    const eventVO = new EventVO();
    Object.assign(eventVO, requestData);
    return eventVO;
  }

  /**
   * 转换为PO实例
   * @returns {Object} 转换后的PO对象
   */
  toPO() {
    const eventPO = new (require('./EventPO.js').EventPO)();
    Object.assign(eventPO, this);
    return eventPO;
  }
}