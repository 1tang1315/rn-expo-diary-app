import React, { useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { categories } from "@/constants/commonConstans";

const CategoryTab = ({
  currentTab,
  setCurrentTab
}) => {
  const [showAllIconOnly, setShowAllIconOnly] = useState(false);
  const scrollRef = useRef(null);
  
  // 过滤出非固定标签
  const sortableTabs = useMemo(() => {
    return categories.filter(tab => !tab.isFixed);
  }, []);
  
  // 处理标签点击
  const handleTabPress = useCallback((tabId) => {
    if (tabId === 'all') {
      scrollRef.current?.scrollTo({ x: 0, animated: true });
    }
    setCurrentTab(tabId);
  }, [setCurrentTab]);
  
  return (
    <View style={styles.tabBar}>
      {/* 全部标签 */}
      <TouchableOpacity
        style={[styles.tabItem, currentTab === "all" && styles.activeTab]}
        onPress={() => handleTabPress("all")}
      >
        <MaterialIcons
          name="view-list"
          size={18}
          color={currentTab === "all" ? "#2196F3" : "#888888"}
        />
        {!showAllIconOnly && (
          <Text style={[styles.tabText, currentTab === "all" && styles.activeTabText]}>全部</Text>
        )}
      </TouchableOpacity>
      
      {/* 可滚动的分类标签 */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={e => setShowAllIconOnly(e.nativeEvent.contentOffset.x > 20)}
        scrollEventThrottle={16}
        style={styles.tabScrollView}
      >
        {sortableTabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, currentTab === tab.id && styles.activeTab]}
            onPress={() => handleTabPress(tab.id)}
          >
            <MaterialIcons
              name={tab.icon}
              size={18}
              color={currentTab === tab.id ? "#2196F3" : "#888888"}
            />
            <Text style={[styles.tabText, currentTab === tab.id && styles.activeTabText]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    boxShadow: '0 -2px 2px rgba(0, 0, 0, 0.1)',
    zIndex: 10
  },
  tabScrollView: {
    marginRight: 10,
    paddingVertical: 4,
    flexGrow: 0
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    whiteSpace: 'nowrap'
  },
  activeTab: {
    backgroundColor: '#E3F2FD'
  },
  tabText: {
    marginLeft: 6,
    color: '#888888',
    fontSize: 14,
    fontWeight: '500'
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600'
  }
});

export default CategoryTab;
