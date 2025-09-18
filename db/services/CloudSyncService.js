import { Buffer } from 'buffer';
import { getDB, getAllTables } from '@/db';
import { getAllCloudDriveConfigs, getSyncCheckpoint, upsertSyncCheckpoint } from '@/db/cloudSyncDb';
import { getCurrentUserId } from "@/db/userDB";

// 云盘类型
export const DriveType = {
  NUTSTORE: 'nutstore',
  DROPBOX: 'dropbox',
  ONEDRIVE: 'onedrive',
  BAIDU: 'baidu'
};

// 云盘配置 - 统一适配所有网盘的同步方案
export const DRIVE_CONFIGS = {
  [DriveType.NUTSTORE]: {
    displayName: '坚果云盘',
    webdavEndpoint: 'https://dav.jianguoyun.com/dav/',
    getRequestUrl: (method, path) => `${DRIVE_CONFIGS[DriveType.NUTSTORE].webdavEndpoint}${path}`,
    getRequestHeaders: (method, path) => {
      const headers = {};
      if(method === 'PROPFIND') {
        headers['Depth'] = '0';
      }
      return headers;
    },
    mapHttpError: (status) => {
      switch(status) {
        case 401:
          return '账号或密码错误（需在坚果云官网单独设置WebDAV密码）';
        case 403:
          return 'WebDAV权限未开启（请在坚果云后台启用）';
        case 404:
          return '路径不存在（需手动创建目录）';
        default:
          return null;
      }
    },
    needsDirCheck: true,
    downloadMethod: 'GET',
    uploadMethod: 'PUT'
  },
  [DriveType.DROPBOX]: {
    displayName: 'Dropbox',
    uploadEndpoint: 'https://api.dropboxapi.com/2/files/upload',
    downloadEndpoint: 'https://api.dropboxapi.com/2/files/download',
    note: '需使用Dropbox开发者API令牌（需开启 files.content.write 和 files.content.read 权限）',
    getRequestUrl: (method) => {
      if(method === 'POST') {
        return DRIVE_CONFIGS[DriveType.DROPBOX].downloadEndpoint;
      }
      return DRIVE_CONFIGS[DriveType.DROPBOX].uploadEndpoint;
    },
    getRequestHeaders: (method, path) => {
      const dropboxArg = JSON.stringify({ path: `/${path}` });
      const headers = { 'Dropbox-API-Arg': dropboxArg };
      
      if(method === 'PUT') {
        headers['Content-Type'] = 'application/octet-stream';
      }
      return headers;
    },
    mapHttpError: (status) => {
      switch(status) {
        case 401:
          return 'API令牌无效或已过期';
        case 403:
          return '缺少权限（需在Dropbox开发者平台开启 files.content.write/read）';
        case 404:
          return '文件/路径不存在（确认路径是否正确）';
        default:
          return null;
      }
    },
    needsDirCheck: false,
    downloadMethod: 'POST',
    uploadMethod: 'PUT'
  },
  [DriveType.ONEDRIVE]: {
    displayName: 'OneDrive',
    webdavEndpoint: 'https://graph.microsoft.com/v1.0/me/drive/root:',
    getRequestUrl: (method, path) => `${DRIVE_CONFIGS[DriveType.ONEDRIVE].webdavEndpoint}/${path}:/content`,
    getRequestHeaders: (method) => {
      if(method === 'PUT') {
        return { 'Content-Type': 'application/json' };
      }
      return {};
    },
    mapHttpError: (status) => {
      switch(status) {
        case 401:
          return '令牌过期（需重新获取Graph API授权）';
        case 403:
          return '缺少Files.ReadWrite.All权限';
        default:
          return null;
      }
    },
    needsDirCheck: false,
    downloadMethod: 'GET',
    uploadMethod: 'PUT'
  },
  [DriveType.BAIDU]: {
    displayName: '百度网盘',
    webdavEndpoint: 'https://dav.baidu.com/',
    getRequestUrl: (method, path) => `${DRIVE_CONFIGS[DriveType.BAIDU].webdavEndpoint}${path}`,
    getRequestHeaders: (method) => {
      if(method === 'PROPFIND') {
        return { 'Depth': '0' };
      }
      return { 'Content-Type': 'application/json' };
    },
    mapHttpError: (status) => {
      switch(status) {
        case 401:
          return '账号或密码错误（需开启百度网盘WebDAV服务）';
        case 503:
          return 'WebDAV服务暂时不可用';
        default:
          return null;
      }
    },
    needsDirCheck: true,
    downloadMethod: 'GET',
    uploadMethod: 'PUT'
  }
};

export class CloudSyncService {
  #defaultConfig = null;
  
  #normalizePath(path = '') {
    return path.trim().replace(/^\/+|\/+$/g, '');
  }
  
  // 统一生成请求头（支持上传/下载，适配不同网盘）
  #getRequestHeaders(driveConfig, method, path, contentType = 'application/json') {
    const baseHeaders = {};
    // 上传类请求（PUT/POST）需加Content-Type
    if(['PUT', 'POST'].includes(method) && !baseHeaders['Content-Type']) {
      baseHeaders['Content-Type'] = contentType;
    }
    // 调用网盘专属的Header配置
    return {
      ...baseHeaders,
      ...(driveConfig.getRequestHeaders?.(method, path) || {})
    };
  }
  
  async #getAllConfigs() {
    const userId = await getCurrentUserId();
    const configs = await getAllCloudDriveConfigs(userId);
    if(!configs?.length) {
      const err = new Error('未找到云盘配置');
      err.code = 'NO_CONFIG';
      throw err;
    }
    return configs;
  }
  
  async #webdavRequest(driveType, url, options) {
    try {
      const {
        method = 'GET',
        account,
        credential,
        headers = {},
        body
      } = options;
      const authHeader = 'Basic ' + Buffer.from(`${account}:${credential}`).toString('base64');
      const response = await fetch(url, {
        method,
        headers: { Authorization: authHeader, ...headers },
        body
      });
      
      // 读取响应内容
      const data = await response.text().catch(() => '');
      const driveConfig = DRIVE_CONFIGS[driveType];
      
      if(response.ok) {
        return {
          ok: true,
          status: response.status,
          data,
          headers: response.headers
        };
      }
      
      const defaultError = `${response.status} ${response.statusText}: ${data.substring(0, 150)}`;
      return {
        ok: false,
        status: response.status,
        error: driveConfig.mapHttpError(response.status) || defaultError
      };
    } catch(err) {
      return {
        ok: false,
        error: err.message || '网络连接失败'
      };
    }
  }
  
  async #checkDirExists(driveType, dirPath, account, credential) {
    const driveConfig = DRIVE_CONFIGS[driveType];
    const dirUrl = driveConfig.getRequestUrl('PROPFIND', dirPath);
    const res = await this.#webdavRequest(driveType, dirUrl, {
      method: 'PROPFIND',
      account,
      credential,
      headers: this.#getRequestHeaders(driveConfig, 'PROPFIND', dirPath)
    });
    if(res.ok) return { exists: true };
    if(res.status === 404) return { exists: false };
    return {
      exists: false,
      error: res.error
    };
  }
  
  async #updateCheckpoint(driveId, path, data) {
    const userId = await getCurrentUserId();
    await upsertSyncCheckpoint({
      user_id: userId,
      drive_id: driveId,
      path,
      last_sync_time: new Date().toISOString(),
      ...data
    });
  }
  
  // 拉取远程数据
  async #fetchRemoteData(tableName, config, syncPath) {
    try {
      const driveConfig = DRIVE_CONFIGS[config.drive_type];
      const res = await this.#webdavRequest(
        config.drive_type,
        driveConfig.getRequestUrl(driveConfig.downloadMethod, syncPath),
        { method: driveConfig.downloadMethod, account: config.account, credential: config.credential }
      );
      const data = res.ok && res.data ? JSON.parse(res.data) : [];
      console.log(`[${tableName}] 拉取远程：${data.length} 行`);
      return data;
    } catch (e) {
      throw new Error(`远程拉取失败: ${e.message}`);
    }
  }
  
  // 获取本地数据
  async #fetchLocalData(db, tableName) {
    const data = await db.getAllAsync(`SELECT * FROM ${tableName}`);
    console.log(`[${tableName}] 本地：${data.length} 行`);
    return data;
  }
  
  // 合并双方数据
  #mergeData(local, remote, updatedAtKey) {
    const map = new Map(local.map(r => [r.id, r]));
    for (const r of remote) {
      const l = map.get(r.id);
      if (!l || new Date(r[updatedAtKey] || 0) > new Date(l[updatedAtKey] || 0)) {
        map.set(r.id, r);
      }
    }
    return [...map.values()];
  }
  
  // 数据写入本地
  async #writeLocalIfChanged(db, tableName, local, merged, updatedAtKey) {
    const [before, after] = await Promise.all([this.#calcDataHash(local), this.#calcDataHash(merged)]);
    if (before === after) {
      console.log(`[${tableName}] 本地数据无变化`);
      return false;
    }
    await db.withExclusiveTransactionAsync(async tx => {
      if (!merged.length) return;
      const keys = Object.keys(merged[0]);
      const sql = `INSERT OR REPLACE INTO ${tableName}(${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`;
      const stmt = await tx.prepareAsync(sql);
      try {
        for (const row of merged) {
          const values = keys.map(k => row[k] || (k === updatedAtKey ? new Date().toISOString() : null));
          await stmt.executeAsync(values);
        }
      } finally {
        await stmt.finalizeAsync();
      }
    });
    console.log(`[${tableName}] 本地写入：${merged.length} 行`);
    return true;
  }
  
  async #uploadIfChanged(config, tableName, syncPath, data, checkpoint) {
    const dbHash = await this.#calcDataHash(data);
    if (dbHash === checkpoint?.last_sync_token) {
      console.log(`[${tableName}] 数据无变化，跳过上传`);
      return;
    }
    const driveConfig = DRIVE_CONFIGS[config.drive_type];
    const res = await this.#webdavRequest(
      config.drive_type,
      driveConfig.getRequestUrl(driveConfig.uploadMethod, syncPath),
      {
        method: driveConfig.uploadMethod,
        account: config.account,
        credential: config.credential,
        headers: this.#getRequestHeaders(driveConfig, driveConfig.uploadMethod, syncPath),
        body: JSON.stringify(data, null, 2)
      }
    );
    if (!res.ok) throw new Error(`上传失败: ${res.error}`);
    await this.#updateCheckpoint(config.id, syncPath, {
      last_sync_time: new Date().toISOString(),
      last_sync_token: dbHash,
      sync_status: 'idle',
      error_message: null
    });
    console.log(`[${tableName}] 远程上传成功：${data.length} 行`);
  }
  
  #buildResult(tableName, rows) {
    return { success: true, tableName, rows: rows.length };
  }
  
  async #updateCheckpointError(configId, path, err) {
    await this.#updateCheckpoint(configId, path, {
      sync_status: 'error',
      error_message: err.message || '同步失败',
      last_sync_time: new Date().toISOString()
    });
  }
  
  async #calcDataHash(data) {
    const jsonStr = JSON.stringify(data);
    const Crypto = require('expo-crypto');
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, jsonStr);
  }
  
  async testConnection(config) {
    const {
      drive_type,
      account,
      credential,
      root_path
    } = config;
    const driveConfig = DRIVE_CONFIGS[drive_type];
    if(!driveConfig) return {
      success: false,
      message: `不支持的网盘类型：${drive_type}`
    };
    
    const normalizedPath = this.#normalizePath(root_path);
    const testFileName = `test_conn_${Date.now()}.txt`;
    const testPath = normalizedPath ? `${normalizedPath}/${testFileName}` : testFileName;
    
    // 测试文件上传URL
    const testUrl = driveConfig.getRequestUrl(driveConfig.uploadMethod, testPath);
    
    // 检查目录是否存在（如需要）
    if(normalizedPath && driveConfig.needsDirCheck) {
      const {
        exists,
        error
      } = await this.#checkDirExists(drive_type, normalizedPath, account, credential);
      if(error) return {
        success: false,
        message: error
      };
      if(!exists) return {
        success: false,
        message: `未找到目录【${normalizedPath}】，请先创建`
      };
    }
    
    // 上传测试文件
    const uploadRes = await this.#webdavRequest(drive_type, testUrl, {
      method: driveConfig.uploadMethod,
      account,
      credential,
      headers: this.#getRequestHeaders(driveConfig, driveConfig.uploadMethod, testPath, 'text/plain'),
      body: `Test from RNExpoDiaryApp: ${new Date().toISOString()}`
    });
    if(!uploadRes.ok) return {
      success: false,
      message: `上传失败：${uploadRes.error}`
    };
    
    // 删除测试文件
    const deleteUrl = driveConfig.getRequestUrl('DELETE', testPath);
    const deleteRes = await this.#webdavRequest(drive_type, deleteUrl, {
      method: 'DELETE',
      account,
      credential
    });
    
    return {
      success: true,
      message: `成功连接${driveConfig.displayName}`,
      ...(deleteRes.ok ? {} : { warning: `测试文件【${testFileName}】删除失败，请手动清理` })
    };
  }
  
  // 全量/增量双向同步方法
  async syncSingleTableSafe(tableName, config, updatedAtKey = "updated_at") {
    const db = await getDB();
    const syncPath = this.#normalizePath(`${config.root_path}/${tableName}.json`);
    const checkpoint = await getSyncCheckpoint(config.id, syncPath);
    
    try {
      const remoteData = await this.#fetchRemoteData(tableName, config, syncPath);
      const localData = await this.#fetchLocalData(db, tableName);
      
      const mergedData = this.#mergeData(localData, remoteData, updatedAtKey);
      await this.#writeLocalIfChanged(db, tableName, localData, mergedData, updatedAtKey);
      
      await this.#uploadIfChanged(config, tableName, syncPath, mergedData, checkpoint);
      
      return this.#buildResult(tableName, mergedData);
    } catch (err) {
      await this.#updateCheckpointError(config.id, syncPath, err);
      throw err;
    }
  }
  
  async syncAllAuto() {
    const result = {
      success: false,
      driveResults: [],
      total: 0
    };
    
    try {
      const allConfigs = await this.#getAllConfigs();
      result.total = allConfigs.length;
      if(!result.total) return {
        ...result,
        success: true,
        message: '无云盘配置需同步'
      };
      
      for(const config of allConfigs) {
        const driveResult = {
          driveId: config.id,
          driveType: config.drive_type,
          displayName: DRIVE_CONFIGS[config.drive_type]?.displayName || config.drive_type,
          success: false,
          successTables: [],
          failedTables: []
        };
        
        try {
          const tables = await getAllTables();
          for(const { name: tableName } of tables) {
            try {
              const res = await this.syncSingleTableSafe(tableName, config);
              driveResult.successTables.push({
                tableName,
                rows: res.rows
              });
              console.log(`[${driveResult.displayName}] 表 ${tableName} 同步成功`);
            } catch(err) {
              const errorMsg = err.message || '同步失败';
              driveResult.failedTables.push({
                tableName,
                error: errorMsg
              });
              console.error(`[${driveResult.displayName}] 表 ${tableName} 同步失败:`, errorMsg);
            }
          }
          driveResult.success = !driveResult.failedTables.length;
        } catch(err) {
          const errorMsg = err.message || '全局同步异常';
          driveResult.failedTables.push({
            tableName: '全局',
            error: errorMsg
          });
          console.error(`[${driveResult.displayName}] 全局同步异常:`, errorMsg);
        } finally {
          result.driveResults.push(driveResult);
        }
      }
      
      // 只要有一个网盘同步成功，就认为整体成功
      result.success = result.driveResults.some(d => d.success);
      console.log("首次同步成功");
      return result;
    } catch(err) {
      const errorMsg = err.message || '同步初始化异常';
      result.driveResults.push({
        driveId: 'global',
        failedTables: [
          {
            tableName: '全局',
            error: errorMsg
          }
        ]
      });
      console.error("同步初始化异常:", errorMsg);
      return result;
    }
  }
  
  resetConfigCache() {
    this.#defaultConfig = null;
  }
}
