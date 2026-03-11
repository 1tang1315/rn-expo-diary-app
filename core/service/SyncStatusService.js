import * as FileSystem from "expo-file-system";

const SYNC_STATUS_FILE = `${FileSystem.documentDirectory}sync_status.json`;

class SyncStatusService {
  // 确保状态文件存在
  async #ensureStatusFile() {
    try {
      const fileInfo = await FileSystem.getInfoAsync(SYNC_STATUS_FILE);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(SYNC_STATUS_FILE, JSON.stringify({ checkpoints: [] }, null, 2));
      }
    } catch (error) {
      console.error('确保同步状态文件失败:', error);
    }
  }

  // 读取同步状态
  async #readStatusFile() {
    await this.#ensureStatusFile();
    try {
      const content = await FileSystem.readAsStringAsync(SYNC_STATUS_FILE);
      return JSON.parse(content);
    } catch (error) {
      console.error('读取同步状态文件失败:', error);
      return { checkpoints: [] };
    }
  }

  // 写入同步状态
  async #writeStatusFile(data) {
    try {
      await FileSystem.writeAsStringAsync(SYNC_STATUS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('写入同步状态文件失败:', error);
    }
  }

  // 获取同步检查点
  async getSyncCheckpoint(driveId, path) {
    const status = await this.#readStatusFile();
    return status.checkpoints.find(cp => cp.drive_id === driveId && cp.path === path);
  }

  // 更新或插入同步检查点
  async upsertSyncCheckpoint({ drive_id, path, last_sync_time, last_sync_token, sync_status = 'idle', error_message }) {
    const status = await this.#readStatusFile();
    const existingIndex = status.checkpoints.findIndex(cp => cp.drive_id === drive_id && cp.path === path);

    const checkpoint = {
      drive_id,
      path,
      last_sync_time: last_sync_time || new Date().toISOString(),
      last_sync_token,
      sync_status,
      error_message,
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      status.checkpoints[existingIndex] = checkpoint;
    } else {
      status.checkpoints.push(checkpoint);
    }

    await this.#writeStatusFile(status);
  }

  // 更新同步状态
  async updateSyncCheckpointStatus(driveId, path, { sync_status, error_message }) {
    const status = await this.#readStatusFile();
    const existingIndex = status.checkpoints.findIndex(cp => cp.drive_id === driveId && cp.path === path);

    if (existingIndex >= 0) {
      status.checkpoints[existingIndex] = {
        ...status.checkpoints[existingIndex],
        sync_status,
        error_message,
        updated_at: new Date().toISOString()
      };
      await this.#writeStatusFile(status);
    }
  }

  // 清除指定云盘的所有同步状态
  async clearSyncStatus(driveId) {
    const status = await this.#readStatusFile();
    status.checkpoints = status.checkpoints.filter(cp => cp.drive_id !== driveId);
    await this.#writeStatusFile(status);
  }

  // 获取所有同步状态
  async getAllSyncStatus() {
    const status = await this.#readStatusFile();
    return status.checkpoints;
  }
}

export default new SyncStatusService();
