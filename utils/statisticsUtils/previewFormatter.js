import dayjs from "dayjs";
import { processStatistics } from "@/utils/statisticsUtils";
import { formatDurationByMinutes } from "@/utils/formatTimeUtils";
import { categories } from "@/constants/commonConstans";
import { Text, View } from "react-native";
import PieChart from "@/components/chart/PieChart";

// 分类ID转中文名称
export const getCategoryName = (categoryId) => {
  if (!categoryId) return "无分类";
  const matchedCategory = categories.find(cat => cat.id === categoryId);
  return matchedCategory?.name || categoryId;
};

// 生成纯文本内容
export const getPlainTextContent = (format, eventsByDate, queryStart, queryEnd, dateRangeText) => {
  switch (format) {
    case "txt":
      return Object.entries(eventsByDate).map(([date, dayEvents]) => {
        const dayHeader = `📅 日期：${date}\n📊 事件总数：${dayEvents.length} 个\n`;
        const dayEventsText = dayEvents.map(e =>
          `${dayjs(e.start_datetime).format("HH:mm")}~${dayjs(e.end_datetime).format("HH:mm")}: ${e.title || getCategoryName(e.category) || "无标题"}` +
          `${e.description ? `\n详情: ${e.description}` : ""}`
        ).join("\n\n");
        return `${dayHeader}\n${dayEventsText}`;
      }).join("\n\n");
    
    case "markdown":
      return Object.entries(eventsByDate).map(([date, dayEvents]) => {
        const dayHeader = `## 📅 ${date}\n\n### 📊 当日统计\n事件总数：${dayEvents.length} 个\n\n`;
        const dayEventsText = dayEvents.map(e =>
          `${dayjs(e.start_datetime).format("HH:mm")}~${dayjs(e.end_datetime).format("HH:mm")}: ${e.title || getCategoryName(e.category) || "无标题"}` +
          `${e.description ? `\n详情: ${e.description}` : ""}`
        ).join("\n\n");
        return `${dayHeader}${dayEventsText}`;
      }).join("\n\n");
    
    default:
      return "";
  }
};

// 生成不同格式的预览内容
export const formatPreviewContent = (selectedFormat, eventsByDate, queryStart, queryEnd, events, styles, dateRangeText) => {
  switch (selectedFormat) {
    case "image":
      const imageDailyBlocks = Object.entries(eventsByDate).map(([date, dayEvents]) => {
        const dayEventsText = dayEvents.map(e =>
          `${dayjs(e.start_datetime).format("HH:mm")}~${dayjs(e.end_datetime).format("HH:mm")}: ${e.title || getCategoryName(e.category) || "无标题"}` +
          `${e.description ? `\n详情: ${e.description}` : ""}`
        ).join("\n\n");
        
        const dayStats = processStatistics(dayEvents);
        const dayTotalDuration = formatDurationByMinutes(dayStats.totalMinutes);
        
        return (
          <View key={date} style={styles.imageDailyBlock}>
            <Text style={styles.imageDailyHeader}>📅 日期：{date}</Text>
            <Text style={styles.imageDailySubHeader}>事件总数：{dayEvents.length} 个 | 总时长：{dayTotalDuration}</Text>
            <Text style={styles.imageDailyEvents}>{dayEventsText}</Text>
            <PieChart data={dayStats.chartData} title="当日事件分类统计" style={styles.imageDailyChart} />
          </View>
        );
      });
      
      const imageTotalStats = processStatistics(events);
      const imageTotalDuration = formatDurationByMinutes(imageTotalStats.totalMinutes);
      const imageTotalBlock = queryStart.isSame(queryEnd, "day") ? null : (
        <View style={styles.imageTotalBlock}>
          <Text style={styles.imageTotalHeader}>📊 总范围统计（{dateRangeText}）</Text>
          <Text style={styles.imageTotalSubHeader}>事件总数：{events.length} 个 | 总时长：{imageTotalDuration}</Text>
          <PieChart data={imageTotalStats.chartData} title="总范围事件分类统计" style={styles.imageTotalChart} />
        </View>
      );
      
      return <View style={styles.imagePreviewContainer}>{imageDailyBlocks}{imageTotalBlock}</View>;
    
    default:
      return <Text></Text>;
  }
};
