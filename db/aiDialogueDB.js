import { getDB } from "@/db/index";
import { getLocalDateTimeByDayjs } from "@/utils/formatTimeUtils";

/**
 * 创建一个新对话
 * @param {Object} conversationData - 对话数据
 * @param {string} conversationData.title - 对话标题 (必填)
 * @returns {Promise<number>} 新创建的对话ID
 */
export async function createConversation(conversationData) {
  const { title } = conversationData;
  if (!title) {
    throw new Error("对话标题不能为空");
  }
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `INSERT INTO conversations
    (title, created_at, updated_at) VALUES (?, ?, ?)`,
    [title, now, now]
  );
  return result.lastInsertRowId;
}

/**
 * 获取所有对话
 * @returns {Promise<Array<Object>>} 对话列表，按更新时间降序排序
 */
export async function getAllConversations() {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM conversations ORDER BY updated_at DESC`
  );
}

/**
 * 更新对话标题
 * @param {number} conversationId - 对话ID
 * @param {Object} updates - 需要更新的数据
 * @param {string} updates.title - 新标题
 * @returns {Promise<boolean>} 是否更新成功
 */
export async function updateConversation(conversationId, updates) {
  const { title } = updates;
  
  if (title === undefined) {
    return true;
  }
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();
  
  const result = await db.runAsync(
    `UPDATE conversations SET
      title = ?,
      updated_at = ?
      WHERE id = ?`,
    [title, now, conversationId]
  );
  
  return result.changes > 0;
}

/**
 * 硬删除对话 (将同时删除关联的消息，因为有 ON DELETE CASCADE)
 * @param {number} conversationId - 对话ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteConversation(conversationId) {
  const db = await getDB();
  const result = await db.runAsync(
    `DELETE FROM conversations WHERE id = ?`,
    [conversationId]
  );
  return result.changes > 0;
}

// --- 消息 (Messages) 相关操作 ---
/**
 * 添加一条新消息
 * @param {Object} messageData - 消息数据
 * @param {number} messageData.conversation_id - 所属对话ID (必填)
 * @param {string} messageData.role - 发送者角色, e.g., 'user' or 'assistant' (必填)
 * @param {string} messageData.content - 消息内容 (必填)
 * @returns {Promise<void>} 新创建的消息ID
 */
export async function createMessage(messageData) {
  const { conversation_id, role, content } = messageData;
  if (!conversation_id || !role || !content) {
    throw new Error("对话ID、角色和消息内容不能为空");
  }
  
  const db = await getDB();
  const now = getLocalDateTimeByDayjs();

  return await db.withTransactionAsync(async () => {
    // 插入新消息
    const messageResult = await db.runAsync(
      `INSERT INTO messages
      (conversation_id, role, content, created_at)
      VALUES (?, ?, ?, ?)`,
      [conversation_id, role, content, now]
    );
    
    await db.runAsync(
      `UPDATE conversations SET updated_at = ? WHERE id = ?`,
      [now, conversation_id]
    );
    
    return messageResult.lastInsertRowId;
  });
}

/**
 * 获取特定对话的所有消息
 * @param {number} conversationId - 对话ID
 * @returns {Promise<Array<Object>>} 消息列表，按创建时间升序排列
 */
export async function getMessagesForConversation(conversationId) {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`,
    [conversationId]
  );
}

/**
 * 根据ID获取消息
 * @param {number} messageId - 消息ID
 * @returns {Promise<Object|null>} 消息对象或null
 */
export async function getMessageById(messageId) {
  const db = await getDB();
  return await db.getFirstAsync(
    `SELECT * FROM messages WHERE id = ?`,
    [messageId]
  );
}

/**
 * 硬删除一条消息
 * @param {number} messageId - 消息ID
 * @returns {Promise<boolean>} 是否删除成功
 */
export async function deleteMessage(messageId) {
  const db = await getDB();
  const deletedMessage = await getMessageById(messageId);
  
  const result = await db.runAsync(
    `DELETE FROM messages WHERE id = ?`,
    [messageId]
  );
  if(result.changes > 0) {
    const now = getLocalDateTimeByDayjs();
    
    await db.runAsync(
      `UPDATE conversations SET
          updated_at = ?
       WHERE id = ?`,
      [now, deletedMessage.conversation_id]
    );
  }
  return result.changes > 0;
}

/**
 * 清空一个对话中的所有消息 (硬删除)
 * @param {number} conversationId - 对话ID
 * @returns {Promise<boolean>} 是否清空成功
 */
export async function clearMessagesInConversation(conversationId) {
  const db = await getDB();
  
  return await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      `DELETE FROM messages WHERE conversation_id = ?`,
      [conversationId]
    );
    
    if (result.changes > 0) {
      const now = getLocalDateTimeByDayjs();
      await db.runAsync(
        `UPDATE conversations SET updated_at = ? WHERE id = ?`,
        [now, conversationId]
      );
    }
    
    return result.changes > 0;
  });
}