import { getDB } from './index';
import { formatDate } from "@/utils/formatTimeUtils";

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
 * 根据日期或日期范围获取所有事件，包括跨天事件
 * (只要结束时间还在用户传入的开始时间内就会被返回)
 * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {string} [endDate] - 可选，结束日期，格式：YYYY-MM-DD
 * @returns {Promise<Array>} 事件对象数组
 */
export async function getEventsByDateRange(startDate, endDate) {
  // 格式化日期参数
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate) || formattedStartDate;
  
  const db = await getDB();

  // 事件开始于查询范围内，或结束于查询范围内，或完全覆盖查询范围
  return  await db.getAllAsync(
    `SELECT * FROM event
     WHERE
        -- 事件开始在查询范围内
         (DATE(start_datetime) BETWEEN ? AND ?)
        OR
        -- 事件结束在查询范围内
         (DATE(end_datetime) BETWEEN ? AND ?)
        OR
        -- 事件开始在查询范围前且结束在查询范围后（完全覆盖）
         (DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?)
     ORDER BY start_datetime`,
    // 参数按查询条件顺序传递
    [formattedStartDate, formattedEndDate,
     formattedStartDate, formattedEndDate,
     formattedStartDate, formattedEndDate]
  );
}

/**
 * 根据日期和分类获取事件
 * @param {string} date - 日期，格式：YYYY-MM-DD
 * @param {string} category - 事件分类
 * @returns {Promise<Array>} 事件对象数组
 */
export async function getEventsByDateAndCategory(date, category) {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM event
     WHERE DATE(start_datetime) = ? AND category = ?
     ORDER BY start_datetime`,
    [date, category]
  );
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
 * 更新事件的状态字段
 * @param {number} id - 事件ID
 * @param {string} newStatus - 新的状态值（如 'completed'/'inProgress' 等）
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateEventStatus(id, newStatus) {
  // 状态值合法性校验（避免无效状态写入数据库）
  const validStatus = ['planned', 'completed', 'canceled', 'inProgress', 'upcoming', 'early', 'notCompleted'];
  if (!validStatus.includes(newStatus)) {
    throw new Error(`无效的事件状态: ${newStatus}，仅允许：${validStatus.join(', ')}`);
  }
  
  const db = await getDB();
  const result = await db.runAsync(
    `UPDATE event SET status = ? WHERE id = ?`,
    [newStatus, id]
  );
  
  return result.changes > 0; // 有数据修改则返回 true
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