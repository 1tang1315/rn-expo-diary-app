import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { AsyncStorage } from "expo-sqlite/kv-store";
import { AiService } from "@/core/service/AiService";
import { noteApi, folderApi } from "@/api";
import { eventApi } from "@/api/EventApi";
import { getPlainTextContent } from "@/utils/previewFormatter";

dayjs.extend(customParseFormat);

/** 与数据库初始化、自动生成日记使用的「日记」分类名称一致 */
export const DIARY_FOLDER_NAME = '日记';

/** 与批量生成 / 自动生成共用的默认用户提示词 */
export const DEFAULT_DIARY_AI_USER_PROMPT = `请按分类逐一总结：
     1.当日核心事件（简要）
     2.存在的问题与不足
     3.次日改进建议
     返回纯文本格式，无需markdown，语言简洁明了。`;

/**
 * 从 AsyncStorage 读取配置并构造 AiService；未配置密钥时返回说明文案
 * @returns {Promise<{ service: AiService|null, error: string|null }>}
 */
export const createAiDiaryServiceFromStorage = async () => {
  const [apiKey, model, apiBaseUrl] = await Promise.all([
    AsyncStorage.getItem('AI_DIARY_API_KEY'),
    AsyncStorage.getItem('AI_DIARY_MODEL'),
    AsyncStorage.getItem('AI_DIARY_API_BASE_URL')
  ]);
  if (!apiKey || apiKey.trim() === '') {
    return { service: null, error: '请先在设置中配置 AI 日记 API 密钥' };
  }
  const service = new AiService(
    apiKey.trim(),
    model || 'Qwen/Qwen3-8B',
    apiBaseUrl || 'https://api.siliconflow.cn/v1'
  );
  return { service, error: null };
};

/**
 * 拉取某日事件并转为与生成日记一致的纯文本
 * @param {string} dateStr YYYY-MM-DD
 */
export const getEventsPlainTextForDiaryDate = async (dateStr) => {
  const events = await eventApi.getByDateRangeAndCategory({
    startDate: dateStr,
    endDate: dateStr,
    sortOrder: 'asc'
  });
  const text = getPlainTextContent('txt', events);
  return { events, text };
};

/** 日记标题是否为 YYYY-MM-DD（AI 日记用标题存日期） */
export const isDiaryDateTitle = (title) => {
  if (!title || typeof title !== 'string') return false;
  return dayjs(title.trim(), 'YYYY-MM-DD', true).isValid();
};

export const getOrCreateFolder = async (folderName) => {
  const folders = await folderApi.getAll();
  let targetFolder = folders.find(f => f.name === folderName);
  if (!targetFolder) {
    const folderId = await folderApi.create({ name: folderName });
    targetFolder = await folderApi.getById(folderId);
  }
  return targetFolder;
};

/**
 * 自动生成前一天的日记（如果不存在）
 */
export const autoGenerateYesterdayDiary = async () => {
  try {
    // 加载AI服务配置
    const [apiKey, model, apiBaseUrl] = await Promise.all([
      AsyncStorage.getItem('AI_DIARY_API_KEY'),
      AsyncStorage.getItem('AI_DIARY_MODEL'),
      AsyncStorage.getItem('AI_DIARY_API_BASE_URL')
    ]);
    
    if (!apiKey || apiKey.trim() === '') {
      console.log('未配置API密钥，跳过自动生成');
      return;
    }
    
    // 初始化AI服务
    const aiDiaryService = new AiService(
      apiKey.trim(),
      model || 'Qwen/Qwen3-8B',
      apiBaseUrl || 'https://api.siliconflow.cn/v1'
    );
    
    // 获取前一天日期
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    // 检查日记是否已存在
    const diaryFolder = await getOrCreateFolder(DIARY_FOLDER_NAME);
    const existsResponse = await noteApi.checkDiaryExists(yesterday);
    const exists = existsResponse.exists;
    if (exists) {
      console.log(`[${yesterday}] 日记已存在，跳过生成`);
      return;
    }
    
    // 检查是否有前一天的事件数据
    const dailyEvents = await eventApi.getByDateRangeAndCategory({ startDate: yesterday, endDate: yesterday, sortOrder: "asc" });
    if (dailyEvents.length === 0) {
      console.log(`[${yesterday}] 无事件数据，跳过生成`);
      return;
    }
    
    // 生成日记提示词
    const dailyEventsText = getPlainTextContent("txt", dailyEvents);
    const dailyPrompt = aiDiaryService.generateDiaryPrompt(
      yesterday,
      yesterday,
      dailyEventsText,
      DEFAULT_DIARY_AI_USER_PROMPT
    );
    
    // 调用AI生成
    const { output } = await aiDiaryService.generateContent(dailyPrompt);
    
    // 保存日记
    if (!output || output.trim() === '') {
      throw new Error('AI 生成的日记内容为空');
    }
    
    await noteApi.create({
      folderId: diaryFolder.id,
      title: yesterday,
      content: output.trim()
    });
    console.log(`[${yesterday}] 日记生成并保存成功`);
  } catch (error) {
    // 增强错误日志
    console.error('自动生成日记失败：', {
      message: error.message,
      stack: error.stack?.substring(0, 200),
      date: dayjs().format('YYYY-MM-DD HH:mm:ss')
    });
  }
};