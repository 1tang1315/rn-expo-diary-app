import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CategoryTab from "@/components/common/CategoryTab";
import AddEventButton from "@/components/TimelinePanel/AddEventButton";
import StorageCard from "@/components/storage/StorageCard";
import { getAllStorageItems } from '@/db/storageDB';
import EmptyContainer from "@/components/common/EmptyContainer";
import StorageModal from "@/components/storage/StorageModal";
import { storageCategories } from "@/constants/commonConstans";

// 常量定义
const MS_PER_DAY = 1000 * 60 * 60 * 24; // 每天的毫秒数
const MIN_DAILY_PRICE = 0; // 最低日价格

export default function Storage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  
  const [isActiveCollapsed, setIsActiveCollapsed] = useState(false);
  const [isRetiredCollapsed, setIsRetiredCollapsed] = useState(false);
  
  const processSingleItem = useCallback((item) => {
    const today = new Date();
    const startDate = item.start_date ? new Date(item.start_date) : null;
    const endDate = item.end_date ? new Date(item.end_date) : today;
    
    // 计算使用天数
    const daysUsed = startDate
      ? Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY))
      : 1;
    
    // 计算每日价格 (总价/使用天数，最低0元)
    const dailyPrice = item.price?.toFixed(2) && daysUsed > 0
      ? Math.max(MIN_DAILY_PRICE, Math.round((item.price / daysUsed) * 100) / 100).toFixed(2)
      : 0;
    
    return {
      id: item.id.toString(),
      name: item.name,
      category: item.category,
      icon: item.icon,
      price: item.price?.toFixed(2) || 0.00,
      dailyPrice,
      daysUsed,
      image: item.image,
      detail: item.detail,
      startDate: item.start_date,
      endDate: item.end_date
    };
  }, []);
  
  // 处理多个项目的数据转换
  const processItems = useCallback((dbItems) => {
    return dbItems.map(processSingleItem);
  }, [processSingleItem]);
  
  // 根据活动类别过滤项目
  const filteredItems = useMemo(() => {
    if(activeCategory === 'all') return allItems;
    return allItems.filter(item => item.category === activeCategory);
  }, [allItems, activeCategory]);
  
  // 从数据库获取数据
  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 从数据库获取所有项目
      const dbItems = await getAllStorageItems('desc', 'start_date');
      
      // 处理数据并更新状态
      const processedItems = processItems(dbItems);
      setAllItems(processedItems);
    } catch(err) {
      console.error('获取储物数据失败:', err);
      setAllItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [processItems]);
  
  // 初始加载获取数据
  useEffect(() => {
    const fetchData = async () => {
      await fetchItems();
    };
    
    fetchData().then();
  }, [fetchItems]);
  
  // 计算统计数据
  const {
    totalValue,
    activeItems,
    retiredItems,
    activeValue,
    retiredValue,
    dailyTotal,
    activeDailyTotal,
    retiredDailyTotal
  } = useMemo(() => {
    const today = new Date();
    const total = filteredItems.reduce((sum, item) => sum + Number(item.price) * 100, 0) / 100;
    const active = filteredItems.filter(item => !item.endDate || new Date(item.endDate) >= today);
    const retired = filteredItems.filter(item => item.endDate && new Date(item.endDate) < today);
    const activeVal = active.reduce((sum, item) => sum + Number(item.price) * 100, 0) / 100;
    const retiredVal = retired.reduce((sum, item) => sum + Number(item.price) * 100, 0) / 100;
    
    const dailyTotal = filteredItems.reduce((sum, item) => sum + Number(item.dailyPrice) * 100, 0) / 100;
    const activeDailyTotal = active.reduce((sum, item) => sum + Number(item.dailyPrice) * 100, 0) / 100;
    const retiredDailyTotal = retired.reduce((sum, item) => sum + Number(item.dailyPrice) * 100, 0) / 100;
    
    return {
      totalValue: total,
      activeItems: active,
      retiredItems: retired,
      activeValue: activeVal,
      retiredValue: retiredVal,
      dailyTotal,
      activeDailyTotal,
      retiredDailyTotal
    };
  }, [filteredItems]);
  
  // 加载中状态
  if(isLoading) {
    return (
      <LinearGradient colors={['#dfe9f3', '#ffffff']} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>加载储物数据中...</Text>
      </LinearGradient>
    );
  }
  
  // 打开弹窗（新增/编辑）
  const openModal = (item = null) => {
    setCurrentEditItem(item);
    setModalVisible(true);
  };
  
  // 关闭弹窗并刷新数据
  const closeModalAndRefresh = () => {
    setModalVisible(false);
    fetchItems().then();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#3498db', '#2980b9']}
        style={styles.statsCard}
      >
        <View style={styles.statsRow}>
          {/* 总资产 + 全部日均价格 */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>总资产</Text>
            <Text style={styles.statValue}>¥{totalValue.toLocaleString()}</Text>
            <Text style={styles.dailyPriceText}>日均 ¥{dailyTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          
          {/* 未退役 + 未退役日均价格 */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>未退役</Text>
            <Text style={[styles.statValue, styles.activeValue]}>
              ¥{activeValue.toLocaleString()}
            </Text>
            <Text style={[styles.dailyPriceText, styles.activeDailyText]}>
              日均 ¥{activeDailyTotal.toFixed(2)}
            </Text>
          </View>
          <View style={styles.divider} />
          
          {/* 已退役 + 已退役日均价格 */}
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>已退役</Text>
            <Text style={[styles.statValue, styles.retiredValue]}>
              ¥{retiredValue.toLocaleString()}
            </Text>
            <Text style={[styles.dailyPriceText, styles.retiredDailyText]}>
              日均 ¥{retiredDailyTotal.toFixed(2)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statsSubRow}>
          <Text style={styles.statsSubText}>
            未退役: {activeItems.length} 件 | 已退役: {retiredItems.length} 件
          </Text>
        </View>
      </LinearGradient>
      
      {/* 分类标签 */}
      <CategoryTab
        categories={storageCategories}
        currentTab={activeCategory}
        setCurrentTab={setActiveCategory}
      />

      <View style={styles.sectionContainer}>
        {/* 未退役 */}
        {activeItems.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsActiveCollapsed(!isActiveCollapsed)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>未退役</Text>
                <Text style={styles.sectionCount}>({activeItems.length}件)</Text>
              </View>
              <Ionicons
                name={isActiveCollapsed ? "chevron-down" : "chevron-up"}
                size={18}
                color="#3498db"
              />
            </TouchableOpacity>
            
            {!isActiveCollapsed && (
              <FlatList
                showsVerticalScrollIndicator={false}
                data={activeItems}
                renderItem={({ item }) => (
                  <StorageCard item={item} onPress={() => openModal(item)} />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.sectionListContent}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={7}
              />
            )}
          </View>
        )}
        
        {/* 已退役 */}
        {retiredItems.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setIsRetiredCollapsed(!isRetiredCollapsed)}
            >
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionTitle}>已退役</Text>
                <Text style={styles.sectionCount}>({retiredItems.length}件)</Text>
              </View>
              <Ionicons
                name={isRetiredCollapsed ? "chevron-down" : "chevron-up"}
                size={18}
                color="#ff9500"
              />
            </TouchableOpacity>
            
            {!isRetiredCollapsed && (
              <FlatList
                showsVerticalScrollIndicator={false}
                data={retiredItems}
                renderItem={({ item }) => (
                  <StorageCard item={item} onPress={() => openModal(item)} />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.sectionListContent}
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={7}
              />
            )}
          </View>
        )}
        
        {/* 空 */}
        {activeItems.length === 0 && retiredItems.length === 0 && (
          <EmptyContainer icon="folder-open" text="暂无储物物品" />
        )}
      </View>
      
      {/* 添加按钮 */}
      <AddEventButton onPress={() => openModal()} />
      
      <StorageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentItem={currentEditItem}
        currentTab={activeCategory}
        onRefresh={closeModalAndRefresh}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f9fc'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    color: '#7f8c8d',
    fontSize: 15
  },
  
  statsCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4
  },
  statValue: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold'
  },
  activeValue: {
    color: '#4cd964'
  },
  retiredValue: {
    color: '#ff9500'
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8
  },
  statsSubRow: {
    marginTop: 12,
    alignItems: 'center'
  },
  statsSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12
  },
  dailyPriceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2
  },
  activeDailyText: {
    color: 'rgba(76,217,100,0.9)'
  },
  retiredDailyText: {
    color: 'rgba(255,149,0,0.9)'
  },
  
  sectionContainer: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    backgroundColor: '#ffffff'
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50'
  },
  sectionCount: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  sectionListContent: {
    gap: 12
  },
});