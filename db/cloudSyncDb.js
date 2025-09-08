import { getDB } from './index';

/**
 * 云盘配置表操作
 */
export async function addCloudDriveConfig({ user_id, drive_type = 'nutstore', account, credential, root_path = 'RNExpoDiaryApp' }) {
  const db = await getDB();
  const result = await db.runAsync(
    `INSERT INTO cloud_drive_config (user_id, drive_type, account, credential, root_path)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, drive_type, account, credential, root_path]
  );
  return result.lastInsertRowId;
}

/**
 * 按类型获取用户的所有云盘配置
 * @param {number} user_id - 用户ID
 * @param {string} drive_type - 云盘类型
 * @returns {Promise<Array<Object>>} 配置数组
 */
export async function getCloudDriveConfigsByType(user_id, drive_type) {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM cloud_drive_config WHERE user_id = ? AND drive_type = ?`,
    [user_id, drive_type]
  );
}

// 获取用户所有云盘配置的函数
export async function getAllCloudDriveConfigs(user_id) {
  const db = await getDB();
  return await db.getAllAsync(
    `SELECT * FROM cloud_drive_config WHERE user_id = ?`,
    [user_id]
  );
}

export async function updateCloudDriveConfig(id, { account, credential, root_path }) {
  const db = await getDB();
  await db.runAsync(
    `UPDATE cloud_drive_config
     SET account = COALESCE(?, account),
         credential = COALESCE(?, credential),
         root_path = COALESCE(?, root_path),
         is_default = COALESCE(?, is_default),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [account, credential, root_path, id]
  );
}

export async function deleteCloudDriveConfig(id) {
  const db = await getDB();
  await db.runAsync(`DELETE FROM cloud_drive_config WHERE id = ?`, [id]);
}

/**
 * 同步检查点表操作
 */
export async function upsertSyncCheckpoint({ user_id, drive_id, path, last_sync_time, last_sync_token, sync_status = 'idle', error_message }) {
  const db = await getDB();
  await db.runAsync(
    `INSERT INTO sync_checkpoint (user_id, drive_id, path, last_sync_time, last_sync_token, sync_status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(drive_id, path) DO UPDATE SET
       last_sync_time = excluded.last_sync_time,
       last_sync_token = excluded.last_sync_token,
       sync_status = excluded.sync_status,
       error_message = excluded.error_message,
       updated_at = CURRENT_TIMESTAMP`,
    [user_id, drive_id, path, last_sync_time, last_sync_token, sync_status, error_message]
  );
}

export async function getSyncCheckpoint(drive_id, path) {
  const db = await getDB();
  return await db.getFirstAsync(
    `SELECT * FROM sync_checkpoint WHERE drive_id = ? AND path = ? LIMIT 1`,
    [drive_id, path]
  );
}

export async function updateSyncCheckpointStatus(drive_id, path, { sync_status, error_message }) {
  const db = await getDB();
  await db.runAsync(
    `UPDATE sync_checkpoint
     SET sync_status = COALESCE(?, sync_status),
         error_message = COALESCE(?, error_message),
         updated_at = CURRENT_TIMESTAMP
     WHERE drive_id = ? AND path = ?`,
    [sync_status, error_message, drive_id, path]
  );
}