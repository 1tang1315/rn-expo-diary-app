import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 创建Context
const SortConfigContext = createContext();

// 排序类型常量
export const SORT_TYPES = {
  DEFAULT: 'default',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  COUNT_ASC: 'count_asc',
  COUNT_DESC: 'count_desc',
  DURATION_ASC: 'duration_asc',
  DURATION_DESC: 'duration_desc',
};

// 默认排序值
const DEFAULT_SORT = SORT_TYPES.DEFAULT;
// 存储key
const STORAGE_KEY = 'check_stat_sort';

// Provider组件
export const SortConfigProvider = ({ children }) => {
  const [currentSort, setCurrentSort] = useState(DEFAULT_SORT);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化：从本地加载排序配置
  useEffect(() => {
    const loadSortConfig = async () => {
      try {
        const savedSort = await AsyncStorage.getItem(STORAGE_KEY);
        // 优先使用本地存储，无则用默认值
        setCurrentSort(savedSort || DEFAULT_SORT);
      } catch (err) {
        console.error('加载排序配置失败：', err);
        setCurrentSort(DEFAULT_SORT);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSortConfig().then();
  }, []);
  
  // 更新排序并持久化
  const updateSort = useCallback(async (sortType) => {
    if (!sortType) return;
    try {
      setCurrentSort(sortType);
      await AsyncStorage.setItem(STORAGE_KEY, sortType);
    } catch (err) {
      console.error('保存排序配置失败：', err);
    }
  }, []);
  
  
  // 暴露给子组件的上下文值
  const value = {
    currentSort,
    isLoading,
    updateSort,
    SORT_TYPES,
  };
  
  return (
    <SortConfigContext.Provider value={value}>
      {children}
    </SortConfigContext.Provider>
  );
};

// 自定义Hook，方便组件消费
export const useSortConfig = () => useContext(SortConfigContext);