import EmptyContainer from "@/components/common/EmptyContainer";
import EventModal from "@/components/event/EventModal";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import ThemeText from "@/components/theme/ThemeText";
import ThemeTextInput from "@/components/theme/ThemeTextInput";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import { useTheme } from "@/context/ThemeContext";
import { getEventsByFilters } from "@/db/eventDB";
import { getCategoryInfo } from "@/utils/categoryUtils";
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal,
  StyleSheet,
  TouchableOpacity, View
} from 'react-native';
import { AsyncStorage } from "expo-sqlite/kv-store";

const SearchPage = () => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  
  // 从本地存储加载历史搜索记录
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem('search_history');
        if (storedHistory) {
          setSearchHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
        console.error('加载历史搜索记录失败：', error);
      }
    };
    
    loadSearchHistory().then();
  }, []);
  
  const [searchType, setSearchType] = useState('both');
  const [sortOrder, setSortOrder] = useState('desc');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const handleSearch = async (keywordParam) => {
    try {
      const keyword = typeof keywordParam === 'string' ? keywordParam.trim() : (typeof inputValue === 'string' ? inputValue.trim() : '');
      if(!keyword) return;
      
      setIsLoading(true);
      const results = await getEventsByFilters({
        keyword,
        searchType,
        startDate,
        endDate,
        sortOrder
      });
      setSearchResults(results);
      
      // Update search history
      if(keyword) {
        setSearchHistory(prev => {
          // Remove if already exists
          const filtered = prev.filter(item => item !== keyword);
          // Add to beginning
          const newHistory = [keyword, ...filtered].slice(0, 10); // Keep only last 10 searches
          // Save to local storage
          AsyncStorage.setItem('search_history', JSON.stringify(newHistory)).catch(error => {
            console.error('保存历史搜索记录失败：', error);
          });
          return newHistory;
        });
      }
      
      // Clear suggestions after full search
      setSuggestions([]);
    } catch(err) {
      console.error('搜索事件失败：', err);
      Alert.alert('搜索失败', '获取事件列表时出现错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveHistoryItem = (itemToRemove) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== itemToRemove);
      // Save to local storage
      AsyncStorage.setItem('search_history', JSON.stringify(newHistory)).catch(error => {
        console.error('保存历史搜索记录失败：', error);
      });
      return newHistory;
    });
  };
  
  const [searchTimer, setSearchTimer] = useState(null);
  
  const getSuggestions = async (keyword) => {
    if(!keyword || typeof keyword !== 'string' || !keyword.trim()) {
      setSuggestions([]);
      return;
    }
    
    try {
      // Get events with title matching the keyword
      const results = await getEventsByFilters({
        keyword,
        searchType: 'title',
        startDate: null,
        endDate: null,
        sortOrder: 'desc'
      });
      
      // Extract just the titles for suggestions
      const titleSuggestions = results.map(event => event.title);
      // Limit to first 5 suggestions
      setSuggestions(titleSuggestions.slice(0, 5));
    } catch(err) {
      console.error('获取搜索建议失败：', err);
      setSuggestions([]);
    }
  };
  
  const handleDelayedSearch = (value) => {
    if(searchTimer) {
      clearTimeout(searchTimer);
    }
    
    const timer = setTimeout(async () => {
      await getSuggestions(value);
    }, 300);
    
    setSearchTimer(timer);
  };
  
  const handleFilterChange = async () => {
    setShowFilterModal(false);
    await handleSearch();
  };
  
  const handleResetFilters = async () => {
    setSearchType('both');
    setSortOrder('desc');
    setStartDate(null);
    setEndDate(null);
    setShowFilterModal(false);
    await handleSearch();
  };
  
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if(selectedDate) {
      setStartDate(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };
  
  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if(selectedDate) {
      setEndDate(dayjs(selectedDate).format('YYYY-MM-DD'));
    }
  };
  
  // 渲染单个搜索结果项
  const renderResultItem = ({ item }) => {
    const { name: categoryName, icon: categoryIcon } = getCategoryInfo(item.category);
    
    return (
      <ThemeTouchableOpacity
        onPress={() => {
          setCurrentEvent(item);
          setModalVisible(true);
        }}
      >
        {/* 标题 */}
        <ThemeSubTitleText style={styles.itemTitle}>
          {highlightKeywords(item.title, inputValue)}
        </ThemeSubTitleText>
        
        <View style={styles.itemTabs}>
          <View style={[
            styles.categoryWrap, {
              backgroundColor: theme.colors.innerCard
            }
          ]}>
            <MaterialIcons
              name={categoryIcon}
              size={13}
              color={theme.colors.subText}
            />
            
            <ThemeText style={[
              styles.itemCategory, {
                color: theme.colors.subText
              }
            ]}>{categoryName}</ThemeText>
          </View>
          {/* 事件状态 */}
          {item.status && (
            <ThemeText
              style={[styles.itemStatus, getStatusStyle(item.status)]}>{formatStatusText(item.status)}</ThemeText>
          )}
        </View>
        
        {/* 事件时间 + 分类 */}
        <View style={styles.itemMeta}>
          <ThemeText style={[
            styles.itemTime, {
              color: theme.colors.subText
            }
          ]}>
            {dayjs(item.start_datetime).format('YYYY-MM-DD HH:MM')}~{dayjs(item.end_datetime).format('YYYY-MM-DD HH:MM')}
          </ThemeText>
        </View>
        
        <ThemeText>{highlightKeywords(item.description, inputValue)}</ThemeText>
      </ThemeTouchableOpacity>
    );
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
    switch(status) {
      case 'completed':
      case 'early':
        return {
          color: theme.colors.success,
          backgroundColor: theme.colors.primaryTransparent
        };
      case 'canceled':
      case 'notCompleted':
        return {
          color: theme.colors.error,
          backgroundColor: theme.colors.primaryTransparent
        };
      case 'inProgress':
      case 'upcoming':
        return {
          color: theme.colors.warning,
          backgroundColor: theme.colors.primaryTransparent
        };
      default:
        return {
          color: theme.colors.dim,
          backgroundColor: theme.colors.innerCard
        };
    }
  };
  
  // 处理关键词高亮
  const highlightKeywords = (text, keyword) => {
    if(!keyword.trim() || !text) {
      return <ThemeText>{text || ''}</ThemeText>;
    }
    
    // 不区分大小写的匹配
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const startIndex = lowerText.indexOf(lowerKeyword);
    
    // 没有匹配到关键词
    if(startIndex === -1) {
      return <ThemeText>{text}</ThemeText>;
    }
    
    // 拆分文本为三部分：关键词前、关键词、关键词后
    const beforeText = text.substring(0, startIndex);
    const keywordText = text.substring(startIndex, startIndex + keyword.length);
    const afterText = text.substring(startIndex + keyword.length);
    
    return (
      <ThemeText>
        <ThemeText>{beforeText}</ThemeText>
        <ThemeText style={[styles.highlightedText, { color: theme.colors.interactive }]}>{keywordText}</ThemeText>
        <ThemeText>{afterText}</ThemeText>
      </ThemeText>
    );
  };
  
  const [modalVisible, setModalVisible] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  
  return (
    <ThemeSafeAreaView>
      {/* 搜索区 */}
      <View style={styles.searchBar}>
        <ThemeTextInput
          style={[
            styles.searchInput, {
              borderColor: theme.colors.border,
              color: theme.colors.text,
              backgroundColor: theme.colors.card
            }
          ]}
          placeholder="输入事件标题搜索..."
          placeholderTextColor={theme.colors.placeholder}
          value={inputValue}
          onChangeText={(value) => {
            setInputValue(value);
            handleDelayedSearch(value);
          }}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {inputValue.trim() !== '' && (
          <TouchableOpacity
            style={[
              styles.clearButton, {
                backgroundColor: theme.colors.interactive
              }
            ]}
            onPress={() => {
              setInputValue('');
              setSearchResults([]);
              setSearchType('both');
              setSortOrder('desc');
              setStartDate(null);
              setEndDate(null);
            }}
          >
            <Ionicons name="close-outline" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.filterBtn, {
              backgroundColor: theme.colors.subText
            }
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.searchBtn, {
              backgroundColor: theme.colors.interactive
            }
          ]}
          onPress={handleSearch}
        >
          <Ionicons name="search-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* 历史搜索区 */}
      {!isLoading && inputValue.trim() === '' && searchResults.length === 0 && searchHistory.length > 0 && (
        <View>
          <View style={styles.historyHeader}>
            <ThemeSubTitleText style={styles.historyTitle}>历史搜索</ThemeSubTitleText>
            <TouchableOpacity onPress={() => {
              setSearchHistory([]);
              // Save empty history to local storage
              AsyncStorage.setItem('search_history', JSON.stringify([])).catch(error => {
                console.error('保存历史搜索记录失败：', error);
              });
            }}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.subText} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.historyList}>
            {searchHistory.map((item, index) => (
              <ThemeTouchableOpacity
                key={`history-${index}`}
                style={[
                  styles.historyItem, {
                    backgroundColor: theme.colors.innerCard
                  }
                ]}
                onPress={() => {
                  setInputValue(item);
                  handleSearch(item).then();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={16} color={theme.colors.subText} />
                
                <ThemeText>{item}</ThemeText>
                
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveHistoryItem(item);
                  }}
                >
                  <Ionicons name="close-circle-outline" size={16} color={theme.colors.subText} />
                </TouchableOpacity>
              </ThemeTouchableOpacity>
            ))}
          </View>
        </View>
      )}
      
      {/* 建议区 */}
      {!isLoading && inputValue.trim() !== '' && suggestions.length > 0 && searchResults.length === 0 && (
        <View style={styles.suggestionsList}>
          {suggestions.map((suggestion, index) => {
            let itemStyle = [
              styles.suggestionItem, {
                backgroundColor: theme.colors.innerCard
              }
            ];
            
            if(index === 0) {
              itemStyle.push({ borderTopLeftRadius: 8, borderTopRightRadius: 8 });
            }
            
            if(index === suggestions.length - 1) {
              itemStyle.push({
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
                borderBottomWidth: 0
              });
            }
            
            return (
              <ThemeTouchableOpacity
                key={`suggestion-${index}`}
                style={itemStyle}
                onPress={() => {
                  setInputValue(suggestion);
                  handleSearch().then();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="search-outline" size={16} color={theme.colors.subText} />
                <ThemeText>{suggestion}</ThemeText>
                <Ionicons name="chevron-forward" size={14} color={theme.colors.subText} />
              </ThemeTouchableOpacity>
            );
          })}
        </View>
      )}
      
      {/* 空状态 */}
      {!isLoading && inputValue.trim() === '' && searchResults.length === 0 && (
        <EmptyContainer
          iconLib="Ionicons"
          iconName="document-outline"
          text="请输入关键词搜索"
        />
      )}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.interactive} />
        </View>
      )}
      
      {!isLoading && inputValue.trim() !== '' && searchResults.length === 0 && suggestions.length === 0 && (
        <EmptyContainer
          iconLib="Ionicons"
          iconName="document-outline"
          text="暂无匹配的事件"
        />
      )}
      
      {!isLoading && searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          renderItem={renderResultItem}
          keyExtractor={(item) => `event-${item.id}`}
          contentContainerStyle={styles.resultsList}
        />
      )}
      
      <EventModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        currentEvent={currentEvent}
        selectedDate={currentEvent ? new Date(currentEvent.start_datetime) : new Date()}
        onRefresh={handleSearch}
      />
      
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={[
            styles.filterModalContent, {
              backgroundColor: theme.colors.card
            }
          ]} activeOpacity={1}>
            <View style={styles.filterHeader}>
              <ThemeSubTitleText style={styles.filterTitle}>筛选条件</ThemeSubTitleText>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <ThemeText style={styles.filterLabel}>搜索类型</ThemeText>
              <View style={styles.filterOptions}>
                <ThemeTouchableOpacity
                  style={[
                    styles.filterOption,
                    { borderColor: theme.colors.border },
                    searchType === 'both' && [
                      styles.filterOptionActive, {
                        backgroundColor: theme.colors.interactive,
                        borderColor: theme.colors.interactive
                      }
                    ]
                  ]}
                  onPress={() => setSearchType('both')}
                >
                  <ThemeText style={[
                    styles.filterOptionText,
                    { color: theme.colors.subText },
                    searchType === 'both' && [styles.filterOptionTextActive, { color: '#fff' }]
                  ]}>全部</ThemeText>
                </ThemeTouchableOpacity>
                <ThemeTouchableOpacity
                  style={[
                    styles.filterOption,
                    { borderColor: theme.colors.border },
                    searchType === 'title' && [
                      styles.filterOptionActive, {
                        backgroundColor: theme.colors.interactive,
                        borderColor: theme.colors.interactive
                      }
                    ]
                  ]}
                  onPress={() => setSearchType('title')}
                >
                  <ThemeText style={[
                    styles.filterOptionText,
                    { color: theme.colors.subText },
                    searchType === 'title' && [styles.filterOptionTextActive, { color: '#fff' }]
                  ]}>标题</ThemeText>
                </ThemeTouchableOpacity>
                <ThemeTouchableOpacity
                  style={[
                    styles.filterOption,
                    { borderColor: theme.colors.border },
                    searchType === 'description' && [
                      styles.filterOptionActive, {
                        backgroundColor: theme.colors.interactive,
                        borderColor: theme.colors.interactive
                      }
                    ]
                  ]}
                  onPress={() => setSearchType('description')}
                >
                  <ThemeText style={[
                    styles.filterOptionText,
                    { color: theme.colors.subText },
                    searchType === 'description' && [styles.filterOptionTextActive, { color: '#fff' }]
                  ]}>详情</ThemeText>
                </ThemeTouchableOpacity>
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <ThemeText style={styles.filterLabel}>日期范围</ThemeText>
              <View style={styles.dateRangeContainer}>
                <ThemeTouchableOpacity
                  style={[
                    styles.dateButton, {
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <ThemeText style={[
                    styles.dateButtonText, {
                      color: theme.colors.text
                    }
                  ]}>
                    {startDate ? dayjs(startDate).format('YYYY-MM-DD') : '开始日期'}
                  </ThemeText>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.subText} />
                </ThemeTouchableOpacity>
                <ThemeText style={[
                  styles.dateSeparator, {
                    color: theme.colors.subText
                  }
                ]}>至</ThemeText>
                <ThemeTouchableOpacity
                  style={[
                    styles.dateButton, {
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <ThemeText style={[
                    styles.dateButtonText, {
                      color: theme.colors.text
                    }
                  ]}>
                    {endDate ? dayjs(endDate).format('YYYY-MM-DD') : '结束日期'}
                  </ThemeText>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.subText} />
                </ThemeTouchableOpacity>
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <ThemeText style={styles.filterLabel}>排序方式</ThemeText>
              <View style={styles.filterOptions}>
                <ThemeTouchableOpacity
                  style={[
                    styles.filterOption,
                    { borderColor: theme.colors.border },
                    sortOrder === 'desc' && [
                      styles.filterOptionActive, {
                        backgroundColor: theme.colors.interactive,
                        borderColor: theme.colors.interactive
                      }
                    ]
                  ]}
                  onPress={() => setSortOrder('desc')}
                >
                  <ThemeText style={[
                    styles.filterOptionText,
                    { color: theme.colors.subText },
                    sortOrder === 'desc' && [styles.filterOptionTextActive, { color: '#fff' }]
                  ]}>降序</ThemeText>
                </ThemeTouchableOpacity>
                <ThemeTouchableOpacity
                  style={[
                    styles.filterOption,
                    { borderColor: theme.colors.border },
                    sortOrder === 'asc' && [
                      styles.filterOptionActive, {
                        backgroundColor: theme.colors.interactive,
                        borderColor: theme.colors.interactive
                      }
                    ]
                  ]}
                  onPress={() => setSortOrder('asc')}
                >
                  <ThemeText style={[
                    styles.filterOptionText,
                    { color: theme.colors.subText },
                    sortOrder === 'asc' && [styles.filterOptionTextActive, { color: '#fff' }]
                  ]}>升序</ThemeText>
                </ThemeTouchableOpacity>
              </View>
            </View>
            
            <View style={styles.filterActions}>
              <ThemeTouchableOpacity
                style={[
                  styles.resetButton,
                  { borderColor: theme.colors.border }
                ]}
                onPress={handleResetFilters}
              >
                <ThemeText style={[
                  styles.resetButtonText, {
                    color: theme.colors.subText
                  }
                ]}>重置</ThemeText>
              </ThemeTouchableOpacity>
              <ThemeTouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: theme.colors.interactive }
                ]}
                onPress={handleFilterChange}
              >
                <ThemeText style={[
                  styles.applyButtonText, {
                    color: '#fff'
                  }
                ]}>应用</ThemeText>
              </ThemeTouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate ? dayjs(startDate).toDate() : new Date()}
          mode="date"
          display="default"
          onChange={handleStartDateChange}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate ? dayjs(endDate).toDate() : new Date()}
          mode="date"
          display="default"
          onChange={handleEndDateChange}
        />
      )}
    </ThemeSafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  searchInput: {
    position: 'relative',
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14
  },
  clearButton: {
    position: 'absolute',
    right: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    borderRadius: '50%',
    zIndex: 100
  },
  filterBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  searchBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultsList: {
    gap: 10,
    paddingBottom: 20
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  highlightedText: {
    fontWeight: 'bold'
  },
  itemTabs: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    height: 35
  },
  itemStatus: {
    flex: 0,
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
    fontSize: 12
  },
  categoryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  itemCategory: {
    flex: 0
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  filterModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600'
  },
  filterSection: {
    marginBottom: 24
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8
  },
  filterOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center'
  },
  filterOptionActive: {
    borderRadius: 8
  },
  filterOptionText: {
    fontSize: 14
  },
  filterOptionTextActive: {
    fontSize: 14
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8
  },
  dateButtonText: {
    fontSize: 14
  },
  dateSeparator: {
    fontSize: 14
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center'
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600'
  },
  historyList: {
    gap: 8
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8
  },
  suggestionsList: {
    gap: 6
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  }
});

export default SearchPage;