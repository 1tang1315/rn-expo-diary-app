import * as SQLite from 'expo-sqlite';

let index = null;

export async function getDB() {
  if(index) return index; // 已经打开过就直接返回
  
  index = await SQLite.openDatabaseAsync('RNExpoDiaryApp');
  
  await index.execAsync(`PRAGMA journal_mode = WAL;`);
  
  // 用户表
  await index.execAsync(`
  CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT DEFAULT 'default_user',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);
  
  // 初始化默认用户（如果不存在）
  const userCount = await index.getFirstAsync(`SELECT COUNT(*) as count FROM user`);
  if(userCount.count === 0) {
    await index.runAsync(`INSERT INTO user (username) VALUES ('default_user')`);
  }
  
  // 事件表(一天 多条事件)
  await index.execAsync(`
  CREATE TABLE IF NOT EXISTS event (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_datetime TEXT NOT NULL,   /* 2025-08-28 23:00 */
    end_datetime TEXT NOT NULL,     /* 2025-08-29 02:00 */
    title TEXT,                     /* 标题可空；为空时显示分类 */
    category TEXT,                  /* work, life, health... */
    description TEXT,
    status TEXT,                    /* planned / completed / canceled */
    icon TEXT
  );
`);
  
  // 网盘配置表
  await index.execAsync(`
     CREATE TABLE IF NOT EXISTS cloud_drive_config (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id INTEGER NOT NULL,
       drive_type TEXT NOT NULL DEFAULT 'nutstore',  /* 默认 nutstore(坚果云盘) */
       account TEXT NOT NULL,                        /* 账号 */
       credential TEXT NOT NULL,                     /* 密码或Token */
       root_path TEXT NOT NULL DEFAULT 'RNExpoDiaryApp', /* 云盘存储路径 */
       created_at TEXT DEFAULT CURRENT_TIMESTAMP,
       updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
       FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
    );
`);
  
  // 同步状态表
  await index.execAsync(`
    CREATE TABLE IF NOT EXISTS sync_checkpoint (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      drive_id INTEGER NOT NULL,
      path TEXT NOT NULL,              /* 云端目录，例如 RNExpoDiaryApp */
      last_sync_time TEXT DEFAULT '1970-01-01T00:00:00Z',
      last_sync_token TEXT,            /* WebDAV的etag，或远端清单版本号 */
      sync_status TEXT DEFAULT 'idle', /* idle / syncing / failed */
      error_message TEXT,              /* 最近一次错误 */
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
      FOREIGN KEY (drive_id) REFERENCES cloud_drive_config(id) ON DELETE CASCADE,
      UNIQUE(drive_id, path)
    );
  `);
  
  return index;
}

/**
 * 导出本地表数据为JSON
 * @param {string} tableName - 表名
 * @returns {Promise<Array<Object>>} 表数据数组
 * @throws {Error} 非法表名时抛出错误
 */
export async function exportTable(tableName) {
  const db = await getDB();
  // 表名合法性校验（防SQL注入）
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error(`非法表名：${tableName}`);
  }
  return await db.getAllAsync(`SELECT * FROM ${tableName}`);
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
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error(`非法表名：${tableName}`);
  }
  
  // 事务批量处理（提升性能）
  await db.transactionAsync(async (tx) => {
    if (mode === 'overwrite') {
      await tx.runAsync(`DELETE FROM ${tableName}`);
    }
    if (rows.length === 0) return;
    
    // 批量插入（避免循环调用）
    const keys = Object.keys(rows[0]);
    const cols = keys.join(',');
    const placeholders = keys.map(() => '?').join(',');
    const values = rows.flatMap(row => keys.map(k => row[k]));
    
    await tx.runAsync(
      `INSERT OR REPLACE INTO ${tableName} (${cols}) VALUES (${placeholders})`,
      values
    );
  });
}

/**
 * 获取所有业务表（排除系统表和配置表）
 * @returns {Promise<Array<Object>>} 表信息数组，每个对象包含name字段
 */
export async function getBusinessTables() {
  const db = await getDB();
  return await db.getAllAsync(`
    SELECT name FROM sqlite_master
    WHERE type='table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT IN ('sync_checkpoint', 'cloud_drive_config', 'user')
  `);
}