/**
 * 储物持久化对象（对应数据库表结构）
 * 注意：当前已使用通用转换工具，此类仅作为历史兼容保留
 */
export class StoragePO {
  constructor() {
    this.id = null;
    this.name = null;
    this.category = null;
    this.icon = null;
    this.price = null;
    this.detail = null;
    this.image = null;
    this.start_date = null;
    this.end_date = null;
    this.created_at = null;
    this.updated_at = null;
    this.deleted_at = null;
  }

  /**
   * 从数据库结果创建 StoragePO 实例
   * @param {Object} dbResult - 数据库查询结果
   * @returns {StoragePO} StoragePO 实例
   */
  static fromDBResult(dbResult) {
    const storagePO = new StoragePO();
    Object.assign(storagePO, dbResult);
    return storagePO;
  }

  /**
   * 转换为数据库插入/更新参数
   * @returns {Array} 数据库操作参数数组
   */
  toDBParams() {
    return [
      this.name,
      this.category,
      this.icon,
      this.price,
      this.detail,
      this.image,
      this.start_date,
      this.end_date,
      this.created_at,
      this.updated_at,
      this.deleted_at
    ];
  }
}
