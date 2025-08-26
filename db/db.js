import * as SQLite from 'expo-sqlite';

const DB_NAME = 'RNExpoDiaryApp.db';
let dbInstance = null; // 缓存数据库实例

export const initDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }
  
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  
  // 初始化表结构（使用execAsync执行批量SQL）
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    
    -- 用户表
    CREATE TABLE IF NOT EXISTS user (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT,
      nickname TEXT,
      constellation TEXT,
      motto TEXT,
      theme TEXT,
      title TEXT,
      createTime TEXT,
      updateTime TEXT
    );
    
    -- 活动表
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todoId INTEGER,
      todoName TEXT,
      beginTime TEXT,
      endTime TEXT,
      duration INTEGER,
      experience TEXT,
      createTime TEXT,
      updateTime TEXT,
      FOREIGN KEY(todoId) REFERENCES todo(id)
    );
    
    -- 任务表
    CREATE TABLE IF NOT EXISTS todo (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collectionId INTEGER,
      name TEXT UNIQUE,
      isTiming BOOLEAN DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      "order" INTEGER UNIQUE,
      createTime TEXT,
      updateTime TEXT,
      FOREIGN KEY(collectionId) REFERENCES collection(id)
    );
    
    -- 集合表
    CREATE TABLE IF NOT EXISTS collection (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      "order" INTEGER UNIQUE,
      isFolded BOOLEAN DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      createTime TEXT,
      updateTime TEXT
    );
    
    -- 笔记表
    CREATE TABLE IF NOT EXISTS note (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      title TEXT UNIQUE,
      content TEXT,
      "order" INTEGER,
      todoId INTEGER,
      collectionId INTEGER,
      createTime TEXT,
      updateTime TEXT,
      FOREIGN KEY(todoId) REFERENCES todo(id),
      FOREIGN KEY(collectionId) REFERENCES collection(id)
    );
  `);
  
  return dbInstance;
};