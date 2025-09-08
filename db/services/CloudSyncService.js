import { Buffer } from 'buffer';
import { getDB, exportTable, importTable, getBusinessTables } from '@/db/index';
import {
  getAllCloudDriveConfigs,
  getSyncCheckpoint,
  upsertSyncCheckpoint
} from '@/db/cloudSyncDb';
import { getCurrentUserId } from "@/db/userDB";

// 定义云盘配置类型
export const DriveType = {
  NUTSTORE: 'nutstore',
  DROPBOX: 'dropbox',
  ONEDRIVE: 'onedrive',
  BAIDU: 'baidu'
};

// 云盘配置映射
export const DRIVE_CONFIGS = {
  [DriveType.NUTSTORE]: {
    displayName: '坚果云盘',
    webdavEndpoint: 'https://dav.jianguoyun.com/dav/',
    getRequestUrl: (endpoint, path) => `${endpoint}${path}`,
    mapHttpError: (status) => {
      switch (status) {
        case 401: return '账号或密码错误（需在坚果云官网单独设置WebDAV密码）';
        case 403: return 'WebDAV权限未开启（请在坚果云后台启用）';
        case 404: return '路径不存在（需手动创建目录）';
        default: return null;
      }
    },
    needsDirCheck: true  // 需要目录检查
  },
  [DriveType.DROPBOX]: {
    displayName: 'Dropbox',
    webdavEndpoint: 'https://api.dropboxapi.com/2/files/upload',
    note: '需使用Dropbox开发者API令牌',
    getRequestUrl: (endpoint) => endpoint, // Dropbox上传URL固定
    getUploadHeaders: (path) => ({
      'Dropbox-API-Arg': JSON.stringify({ path: `/${path}` }),
      'Content-Type': 'application/octet-stream'
    }),
    mapHttpError: (status) => {
      switch (status) {
        case 401: return 'API令牌无效或已过期';
        case 403: return '缺少files.content.write权限（需在Dropbox开发者平台配置）';
        default: return null;
      }
    },
    needsDirCheck: false  // 不需要目录检查（API自动处理）
  },
  [DriveType.ONEDRIVE]: {
    displayName: 'OneDrive',
    webdavEndpoint: 'https://graph.microsoft.com/v1.0/me/drive/root:',
    note: '需使用Microsoft Graph API令牌',
    getRequestUrl: (endpoint, path) => `${endpoint}/${path}:/content`, // OneDrive特殊路径格式
    mapHttpError: (status) => {
      switch (status) {
        case 401: return '令牌过期（需重新获取Graph API授权）';
        case 403: return '缺少Files.ReadWrite.All权限（需在Azure后台配置）';
        default: return null;
      }
    },
    needsDirCheck: false  // 不需要目录检查（API自动处理）
  },
  [DriveType.BAIDU]: {
    displayName: '百度网盘',
    webdavEndpoint: 'https://dav.baidu.com/',
    getRequestUrl: (endpoint, path) => `${endpoint}${path}`,
    mapHttpError: (status) => {
      switch (status) {
        case 401: return '账号或密码错误（需开启百度网盘WebDAV服务）';
        case 503: return 'WebDAV服务暂时不可用（建议稍后重试）';
        default: return null;
      }
    },
    needsDirCheck: true  // 需要目录检查
  }
};

// 云同步服务类
export class CloudSyncService {
  // 实例属性
  #defaultConfig = null;
  
  /**
   * 私有方法: 获取所有网盘配置
   * @returns {Promise<*>}
   */
  async #getAllConfigs() {
    const userId = await getCurrentUserId();
    const configs = await getAllCloudDriveConfigs(userId);
    
    if (!configs || configs.length === 0) {
      const err = new Error('未找到云盘配置');
      err.code = 'NO_CONFIG';
      throw err;
    }
    return configs;
  }
  
  /**
   * 私有方法：WebDAV请求封装（适配不同云盘）
   * @param {string} driveType - 云盘类型
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @param {string} [options.method='GET'] - 请求方法
   * @param {string} options.account - 账号
   * @param {string} options.credential - 凭证（密码/令牌）
   * @param {Object} [options.headers={}] - 请求头
   * @param {string|Blob} [options.body] - 请求体
   * @returns {Promise<Object>} 请求结果
   */
  async #webdavRequest(driveType, url, options) {
    try {
      const {
        method = 'GET',
        account,
        credential,
        headers = {},
        body
      } = options;
      // 基础认证头
      const authHeader = 'Basic ' + Buffer.from(`${account}:${credential}`).toString('base64');
      const response = await fetch(url, {
        method,
        headers: { Authorization: authHeader, ...headers },
        body
      });
      
      // 解析响应数据
      const data = await response.text().catch(() => '');
      const driveConfig = DRIVE_CONFIGS[driveType];
      
      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          data,
          headers: response.headers
        };
      }
      
      // 映射云盘专属错误提示
      const defaultError = `${response.status} ${response.statusText}: ${data.substring(0, 150)}`;
      const driveError = driveConfig.mapHttpError(response.status) || defaultError;
      return {
        ok: false,
        status: response.status,
        error: driveError
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message || '网络连接失败'
      };
    }
  }
  
  /**
   * 私有方法：检查云盘目录是否存在
   * @param {string} driveType - 云盘类型
   * @param {string} dirPath - 目录路径
   * @param {string} account - 账号
   * @param {string} credential - 凭证（密码/令牌）
   * @returns {Promise<Object>} 检查结果
   */
  async #checkDirExists(driveType, dirPath, account, credential) {
    const driveConfig = DRIVE_CONFIGS[driveType];
    const dirUrl = driveConfig.getRequestUrl(driveConfig.webdavEndpoint, dirPath);
    
    const res = await this.#webdavRequest(driveType, dirUrl, {
      method: 'PROPFIND',
      account,
      credential,
      headers: { Depth: '0' } // WebDAV目录检查需设置Depth=0
    });
    
    if (res.ok) return { exists: true };
    if (res.status === 404) return { exists: false };
    return { exists: false, error: res.error };
  }
  
  /**
   * 私有方法：合并本地与远端数据（处理冲突）
   * @param {Array<Object>} localRows - 本地数据
   * @param {Array<Object>} remoteRows - 远端数据
   * @param {string} [pk='id'] - 主键字段名
   * @param {string} [updatedAtKey='updated_at'] - 更新时间字段名
   * @returns {Array<Object>} 合并后的数据
   */
  #mergeRows(localRows, remoteRows, pk = 'id', updatedAtKey = 'updated_at') {
    const rowMap = new Map();
    
    // 1. 先存入远端数据
    remoteRows.forEach(row => {
      rowMap.set(row[pk].toString(), { ...row, __source: 'remote' });
    });
    
    // 2. 合并本地数据（按更新时间优先级）
    localRows.forEach(localRow => {
      const id = localRow[pk].toString();
      const remoteRow = rowMap.get(id);
      
      if (!remoteRow) {
        // 本地有、远端无 → 保留本地
        rowMap.set(id, { ...localRow, __source: 'local' });
        return;
      }
      
      // 两端都有 → 按更新时间判断
      const localTime = localRow[updatedAtKey]
        ? new Date(localRow[updatedAtKey]).getTime()
        : 0;
      const remoteTime = remoteRow[updatedAtKey]
        ? new Date(remoteRow[updatedAtKey]).getTime()
        : 0;
      
      if (localTime > remoteTime) {
        rowMap.set(id, { ...localRow, __source: 'local' });
      } else if (remoteTime > localTime) {
        rowMap.set(id, { ...remoteRow, __source: 'remote' });
      } else {
        // 时间相同但内容不同 → 生成冲突记录
        if (JSON.stringify(localRow) !== JSON.stringify(remoteRow)) {
          rowMap.set(`${id}_conflict`, {
            ...localRow,
            __source: 'conflict',
            original_id: id
          });
        }
      }
    });
    
    // 移除内部标记字段
    return Array.from(rowMap.values()).map(({ __source, original_id, ...rest }) => rest);
  }
  
  /**
   * 私有方法：更新同步检查点
   * @param {number} driveId - 云盘ID
   * @param {string} path - 同步路径
   * @param {Partial<SyncCheckpoint>} data - 检查点数据
   * @returns {Promise<void>}
   */
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
  
  // ------ 公有方法（外部调用接口）------
  
  /**
   * 测试云盘连接（外部可调用，用于配置表单）
   * @param {Object} config - 云盘配置
   * @param {string} config.drive_type - 云盘类型
   * @param {string} config.account - 账号
   * @param {string} config.credential - 凭证（密码/令牌）
   * @param {string} config.root_path - 根路径
   * @returns {Promise<Object>} 连接结果
   */
  async testConnection(config) {
    const { drive_type, account, credential, root_path } = config;
    const driveConfig = DRIVE_CONFIGS[drive_type];
    if (!driveConfig) {
      return {
        success: false,
        message: `不支持的网盘类型：${drive_type}`
      };
    }
    
    // 标准化路径（去除首尾斜杠）
    const normalizedPath = root_path.trim().replace(/^\/+|\/+$/g, '');
    const testFileName = `test_conn_${Date.now()}.txt`;
    const testPath = normalizedPath ? `${normalizedPath}/${testFileName}` : testFileName;
    const testUrl = driveConfig.getRequestUrl(driveConfig.webdavEndpoint, testPath);
    let testFileCreated = false;
    
    try {
      // 1. 目录检查：只对需要的云盘类型进行检查
      if (normalizedPath && driveConfig.needsDirCheck) {
        const { exists, error: dirError } = await this.#checkDirExists(
          drive_type,
          normalizedPath,
          account,
          credential
        );
        if (dirError) {
          return {
            success: false,
            message: `${dirError}`
          };
        }
        if (!exists) {
          return {
            success: false,
            message: `未找到目录【${normalizedPath}】，请先在${driveConfig.displayName}创建`
          };
        }
      }
      
      // 2. 上传测试文件
      const uploadHeaders = {
        'Content-Type': 'text/plain',
        ...(driveConfig.getUploadHeaders?.(testPath) || {})
      };
      const uploadRes = await this.#webdavRequest(drive_type, testUrl, {
        method: 'PUT',
        account,
        credential,
        headers: uploadHeaders,
        body: `Test from RNExpoDiaryApp: ${new Date().toISOString()}`
      });
      
      if (!uploadRes.ok) {
        return {
          success: false,
          message: `上传失败：${uploadRes.error || '未知错误'}`
        };
      }
      testFileCreated = true;
      
      // 3. 删除测试文件（清理垃圾）
      const deleteRes = await this.#webdavRequest(drive_type, testUrl, {
        method: 'DELETE',
        account,
        credential
      });
      
      if (!deleteRes.ok) {
        return {
          success: true,
          message: `成功连接${driveConfig.displayName}`,
          warning: `测试文件【${testFileName}】删除失败，请手动清理`
        };
      }
      
      return {
        success: true,
        message: `成功连接${driveConfig.displayName}`
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || '连接测试异常'
      };
    } finally {
      // 兜底：记录未删除的测试文件
      if (testFileCreated) {
        console.warn(`未清理的测试文件：${testPath}`);
      }
    }
  }
  
  /**
   * 同步单个表（外部可调用，支持增量/全量）
   * @param {Object} params - 同步参数
   * @param config
   * @param {string} params.tableName - 表名
   * @param {string} [params.pk='id'] - 主键字段名
   * @param {string} [params.updatedAtKey='updated_at'] - 更新时间字段名
   * @param {'merge'|'overwrite'} [params.mode='merge'] - 同步模式
   * @returns {Promise<Object>} 同步结果
   */
  async syncSingleTable(params, config) {
    const {
      tableName,
      pk = 'id',
      updatedAtKey = 'updated_at',
      mode = 'merge'
    } = params;
    
    const driveConfig = DRIVE_CONFIGS[config.drive_type];
    const syncPath = `${config.root_path.trim().replace(/^\/+|\/+$/g, '')}/${tableName}.json`;
    const syncUrl = driveConfig.getRequestUrl(driveConfig.webdavEndpoint, syncPath);
    
    try {
      // 1. 检查同步目录
      const { exists, error: dirError } = await this.#checkDirExists(
        config.drive_type,
        config.root_path,
        config.account,
        config.credential
      );
      if (dirError) throw new Error(`目录检查失败：${dirError}`);
      if (!exists) throw new Error(`同步目录【${config.root_path}】不存在`);
      
      // 2. 更新检查点为“同步中”
      await this.#updateCheckpoint(config.id, syncPath, { sync_status: 'syncing' });
      
      // 3. 拉取远端数据（带缓存校验）
      const checkpoint = await getSyncCheckpoint(config.id, syncPath);
      const requestHeaders = {};
      if (checkpoint?.last_sync_token) {
        requestHeaders['If-None-Match'] = checkpoint.last_sync_token; // 304缓存优化
      }
      
      const fetchRes = await this.#webdavRequest(config.drive_type, syncUrl, {
        method: 'GET',
        account: config.account,
        credential: config.credential,
        headers: requestHeaders
      });
      
      let remoteRows = [];
      if (fetchRes.ok) {
        try {
          remoteRows = JSON.parse(fetchRes.data || '[]');
        } catch {
          remoteRows = [];
        }
      } else if (fetchRes.status !== 404) {
        // 404表示远端无文件，正常；其他错误抛出
        throw new Error(`拉取远端数据失败：${fetchRes.error}`);
      }
      
      // 4. 导出本地数据（增量/全量）
      let localRows;
      if (checkpoint?.last_sync_time && updatedAtKey) {
        const db = await getDB();
        localRows = await db.getAllAsync(
          `SELECT * FROM ${tableName} WHERE ${updatedAtKey} > ?`,
          [checkpoint.last_sync_time]
        );
      } else {
        localRows = await exportTable(tableName);
      }
      
      // 5. 合并数据
      const mergedRows = this.#mergeRows(localRows, remoteRows, pk, updatedAtKey);
      await importTable(tableName, mergedRows, mode);
      
      // 6. 上传合并结果到远端
      const uploadHeaders = {
        'Content-Type': 'application/json',
        ...(driveConfig.getUploadHeaders?.(syncPath) || {})
      };
      const uploadRes = await this.#webdavRequest(config.drive_type, syncUrl, {
        method: 'PUT',
        account: config.account,
        credential: config.credential,
        headers: uploadHeaders,
        body: JSON.stringify(mergedRows, null, 2)
      });
      
      if (!uploadRes.ok) throw new Error(`上传数据失败：${uploadRes.error}`);
      
      // 7. 更新检查点为“成功”
      await this.#updateCheckpoint(config.id, syncPath, {
        sync_status: 'idle',
        last_sync_token: uploadRes.headers?.get('etag') || null,
        error_message: null
      });
      
      return {
        success: true,
        tableName,
        mergedCount: mergedRows.length
      };
    } catch (err) {
      // 8. 更新检查点为“失败”
      await this.#updateCheckpoint(config.id, syncPath, {
        sync_status: 'failed',
        error_message: err.message || '未知错误'
      });
      throw err;
    }
  }
  
  /**
   * 自动同步所有业务表（外部可调用，如Header点击同步）
   * @returns {Promise<Object>} 同步汇总结果
   */
  async syncAllAuto() {
    const result = {
      success: false,
      driveResults: [], // 按网盘区分结果
      total: 0
    };

    try {
      // 确保有配置
      const allConfigs = await this.#getAllConfigs();
      result.total = allConfigs.length;
      
      if (result.total === 0) {
        return { ...result, success: true, message: '无云盘配置需同步' };
      }
      
      const db = await getDB();
      // 逐个处理每个网盘配置
      for (const config of allConfigs) {
        const driveResult = {
          driveId: config.id,
          driveType: config.drive_type,
          success: false,
          successTables: [],
          failedTables: []
        };
      
        try {
          // 使用封装的业务表查询方法
          const tables = await getBusinessTables();
          // 逐个同步表
          for (const { name: tableName } of tables) {
            try {
              const tableInfo = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
              const updatedAtKey = tableInfo.find(f => f.name === 'updated_at')?.name
                || tableInfo.find(f => f.name === 'end_datetime')?.name
                || 'updated_at';
              
              await this.syncSingleTable({
                tableName,
                pk: 'id',
                updatedAtKey,
                mode: 'merge'
              }, config); // 传入当前网盘配置
              
              driveResult.successTables.push(tableName);
            } catch (err) {
              driveResult.failedTables.push({
                tableName,
                error: err.message || '同步失败'
              });
            }
          }
          
          driveResult.success = driveResult.failedTables.length === 0;
        } catch(err) {
          // 全局错误（如无配置、数据库异常）
          result.failedTables.push({
            tableName: '全局',
            error: err.message || '全局同步异常'
          });
        } finally {
          result.driveResults.push(driveResult);
        }
      }
      result.success = result.driveResults.some(d => d.success);
      return result;
    } catch (err) {
      result.driveResults.push({
        driveId: 'global',
        failedTables: [{
          tableName: '全局',
          error: err.message || '同步初始化异常'
        }]
      });
      return result;
    }
  }
  
  /**
   * 重置默认配置缓存（外部可调用，如配置修改后）
   */
  resetConfigCache() {
    this.#defaultConfig = null;
  }
}