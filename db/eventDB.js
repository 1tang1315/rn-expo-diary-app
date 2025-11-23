import { getDB } from './index';
import { formatDate, getLocalDateTimeByDayjs } from "@/utils/formatTimeUtils";

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
  const localNow = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `INSERT INTO event
     (start_datetime, end_datetime, title, category, description, status, icon, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [start_datetime, end_datetime, title, category, description, status, icon, localNow]
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
 * @param {'asc' | 'desc'} [sortOrder='desc'] - 可选，排序方向。'asc' 表示升序（从早到晚），'desc' 表示降序（从晚到早）。默认为 'desc'。
 * @returns {Promise<Array>} 事件对象数组
 */
export async function getEventsByDateRange(startDate, endDate, sortOrder = 'desc') {
  // 格式化日期参数
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate) || formattedStartDate;
  
  // 校验排序方向参数
  const validSortOrders = ['asc', 'desc'];
  const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'desc'; // 如果传入无效值，则使用默认的 'desc'
  
  const db = await getDB();
  
  // 事件开始于查询范围内，或结束于查询范围内，或完全覆盖查询范围
  const sql = `
    SELECT *
    FROM event
    WHERE
      deleted_at IS NULL
      AND (
        (DATE(start_datetime) BETWEEN ? AND ?)
        OR
        (DATE(end_datetime) BETWEEN ? AND ?)
        OR
        (DATE(start_datetime) <= ? AND DATE(end_datetime) >= ?)
      )
    ORDER BY start_datetime ${finalSortOrder}
  `;
  
  return await db.getAllAsync(
    sql,
    // 参数按查询条件顺序传递
    [
      formattedStartDate, formattedEndDate,
      formattedStartDate, formattedEndDate,
      formattedStartDate, formattedEndDate
    ]
  );
}

/**
 * 按标题和详情模糊搜索事件（排除已删除，按匹配度和开始时间排序）
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array>} 匹配的事件数组
 */
export async function getEventsByTitleOrDescriptionSearch(keyword) {
  const db = await getDB();
  // 改进权重计算，优先完全匹配、开头匹配和更精确的匹配
  return await db.getAllAsync(
    `SELECT *,
       CASE
         -- 标题完全匹配权重最高
         WHEN title = ? THEN 1
         -- 标题以关键词开头
         WHEN title LIKE ? THEN 2
         -- 标题包含关键词
         WHEN title LIKE ? THEN 3
         -- 描述完全匹配
         WHEN description = ? THEN 4
         -- 描述以关键词开头
         WHEN description LIKE ? THEN 5
         -- 描述包含关键词
         WHEN description LIKE ? THEN 6
         ELSE 7
         END AS search_priority
     FROM event
     WHERE
       deleted_at IS NULL
       AND (title LIKE ? OR description LIKE ?)
     -- 先按匹配优先级，再按开始时间倒序
     ORDER BY search_priority ASC, start_datetime DESC`,
    [
      keyword,                   // 标题完全匹配
      `${keyword}%`,             // 标题以关键词开头
      `%${keyword}%`,            // 标题包含关键词
      keyword,                   // 描述完全匹配
      `${keyword}%`,             // 描述以关键词开头
      `%${keyword}%`,            // 描述包含关键词
      `%${keyword}%`,            // 用于WHERE子句的标题匹配
      `%${keyword}%`             // 用于WHERE子句的描述匹配
    ]
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
  const localNow = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `UPDATE event
     SET start_datetime = ?,
         end_datetime   = ?,
         title          = ?,
         category       = ?,
         description    = ?,
         status         = ?,
         icon           = ?,
         updated_at     = ?
     WHERE id = ?`,
    [start_datetime, end_datetime, title, category, description, status, icon, localNow, id]
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
  if(!validStatus.includes(newStatus)) {
    throw new Error(`无效的事件状态: ${newStatus}，仅允许：${validStatus.join(', ')}`);
  }
  
  const db = await getDB();
  const localNow = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `UPDATE event
     SET status     = ?,
         updated_at = ?
     WHERE id = ?`,
    [newStatus, localNow, id]
  );
  
  return result.changes > 0; // 有数据修改则返回 true
}

/**
 * 软删除事件
 * @param {number} id - 事件ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteEvent(id) {
  const db = await getDB();
  const localNow = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `UPDATE event
     SET deleted_at = ?,
         updated_at = ?
     WHERE id = ?
       AND deleted_at IS NULL`,
    [localNow, localNow, id]
  );
  // 通过受影响的行数判断是否删除成功
  return result.changes > 0;
}

/**
 * 获取指定分类下的常用标题（按使用次数排序，排除空标题）
 * @param {string} category - 事件分类
 * @param {number} limit - 最多返回数量，默认10个
 * @returns {Promise<Array<string>>} 常用标题数组
 */
export async function getCommonTitlesByCategory(category, limit = 5) {
  const db = await getDB();
  const result = await db.getAllAsync(
    `SELECT title, COUNT(title) AS useCount
     FROM event
     WHERE title IS NOT NULL
       AND title != '' AND category = ? AND deleted_at IS NULL
     GROUP BY title
     ORDER BY useCount DESC LIMIT ?`,
    [category, limit]
  );
  return result.map(item => item.title);
}