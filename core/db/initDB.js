import * as SQLite from "expo-sqlite";

let dbPromise = null;

export async function getDB() {
  if(dbPromise) {
    return dbPromise;
  }
  
  dbPromise = (async () => {
    const db = await SQLite.openDatabaseAsync('RNExpoDiaryApp');
    
    await db.execAsync(`PRAGMA journal_mode = WAL;`);
    
    // await db.execAsync(`DROP TABLE IF EXISTS user;`);
    // await db.execAsync(`DROP TABLE IF EXISTS event;`);
    // await db.execAsync(`DROP TABLE IF EXISTS folders;`);
    // await db.execAsync(`DROP TABLE IF EXISTS notes;`);
    // await db.execAsync(`DROP TABLE IF EXISTS conversations;`);
    // await db.execAsync(`DROP TABLE IF EXISTS messages;`);
    // await db.execAsync(`DROP TABLE IF EXISTS storage;`);
    // await db.execAsync(`DROP TABLE IF EXISTS cloud_drive_config;`);
    // await db.execAsync(`DROP TABLE IF EXISTS sync_checkpoint;`);
    
    // 用户表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS user
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT DEFAULT 'default_user',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at TEXT DEFAULT NULL /* 软删除字段，NULL表示未删除 */
        );
    `);
    
    // 初始化默认用户（如果不存在）
    const userCount = await db.getFirstAsync(`SELECT COUNT(*) as count
                                              FROM user`);
    if(userCount.count === 0) {
      await db.runAsync(`INSERT INTO user (username)
                         VALUES ('default_user')`);
    }
    
    // 事件表(一天 多条事件)
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS event
        (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            start_datetime TEXT NOT NULL, /* 2025-08-28 23:00 */
            end_datetime   TEXT NOT NULL, /* 2025-08-29 02:00 */
            title          TEXT, /* 标题可空；为空时显示分类 */
            category       TEXT, /* work, life, health... */
            description    TEXT,
            status         TEXT, /* early / upcoming / inProgress / completed / notCompleted */
            icon           TEXT,
            created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at     TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at     TEXT DEFAULT NULL /* 软删除字段，NULL表示未删除 */
        );
    `);
    
    // 文件夹/笔记本表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS folders
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL, /* 文件夹名称，如 '日记', '工作', '灵感' */
            sort_order INTEGER DEFAULT 0, /* 排序顺序，用于自定义排序 */
            created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT    DEFAULT CURRENT_TIMESTAMP,
            deleted_at TEXT    DEFAULT NULL /* 软删除字段 */
        );
    `);
    
    // 笔记表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            folder_id  INTEGER, /* 外键 */
            title      TEXT NOT NULL DEFAULT '', /* 笔记标题 */
            content    TEXT NOT NULL, /* 笔记内容 */
            created_at TEXT          DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT          DEFAULT CURRENT_TIMESTAMP,
            deleted_at TEXT          DEFAULT NULL,
            FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE SET NULL
        );
    `);
    
    // 初始化默认文件夹 "日记"（如果不存在）
    const diaryFolder = await db.getFirstAsync(`SELECT id
                                                FROM folders
                                                WHERE name = '日记'
                                                LIMIT 1`);
    if(!diaryFolder) {
      await db.runAsync(`INSERT INTO folders (name)
                         VALUES ('日记')`);
    }
    
    // AI 对话相关
    // 对话历史表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS conversations
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at TEXT DEFAULT NULL
        );
    `);
    
    // 消息表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS messages
        (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role            TEXT    NOT NULL,
            thought         TEXT,
            content         TEXT    NOT NULL,
            created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at      TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at      TEXT DEFAULT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
        );
    `);
    
    // 储物表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS storage
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            category   TEXT NOT NULL,
            icon       TEXT,
            name       TEXT NOT NULL,
            price      REAL,
            detail     TEXT,
            image      TEXT,
            start_date TEXT DEFAULT CURRENT_TIMESTAMP,
            end_date   TEXT DEFAULT CURRENT_TIMESTAMP,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at TEXT DEFAULT NULL
        );
    `);
    
    // 网盘配置表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cloud_drive_config
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            drive_type TEXT    NOT NULL DEFAULT 'nutstore', /* 默认 nutstore(坚果云盘) */
            account    TEXT    NOT NULL, /* 账号 */
            credential TEXT    NOT NULL, /* 密码或Token */
            root_path  TEXT    NOT NULL DEFAULT 'RNExpoDiaryApp', /* 云盘存储路径 */
            created_at TEXT             DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT             DEFAULT CURRENT_TIMESTAMP,
            deleted_at TEXT             DEFAULT NULL,
            FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
        );
    `);
    
    // 同步状态表
    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sync_checkpoint
        (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER NOT NULL,
            drive_id        INTEGER NOT NULL,
            path            TEXT    NOT NULL, /* 云端目录，例如 RNExpoDiaryApp */
            last_sync_time  TEXT DEFAULT '1970-01-01T00:00:00Z',
            last_sync_token TEXT, /* WebDAV的etag，或远端清单版本号 */
            sync_status     TEXT DEFAULT 'idle', /* idle / syncing / failed */
            error_message   TEXT, /* 最近一次错误 */
            create_at      TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at      TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at      TEXT DEFAULT NULL, /* 软删除字段，NULL表示未删除 */
            FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE,
            FOREIGN KEY (drive_id) REFERENCES cloud_drive_config (id) ON DELETE CASCADE,
            UNIQUE (drive_id, path)
        );
    `);
    
    return db;
  })();
  
  return dbPromise;
}