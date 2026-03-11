import CloudSyncController from '@/core/controller/CloudSyncController';

class CloudSyncApi {
  constructor() {
    this.cloudSyncController = new CloudSyncController();
  }

  async testConnection(config) {
    return await this.cloudSyncController.testConnection(config);
  }

  async syncAllAuto(driveConfigs) {
    return await this.cloudSyncController.syncAllAuto(driveConfigs);
  }

  async syncSingleTableSafe(tableName, config, updatedAtKey = 'updated_at') {
    return await this.cloudSyncController.syncSingleTableSafe(tableName, config, updatedAtKey);
  }
}

export default new CloudSyncApi();
