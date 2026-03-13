import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ThemeCard from '@/components/theme/ThemeCard';
import { useTheme } from '@/context/ThemeContext';

const MOCK_EVENT_DATA = {
  sleep: [
    {
      category: '睡眠',
      totalDuration: '8.0小时',
      contribution: '88分',
      events: [
        {
          timeRange: '12:53~13:36',
          duration: '43分钟',
          title: '午睡',
          description: '幻想自己很有钱，直接有两百万，然后随便玩。'
        },
        {
          timeRange: '23:33~06:49',
          duration: '7小时16分钟',
          title: '晚寝',
          description: '今晚玩游戏又有点晚了，睡得又有点迟了。又梦到了高中时代...好困呐，都不想起来。'
        }
      ]
    }
  ],
  mood: [
    {
      category: '情绪',
      totalDuration: '4.0小时',
      contribution: '75分',
      events: [
        {
          timeRange: '08:00~09:00',
          duration: '1小时',
          title: '晨间冥想',
          description: '感觉非常平静，对新的一天充满期待。'
        },
        { timeRange: '19:00~20:00', duration: '1小时', title: '阅读', description: '读了一本很有趣的小说，心情很愉快。' }
      ]
    }
  ],
  productivity: [
    {
      category: '效率',
      totalDuration: '6.5小时',
      contribution: '92分',
      events: [
        { timeRange: '09:30~11:30', duration: '2小时', title: '深度工作', description: '完成了项目报告的核心部分。' },
        { timeRange: '14:00~16:00', duration: '2小时', title: '会议', description: '团队周会，讨论了下季度的目标。' },
        { timeRange: '16:30~19:00', duration: '2.5小时', title: '代码开发', description: '修复了几个关键bug。' }
      ]
    }
  ],
  exercise: [
    {
      category: '运动',
      totalDuration: '1.5小时',
      contribution: '85分',
      events: [
        { timeRange: '07:00~07:30', duration: '30分钟', title: '晨跑', description: '空气很好，跑了3公里。' },
        { timeRange: '18:00~19:00', duration: '1小时', title: '健身房', description: '练了胸肌和三头肌。' }
      ]
    }
  ],
  diet: [
    {
      category: '饮食',
      totalDuration: '1.2小时',
      contribution: '80分',
      events: [
        { timeRange: '08:00~08:20', duration: '20分钟', title: '早餐', description: '燕麦粥 + 鸡蛋。' },
        { timeRange: '12:30~13:00', duration: '30分钟', title: '午餐', description: '鸡胸肉沙拉。' },
        { timeRange: '19:00~19:30', duration: '30分钟', title: '晚餐', description: '清蒸鱼 + 时蔬。' }
      ]
    }
  ],
  balance: [
    {
      category: '平衡',
      totalDuration: '2.0小时',
      contribution: '70分',
      events: [
        { timeRange: '20:00~21:00', duration: '1小时', title: '家庭时光', description: '陪家人聊天看电视。' },
        { timeRange: '21:00~22:00', duration: '1小时', title: '自我反思', description: '写日记，规划明天。' }
      ]
    }
  ],
  total: []
};

// Aliases for compatibility
MOCK_EVENT_DATA.emotion = MOCK_EVENT_DATA.mood;
MOCK_EVENT_DATA.sport = MOCK_EVENT_DATA.exercise;

export default function CategoryEventList({ category }) {
  const { theme } = useTheme();
  
  const data = useMemo(() => {
    return MOCK_EVENT_DATA[category] || [];
  }, [category]);
  
  if(!data || data.length === 0) return null;
  
  return (
    <>
      {data.map((group, groupIndex) => (
        <ThemeCard key={`${group.category}-${groupIndex}`}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
              {group.category}
            </Text>
            <Text style={[styles.groupDuration, { color: theme.colors.subText || '#666' }]}>
              （时长：{group.totalDuration}）
            </Text>
          </View>
          
          <>
            {group.events.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <View style={styles.eventHeaderLine}>
                  <Text style={[styles.bullet, { color: theme.colors.primary }]}>•</Text>
                  <Text style={[styles.timeRange, { color: theme.colors.text }]}>{event.timeRange}</Text>
                  <Text
                    style={[{ color: theme.colors.subText || '#666' }]}>
                    ({event.duration})：
                  </Text>
                  <Text style={[styles.eventTitle, { color: theme.colors.text }]}>{event.title}</Text>
                </View>
                {event.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={[styles.eventDescription, { color: theme.colors.subText || theme.colors.text }]}>
                      {event.description}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </>
          
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.contributionLabel, { color: theme.colors.text }]}>维度贡献：</Text>
            <Text style={[styles.contributionValue, { color: theme.colors.primary }]}>
              {group.category}: {group.contribution}
            </Text>
          </View>
        </ThemeCard>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupDuration: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  eventItem: {
    marginBottom: 8,
  },
  eventHeaderLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 4,
    marginTop: 0,
  },
  timeRange: {
    fontWeight: '500',
  },
  eventTitle: {
    fontWeight: 'bold',
  },
  descriptionContainer: {
    flexDirection: 'row',
    paddingLeft: 18,
    paddingRight: 4,
  },
  eventDescription: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  contributionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  contributionValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  }
});
