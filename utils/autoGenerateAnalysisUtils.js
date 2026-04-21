import { analyseApi, eventApi } from "@/api";
import dayjs from "dayjs";

const hasValidDashboardData = (scoreResult) => {
  if (!scoreResult) return false;
  return (
    scoreResult.totalScore > 0 ||
    Object.values(scoreResult.scores || {}).some((score) => score > 0)
  );
};

/**
 * 自动生成前一天的 AI 分析（如果存在事件且尚未生成）
 */
export const autoGenerateYesterdayAnalysis = async () => {
  try {
    const yesterday = dayjs().subtract(1, "day");
    const startDate = yesterday.startOf("day").toDate();
    const endDate = yesterday.endOf("day").toDate();

    const events = await eventApi.getByDateRangeAndCategory({
      startDate,
      endDate,
    });
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }

    const dashboard = await analyseApi.getDashboard({ startDate, endDate });
    if (hasValidDashboardData(dashboard)) {
      return;
    }

    await analyseApi.generateAiReport({
      startDate,
      endDate,
      forceRefresh: false,
    });
  } catch (error) {
    console.error("自动生成前一天 AI 分析失败：", error);
  }
};
