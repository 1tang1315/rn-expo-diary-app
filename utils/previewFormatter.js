import dayjs from "dayjs";
import { processStatistics } from "@/utils/statisticsUtils";
import { formatDurationByMinutes, getTotalMinutes } from "@/utils/formatTimeUtils";
import { Text, View } from "react-native";
import PieChart from "@/components/chart/PieChart";
import { getCategoryName } from "@/utils/categoryUtils";
import { categories } from "@/constants/commonConstans";

// 按日期分组事件
function groupEventsByDate (events) {
  // 使用数组的 reduce 方法进行分组
  return events.reduce((acc, event) => {
    // 睡眠分类使用结束日期作为归属日期，其他分类使用开始日期
    const eventDate = event.category === 'sleep' 
      ? dayjs(event.endDatetime).format('YYYY-MM-DD')
      : dayjs(event.startDatetime).format('YYYY-MM-DD');
    
    // 如果累加器 (acc) 中还没有这个日期的数组，就先创建一个空数组
    if(!acc[eventDate]) {
      acc[eventDate] = [];
    }
    
    // 将当前事件推入对应日期的数组中
    acc[eventDate].push(event);
    
    // 返回累加器，继续下一次迭代
    return acc;
  }, {}); // 初始化一个空对象作为累加器
}

function formatDayEvents(date, dayEvents, mode="txt" ) {
  const presets = {
    txt: { headerLevel: "", itemPrefix: "", detailPrefix: "" },
    markdown: { headerLevel: "# ", itemPrefix: "- ", detailPrefix: "\t" }
  };
  const options = presets[mode];
  
  const totalDuration = dayEvents.reduce((sum, e) => sum + getTotalMinutes(e.startDatetime, e.endDatetime), 0);
  
  const dayHeader = `${options.headerLevel}📅 日期: ${date}
📊 事件总数: ${dayEvents.length} 个
⏱️ 总时长: ${formatDurationByMinutes(totalDuration)}`;
  
  // 分类
  const eventsByCategory = categories
    .filter(c => c.name !== "全部")
    .reduce((acc, c) => {
      acc[c.name] = { events: [], totalDuration: 0, emoji: c.emoji };
      return acc;
    }, {});
  
  dayEvents.forEach(e => {
    const categoryName = getCategoryName(e.category) || "未分类";
    const duration = getTotalMinutes(e.startDatetime, e.endDatetime);
    eventsByCategory[categoryName].events.push(e);
    eventsByCategory[categoryName].totalDuration += duration;
  });
  
  // 分类文本
  const categorySections = Object.entries(eventsByCategory).map(([category, { events, totalDuration }]) => {
    if (totalDuration === 0) return null;
    const categoryConfig = categories.find(c => c.name === category);
    const categoryEmoji = categoryConfig ? categoryConfig.emoji : "📁";
    const categoryHeader = `${categoryEmoji} ${category}: ${formatDurationByMinutes(totalDuration)}`;
    
    const categoryEventsText = events
      .map(e => {
        const duration = getTotalMinutes(e.startDatetime, e.endDatetime);
        return `${options.itemPrefix}${dayjs(e.startDatetime).format("HH:mm")}~${dayjs(e.endDatetime).format("HH:mm")} (${formatDurationByMinutes(duration)}): ${e.title || "无标题"}${e.description ? `\n${options.detailPrefix}详情: ${e.description}` : ""}`;
      })
      .join("\n");
    
    return `${categoryHeader}\n${categoryEventsText}`;
  }).filter(Boolean);
  
  return `${dayHeader}\n\n${categorySections.join("\n\n")}`;
}

function formatEvents(eventsByDate, mode = "txt") {
  return Object.entries(eventsByDate)
    .map(([date, dayEvents]) => formatDayEvents(date, dayEvents, mode))
    .join("\n\n");
}

// 生成纯文本内容
export const getPlainTextContent = (format, events) => {
  // 按日期分组事件
  const eventsByDate = groupEventsByDate(events);
  
  switch(format) {
    case "txt":
      return formatEvents(eventsByDate, "txt");
    
    case "markdown":
      return formatEvents(eventsByDate, "markdown");
    default:
      return "";
  }
};

// 生成不同格式的预览内容
export const formatPreviewContent = (selectedFormat, queryStart, queryEnd, events, styles, dateRangeText) => {
  const eventsByDate = groupEventsByDate(events);
  
  switch(selectedFormat) {
    case "image":
      const imageDailyBlocks = Object.entries(eventsByDate).map(([date, dayEvents]) => {
        const dayStats = processStatistics(dayEvents);
        const dayTotalDuration = formatDurationByMinutes(dayStats.totalMinutes);
        
        return (
          <View key={date} style={styles.imageDailyBlock}>
            <Text style={styles.imageDailyEvents}>
              {formatDayEvents(date, dayEvents)}
            </Text>
            <PieChart
              data={dayStats.chartData}
              title={`总时长: ${dayTotalDuration}`}
              style={styles.imageDailyChart}
            />
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
