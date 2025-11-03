import { getDB } from '@/db/index';
import { formatDate, getLocalDateTimeByDayjs } from "@/utils/formatTimeUtils";
import { deleteLocalImage } from "@/db/imageDB";

/**
 * 创建新储物项
 * @param {Object} item - 储物项对象
 * @param {string} item.category - 物品分类（必填）
 * @returns {Promise<Object>} 新创建的储物项对象
 */
export async function createStorageItem(item) {
  const {
    name,
    category,
    icon,
    price,
    detail,
    image,
    startDate: start_date,
    endDate: end_date
  } = item;

  const db = await getDB();
  const localNow = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `INSERT INTO storage
     (name, category, icon, price, detail, image, start_date, end_date, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, category, icon, price, detail, image, start_date, end_date, localNow]
  );
  
  // 返回新创建的储物项
  return getStorageItemById(result.lastInsertRowId);
}

/**
 * 根据ID获取储物项
 * @param {number} id - 储物项ID
 * @returns {Promise<Object|null>} 储物项对象
 */
export async function getStorageItemById(id) {
  const db = await getDB();
  const result = await db.getAllAsync(
    'SELECT * FROM storage WHERE id = ? AND deleted_at IS NULL',
    [id]
  );
  return result.length > 0 ? result[0] : null;
}

/**
 * 获取所有储物项
 * @param {'asc' | 'desc'} [sortOrder='asc'] - 排序方向，默认为升序
 * @param {string} [sortField='name'] - 排序字段
 * @returns {Promise<Array>} 储物项对象数组（包含category字段）
 */
export async function getAllStorageItems(sortOrder = 'asc', sortField = 'name') {
  // 验证排序字段是否合法
  const validFields = ['name', 'category', 'price', 'start_date', 'end_date'];
  const finalSortField = validFields.includes(sortField) ? sortField : 'name';
  
  // 验证排序方向
  const finalSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'asc';
  
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM storage
     WHERE deleted_at IS NULL
     ORDER BY ${finalSortField} ${finalSortOrder}`,
  );
}

/**
 * 根据日期范围获取储物项
 * @param {string} startDate - 开始日期，格式：YYYY-MM-DD
 * @param {string} [endDate] - 可选，结束日期，格式：YYYY-MM-DD
 * @param {'asc' | 'desc'} [sortOrder='asc'] - 排序方向，默认为升序
 * @returns {Promise<Array>} 储物项对象数组
 */
export async function getStorageItemsByDateRange(startDate, endDate, sortOrder = 'asc') {
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate) || formattedStartDate;
  
  const validSortOrders = ['asc', 'desc'];
  const finalSortOrder = validSortOrders.includes(sortOrder.toLowerCase())
    ? sortOrder.toLowerCase()
    : 'asc';
  
  const db = await getDB();
  
  // 查询在日期范围内的储物项
  const sql = `
    SELECT *
    FROM storage
    WHERE
      deleted_at IS NULL
      AND (
        (DATE(start_date) BETWEEN ? AND ?)
        OR
        (DATE(end_date) BETWEEN ? AND ?)
        OR
        (DATE(start_date) <= ? AND DATE(end_date) >= ?)
      )
    ORDER BY start_date ${finalSortOrder}
  `;
  
  return await db.getAllAsync(
    sql,
    [
      formattedStartDate, formattedEndDate,
      formattedStartDate, formattedEndDate,
      formattedStartDate, formattedEndDate
    ]
  );
}

/**
 * 按名称、详情和分类搜索储物项
 * @param {string} keyword - 搜索关键词
 * @returns {Promise<Array>} 匹配的储物项数组
 */
export async function searchStorageItems(keyword) {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT *,
            CASE
                WHEN name = ? THEN 1
                WHEN name LIKE ? THEN 2
                WHEN name LIKE ? THEN 3
                WHEN category = ? THEN 4
                WHEN category LIKE ? THEN 5
                WHEN detail = ? THEN 6
                WHEN detail LIKE ? THEN 7
                WHEN detail LIKE ? THEN 8
                ELSE 9
                END AS search_priority
     FROM storage
     WHERE
         deleted_at IS NULL
       AND (name LIKE ? OR detail LIKE ? OR category LIKE ?)  -- 新增：搜索分类
     ORDER BY search_priority ASC, name ASC`,
    [
      keyword,                   // 名称完全匹配
      `${keyword}%`,             // 名称以关键词开头
      `%${keyword}%`,            // 名称包含关键词
      keyword,                   // 分类完全匹配（新增）
      `%${keyword}%`,            // 分类包含关键词（新增）
      keyword,                   // 详情完全匹配
      `${keyword}%`,             // 详情以关键词开头
      `%${keyword}%`,            // 详情包含关键词
      `%${keyword}%`,            // WHERE子句的名称匹配
      `%${keyword}%`,            // WHERE子句的详情匹配
      `%${keyword}%`             // WHERE子句的分类匹配（新增）
    ]
  );
}

/**
 * 更新储物项
 * @param {number} id - 储物项ID
 * @param {Object} updates - 要更新的字段
 * @param {string} [updates.category] - 可选，物品分类
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateStorageItem(id, updates) {
  const {
    name,
    category,
    icon,
    price,
    detail,
    image,
    startDate: start_date,
    endDate: end_date,
  } = updates;
  
  const db = await getDB();
  const localNow = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `UPDATE storage
     SET name = ?,
         category = ?,
         icon = ?,
         price = ?,
         detail = ?,
         image = ?,
         start_date = ?,
         end_date = ?,
         updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [name, category, icon, price, detail, image, start_date, end_date, localNow, id]
  );
  
  return result.changes > 0;
}

/**
 * 软删除储物项
 * @param {number} id - 储物项ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteStorageItem(id) {
  const db = await getDB();
  const localNow = getLocalDateTimeByDayjs();
  
  // 先查询该储物项的图片路径
  const storageItem = await getStorageItemById(id);
  const imagePath = storageItem?.imagePath;
  
  // 执行软删除（更新删除时间和更新时间）
  const result = await db.runAsync(
    `UPDATE storage
     SET deleted_at = ?,
         updated_at = ?
     WHERE id = ?
       AND deleted_at IS NULL`,
    [localNow, localNow, id]
  );
  
  // 如果存在图片路径，删除本地图片
  if (imagePath) {
    await deleteLocalImage(imagePath);
  }
  
  return result.changes > 0;
}
