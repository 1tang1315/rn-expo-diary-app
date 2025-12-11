import dayjs from 'dayjs';
import { AsyncStorage } from "expo-sqlite/kv-store";
import AiDiaryService from "@/db/services/AiDiaryService";
import { checkDiaryExists, createFolder, createNote, getFolderById, getFoldersWithNoteCount } from "@/db/notesDB";
import { getEventsByDateRange } from "@/db/eventDB";
import { getPlainTextContent } from "@/utils/previewFormatter";

export const getOrCreateFolder = async (folderName) => {
  const folders = await getFoldersWithNoteCount();
  let targetFolder = folders.find(f => f.name === folderName);
  if (!targetFolder) {
    const folderId = await createFolder({ name: folderName });
    targetFolder = await getFolderById(folderId);
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
    const aiDiaryService = new AiDiaryService(
      apiKey.trim(),
      model || 'Qwen/Qwen3-8B',
      apiBaseUrl || 'https://api.siliconflow.cn/v1'
    );
    
    // 获取前一天日期
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    
    // 检查日记是否已存在
    const diaryFolder = await getOrCreateFolder('日记');
    const exists = await checkDiaryExists(yesterday, diaryFolder.id);
    if (exists) {
      console.log(`[${yesterday}] 日记已存在，跳过生成`);
      return;
    }
    
    // 检查是否有前一天的事件数据
    const dailyEvents = await getEventsByDateRange(yesterday, yesterday, "asc");
    if (dailyEvents.length === 0) {
      console.log(`[${yesterday}] 无事件数据，跳过生成`);
      return;
    }
    
    // 生成日记提示词
    const dailyEventsText = getPlainTextContent("txt", dailyEvents);
    const prompt = `请按分类逐一总结：
     1.当日核心事件（简要）
     2.存在的问题与不足
     3.次日改进建议
     返回纯文本格式，无需markdown，语言简洁明了。`;
    const dailyPrompt = aiDiaryService.generateDiaryPrompt(
      yesterday,
      yesterday,
      dailyEventsText,
      prompt
    );
    console.log(`[${yesterday}] 生成提示词：`, dailyPrompt.substring(0, 100) + '...');
    
    // 调用AI生成
    console.log(`[${yesterday}] 开始生成日记...`);
    const { output } = await aiDiaryService.generateContent(dailyPrompt, {
      onThought: (partialThought) => {
        console.log(`[${yesterday}] 思考中：`, partialThought.substring(0, 50) + '...');
      },
      onOutput: (partialOutput) => {
        console.log(`[${yesterday}] 生成中：`, partialOutput.substring(0, 50) + '...');
      }
    });
    
    // 保存日记
    if (!output || output.trim() === '') {
      throw new Error('AI生成的日记内容为空');
    }
    
    await createNote({
      folder_id: diaryFolder.id,
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