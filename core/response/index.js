/**
 * 统一结果返回包装器
 */
export class Response {
  /**
   * 成功响应
   * @param {*} data - 响应数据
   * @param {string} message - 响应消息
   * @returns {Object} 统一格式的成功响应
   */
  static success(data = null, message = '操作成功') {
    return {
      code: 200,
      success: true,
      message,
      data
    };
  }
  
  /**
   * 错误响应
   * @param {number} code - 错误代码
   * @param {string} message - 错误消息
   * @param {*} data - 错误数据（可选）
   * @returns {Object} 统一格式的错误响应
   */
  static error(code = 500, message = '操作失败', data = null) {
    return {
      code,
      success: false,
      message,
      data
    };
  }
  
  /**
   * 分页响应
   * @param {Array} list - 数据列表
   * @param {number} total - 总记录数
   * @param {number} page - 当前页码
   * @param {number} pageSize - 每页大小
   * @param {string} message - 响应消息
   * @returns {Object} 统一格式的分页响应
   */
  static pagination(list = [], total = 0, page = 1, pageSize = 10, message = '操作成功') {
    return {
      code: 200,
      success: true,
      message,
      data: {
        list,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }
}