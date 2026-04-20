/**
 * 将任意输入转换为“有限数值”（finite number）。
 *
 * - 若 value 本身是 number，则直接使用
 * - 否则尝试使用 Number(value) 转换
 * - 若转换结果不是有限数（NaN / Infinity / -Infinity），则返回 fallback
 *
 * @param {*} value 待转换的值（number/string/undefined 等）
 * @param {number} fallback 转换失败时的兜底值，默认 0
 * @returns {number} 有限数值
 */
export function toFiniteNumber(value, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 将任意输入转换为“非负的有限数值”。
 *
 * - 先用 toFiniteNumber 做 finite 兜底
 * - 再将负数裁剪为 0（避免图表出现负高度/负半径等异常）
 *
 * @param {*} value 待转换的值
 * @param {number} fallback 转换失败时的兜底值，默认 0
 * @returns {number} 非负的有限数值
 */
export function toNonNegativeFiniteNumber(value, fallback = 0) {
  return Math.max(0, toFiniteNumber(value, fallback));
}

/**
 * 规范化图表数据，保证绘制过程中不会因为 NaN/Infinity 导致 SVG 崩溃。
 *
 * - 保留原对象的其它字段（比如 color、useCount 等）
 * - 强制保证：
 *   - value：非负有限数（NaN/Infinity/负数都会被兜底/裁剪）
 *   - label：字符串（null/undefined 会变成空串）
 *
 * @param {Array} data 原始数据数组，元素形如 { label, value, ... }
 * @returns {Array} 规范化后的数据数组（若入参不是数组则返回空数组）
 */
export function normalizeChartData(data = []) {
  if (!Array.isArray(data)) return [];
  return data.map((d) => ({
    ...d,
    value: toNonNegativeFiniteNumber(d?.value, 0),
    label: d?.label == null ? "" : String(d.label),
  }));
}

/**
 * 计算数据 value 的总和（会先做 normalize，确保不会加出 NaN）。
 *
 * 典型用途：饼图/环形图计算总量，避免 total=0 或 total=NaN 引发的除零问题。
 *
 * @param {Array} data 原始数据数组
 * @returns {number} 总和（非负有限数）
 */
export function sumValues(data = []) {
  return normalizeChartData(data).reduce((sum, item) => sum + item.value, 0);
}

/**
 * 获取数据中的最大 value（会先做 normalize）。
 *
 * - 若数据为空，返回 0
 * - 通过在 Math.max 前加 0，确保不会因为展开空数组而得到 -Infinity
 *
 * @param {Array} data 原始数据数组
 * @returns {number} 最大值（非负有限数）
 */
export function maxValueOf(data = []) {
  const safe = normalizeChartData(data);
  return Math.max(0, ...safe.map((d) => d.value));
}

/**
 * 计算纵向缩放比例 scaleY（用于折线/柱状图）。
 *
 * - height 或 maxValue 若不是有限数会被兜底为 0
 * - 当 maxValue <= 0 时返回 0，避免出现 height/0 => Infinity
 *   从而引发 0 * Infinity => NaN，最终导致 SVG Path/Rect 崩溃
 *
 * @param {Object} params
 * @param {number} params.height 图表绘制高度
 * @param {number} params.maxValue 数据最大值
 * @returns {number} scaleY（有限数；maxValue<=0 时为 0）
 */
export function scaleYFor({ height, maxValue }) {
  const h = toFiniteNumber(height, 0);
  const max = toFiniteNumber(maxValue, 0);
  return max > 0 ? h / max : 0;
}

