import { initDB } from '../initDB.js';

export class BaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }
  
  // 获取最大排序值（适配SQLite）
  async getMaxOrder() {
    const db = await initDB();
    const result = await db.getFirstAsync(
      `SELECT MAX("order") as maxOrder FROM ${this.tableName}`
    );
    return result?.maxOrder || 0;
  }
  
  // 获取列表
  async getList() {
    const db = await initDB();
    const list = await db.getAllAsync(`SELECT * FROM ${this.tableName}`);
    
    // 按order排序（如果存在）
    if (list.length > 0 && 'order' in list[0]) {
      list.sort((a, b) => a.order - b.order);
    }
    return list;
  }
  
  // 通过ID获取
  async getById(id) {
    const db = await initDB();
    return await db.getFirstAsync(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }
  
  // 新增
  async add(obj) {
    if (['todo', 'collection'].includes(this.tableName)) {
      const maxOrder = await this.getMaxOrder();
      obj.order = maxOrder + 1;
    }
    
    const db = await initDB();
    const keys = Object.keys(obj);
    const placeholders = keys.map(() => '?').join(',');
    const values = Object.values(obj);
    
    const result = await db.runAsync(
      `INSERT INTO ${this.tableName} (${keys.join(',')}) VALUES (${placeholders})`,
      values
    );
    return result.lastInsertRowId;
  }
  
  // 更新
  async update(obj) {
    const { id, ...rest } = obj;
    const db = await initDB();
    const updates = Object.keys(rest).map(key => `${key} = ?`).join(',');
    const values = [...Object.values(rest), id];
    
    await db.runAsync(
      `UPDATE ${this.tableName} SET ${updates} WHERE id = ?`,
      values
    );
  }
  
  // 删除
  async deleteById(id) {
    const db = await initDB();
    await db.runAsync(
      `DELETE FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
  }
}