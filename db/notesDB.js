import { getDB } from './index';
import { getLocalDateTimeByDayjs } from "@/utils/formatTimeUtils";

/**
 * 创建一个新文件夹
 * @param {Object} folderData - 文件夹数据
 * @param {string} folderData.name - 文件夹名称 (必填)
 * @param {number} [folderData.sort_order=0] - 排序顺序
 * @returns {Promise<number>} 新创建的文件夹ID
 */
export async function createFolder(folderData) {
  const { name, sort_order = 0 } = folderData;
  if (!name) {
    throw new Error("文件夹名称不能为空");
  }
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `INSERT INTO folders (name, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    [name, sort_order, now, now]
  );
  return result.lastInsertRowId;
}

/**
 * 获取所有未删除的文件夹
 * @returns {Promise<Array<Object>>} 文件夹列表，按 sort_order 和 name 排序
 */
export async function getAllFolders() {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM folders
     WHERE deleted_at IS NULL
     ORDER BY sort_order ASC, name ASC`
  );
}

/**
 * 根据ID获取文件夹
 * @param {number} folderId - 文件夹ID
 * @returns {Promise<Object|null>} 文件夹对象或null
 */
export async function getFolderById(folderId) {
  const db = await getDB();
  return await db.getFirstAsync(
    `SELECT * FROM folders
     WHERE id = ? AND deleted_at IS NULL`,
    [folderId]
  );
}

/**
 * 更新文件夹信息
 * @param {number} folderId - 文件夹ID
 * @param {Object} updates - 需要更新的数据
 * @param {string} [updates.name] - 新名称
 * @param {number} [updates.sort_order] - 新的排序顺序
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateFolder(folderId, updates) {
  const { name, sort_order } = updates;
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `UPDATE folders
     SET name = ?,
         sort_order = ?,
         updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [name, sort_order, now, folderId]
  );

  return result.changes > 0;
}

/**
 * 软删除文件夹 (如果文件夹不为空，由于外键约束 ON DELETE RESTRICT，操作将失败)
 * @param {number} folderId - 文件夹ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteFolder(folderId) {
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  const result = await db.runAsync(
    `UPDATE folders SET
      deleted_at = ?
      WHERE id = ?
      AND deleted_at IS NULL`,
    [now, folderId]
  );
  return result.changes > 0;
}

/**
 * 检查文件夹是否为空（即没有任何未删除的笔记）
 * @param {number} folderId - 文件夹ID
 * @returns {Promise<boolean>} 如果为空则返回 true，否则返回 false
 */
export async function isFolderEmpty(folderId) {
  const db = await getDB();
  const count = await db.getFirstAsync(
    `SELECT COUNT(*) as count FROM notes
     WHERE folder_id = ? AND deleted_at IS NULL`,
    [folderId]
  );
  return count.count === 0;
}

/**
 * 创建一条新笔记
 * @param {Object} noteData - 笔记数据
 * @param {number|null} [noteData.folder_id] - 所属文件夹ID (可选，为null时表示未分类)
 * @param {string} noteData.title - 笔记标题 (必填)
 * @param {string} noteData.content - 笔记内容 (必填)
 * @returns {Promise<number>} 新创建的笔记ID
 */
export async function createNote(noteData) {
  const { folder_id, title, content } = noteData;
  
  // 只校验 title 和 content 是必填的
  if (!title || !content) {
    throw new Error("标题和内容不能为空");
  }
  
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `INSERT INTO notes (folder_id, title, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [folder_id, title, content, now, now]
  );
  return result.lastInsertRowId;
}

/**
 * 获取系统中所有未删除的笔记
 * @returns {Promise<Array<Object>>} 所有笔记的列表，按更新时间倒序排列
 */
export async function getAllNotes() {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM notes
     WHERE deleted_at IS NULL
     ORDER BY updated_at DESC`
  );
}

/**
 * 获取指定文件夹下的所有笔记（支持获取未分类笔记）
 * @param {number|null} folderId - 文件夹ID。传入 `null` 则获取所有未分类的笔记。
 * @returns {Promise<Array<Object>>} 笔记列表，按更新时间倒序排列
 */
export async function getNotesByFolderId(folderId) {
  if (folderId !== null && (typeof folderId !== 'number' || folderId <= 0)) {
    throw new Error("无效的 folderId，必须是正整数或 null");
  }
  
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM notes
     WHERE folder_id = ? AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
    [folderId]
  );
}

/**
 * 根据ID获取笔记
 * @param {number} noteId - 笔记ID
 * @returns {Promise<Object|null>} 笔记对象或null
 */
export async function getNoteById(noteId) {
  const db = await getDB();
  return await db.getFirstAsync(
    `SELECT * FROM notes
     WHERE id = ? AND deleted_at IS NULL`,
    [noteId]
  );
}

/**
 * 更新笔记
 * @param {number} noteId - 笔记ID
 * @param {Object} updates - 需要更新的数据
 * @param {string} [updates.title] - 新标题
 * @param {string} [updates.content] - 新内容
 * @param {number} [updates.folder_id] - 新的所属文件夹ID
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateNote(noteId, updates) {
  const { title, content, folder_id } = updates;
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `UPDATE notes
     SET title = ?,
         content = ?,
         folder_id = ?,
         created_at = ?,
         updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [title, content, folder_id, now, now, noteId]
  );
  
  return result.changes > 0;
}

/**
 * 软删除笔记
 * @param {number} noteId - 笔记ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteNote(noteId) {
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  const result = await db.runAsync(
    `UPDATE notes SET
        deleted_at = ?
     WHERE id = ?
       AND deleted_at IS NULL`,
    [now, noteId]
  );
  return result.changes > 0;
}

/**
 * 批量软删除笔记
 * @param {number[]} noteIds - 笔记ID数组
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteNotes(noteIds) {
  if (!noteIds || noteIds.length === 0) {
    return false;
  }
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  // 生成与ID数量匹配的占位符 (?, ?, ...)
  const placeholders = noteIds.map(() => '?').join(',');
  
  const result = await db.runAsync(
    `UPDATE notes SET
      deleted_at = ?
      WHERE id IN (${placeholders})
      AND deleted_at IS NULL`,
    [now, ...noteIds] // 第一个参数是当前时间，后面跟所有要删除的ID
  );
  
  return result.changes > 0;
}

/**
 * 获取所有文件夹及其包含的笔记数量
 * @returns {Promise<Array<Object>>} 包含文件夹信息和 note_count 的对象列表
 */
export async function getFoldersWithNoteCount() {
  const db = await getDB();
  return await db.getAllAsync(`
    SELECT
     f.*,
     (SELECT COUNT(*) FROM notes
       n WHERE n.folder_id = f.id
       AND n.deleted_at IS NULL
     ) as note_count
    FROM
      folders f
    WHERE
      f.deleted_at IS NULL
    ORDER BY
      f.sort_order ASC, f.name ASC
  `);
}

/**
 * 搜索笔记（按标题和内容）
 * @param {string} query - 搜索关键词
 * @param {number|null} [folderId=null] - 可选，指定文件夹ID进行搜索
 * @returns {Promise<Array<Object>>} 匹配的笔记列表
 */
export async function searchNotes(query, folderId = null) {
  const db = await getDB();
  const searchTerm = `%${query}%`; // 用于 LIKE 搜索
  
  let sql = `
    SELECT * FROM notes
    WHERE (title LIKE ? OR content LIKE ?) AND deleted_at IS NULL
  `;
  const params = [searchTerm, searchTerm];
  
  if (folderId !== null) {
    sql += ' AND folder_id = ?';
    params.push(folderId);
  }
  
  sql += ' ORDER BY updated_at DESC';
  
  return await db.getAllAsync(sql, params);
}

export const checkDiaryExists = async (dateStr) => {
  const db = await getDB();
  const result = await db.getFirstAsync(
    `SELECT id FROM notes
     WHERE title = ?
       AND folder_id = (SELECT id FROM folders
         WHERE name = '日记'
         AND deleted_at IS NULL
       )
       AND deleted_at IS NULL`,
    [`${dateStr}`]
  );
  return !!result;
};