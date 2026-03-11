/**
 * 获取当前用户ID，单用户场景下默认返回1
 * @returns {Promise<number>} 当前用户ID
 */
export async function getCurrentUserId() {
  // 由于移除了用户表，直接返回默认用户ID 1
  return 1;
}