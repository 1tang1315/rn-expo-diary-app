import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * 分类标签组件
 * @param {object} props - 组件属性
 * @param {string} props.currentTab - 当前选中的标签ID
 * @param {function} props.setCurrentTab - 切换标签的回调函数
 * @param {Array<object>} props.categories - 分类数据列表
 */
const CategoryTab = ({
  categories,
  currentTab,
  setCurrentTab,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current; // 用于折叠/展开动画
  
  // 分离固定标签和可滚动标签
  const { fixedTabs, scrollableTabs } = useMemo(() => {
    const fixed = categories?.filter(tab => tab.isFixed);
    const scrollable = categories?.filter(tab => !tab.isFixed);
    return { fixedTabs: fixed, scrollableTabs: scrollable };
  }, [categories]);
  
  // 处理标签点击
  const handleTabPress = useCallback(
    (tabId) => {
      const clickedFixedTab = fixedTabs?.some(tab => tab.id === tabId);
      
      if (clickedFixedTab && isScrolled) {
        scrollRef.current?.scrollTo({ x: 0, animated: true });
      }
      setCurrentTab(tabId);
    },
    [setCurrentTab, fixedTabs, isScrolled]
  );
  
  // 处理滚动事件，判断是否需要折叠固定标签
  const handleScroll = useCallback((event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    
    // 当滚动超过20像素时，折叠固定标签
    if (scrollPosition > 20 && !isScrolled) {
      setIsScrolled(true);
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    // 当滚动回到最左边时，展开固定标签
    else if (scrollPosition <= 0 && isScrolled) {
      setIsScrolled(false);
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isScrolled, scaleAnim]);
  
  // 渲染单个标签
  const renderTab = (tab, isFixed = false) => {
    const isActive = currentTab === tab.id;
    const hasIcon = !!tab.icon || !!tab.emoji;
    
    // 判断是否需要显示默认图标（无自定义图标且固定标签处于折叠状态）
    const shouldShowDefaultIcon = !hasIcon && isFixed && isScrolled;
    
    // 对于固定标签，根据滚动状态决定是否显示文字
    const shouldShowText = !isFixed || !isScrolled;
    
    return (
      <TouchableOpacity
        key={tab.id}
        style={[
          styles.tabItem,
          isActive && styles.activeTab,
          isFixed && isScrolled && styles.collapsedFixedTab
        ]}
        onPress={() => handleTabPress(tab.id)}
        activeOpacity={0.8}
      >
        {hasIcon || shouldShowDefaultIcon ? (
          <Animated.View style={{ transform: [{ scale: isFixed && isScrolled ? scaleAnim : 1 }] }}>
            {shouldShowDefaultIcon ? (
              // 折叠时显示默认图标
              <MaterialIcons
                name="view-list"
                size={20}
                color={isActive ? "#2196F3" : "#888888"}
              />
            ) : tab.icon ? (
              // 原有自定义图标渲染
              <MaterialIcons
                name={tab.icon}
                size={isFixed && isScrolled ? 20 : 18}
                color={isActive ? "#2196F3" : "#888888"}
              />
            ) : (
              // 原有emoji渲染
              <Text style={{ fontSize: isFixed && isScrolled ? 20 : 18 }}>{tab.emoji}</Text>
            )}
          </Animated.View>
        ) : null}
        
        {/* 仅在非固定标签或固定标签未折叠时显示文字 */}
        {shouldShowText && (
          <Text
            style={[
              styles.tabText,
              isActive && styles.activeTabText,
              !hasIcon && styles.tabTextNoIcon
            ]}
          >{tab.name}</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {/* 渲染固定标签 */}
        <View>
          {fixedTabs?.map(tab => renderTab(tab, true))}
        </View>
        
        {/* 渲染可滚动的标签 */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {scrollableTabs?.map(tab => renderTab(tab))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scrollContentContainer: {
    paddingVertical: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  collapsedFixedTab: {
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: '#E3F2FD',
  },
  tabText: {
    marginLeft: 6,
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextNoIcon: {
    marginLeft: 0,
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default CategoryTab;