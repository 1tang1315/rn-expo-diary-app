import React, { useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { getEventsByTitleOrDescriptionSearch } from "@/db/eventDB";
import { getCategoryInfo } from "@/utils/categoryUtils";
import EventModal from "@/components/event/EventModal";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";

const SearchPage = () => {
  // 状态管理：搜索输入、搜索结果、加载状态
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 处理搜索逻辑
  const handleSearch = async (value) => {
    // 空关键词不触发搜索
    if (!value.trim()) return;
    
    try {
      setIsLoading(true);
      const results = await getEventsByTitleOrDescriptionSearch(value.trim());
      setSearchResults(results);
    } catch (err) {
      console.error('搜索事件失败：', err);
      Alert.alert('搜索失败', '获取事件列表时出现错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  const [searchTimer, setSearchTimer] = useState(null);
  const handleDelayedSearch = (value) => {
    // 清除之前的定时器
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    // 设置新的定时器，300ms后执行搜索
    const timer = setTimeout(async () => {
      await handleSearch(value);
    }, 300);
    
    setSearchTimer(timer);
  };
  
  // 渲染单个搜索结果项
  const renderResultItem = ({ item }) => {
    const { name: categoryName, icon: categoryIcon } = getCategoryInfo(item.category);
    
    return (<TouchableOpacity
      style={styles.resultItem}
      onPress={() => {
        setCurrentEvent(item);
        setModalVisible(true);
      }}
    >
      {/* 标题 */}
      <Text style={styles.itemTitle}>
        {highlightKeywords(item.title, inputValue)}
      </Text>
      
      <View style={styles.itemTabs}>
        <View style={styles.categoryWrap}>
          <MaterialIcons
            name={categoryIcon}
            size={12}
            color="#666"
            style={styles.categoryIcon}
          />
          <Text style={styles.itemCategory}>{categoryName}</Text>
        </View>
        {/* 事件状态 */}
        {item.status && (
          <Text style={[styles.itemStatus, getStatusStyle(item.status)]}>{formatStatusText(item.status)}</Text>
        )}
      </View>
        
        {/* 事件时间 + 分类 */}
        <View style={styles.itemMeta}>
          <Text style={styles.itemTime}>
            {dayjs(item.start_datetime).format('YYYY-MM-DD HH:MM')}~{dayjs(item.end_datetime).format('YYYY-MM-DD HH:MM')}
          </Text>
        </View>
        
        <Text>{highlightKeywords(item.description, inputValue)}</Text>
      </TouchableOpacity>)
  };
  
  // 辅助：格式化状态文本（如 'completed' → '已完成'）
  const formatStatusText = (status) => {
    const statusMap = {
      planned: '计划中',
      completed: '已完成',
      canceled: '已取消',
      inProgress: '进行中',
      upcoming: '即将开始',
      early: '提前完成',
      notCompleted: '未完成'
    };
    return statusMap[status] || status;
  };
  
  // 辅助：根据状态设置样式（如已完成绿色，已取消红色）
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
      case 'early':
        return styles.statusSuccess;
      case 'canceled':
      case 'notCompleted':
        return styles.statusError;
      case 'inProgress':
      case 'upcoming':
        return styles.statusWarning;
      default:
        return styles.statusDefault;
    }
  };
  
  // 处理关键词高亮
  const highlightKeywords = (text, keyword) => {
    if (!keyword.trim() || !text) {
      return <Text>{text || ''}</Text>;
    }
    
    // 不区分大小写的匹配
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const startIndex = lowerText.indexOf(lowerKeyword);
    
    // 没有匹配到关键词
    if (startIndex === -1) {
      return <Text>{text}</Text>;
    }
    
    // 拆分文本为三部分：关键词前、关键词、关键词后
    const beforeText = text.substring(0, startIndex);
    const keywordText = text.substring(startIndex, startIndex + keyword.length);
    const afterText = text.substring(startIndex + keyword.length);
    
    return (
      <Text>
        <Text>{beforeText}</Text>
        <Text style={styles.highlightedText}>{keywordText}</Text>
        <Text>{afterText}</Text>
      </Text>
    );
  };
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  return (
    <ThemeSafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="输入事件标题搜索..."
          value={inputValue}
          onChangeText={(value) => {
            setInputValue(value);
            handleDelayedSearch(value);
          }}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={value => handleSearch(value)}
        />
        {/* 清空按钮 */}
        {inputValue.trim() !== '' && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setInputValue('');
              setSearchResults([]);
            }}
          >
            <Ionicons name="close-outline" size={18} color="#999" />
          </TouchableOpacity>
        )}
        {/* 搜索按钮 */}
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Ionicons name="search-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* 加载状态 */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      
      {/* 搜索结果区域 */}
      {!isLoading && (
        <FlatList
          data={searchResults}
          renderItem={renderResultItem}
          keyExtractor={(item) => `event-${item.id}`}
          // 无结果时显示
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {inputValue.trim() ? '暂无匹配的事件' : '请输入关键词搜索'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.resultsList}
        />
      )}
      
      <EventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentEvent={currentEvent}
        selectedDate={currentEvent ? new Date(currentEvent.start_datetime) : new Date()}
        onRefresh={() => handleSearch(inputValue)}
      />
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 20
  },
  searchInput: {
    position: 'relative',
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14
  },
  clearButton: {
    position: 'absolute',
    right: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: '50%',
    backgroundColor: '#ccc',
    zIndex: 100,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultsList: {
    paddingBottom: 20
  },
  resultItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5'
  },
  itemTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  highlightedText: {
    color: '#04f5fb',
    fontWeight: 'bold',
  },
  itemTabs: {
    display: 'flex',
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    height: 35
  },
  itemStatus: {
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
    fontSize: 12,
    color: '#666'
  },
  itemTime: {
    color: '#666'
  },
  categoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  itemCategory: {
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  statusSuccess: {
    color: '#28a745',
    backgroundColor: '#f0fff4'
  },
  statusError: {
    color: '#dc3545',
    backgroundColor: '#fff0f0'
  },
  statusWarning: {
    color: '#ffc107',
    backgroundColor: '#fffbf0'
  },
  statusDefault: {
    color: '#6c757d',
    backgroundColor: '#f8f9fa'
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50
  },
  emptyText: {
    color: '#999',
    fontSize: 14
  }
});

export default SearchPage;