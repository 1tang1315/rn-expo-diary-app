/**
 * 储物值对象（用于前端展示）
 * 注意：当前已使用通用转换工具，此类仅作为历史兼容保留
 */
export class StorageVO {
  constructor() {
    this.id = null;
    this.name = null;
    this.category = null;
    this.icon = null;
    this.price = null;
    this.detail = null;
    this.image = null;
    this.startDate = null;
    this.endDate = null;
    this.createdAt = null;
    this.updatedAt = null;
    this.deletedAt = null;
  }

  /**
   * 从 PO 创建 VO 实例
   * @param {Object} storagePO - 储物持久化对象
   * @returns {StorageVO} StorageVO 实例
   */
  static fromPO(storagePO) {
    const storageVO = new StorageVO();
    Object.assign(storageVO, storagePO);
    return storageVO;
  }

  /**
   * 从前端请求数据创建 VO 实例
   * @param {Object} requestData - 前端请求数据
   * @returns {StorageVO} StorageVO 实例
   */
  static fromRequest(requestData) {
    const storageVO = new StorageVO();
    Object.assign(storageVO, requestData);
    return storageVO;
  }

  /**
   * 转换为 PO 实例
   * @returns {Object} 转换后的 PO 对象
   */
  toPO() {
    const storagePO = new (require('./StoragePO.js').StoragePO)();
    Object.assign(storagePO, this);
    return storagePO;
  }
}
