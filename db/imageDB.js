import * as FileSystem from 'expo-file-system';
import { BASE_IMAGE_DIR } from "@/constants/commonConstans";

export const ImageDirType = {
  STORAGE: 'storage',    // 储物相关图片
  DIARY: 'diary',        // 日记相关图片
  SYSTEM: 'system',      // 系统x相关图片
};

/**
 * 确保指定目录存在（不存在则创建）
 * @param {string} dirPath - 需要检查的目录路径
 */
const ensureDirExists = async (dirPath) => {
  const exists = await FileSystem.getInfoAsync(dirPath);
  if (!exists.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
};

/**
 * 将外部图片（相机/相册）复制到应用私有目录的指定分类中
 * @param {string} sourceUri - 原始图片URI（如相机返回的临时URI）
 * @param {string} type - 图片分类（必须是 ImageDirType 中的值）
 * @returns {string} 私有目录中的图片路径（用于存入数据库）
 */
export async function saveImageToLocal(sourceUri, type = ImageDirType.STORAGE) {
  // 校验分类类型合法性
  const validTypes = Object.values(ImageDirType);
  if (!validTypes.includes(type)) {
    throw new Error(`无效的图片分类类型: ${type}，允许的值: ${validTypes.join(', ')}`);
  }
  
  // 生成目标分类目录（如 images/storage/、images/diary/ 等）
  const targetDir = `${BASE_IMAGE_DIR}${type}/`;
  await ensureDirExists(targetDir);
  
  // 生成唯一文件名（时间戳+随机数+原始扩展名，避免重复）
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const ext = sourceUri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `img_${timestamp}_${random}.${ext}`;
  const destUri = `${targetDir}${fileName}`;
  
  // 复制文件到目标目录
  await FileSystem.copyAsync({
    from: sourceUri,
    to: destUri,
  });
  
  return destUri;
}

/**
 * 从私有目录删除图片（支持任意分类下的图片）
 * @param {string} imagePath - 数据库中存储的图片完整路径
 */
export const deleteLocalImage = async (imagePath) => {
  if (!imagePath) return;
  try {
    const exists = await FileSystem.getInfoAsync(imagePath);
    if (exists.exists) {
      await FileSystem.deleteAsync(imagePath);
    }
  } catch (error) {
    console.error('删除本地图片失败:', error);
  }
};