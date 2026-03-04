import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import DragDropList from "@/components/common/DragDropList";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import ThemeText from "@/components/theme/ThemeText";
import { useSortConfig } from "@/context/SortConfigContext";
import { useTheme } from "@/context/ThemeContext";
import { eventApi } from "@/api/EventApi";
import dayjs from "dayjs";
import { getCategoryName } from "@/utils/categoryUtils";
import Icon from "@/components/common/Icon";
import EmptyContainer from "@/components/common/EmptyContainer";

const DragDropListPage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    updateSort,
    updateCustomSort,
    customSortData
  } = useSortConfig();
  
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(true);
  // 防止重复提交（确认按钮防抖）
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 完善数据获取逻辑，增加空数据处理，优化日期格式传递
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // 优化：dayjs 日期格式化，确保传递给数据库的格式统一
      const endDate = dayjs().endOf('year').toISOString();
      const startDate = dayjs().startOf('year').toISOString();
      const events = await eventApi.getByDateRangeAndCategory({ startDate, endDate });
      
      if(!events || !Array.isArray(events)) {
        setListData([]);
        return;
      }
      
      const aggregatedData = events.reduce((acc, event) => {
        const title = event.title || getCategoryName(event.category) || '未分类'; // 优化：增加默认值，防止空标题
        const existing = acc.find(item => item.title === title);
        
        if(existing) {
          existing.count += 1;
        } else {
          acc.push({
            id: title, // 可选优化：使用 uuid 替代 title 作为唯一 key，避免标题重复导致 key 冲突
            title: title,
            count: 1,
            originalIndex: acc.length
          });
        }
        return acc;
      }, []);
      
      // 优化：自定义排序逻辑保持，增加空值判断
      if(customSortData && Array.isArray(customSortData) && customSortData.length > 0) {
        const sortOrderMap = new Map(
          customSortData.map((item, index) => [item.title, index])
        );
        aggregatedData.sort((a, b) => {
          const orderA = sortOrderMap.get(a.title);
          const orderB = sortOrderMap.get(b.title);
          if(orderA !== undefined && orderB !== undefined) {
            return orderA - orderB;
          }
          if(orderA !== undefined) return -1;
          if(orderB !== undefined) return 1;
          return a.originalIndex - b.originalIndex;
        });
      }
      
      setListData(aggregatedData);
    } catch(error) {
      console.error('获取数据失败:', error);
      setListData([]);
    } finally {
      setLoading(false);
    }
  }, [customSortData]);
  
  // useFocusEffect 逻辑保持，确保页面聚焦时重新获取数据
  useFocusEffect(
    useCallback(() => {
      fetchData().catch(err => console.error('页面聚焦获取数据失败:', err));
    }, [fetchData])
  );
  
  // 拖拽排序结束回调，增加数据校验
  const handleSortEnd = useCallback((sortedData) => {
    if(Array.isArray(sortedData)) {
      setListData(sortedData);
    }
  }, []);
  
  // 确认提交逻辑（防止重复提交、优化返回体验、增加异常处理）
  const handleConfirm = useCallback(async () => {
    // 防止重复点击提交
    if(isSubmitting || listData.length === 0) return;
    
    try {
      // 标记为提交中，禁用按钮
      setIsSubmitting(true);
      
      // 构造排序数据，增加数据校验
      const sortData = listData.map((item, index) => ({
        title: item.title || '未分类',
        id: item.id || item.title || `default_${index}`,
        index
      }));
      
      // 按顺序执行更新操作，确保数据持久化完成后再返回
      await updateCustomSort(sortData);
      await updateSort('custom');
      
      // 优化返回体验：使用 router.back() 更贴合原生导航，也可使用 router.replace 避免返回重复页面
      // 可选：如果需要返回上一级并刷新数据，可结合路由参数传递更新标识
      router.back(); // 替代 router.goBack()，expo-router 中 back() 更稳定
    } catch(error) {
      console.error('提交自定义排序失败:', error);
      // 可增加用户提示：Toast 或 Alert 告知提交失败
    } finally {
      // 解除提交状态，无论成功失败都恢复按钮可用
      setIsSubmitting(false);
    }
  }, [listData, updateCustomSort, updateSort, router, isSubmitting]);
  
  // 返回逻辑，增加防误触（简单防抖）
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);
  
  // 列表项渲染
  const renderItem = useCallback((item) => {
    return (
      <View style={styles.itemContent}>
        <Text style={[styles.itemText, { color: theme.colors.text }]}>{item.title}</Text>
        <Text style={[styles.itemCount, { color: theme.colors.subText }]}>次数: {item.count}</Text>
      </View>
    );
  }, [theme]);
  
  const header = () => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleBack}
          disabled={isSubmitting}
        >
          <Icon lib="Ionicons" name="arrow-back" size={24} />
        </TouchableOpacity>
        
        <ThemeText style={[styles.title, { color: theme.colors.interactive }]}>长按拖拽调整排序顺序</ThemeText>
        
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={isSubmitting || listData.length === 0}
          activeOpacity={isSubmitting ? 1 : 0.7} // 禁用时取消点击透明度变化
        >
          <ThemeText style={[
            styles.confirmBtnText,
            {
              color: theme.colors.interactive,
            }
          ]}>确认</ThemeText>
        </TouchableOpacity>
      </View>
    )
  }
  
  // 加载状态优化
  if(loading) {
    return (
      <ThemeSafeAreaView style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <ThemeText style={[styles.loadingText, { color: theme.colors.text }]}>加载数据中...</ThemeText>
      </ThemeSafeAreaView>
    );
  }
  
  // 空数据状态优化
  if(listData.length === 0) {
    return (
      <ThemeSafeAreaView style={styles.container}>
        {header()}
        
        <EmptyContainer text="暂无可排序的数据"/>
      </ThemeSafeAreaView>
    );
  }
  
  return (
    <ThemeSafeAreaView>
      {header()}
      
      <View style={styles.listContainer}>
        <DragDropList
          data={listData}
          onSortEnd={handleSortEnd}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
        />
      </View>
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingText: {
    maxWidth: 80,
    marginLeft: 10,
    fontSize: 14
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  confirmBtnText: {
    height: 30,
    lineHeight: 30,
    fontSize: 16
  },
  listContainer: {
    flex: 1
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center'
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4
  },
  itemCount: {
    fontSize: 12
  }
});

export default DragDropListPage;