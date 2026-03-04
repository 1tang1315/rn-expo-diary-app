import { getDB } from "./initDB";

/**
 * 导出本地表数据为JSON
 * @param {string} tableName - 表名
 * @returns {Promise<Array<Object>>} 表数据数组
 * @throws {Error} 非法表名时抛出错误
 */
export async function exportTable(tableName) {
  const db = await getDB();
  // 表名合法性校验（防SQL注入）
  if(!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error(`非法表名：${tableName}`);
  }
  return await db.getAllAsync(`SELECT *
                               FROM ${tableName}`);
}

/**
 * 导入JSON数据到本地表
 * @param {string} tableName - 表名
 * @param {Array<Object>} rows - 数据行数组
 * @param {'merge'|'overwrite'} [mode='merge'] - 导入模式
 * @returns {Promise<void>}
 * @throws {Error} 非法表名时抛出错误
 */
export async function importTable(tableName, rows, mode = 'merge') {
  const db = await getDB();
  // 表名合法性校验（防SQL注入）
  if(!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error(`非法表名：${tableName}`);
  }
  
  // 事务批量处理（提升性能）
  await db.transactionAsync(async (tx) => {
    if(mode === 'overwrite') {
      await tx.runAsync(`DELETE
                         FROM ${tableName}`);
    }
    if(rows.length === 0) return;
    
    // 批量插入（避免循环调用）
    const keys = Object.keys(rows[0]);
    const cols = keys.join(',');
    const placeholders = keys.map(() => '?').join(',');
    const values = rows.flatMap(row => keys.map(k => row[k]));
    
    await tx.runAsync(
      `INSERT OR
       REPLACE INTO ${tableName} (${cols})
       VALUES (${placeholders})`,
      values
    );
  });
}

/**
 * 获取所有表（排除系统表）
 * @returns {Promise<Array<Object>>} 表信息数组，每个对象包含name字段
 */
export async function getAllTables() {
  const db = await getDB();
  return await db.getAllAsync(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
  `);
}