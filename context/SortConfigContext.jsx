import { AsyncStorage } from "expo-sqlite/kv-store";
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
  CUSTOM: 'custom',
};

// 自定义排序数据存储key
const CUSTOM_SORT_STORAGE_KEY = 'check_stat_custom_sort';

// 默认排序值
const DEFAULT_SORT = SORT_TYPES.DEFAULT;
// 存储key
const STORAGE_KEY = 'check_stat_sort';

// Provider组件
export const SortConfigProvider = ({ children }) => {
  const [currentSort, setCurrentSort] = useState(DEFAULT_SORT);
  const [isLoading, setIsLoading] = useState(true);
  const [customSortData, setCustomSortData] = useState([]);
  
  // 初始化：从本地加载排序配置
  useEffect(() => {
    const loadSortConfig = async () => {
      try {
        const savedSort = await AsyncStorage.getItem(STORAGE_KEY);
        const savedCustomSort = await AsyncStorage.getItem(CUSTOM_SORT_STORAGE_KEY);
        setCurrentSort(savedSort || DEFAULT_SORT);
        if (savedCustomSort) {
          setCustomSortData(JSON.parse(savedCustomSort));
        }
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
  
  // 更新自定义排序数据
  const updateCustomSort = useCallback(async (sortedData) => {
    try {
      const dataWithIds = sortedData.map((item, index) => ({
        ...item,
        customSortOrder: index
      }));
      setCustomSortData(dataWithIds);
      await AsyncStorage.setItem(CUSTOM_SORT_STORAGE_KEY, JSON.stringify(dataWithIds));
    } catch (err) {
      console.error('保存自定义排序失败：', err);
    }
  }, []);
  
  
  // 暴露给子组件的上下文值
  const value = {
    currentSort,
    isLoading,
    updateSort,
    updateCustomSort,
    customSortData,
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