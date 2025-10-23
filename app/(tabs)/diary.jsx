import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { getAllNotes } from '@/db/notesDB';
import dayjs from 'dayjs';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / 4;

const TABS = ["全部", "日记"];

export default function Diary() {
  const [activeTab, setActiveTab] = useState("全部");
  const translateX = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const [diaries, setDiaries] = useState([]);
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      const allDiaries = await getAllNotes();
      const formattedData = allDiaries.map(diary => ({
        id: diary.id,
        title: diary.title,
        content: diary.content.substring(0, 100),
        time: diary.updated_at,
      }));
      setDiaries(formattedData);
    };
    
    loadData().then();
    
    return navigation.addListener('focus', loadData);
  }, [navigation]);
  
  // 基于dayjs的动态过滤逻辑
  const filterData = () => {
    const now = dayjs();
    if (activeTab === "全部") return diaries;
    if (activeTab === "年") {
      return diaries.filter(item => dayjs(item.time).year() === now.year());
    }
    if (activeTab === "月") {
      return diaries.filter(item =>
        dayjs(item.time).year() === now.year() &&
        dayjs(item.time).month() === now.month()
      );
    }
    if (activeTab === "日") {
      return diaries.filter(item => dayjs(item.time).isSame(now, 'day'));
    }
    return diaries;
  };
  
  // 列表项点击跳转详情页
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('diary-edit', { nodeId: item.id })}
    >
      <Text style={styles.itemTitle}>{item.title}</Text>
      <Text numberOfLines={1} style={styles.itemContent}>
        {item.content}
      </Text>
      <Text style={styles.itemTime}>
        {dayjs(item.time).format('YYYY-MM-DD dddd')}
      </Text>
    </TouchableOpacity>
  );
  
  // 列表为空时显示提示
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无日记记录</Text>
      <Text style={styles.emptySubText}>切换标签或等待自动生成</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 顶部 Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabsRow}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab, index)}
            >
              <Text style={activeTab === tab ? styles.activeTabText : styles.tabText}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Animated.View style={[styles.tabIndicator, { transform: [{ translateX }] }]} />
      </View>
      
      {/* 内容列表 */}
      <FlatList
        contentContainerStyle={styles.flatList}
        numColumns={2}
        data={filterData()}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
      />
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('diary-edit')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );

  function handleTabPress(tab, index) {
    setActiveTab(tab);
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
    }).start();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafd"
  },
  tabsContainer: {
    position: "relative",
    marginBottom: 4,
    paddingVertical: 8,
    backgroundColor: '#fff'
  },
  tabsRow: {
    flexDirection: "row"
  },
  tabButton: {
    width: TAB_WIDTH,
    alignItems: "center",
    paddingVertical: 5
  },
  tabText: {
    fontSize: 16,
    color: "#888"
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },
  tabIndicator: {
    position: "absolute",
    bottom: 8,
    left: TAB_WIDTH / 4,
    width: TAB_WIDTH / 2,
    height: 2,
    backgroundColor: "#333"
  },
  flatList: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff"
  },
  listItem: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f6f6f6",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold"
  },
  itemContent: {
    marginTop: 4,
    color: "#555"
  },
  itemTime: {
    marginTop: 4,
    fontSize: 12,
    color: "#999"
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40
  },
  emptyText: {
    fontSize: 16,
    color: "#666"
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100
  }
});