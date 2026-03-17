// 测试 AnalysisService 的重构功能
const { AnalysisService } = require('../core/service/analyse/AnalysisService');

// 模拟 AI 返回的文本
const mockAIText = `综合评估 评分：85
概述：你本周的整体状态良好，各项指标都在合理范围内。
得分原因：
- 睡眠质量较高，平均每天睡眠时间达到 7.5 小时
- 饮食均衡，摄入了足够的营养
- 运动频率适中，每周保持 3-4 次运动
- 工作效率良好，能够按时完成任务
- 生活平衡，有足够的休闲时间
- 情绪稳定，积极乐观
建议：
- 可以适当增加运动强度，提高心肺功能
- 注意保持规律的作息时间
- 多吃新鲜蔬菜水果，补充维生素
总结：继续保持良好的生活习惯，你的状态会越来越好。

睡眠分析 评分：80
概述：你的睡眠质量整体不错，但还有一些改进空间。
得分原因：
- 每天睡眠时间充足
- 入睡速度较快
建议：
- 睡前避免使用电子设备
- 保持卧室安静、舒适
总结：良好的睡眠是健康的基础，继续保持。

饮食分析 评分：90
概述：你的饮食习惯非常健康，营养搭配合理。
得分原因：
- 每天摄入足够的蛋白质
- 多吃蔬菜水果
- 控制油脂和糖分的摄入
建议：
- 可以增加一些粗粮的摄入
- 多喝水，保持身体水分充足
总结：继续保持良好的饮食习惯。

运动分析 评分：75
概述：你的运动频率适中，但运动强度可以适当增加。
得分原因：
- 每周保持 3-4 次运动
- 运动类型多样化
建议：
- 增加有氧运动的时间
- 尝试一些力量训练
总结：坚持运动，有助于保持身体健康。

效率分析 评分：85
概述：你的工作效率较高，能够有效地完成任务。
得分原因：
- 时间管理合理
- 专注度高
建议：
- 可以学习一些时间管理技巧
- 适当休息，避免过度劳累
总结：继续保持高效的工作状态。

生活平衡 评分：80
概述：你的生活比较平衡，工作和休闲时间分配合理。
得分原因：
- 有足够的休闲时间
- 能够兼顾家庭和工作
建议：
- 可以增加一些社交活动
- 培养一些兴趣爱好
总结：保持生活平衡，有助于提高生活质量。

情绪状态 评分：90
概述：你的情绪状态非常稳定，积极乐观。
得分原因：
- 心态良好
- 能够应对压力
建议：
- 继续保持积极的心态
- 学会放松自己
总结：良好的情绪状态是健康的重要组成部分。

总结：
你本周的整体状态良好，各项指标都在合理范围内。继续保持良好的生活习惯，注意适当增加运动强度，保持规律的作息时间，多吃新鲜蔬菜水果，你的状态会越来越好。`;

// 模拟昨日数据
const mockYesterdayData = {
  total: { score: 80 },
  sleep: { score: 75 },
  diet: { score: 85 },
  exercise: { score: 70 },
  efficiency: { score: 80 },
  balance: { score: 75 },
  emotion: { score: 85 }
};

// 测试函数
async function testAnalysisService() {
  const analysisService = new AnalysisService();
  
  console.log('=== 测试 parseAITextToStructured 函数 ===');
  const structured = await analysisService.parseAITextToStructured(mockAIText, '2026-03-16', 'test-hash');
  console.log('解析结果:', JSON.stringify(structured, null, 2));
  
  console.log('\n=== 测试 calculateScoreChanges 函数 ===');
  const changes = analysisService.calculateScoreChanges(structured, mockYesterdayData);
  console.log('分数变化:', changes);
  
  console.log('\n=== 测试 parseAndCompare 函数 ===');
  const result = await analysisService.parseAndCompare(mockAIText, '2026-03-16', mockYesterdayData, 'test-hash');
  console.log('最终结果:', JSON.stringify(result, null, 2));
}

// 运行测试
testAnalysisService().catch(console.error);
