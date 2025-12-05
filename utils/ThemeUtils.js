/**
 * 解析CSS式的padding/margin值（支持1-4个值）
 * @param {string|number} value - 类似CSS的box值（如 "10"、"10 20"、"10 20 30"、"10 20 30 40"）
 * @returns {object} 对应RN的top/right/bottom/left样式对象
 */
export const parseBoxValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  
  // 统一转为字符串并分割，过滤无效值
  const vals = String(value)
    .split(/\s+/)
    .map(v => Number(v))
    .filter(v => !isNaN(v));
  
  switch (vals.length) {
    case 1: return { top: vals[0], right: vals[0], bottom: vals[0], left: vals[0] };
    case 2: return { top: vals[0], right: vals[1], bottom: vals[0], left: vals[1] };
    case 3: return { top: vals[0], right: vals[1], bottom: vals[2], left: vals[1] };
    case 4: return { top: vals[0], right: vals[1], bottom: vals[2], left: vals[3] };
    default: return null;
  }
};

/**
 * 生成RN的box样式（padding/margin）
 * @param {string} type - 类型：'padding' 或 'margin'
 * @param {string|number} value - 解析的值
 * @returns {object} RN样式对象
 */
export const getBoxStyles = (type, value) => {
  const parsed = parseBoxValue(value);
  if (!parsed) return {};
  
  return {
    [`${type}Top`]: parsed.top,
    [`${type}Right`]: parsed.right,
    [`${type}Bottom`]: parsed.bottom,
    [`${type}Left`]: parsed.left,
  };
};