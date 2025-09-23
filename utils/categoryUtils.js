import { categories } from "@/constants/commonConstans";

/**
 * 根据分类ID获取分类信息（名称+图标）
 * @param {string} categoryId - 分类ID（如 'daily'/'work'）
 * @returns {Object} { name: 分类中文名称, icon: 分类图标名 }
 */
export const getCategoryInfo = (categoryId) => {
  // 匹配对应的分类
  const matchedCategory = categories.find(item => item.id === categoryId);
  
  // 未匹配到时返回默认值（避免显示空白/错误ID）
  return matchedCategory || {
    name: '未分类',
    icon: 'folder-outline'
  };
};

/**
 * 根据分类ID直接获取分类中文名称
 * @param {string} categoryId - 分类ID
 * @returns {string} 分类中文名称
 */
export const getCategoryName = (categoryId) => {
  return getCategoryInfo(categoryId).name;
};

/**
 * 根据分类ID直接获取分类图标名
 * @param {string} categoryId - 分类ID
 * @returns {string} 分类图标名
 */
export const getCategoryIcon = (categoryId) => {
  return getCategoryInfo(categoryId).icon;
};