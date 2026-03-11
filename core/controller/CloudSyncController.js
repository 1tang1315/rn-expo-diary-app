import { CloudSyncService } from '@/core/service';

class CloudSyncController {
  constructor() {
    this.cloudSyncService = new CloudSyncService();
  }

  async testConnection(config) {
    return await this.cloudSyncService.testConnection(config);
  }

  async syncAllAuto(driveConfigs) {
    return await this.cloudSyncService.syncAllAuto(driveConfigs);
  }

  async syncSingleTableSafe(tableName, config, updatedAtKey = 'updated_at') {
    return await this.cloudSyncService.syncSingleTableSafe(tableName, config, updatedAtKey);
  }
}

export default CloudSyncController;
