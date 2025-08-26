import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Calendar from "@/components/Calendar";
import Editor from "@/components/Editor";

export default function Home() {
  // 示例数据
  const [selectedDate, setSelectedDate] = useState('2023-08-20');
  const diaryList = [
    {
      date: '2023-08-20',
      title: '早晨·咖啡时间',
      tags: ['Morning', 'Author'],
      content: ['喝咖啡，写日记', '整理思路', '保持好心情。'],
      code: `function onGo() {\n  console.log('早安');\n}`
    }
  ];
  
  return (
    <SafeAreaView style={{flex: 1}}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>清新日记</Text>
      </View>
      
      <ScrollView>
        {/* 日历 */}
        <Calendar />
        
        {/* 编辑器 */}
        <Editor />
        
        {/* 日期与时间 */}
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>2023年8月20日 周三</Text>
          <Text style={styles.timeText}>11:03:59</Text>
        </View>
        
        {/* 日记内容 */}
        <View style={styles.diaryList}>
          {diaryList.map((item, idx) => (
            <View key={idx} style={styles.diaryCard}>
              <Text style={styles.diaryTitle}>{item.title}</Text>
              <View style={styles.tagRow}>
                {item.tags.map(tag => (
                  <Text key={tag} style={styles.tag}>{tag}</Text>
                ))}
              </View>
              <View style={styles.diaryContent}>
                {item.content.map((line, i) => (
                  <Text key={i} style={styles.diaryText}>{line}</Text>
                ))}
              </View>
              <View style={styles.codeBox}>
                <Text style={styles.codeTitle}>写了写代码：JavaScript 闹钟与控制台输出。</Text>
                <Text style={styles.code}>{item.code}</Text>
              </View>
            </View>
          ))}
        </View>
        {/* 新增按钮 */}
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd'
  },
  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffb300'
  },
  calendarText: { fontSize: 18, color: '#333' },
  dateBox: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 16, marginBottom: 8 },
  dateText: { fontSize: 16, color: '#666' },
  timeText: { fontSize: 16, color: '#666' },
  diaryList: { flex: 1, marginHorizontal: 8 },
  diaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  diaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tag: {
    backgroundColor: '#e0f7fa',
    color: '#00796b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8
  },
  diaryContent: { marginBottom: 8 },
  diaryText: { fontSize: 15, color: '#444', marginBottom: 2 },
  codeBox: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8 },
  codeTitle: { fontSize: 13, color: '#888', marginBottom: 4 },
  code: { fontFamily: 'monospace', fontSize: 13, color: '#333' },
  addBtn: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3
  },
  addBtnText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
});
