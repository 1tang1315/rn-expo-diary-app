import * as SQLite from "expo-sqlite";

let dbPromise = null;

export async function getDB() {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = (async () => {
        const db = await SQLite.openDatabaseAsync('RNExpoDiaryApp');

        await db.execAsync(`PRAGMA journal_mode = WAL;`);

        // await db.execAsync(`DROP TABLE IF EXISTS event;`);
        // await db.execAsync(`DROP TABLE IF EXISTS folders;`);
        // await db.execAsync(`DROP TABLE IF EXISTS notes;`);
        // await db.execAsync(`DROP TABLE IF EXISTS conversations;`);
        // await db.execAsync(`DROP TABLE IF EXISTS messages;`);
        // await db.execAsync(`DROP TABLE IF EXISTS storage;`);

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
            time_kind      TEXT, /* instant | interval；NULL 视为 interval */
            extras         TEXT, /* JSON object */
            images         TEXT, /* JSON string array of relative keys */
            created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at     TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at     TEXT DEFAULT NULL /* 软删除字段，NULL表示未删除 */
        );
    `);

        const eventAlters = [
            'ALTER TABLE event ADD COLUMN time_kind TEXT',
            'ALTER TABLE event ADD COLUMN extras TEXT',
            'ALTER TABLE event ADD COLUMN images TEXT',
        ];
        for (const sql of eventAlters) {
            try {
                await db.execAsync(sql);
            } catch (e) {
                const msg = String(e?.message || e);
                if (!msg.includes('duplicate column')) {
                    throw e;
                }
            }
        }

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
        if (!diaryFolder) {
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
            end_date   TEXT DEFAULT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            deleted_at TEXT DEFAULT NULL
        );
    `);

        // 每日 AI 行为分析缓存表（结构化字段）
        await db.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_analysis
        (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            date               TEXT NOT NULL UNIQUE, /* YYYY-MM-DD */
            ai_text            TEXT, /* 原始 AI 文本 */
            total_score        INTEGER DEFAULT 0,
            total_text         TEXT, /* 综合评估文本 */
            sleep_score        INTEGER DEFAULT 0,
            sleep_text         TEXT, /* 睡眠分析文本 */
            diet_score         INTEGER DEFAULT 0,
            diet_text          TEXT, /* 饮食分析文本 */
            exercise_score     INTEGER DEFAULT 0,
            exercise_text      TEXT, /* 运动分析文本 */
            efficiency_score   INTEGER DEFAULT 0,
            efficiency_text    TEXT, /* 效率分析文本 */
            balance_score      INTEGER DEFAULT 0,
            balance_text       TEXT, /* 生活平衡文本 */
            emotion_score      INTEGER DEFAULT 0,
            emotion_text       TEXT, /* 情绪状态文本 */
            overall_summary    TEXT, /* 整体总结 */
            event_hash         TEXT, /* 事件数据版本，如：22_23:57 */
            created_at         TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at         TEXT DEFAULT CURRENT_TIMESTAMP
        );
    `);

        return db;
    })();

    return dbPromise;
}