import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  PanResponder,
  Animated,
  StyleSheet,
  Dimensions,
  LayoutAnimation,
  UIManager, Platform
} from 'react-native';

// 启用LayoutAnimation（Android需要额外配置）
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const DragSortList = ({ initialItems }) => {
  // 列表数据状态
  const [items, setItems] = useState(initialItems);
  // 当前拖拽项ID
  const [draggedId, setDraggedId] = useState(null);
  // 拖拽偏移量
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // 拖拽项位置
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  // 列表项高度（假设固定高度）
  const itemHeight = 60;
  // 动画值引用
  const animatedValues = useRef(new Map()).current;
  // FlatList引用
  const flatListRef = useRef(null);
  // 拖拽项初始索引
  const initialIndexRef = useRef(-1);
  
  // 初始化动画值
  useEffect(() => {
    items.forEach(item => {
      if (!animatedValues.has(item.id)) {
        animatedValues.set(item.id, new Animated.Value(0));
      }
    });
  }, [items]);
  
  // 创建PanResponder处理拖拽手势
  const panResponder = useRef(
    PanResponder.create({
      // 开始触摸时
      onStartShouldSetPanResponder: (evt, gestureState) => {
        const { id } = evt.target._nativeTag; // 获取当前项ID
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
          initialIndexRef.current = index;
          setDraggedId(id);
          // 记录初始位置
          const y = index * itemHeight;
          setDragPosition({ x: 0, y });
          setOffset({ x: gestureState.x0, y: gestureState.y0 });
          return true;
        }
        return false;
      },
      
      // 触摸移动时
      onPanResponderMove: (evt, gestureState) => {
        if (!draggedId) return;
        
        // 计算拖拽位置
        const newY = dragPosition.y + (gestureState.moveY - offset.y);
        setDragPosition(prev => ({ ...prev, y: newY }));
        setOffset({ x: gestureState.x0, y: gestureState.y0 });
        
        // 计算当前应该在的索引
        const currentIndex = Math.max(
          0,
          Math.min(items.length - 1, Math.round(newY / itemHeight))
        );
        
        // 如果索引变化，调整列表顺序并触发动画
        if (currentIndex !== initialIndexRef.current) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          const newItems = [...items];
          const [movedItem] = newItems.splice(initialIndexRef.current, 1);
          newItems.splice(currentIndex, 0, movedItem);
          setItems(newItems);
          initialIndexRef.current = currentIndex;
          
          // 更新其他项的动画
          newItems.forEach((item, idx) => {
            const animatedValue = animatedValues.get(item.id);
            if (animatedValue) {
              Animated.timing(animatedValue, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true
              }).start();
            }
          });
        }
      },
      
      // 触摸结束时
      onPanResponderRelease: () => {
        setDraggedId(null);
        initialIndexRef.current = -1;
      }
    })
  ).current;
  
  // 渲染列表项
  const renderItem = ({ item, index }) => {
    const isDragging = draggedId === item.id;
    const animatedValue = animatedValues.get(item.id) || new Animated.Value(0);
    
    // 拖拽项样式（浮层效果）
    if (isDragging) {
      return (
        <Animated.View
          style={[
            styles.item,
            styles.draggingItem,
            {
              position: 'absolute',
              top: dragPosition.y,
              left: 0,
              width: width - 40,
              zIndex: 100
            }
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={styles.itemText}>{item.content}</Text>
        </Animated.View>
      );
    }
    
    // 普通项样式（带动画）
    return (
      <Animated.View
        style={[
          styles.item,
          {
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, itemHeight]
                })
              }
            ]
          }
        ]}
        {...panResponder.panHandlers}
        _nativeTag={{ id: item.id }} // 用于识别当前项ID
      >
        <Text style={styles.itemText}>{item.content}</Text>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={!draggedId} // 拖拽时禁用滚动
      />
    </View>
  );
};

export default DragSortList;

// 样式定义
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingVertical: 10,
  },
  item: {
    height: 60,
    paddingHorizontal: 15,
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  draggingItem: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
    elevation: 5,
  },
});