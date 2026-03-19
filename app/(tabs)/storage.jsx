import { storageApi } from '@/api';
import AddButton from "@/components/common/AddButton";
import CategoryTab from "@/components/common/CategoryTab";
import EmptyContainer from "@/components/common/EmptyContainer";
import ExpandableCard from "@/components/common/ExpandableCard";
import StorageCard from "@/components/storage/StorageCard";
import StorageModal from "@/components/storage/StorageModal";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import { storageCategories } from "@/constants/commonConstans";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

// 常量定义
const MS_PER_DAY = 1000 * 60 * 60 * 24; // 每天的毫秒数
const MIN_DAILY_PRICE = 0; // 最低日价格

export default function Storage() {
  const { theme } = useTheme();
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);

  const processSingleItem = useCallback((item) => {
    const today = new Date();
    const startDate = item.startDate ? new Date(item.startDate) : null;
    // 检查 endDate 是否为有效日期
    const isValidEndDate = item.endDate && !isNaN(new Date(item.endDate).getTime());
    const endDate = isValidEndDate ? new Date(item.endDate) : null;
    
    // 计算使用天数
    const daysUsed = startDate && endDate
      ? Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / MS_PER_DAY))
      : startDate
      ? Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / MS_PER_DAY))
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
      startDate: item.startDate,
      endDate: isValidEndDate ? item.endDate : null
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
  
  // 从 API 获取数据
  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await storageApi.getAllWithSort({ sortField: 'start_date', sortOrder: 'desc' });
      
      // 处理数据并更新状态
      const processedItems = processItems(response || []);
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
    const active = filteredItems.filter(item => {
      if (!item.endDate) return true;
      const endDate = new Date(item.endDate);
      return !isNaN(endDate.getTime()) && endDate >= today;
    });
    const retired = filteredItems.filter(item => {
      if (!item.endDate) return false;
      const endDate = new Date(item.endDate);
      return !isNaN(endDate.getTime()) && endDate < today;
    });
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
    <ThemeSafeAreaView>
      <LinearGradient
        colors={[theme.colors.interactive, theme.colors.interactiveLight]}
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
        {activeItems.length > 0 || retiredItems.length > 0 ? (
          <FlatList
            data={[
              { key: 'active', title: `未退役(${activeItems.length}件)`, items: activeItems },
              { key: 'retired', title: `已退役(${retiredItems.length}件)`, items: retiredItems },
            ]}
            renderItem={({ item: section }) => {
              if (section.items.length === 0) return null;
              return (
                <ExpandableCard title={section.title}>
                  <FlatList
                    showsVerticalScrollIndicator={false}
                    data={section.items}
                    extraData={section.items}
                    renderItem={({ item }) => (
                      <StorageCard item={item} onPress={() => openModal(item)} />
                    )}
                    keyExtractor={(item) => item.id}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={7}
                    nestedScrollEnabled={true}
                  />
                </ExpandableCard>
              );
            }}
            keyExtractor={(section) => section.key}
            extraData={allItems}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <EmptyContainer iconName="folder-open" text="暂无储物物品" />
          </View>
        )}
      </View>
      
      {/* 添加按钮 */}
      <AddButton onPress={() => openModal()} />
      
      <StorageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentItem={currentEditItem}
        currentTab={activeCategory}
        onRefresh={closeModalAndRefresh}
      />
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  // 顶部资产卡片
  statsCard: {
    marginBottom: 10,
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
    flex: 1
  }
});