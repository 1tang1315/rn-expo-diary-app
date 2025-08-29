import { getDB } from './db';

/**
 * 创建新事件
 * @param {Object} event - 事件对象
 * @returns {Promise<Object>} 新创建的事件对象
 */
export async function createEvent(event) {
  const {
    start_datetime,  // 格式：YYYY-MM-DD HH:MM
    end_datetime,    // 格式：YYYY-MM-DD HH:MM
    title,
    category,
    description,
    status,
    icon
  } = event;
  
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO event
     (start_datetime, end_datetime, title, category, description, status, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [start_datetime, end_datetime, title, category, description, status, icon]
  );
  
  // 返回新创建的事件
  return getEventById(result.lastInsertRowId);
}

/**
 * 根据ID获取事件
 * @param {number} id - 事件ID
 * @returns {Promise<Object|null>} 事件对象或null
 */
export async function getEventById(id) {
  const db = await getDB();
  const result = await db.getAllAsync(
    'SELECT * FROM event WHERE id = ?',
    [id]
  );
  return result.length > 0 ? result[0] : null;
}

/**
 * 根据日期获取所有事件
 * @param {string} date - 日期，格式：YYYY-MM-DD
 * @returns {Promise<Array>} 事件对象数组
 */
export async function getEventsByDate(date) {
  const db = await getDB();
  // 查找开始时间在指定日期的事件
  const result = await db.getAllAsync(
    `SELECT * FROM event
     WHERE DATE(start_datetime) = ?
     ORDER BY start_datetime`,
    [date]
  );
  return result;
}

/**
 * 根据日期和分类获取事件
 * @param {string} date - 日期，格式：YYYY-MM-DD
 * @param {string} category - 事件分类
 * @returns {Promise<Array>} 事件对象数组
 */
export async function getEventsByDateAndCategory(date, category) {
  const db = await getDB();
  const result = await db.getAllAsync(
    `SELECT * FROM event
     WHERE DATE(start_datetime) = ? AND category = ?
     ORDER BY start_datetime`,
    [date, category]
  );
  return result;
}

/**
 * 更新事件
 * @param {number} id - 事件ID
 * @param {Object} updates - 要更新的字段
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateEvent(id, updates) {
  const {
    start_datetime,
    end_datetime,
    title,
    category,
    description,
    status,
    icon
  } = updates;
  
  const db = await getDB();
  const result = await db.runAsync(
    `UPDATE event SET
     start_datetime = ?, end_datetime = ?, title = ?,
     category = ?, description = ?, status = ?, icon = ?
     WHERE id = ?`,
    [start_datetime, end_datetime, title, category, description, status, icon, id]
  );
  
  return result.changes > 0;
}

/**
 * 删除事件
 * @param {number} id - 事件ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteEvent(id) {
  const db = await getDB();
  const result = await db.runAsync(
    'DELETE FROM event WHERE id = ?',
    [id]
  );
  return result.changes > 0;
}

/**
 * 获取跨天事件（开始日期和结束日期不同的事件）
 * @returns {Promise<Array>} 跨天事件数组
 */
export async function getCrossDayEvents() {
  const db = await getDB();
  const result = await db.getAllAsync(
    `SELECT * FROM event
     WHERE DATE(start_datetime) != DATE(end_datetime)
     ORDER BY start_datetime`
  );
  return result;
}

/**
 * 获取指定分类下的常用标题（按使用次数排序，排除空标题）
 * @param {string} category - 事件分类
 * @param {number} limit - 最多返回数量，默认5个
 * @returns {Promise<Array<string>>} 常用标题数组
 */
export async function getCommonTitlesByCategory(category, limit = 5) {
  const db = await getDB();
  const result = await db.getAllAsync(
    `SELECT title, COUNT(title) AS useCount
     FROM event
     WHERE title IS NOT NULL AND title != '' AND category = ?
     GROUP BY title
     ORDER BY useCount DESC
     LIMIT ?`,
    [category, limit]
  );
  return result.map(item => item.title);
}