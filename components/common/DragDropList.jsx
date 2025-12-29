import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, UIManager, Platform, ScrollView } from 'react-native';
import {
  GestureHandlerRootView, PanGestureHandler, State
} from 'react-native-gesture-handler';
import Icon from "@/components/common/Icon";
import EmptyContainer from "@/components/common/EmptyContainer";

// 适配Android布局动画
if(Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEM_BASE_HEIGHT = 70; // 包含margin的项总高度 (60高度 + 10margin)
const SNAP_ANIMATION_DURATION = 80; // 吸附动画时长
const AUTO_SCROLL_THRESHOLD = 100; // 自动滚动边界阈值

// 深比较函数：判断两个数组内容是否相同（避免引用变化但内容不变时的重渲染）
const isArrayEqual = (arr1, arr2) => {
  if(arr1.length !== arr2.length) return false;
  for(let i = 0; i < arr1.length; i++) {
    if(JSON.stringify(arr1[i]) !== JSON.stringify(arr2[i])) {
      return false;
    }
  }
  return true;
};

// 通用拖拽排序列表组件
const DragDropList = ({
  data = [],
  onSortEnd,
  keyExtractor = (item) => item.id, // 自定义key提取函数
  renderItem = (item) => <Text style={styles.defaultItemText}>{item.text}</Text>, // 自定义渲染每一项
}) => {
  // 内部维护一份数据副本用于拖拽操作
  const [list, setList] = useState([...data]);
  
  // 拖拽状态管理
  const longPressTimer = useRef(null);
  const LONG_PRESS_DELAY = 300;
  const [draggingItemId, setDraggingItemId] = useState(null); // 当前拖拽项ID
  const [activeIndex, setActiveIndex] = useState(-1); // 拖拽项初始索引
  const [targetIndex, setTargetIndex] = useState(-1); // 目标索引
  
  // 滚动相关
  const scrollViewRef = useRef(null);
  const scrollY = useRef(0); // 当前滚动位置
  const containerHeight = useRef(0); // 容器高度
  const contentHeight = useRef(0); // 内容高度
  
  // 动画相关
  const dragY = useRef(new Animated.Value(0)).current; // 拖拽偏移量
  const dragStartY = useRef(0); // 手势起始Y坐标
  const isAnimating = useRef(false); // 吸附动画锁
  const autoScrollTimer = useRef(null); // 自动滚动定时器
  
  const memoizedKeyExtractor = keyExtractor;
  const memoizedRenderItem = renderItem;
  
  // 监听外部数据变化，同步更新内部列表
  useEffect(() => {
    // 只有当数据内容真正变化时才更新内部列表
    if(!isArrayEqual(data, list)) {
      setList([...data]);
    }
  }, [data, list]);
  
  // 处理手势开始
  const handleGestureStart = useCallback((e, itemId, index) => {
    if(isAnimating.current || list.length === 0) return;
    
    setDraggingItemId(itemId);
    setActiveIndex(index);
    setTargetIndex(index);
    dragStartY.current = e.nativeEvent.y;
    dragY.setValue(0); // 重置拖拽偏移
  }, [list.length, dragY]);
  
  const stopAutoScroll = useCallback(() => {
    autoScrollDirection.current = null;
    if(autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
      autoScrollTimer.current = null;
    }
  }, []);
  
  const handleGestureEnd = useCallback(() => {
    if(!draggingItemId || activeIndex === -1 || targetIndex === -1 || isAnimating.current || list.length === 0) return;
    
    isAnimating.current = true;
    stopAutoScroll(); // 停止自动滚动
    
    // 计算从当前位置到目标坑位的吸附偏移量
    const snapOffset = (targetIndex - activeIndex) * ITEM_BASE_HEIGHT;
    
    // 执行吸附动画：从松手位置直接吸附到目标坑位
    Animated.timing(dragY, {
      toValue: snapOffset,
      duration: SNAP_ANIMATION_DURATION,
      useNativeDriver: false,
    }).start(() => {
      // 动画完成后更新列表
      if(targetIndex !== activeIndex) {
        const newList = [...list];
        const [movedItem] = newList.splice(activeIndex, 1);
        newList.splice(targetIndex, 0, movedItem);
        setList(newList);
        
        // 通知父组件排序完成，返回最新数组
        if(typeof onSortEnd === 'function') {
          onSortEnd([...newList]);
        }
      }
      
      // 重置状态
      setDraggingItemId(null);
      setActiveIndex(-1);
      setTargetIndex(-1);
      isAnimating.current = false;
    });
  }, [draggingItemId, activeIndex, targetIndex, list, dragY, stopAutoScroll, onSortEnd]);
  
  const startAutoScroll = useCallback((direction, distance) => {
    if(autoScrollDirection.current === direction) return;
    
    stopAutoScroll();
    autoScrollDirection.current = direction;
    
    autoScrollTimer.current = setInterval(() => {
      const speed = Math.max(4, distance * 0.8); // 最小速度保障
      
      let nextY =
        direction === 'up'
          ? scrollY.current - speed
          : scrollY.current + speed;
      
      const maxY = contentHeight.current - containerHeight.current;
      nextY = Math.max(0, Math.min(maxY, nextY));
      
      scrollViewRef.current?.scrollTo({
        y: nextY,
        animated: false
      });
    }, 16);
  }, [stopAutoScroll]);
  
  const checkAutoScroll = useCallback((fingerY) => {
    if(!containerHeight.current || list.length === 0) return;
    
    const topEdge = AUTO_SCROLL_THRESHOLD;
    const bottomEdge = containerHeight.current - AUTO_SCROLL_THRESHOLD;
    
    if(fingerY < topEdge) {
      startAutoScroll('up', topEdge - fingerY);
    } else if(fingerY > bottomEdge) {
      startAutoScroll('down', fingerY - bottomEdge);
    } else {
      stopAutoScroll();
    }
  }, [list.length, startAutoScroll, stopAutoScroll]);
  
  // 处理手势移动的监听函数
  const gestureEventListener = useCallback((event) => {
    if(!draggingItemId || list.length === 0) return;
    
    const {
      translationY,
      absoluteY
    } = event.nativeEvent;
    
    dragY.setValue(translationY);
    
    const newTargetIndex = Math.max(
      0,
      Math.min(
        list.length - 1,
        activeIndex + Math.round(translationY / ITEM_BASE_HEIGHT)
      )
    );
    
    if(newTargetIndex !== targetIndex) {
      setTargetIndex(newTargetIndex);
    }
    
    checkAutoScroll(absoluteY);
  }, [draggingItemId, list.length, activeIndex, targetIndex, dragY, checkAutoScroll]);
  
  // 处理手势事件（使用useCallback缓存）
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragY } }],
    {
      useNativeDriver: false,
      listener: gestureEventListener
    }
  );
  
  const onPanStateChange = useCallback((e, item, index) => {
    // 空数据时直接返回
    if(list.length === 0) return;
    
    const { state } = e.nativeEvent;
    
    if(state === State.BEGAN) {
      longPressTimer.current = setTimeout(() => {
        handleGestureStart(e, memoizedKeyExtractor(item), index);
      }, LONG_PRESS_DELAY);
    }
    
    if(state === State.ACTIVE) {
      // 如果手指提前移动，取消长按
      if(!draggingItemId) {
        clearTimeout(longPressTimer.current);
      }
    }
    
    if(state === State.END || state === State.CANCELLED) {
      clearTimeout(longPressTimer.current);
      handleGestureEnd();
      stopAutoScroll(); // 停止自动滚动
    }
  }, [list.length, draggingItemId, handleGestureStart, handleGestureEnd, stopAutoScroll, memoizedKeyExtractor]);
  
  // 自动滚动方向引用
  const autoScrollDirection = useRef(null);
  
  // 处理ScrollView滚动
  const handleScroll = useCallback((event) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
  }, []);
  
  // 获取容器尺寸
  const handleContainerLayout = useCallback((event) => {
    containerHeight.current = event.nativeEvent.layout.height;
  }, []);
  
  // 获取内容尺寸
  const handleContentSizeChange = useCallback((width, height) => {
    contentHeight.current = height;
  }, []);
  
  // 获取列表项样式
  const getItemStyle = useCallback((item, index) => {
    const itemId = memoizedKeyExtractor(item);
    const isDragging = draggingItemId === itemId;
    const baseTop = index * ITEM_BASE_HEIGHT; // 每个项的基础top值
    
    // 非拖拽项的挤压效果
    let translateY = 0;
    if(draggingItemId && activeIndex !== -1 && targetIndex !== -1 && !isDragging) {
      // 向下拖拽：中间项向上挤
      if(targetIndex > activeIndex) {
        if(index > activeIndex && index <= targetIndex) {
          translateY = -ITEM_BASE_HEIGHT;
        }
      }
      // 向上拖拽：中间项向下挤
      else if(targetIndex < activeIndex) {
        if(index < activeIndex && index >= targetIndex) {
          translateY = ITEM_BASE_HEIGHT;
        }
      }
    }
    
    // 拖拽项样式（跟随手势+吸附）
    if(isDragging) {
      return {
        position: 'absolute',
        top: baseTop,
        left: 0,
        right: 0,
        zIndex: 100,
        transform: [{ translateY: dragY }],
        elevation: 8,
        opacity: 0.95,
      };
    }
    
    // 非拖拽项样式（带挤压效果）
    return {
      position: 'absolute',
      top: baseTop,
      left: 0,
      right: 0,
      transform: [{ translateY }],
      transition: 'transform 0.08s ease', // 轻量过渡
    };
  }, [draggingItemId, activeIndex, targetIndex, dragY, memoizedKeyExtractor]);
  
  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if(autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
      if(longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);
  
  return (
    <GestureHandlerRootView
      style={styles.container}>
      {list.length === 0 ? (
        <EmptyContainer />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleContainerLayout}
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            styles.listContainer,
            { height: ITEM_BASE_HEIGHT * list.length } // 根据实际数据长度动态设置高度
          ]}>
            {/* 占位坑位（背景） */}
            {list.map((item, index) => (
              <View
                key={`placeholder-${memoizedKeyExtractor(item)}`}
                style={[styles.placeholder, { top: index * ITEM_BASE_HEIGHT }]}
              />
            ))}
            
            {/* 可拖拽列表项 */}
            {list.map((item, index) => {
              // 原有列表项渲染逻辑保持不变
              const itemId = memoizedKeyExtractor(item);
              return (
                <Animated.View
                  key={itemId}
                  style={[
                    styles.listItem,
                    getItemStyle(item, index),
                    draggingItemId === itemId && styles.draggingItem,
                  ]}
                >
                  {/* 原有列表项内容保持不变 */}
                  <PanGestureHandler
                    onHandlerStateChange={(e) => onPanStateChange(e, item, index)}
                    onGestureEvent={handleGestureEvent}
                  >
                    <View style={styles.content}>
                      {memoizedRenderItem(item)}
                    </View>
                  </PanGestureHandler>
                  
                  <PanGestureHandler
                    onHandlerStateChange={(e) => {
                      if(list.length === 0) return;
                      if(e.nativeEvent.state === State.BEGAN) {
                        handleGestureStart(e, itemId, index);
                      }
                      if(
                        e.nativeEvent.state === State.END ||
                        e.nativeEvent.state === State.CANCELLED
                      ) {
                        handleGestureEnd();
                      }
                    }}
                    onGestureEvent={handleGestureEvent}
                  >
                    <View style={styles.handle}>
                      <Icon
                        lib={"MaterialIcons"}
                        name="drag-handle"
                        size={24}
                        color="#fff"
                      />
                    </View>
                  </PanGestureHandler>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    position: 'relative',
    padding: 10,
  },
  placeholder: {
    position: 'absolute',
    height: 60,
    marginVertical: 5,
    opacity: 0.4,
    borderRadius: 4,
    backgroundColor: '#e0e0e0'
  },
  draggingItem: {
    backgroundColor: 'skyblue',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2
    }
  },
  defaultItemText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500'
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    marginVertical: 5,
    borderRadius: 4,
    backgroundColor: 'skyblue'
  },
  content: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center'
  },
  handle: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'grab'
  },
  handleIcon: {
    fontSize: 22,
    color: '#fff'
  }
});

export default React.memo(DragDropList);