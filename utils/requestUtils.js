import { Alert } from 'react-native';

/**
 * 统一请求响应处理工具
 */

/**
 * 处理 API 响应
 * @param {Promise} request - API 请求 Promise
 * @param {Object} options - 配置选项
 * @param {boolean} options.showError - 是否显示错误弹窗
 * @param {boolean} options.showSuccess - 是否显示成功弹窗
 * @param {string} options.successMessage - 成功消息
 * @returns {Promise<any>} 处理后的数据
 */
export async function handleResponse(request, options = {}) {
  const {
    showError = true,
    showSuccess = false,
    successMessage = '操作成功'
  } = options;

  try {
    const response = await request;

    if (response.success) {
      if (showSuccess) {
        Alert.alert('成功', successMessage);
      }
      return response.data;
    } else {
      if (showError) {
        Alert.alert('错误', response.message || '操作失败');
      }
      return null;
    }
  } catch (error) {
    if (showError) {
      Alert.alert('错误', error.message || '网络请求失败');
    }
    return null;
  }
}

/**
 * 处理分页响应
 * @param {Promise} request - API 请求 Promise
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 处理后的分页数据
 */
export async function handlePaginationResponse(request, options = {}) {
  const data = await handleResponse(request, options);
  return {
    list: data.list || [],
    total: data.total || 0,
    page: data.page || 1,
    pageSize: data.pageSize || 10,
    totalPages: data.totalPages || 0
  };
}

/**
 * 安全的 API 调用包装器
 * @param {Function} apiCall - API 调用函数
 * @param {Array} args - API 调用参数
 * @param {Object} options - 配置选项
 * @returns {Promise<any>} 处理后的数据
 */
export async function safeApiCall(apiCall, args = [], options = {}) {
  return handleResponse(apiCall(...args), options);
}