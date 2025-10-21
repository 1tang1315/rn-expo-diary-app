import { getDB } from './index';
import dayjs from 'dayjs';
import { getCurrentUserId } from "@/db/userDB";

// -------------------------- AI配置主表操作 --------------------------
/**
 * 获取当前用户的所有AI配置（未删除）
 * @returns {Promise<Array<Object>>} 配置列表（默认配置优先）
 */
export async function getAIConfigs() {
  const db = await getDB();
  const userId = await getCurrentUserId();
  
  return await db.getAllAsync(`
  SELECT id, user_id, model_name, api_key, api_base_url, is_default, created_at, updated_at
  FROM ai_config
  WHERE user_id = ? AND deleted_at IS NULL
  ORDER BY is_default DESC, created_at DESC
  `, [userId]);
}

/**
 * 获取当前用户的默认AI配置
 * @returns {Promise<Object|null>} 默认配置（无则返回null）
 */
export async function getDefaultAIConfig() {
  const db = await getDB();
  const userId = await getCurrentUserId();
  
  return await db.getFirstAsync(`
  SELECT id, user_id, model_name, api_key, api_base_url, is_default, created_at, updated_at
  FROM ai_config
  WHERE user_id = ? AND is_default = 1 AND deleted_at IS NULL
  LIMIT 1
  `, [userId]);
}

/**
 * 添加AI配置（支持设为默认）
 * @param {Object} config - 配置参数
 * @param {string} config.model_name - 模型名称
 * @param {string} config.api_key - API密钥
 * @param {string} config.api_base_url - API基础URL
 * @param {boolean} [config.is_default=false] - 是否默认配置
 * @returns {Promise<Object>} 新增配置（含ID）
 */
export async function addAIConfig(config) {
  const { model_name, api_key, api_base_url, is_default = false } = config;
  if (!model_name || !api_key || !api_base_url) {
    throw new Error('模型名称、API密钥、API基础URL为必填项');
  }
  
  const db = await getDB();
  const userId = await getCurrentUserId();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // 事务保证原子性（设为默认时先取消其他默认）
  return await db.transactionAsync(async (tx) => {
    if (is_default) {
      await tx.runAsync(`
      UPDATE ai_config
      SET is_default = 0, updated_at = ?
      WHERE user_id = ? AND is_default = 1 AND deleted_at IS NULL
      `, [now, userId]);
    }
    
    // 插入新配置
    const insertResult = await tx.runAsync(`
    INSERT INTO ai_config (
      user_id, model_name, api_key, api_base_url, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, model_name, api_key, api_base_url, is_default ? 1 : 0, now, now]);
    
    // 返回新增配置详情
    return await tx.getFirstAsync(`
    SELECT id, user_id, model_name, api_key, api_base_url, is_default, created_at, updated_at
    FROM ai_config
    WHERE id = ?
    `, [insertResult.lastInsertRowId]);
  });
}

/**
 * 更新AI配置
 * @param {number} configId - 配置ID
 * @param {Object} updateData - 更新字段（可选：model_name/api_key/api_base_url/is_default）
 * @returns {Promise<Object>} 更新后配置
 */
export async function updateAIConfig(configId, updateData) {
  if (Object.keys(updateData).length === 0) {
    throw new Error('至少需提供一个更新字段');
  }
  
  const db = await getDB();
  const userId = await getCurrentUserId();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // 校验配置归属
  const existConfig = await db.getFirstAsync(`
  SELECT id FROM ai_config
  WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `, [configId, userId]);
  if (!existConfig) throw new Error('配置不存在或无权限修改');
  
  return await db.transactionAsync(async (tx) => {
    // 处理默认配置切换
    if (updateData.is_default !== undefined && updateData.is_default) {
      await tx.runAsync(`
      UPDATE ai_config
      SET is_default = 0, updated_at = ?
      WHERE user_id = ? AND is_default = 1 AND id != ? AND deleted_at IS NULL
      `, [now, userId, configId]);
    }
    
    // 构建更新语句
    const [updateFields, params] = Object.entries(updateData).reduce(
      ([fields, ps], [key, value]) => {
        if (['model_name', 'api_key', 'api_base_url'].includes(key)) {
          fields.push(`${key} = ?`);
          ps.push(value);
        }
        if (key === 'is_default') {
          fields.push('is_default = ?');
          ps.push(value ? 1 : 0);
        }
        return [fields, ps];
      },
      [[], []]
    );
    
    // 必加更新时间
    updateFields.push('updated_at = ?');
    params.push(now);
    // 补充WHERE参数
    params.push(configId, userId);
    
    // 执行更新
    await tx.runAsync(`
    UPDATE ai_config
    SET ${updateFields.join(', ')}
    WHERE id = ? AND user_id = ? AND deleted_at IS NULL
    `, params);
    
    // 返回更新后配置
    return await tx.getFirstAsync(`
    SELECT id, user_id, model_name, api_key, api_base_url, is_default, created_at, updated_at
    FROM ai_config
    WHERE id = ? AND user_id = ?
    `, [configId, userId]);
  });
}

/**
 * 软删除AI配置（标记deleted_at）
 * @param {number} configId - 配置ID
 * @returns {Promise<boolean>} 删除成功返回true
 */
export async function deleteAIConfig(configId) {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // 校验配置归属
  const existConfig = await db.getFirstAsync(`
  SELECT id FROM ai_config
  WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `, [configId, userId]);
  if (!existConfig) throw new Error('配置不存在或无权限删除');
  
  // 执行软删除
  const result = await db.runAsync(`
  UPDATE ai_config
  SET deleted_at = ?, updated_at = ?
  WHERE id = ? AND user_id = ?
  `, [now, now, configId, userId]);
  
  return result.changes > 0;
}

// -------------------------- AI提示词表操作 --------------------------

/**
 * 根据配置ID获取所有提示词（未删除）
 * @param {number} configId - 配置ID
 * @returns {Promise<Array<Object>>} 提示词列表（按sort_order排序）
 */
export async function getPromptsByConfigId(configId) {
  const db = await getDB();
  const userId = await getCurrentUserId();
  
  // 校验配置归属
  const config = await db.getFirstAsync(`
  SELECT id FROM ai_config
  WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `, [configId, userId]);
  if (!config) throw new Error('配置不存在或无权限访问');
  
  // 获取提示词
  return await db.getAllAsync(`
  SELECT id, ai_config_id, prompt_type, prompt_content, sort_order, created_at, updated_at
  FROM ai_prompt
  WHERE ai_config_id = ? AND deleted_at IS NULL
  ORDER BY sort_order ASC, created_at DESC
  `, [configId]);
}

/**
 * 为配置添加提示词
 * @param {number} configId - 配置ID
 * @param {Object} promptData - 提示词参数
 * @param {string} promptData.prompt_type - 提示词类型
 * @param {string} promptData.prompt_content - 提示词内容
 * @param {number} [promptData.sort_order=0] - 排序序号
 * @returns {Promise<Object>} 新增提示词（含ID）
 */
export async function addAIPrompt(configId, promptData) {
  const { prompt_type, prompt_content, sort_order = 0 } = promptData;
  if (!prompt_type || !prompt_content) {
    throw new Error('提示词类型和内容为必填项');
  }
  
  const db = await getDB();
  const userId = await getCurrentUserId();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // 校验配置归属
  const config = await db.getFirstAsync(`
  SELECT id FROM ai_config
  WHERE id = ? AND user_id = ? AND deleted_at IS NULL
  `, [configId, userId]);
  if (!config) throw new Error('配置不存在或无权限添加提示词');
  
  // 插入提示词
  const insertResult = await db.runAsync(`
  INSERT INTO ai_prompt (
    ai_config_id, prompt_type, prompt_content, sort_order, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?)
  `, [configId, prompt_type, prompt_content, sort_order, now, now]);
  
  // 返回新增提示词
  return await db.getFirstAsync(`
  SELECT id, ai_config_id, prompt_type, prompt_content, sort_order, created_at, updated_at
  FROM ai_prompt
  WHERE id = ?
  `, [insertResult.lastInsertRowId]);
}

/**
 * 更新提示词
 * @param {number} promptId - 提示词ID
 * @param {Object} updateData - 更新字段（可选：prompt_type/prompt_content/sort_order）
 * @returns {Promise<Object>} 更新后提示词
 */
export async function updateAIPrompt(promptId, updateData) {
  if (Object.keys(updateData).length === 0) {
    throw new Error('至少需提供一个更新字段');
  }
  
  const db = await getDB();
  const userId = await getCurrentUserId();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // 校验提示词归属
  const prompt = await db.getFirstAsync(`
  SELECT ap.id FROM ai_prompt ap
  JOIN ai_config ac ON ap.ai_config_id = ac.id
  WHERE ap.id = ? AND ac.user_id = ? AND ap.deleted_at IS NULL
  `, [promptId, userId]);
  if (!prompt) throw new Error('提示词不存在或无权限修改');
  
  // 构建更新语句
  const [updateFields, params] = Object.entries(updateData).reduce(
    ([fields, ps], [key, value]) => {
      if (['prompt_type', 'prompt_content', 'sort_order'].includes(key)) {
        fields.push(`${key} = ?`);
        ps.push(value);
      }
      return [fields, ps];
    },
    [[], []]
  );
  
  // 必加更新时间
  updateFields.push('updated_at = ?');
  params.push(now);
  // 补充WHERE参数
  params.push(promptId);
  
  // 执行更新
  await db.runAsync(`
  UPDATE ai_prompt
  SET ${updateFields.join(', ')}
  WHERE id = ? AND deleted_at IS NULL
  `, params);
  
  // 返回更新后提示词
  return await db.getFirstAsync(`
  SELECT id, ai_config_id, prompt_type, prompt_content, sort_order, created_at, updated_at
  FROM ai_prompt
  WHERE id = ?
  `, [promptId]);
}

/**
 * 软删除提示词
 * @param {number} promptId - 提示词ID
 * @returns {Promise<boolean>} 删除成功返回true
 */
export async function deleteAIPrompt(promptId) {
  const db = await getDB();
  const userId = await getCurrentUserId();
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
  
  // 校验提示词归属
  const prompt = await db.getFirstAsync(`
  SELECT ap.id FROM ai_prompt ap
  JOIN ai_config ac ON ap.ai_config_id = ac.id
  WHERE ap.id = ? AND ac.user_id = ? AND ap.deleted_at IS NULL
  `, [promptId, userId]);
  if (!prompt) throw new Error('提示词不存在或无权限删除');
  
  // 执行软删除
  const result = await db.runAsync(`
  UPDATE ai_prompt
  SET deleted_at = ?, updated_at = ?
  WHERE id = ?
  `, [now, now, promptId]);
  
  return result.changes > 0;
}

// -------------------------- 安全辅助函数 --------------------------

/**
 * 单独更新API密钥（隐藏敏感信息返回）
 * @param {number} configId - 配置ID
 * @param {string} newApiKey - 新API密钥
 * @returns {Promise<Object>} 更新后配置（密钥中间字符隐藏）
 */
export async function updateAIConfigApiKey(configId, newApiKey) {
  if (!newApiKey) throw new Error('API密钥不能为空');
  
  const updatedConfig = await updateAIConfig(configId, { api_key: newApiKey });
  
  // 安全显示：隐藏密钥中间部分（如 sk-xxxx****xxxx）
  if (updatedConfig.api_key) {
    updatedConfig.api_key = updatedConfig.api_key.replace(
      /^(.{4})(.*)(.{4})$/,
      '$1****$3'
    );
  }
  
  return updatedConfig;
}