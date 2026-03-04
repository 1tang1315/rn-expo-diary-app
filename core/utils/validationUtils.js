/**
 * 参数验证工具函数
 */

/**
 * 验证参数是否符合 schema 定义
 * @param {Object} params - 待验证的参数
 * @param {Object} schema - 验证规则
 * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
 */
export function validateParams(params, schema) {
  const errors = [];
  
  // 检查必填字段
  if (schema.required && schema.required.length > 0) {
    schema.required.forEach(field => {
      if (params[field] === undefined || params[field] === null) {
        errors.push(`缺少必填字段: ${field}`);
      }
    });
  }
  
  // 检查字段类型和约束
  if (schema.properties) {
    Object.keys(schema.properties).forEach(field => {
      const fieldSchema = schema.properties[field];
      const value = params[field];
      
      // 如果值不存在且不是必填字段，跳过验证
      if (value === undefined || value === null) {
        return;
      }
      
      // 检查类型
      if (fieldSchema.type && typeof value !== fieldSchema.type) {
        errors.push(`字段 ${field} 类型错误，期望 ${fieldSchema.type}，实际 ${typeof value}`);
      }
      
      // 检查字符串长度
      if (fieldSchema.type === 'string') {
        if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
          errors.push(`字段 ${field} 长度不能小于 ${fieldSchema.minLength}`);
        }
        if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
          errors.push(`字段 ${field} 长度不能大于 ${fieldSchema.maxLength}`);
        }
        if (fieldSchema.pattern) {
          const regex = new RegExp(fieldSchema.pattern);
          if (!regex.test(value)) {
            errors.push(`字段 ${field} 格式错误，期望符合模式: ${fieldSchema.pattern}`);
          }
        }
      }
      
      // 检查数字范围
      if (fieldSchema.type === 'number') {
        if (fieldSchema.minimum !== undefined && value < fieldSchema.minimum) {
          errors.push(`字段 ${field} 不能小于 ${fieldSchema.minimum}`);
        }
        if (fieldSchema.maximum !== undefined && value > fieldSchema.maximum) {
          errors.push(`字段 ${field} 不能大于 ${fieldSchema.maximum}`);
        }
      }
      
      // 检查枚举值
      if (fieldSchema.enum && fieldSchema.enum.length > 0) {
        if (!fieldSchema.enum.includes(value)) {
          errors.push(`字段 ${field} 必须是以下值之一: ${fieldSchema.enum.join(', ')}`);
        }
      }
      
      // 检查数组
      if (fieldSchema.type === 'array' && Array.isArray(value)) {
        if (fieldSchema.items) {
          value.forEach((item, index) => {
            if (typeof fieldSchema.items === 'object') {
              const itemErrors = validateParams(item, fieldSchema.items).errors;
              if (itemErrors.length > 0) {
                errors.push(`数组索引 ${index} 的元素验证失败: ${itemErrors.join('; ')}`);
              }
            }
          });
        }
      }
      
      // 检查对象
      if (fieldSchema.type === 'object' && typeof value === 'object' && value !== null) {
        if (fieldSchema.properties) {
          const nestedErrors = validateParams(value, fieldSchema).errors;
          if (nestedErrors.length > 0) {
            errors.push(`字段 ${field} 验证失败: ${nestedErrors.join('; ')}`);
          }
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 验证并返回格式化的错误消息
 * @param {Object} params - 待验证的参数
 * @param {Object} schema - 验证规则
 * @returns {string|null} 错误消息，无错误返回 null
 */
export function getValidationError(params, schema) {
  const result = validateParams(params, schema);
  if (!result.isValid) {
    return result.errors.join('; ');
  }
  return null;
}

/**
 * 验证响应数据是否符合 schema 定义
 * @param {Object} response - 响应数据
 * @param {Object} schema - 验证规则
 * @returns {Object} 验证结果 { isValid: boolean, errors: string[] }
 */
export function validateResponse(response, schema) {
  return validateParams(response, schema);
}

/**
 * 验证响应并返回格式化的错误消息
 * @param {Object} response - 响应数据
 * @param {Object} schema - 验证规则
 * @returns {string|null} 错误消息，无错误返回 null
 */
export function getResponseValidationError(response, schema) {
  return getValidationError(response, schema);
}

/**
 * 安全地获取默认值
 * @param {any} value - 原始值
 * @param {any} defaultValue - 默认值
 * @returns {any} 如果原始值为 undefined 或 null，返回默认值，否则返回原始值
 */
export function getDefaultValue(value, defaultValue) {
  return value === undefined || value === null ? defaultValue : value;
}