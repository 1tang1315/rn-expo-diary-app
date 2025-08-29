import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDB() {
  if(db) return db; // 已经打开过就直接返回
  
  db = await SQLite.openDatabaseAsync('RNExpoDiaryApp');
  
  await db.execAsync(`PRAGMA journal_mode = WAL;`);
  
  // 事件表(一天 多条事件)
  await db.execAsync(`
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
  
  return db;
}
