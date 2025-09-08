import { getDB } from './index';

/**
 * 获取当前用户ID，单用户场景下默认返回1
 * @returns {Promise<number>} 当前用户ID
 */
export async function getCurrentUserId() {
  const db = await getDB();
  const user = await db.getFirstAsync(`SELECT id FROM user LIMIT 1`);
  return user?.id || 1;
}