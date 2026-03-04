/**
 * 命名转换工具，处理下划线和驼峰命名的相互转换
 */

/**
 * 将下划线命名转换为驼峰命名
 * @param {string} str - 下划线命名字符串
 * @returns {string} 驼峰命名字符串
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * 将驼峰命名转换为下划线命名
 * @param {string} str - 驼峰命名字符串
 * @returns {string} 下划线命名字符串
 */
export function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 将对象的所有键从下划线命名转换为驼峰命名
 * @param {Object} obj - 包含下划线命名键的对象
 * @returns {Object} 包含驼峰命名键的对象
 */
export function snakeToCamelObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[snakeToCamel(key)] = obj[key];
    }
  }
  return result;
}

/**
 * 将对象的所有键从驼峰命名转换为下划线命名
 * @param {Object} obj - 包含驼峰命名键的对象
 * @returns {Object} 包含下划线命名键的对象
 */
export function camelToSnakeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[camelToSnake(key)] = obj[key];
    }
  }
  return result;
}
