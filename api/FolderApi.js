/**
 * 文件夹 API 类，封装文件夹控制器的方法
 */
import { FolderController } from '@/core/controller';
import { BaseApi } from './BaseApi';

/**
 * 文件夹 API 类，封装文件夹控制器的方法
 */
class FolderApi extends BaseApi {
  constructor() {
    super(new FolderController());
  }
}

export const folderApi = new FolderApi();
