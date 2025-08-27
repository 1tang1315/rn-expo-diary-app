import React, {
  useState,
  useCallback,
  useRef,
  useEffect
} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  PanResponder,
  Dimensions
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import solarLunar from 'solarlunar';

// 基础配置
const screenWidth = Dimensions.get('window').width;
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// 颜色配置
const COLORS = {
  text: '#222',
  dim: '#999',
  border: '#eee',
  bg: '#fff',
  weekend: '#2563eb',
  holiday: '#dc2626',
  today: '#16a34a',
  primary: '#3b82f6',
  modalBg: 'rgba(0, 0, 0, 0.5)',
};

// 节日数据
const SOLAR_HOLIDAYS = {
  '1-1': '元旦',
  '2-14': '情人节',
  '3-8': '妇女节',
  '3-12': '植树节',
  '4-5': '清明节',
  '5-1': '劳动节',
  '5-4': '青年节',
  '6-1': '儿童节',
  '7-1': '建党节',
  '8-1': '建军节',
  '9-10': '教师节',
  '10-1': '国庆节',
  '12-24': '平安夜',
  '12-25': '圣诞节'
};

const LUNAR_HOLIDAYS = {
  '1-1': '春节',
  '1-15': '元宵节',
  '2-2': '龙抬头',
  '5-5': '端午节',
  '7-7': '七夕',
  '7-15': '中元节',
  '8-15': '中秋节',
  '9-9': '重阳节',
  '12-30': '除夕'
};

// ———————————————— 工具函数层 ————————————————
function getHolidayInfo(d) {
  if (!d.isValid()) return null;
  
  const m = d.month() + 1;
  const dd = d.date();
  const solarKey = `${m}-${dd}`;
  
  // 优先判断公历节日
  if (SOLAR_HOLIDAYS[solarKey]) {
    return { name: SOLAR_HOLIDAYS[solarKey], isHoliday: true, isSolar: true };
  }
  
  // 再判断农历节日/节气
  const lunar = lunarInfo(d);
  if (lunar.term) {
    return { name: lunar.term, isHoliday: false, isSolar: false };
  }
  const lunarKey = `${lunar.lunarMonth}-${lunar.lunarDay}`;
  if (LUNAR_HOLIDAYS[lunarKey]) {
    return { name: LUNAR_HOLIDAYS[lunarKey], isHoliday: true, isSolar: false };
  }
  
  return null;
}

function lunarInfo(d) {
  if (!d.isValid()) return { lunarMonth: 0, lunarDay: 0, lunarDayCn: '', term: '', lunarMonthCn: '' };
  
  try {
    const info = solarLunar.solar2lunar(d.year(), d.month() + 1, d.date());
    return {
      lunarMonth: info.lMonth || 0,
      lunarDay: info.lDay || 0,
      lunarDayCn: info.dayCn || '',
      term: info.term || '',
      lunarMonthCn: info.monthCn || ''
    };
  } catch (e) {
    console.warn('农历转换失败:', e);
    return {
      lunarMonth: 0,
      lunarDay: 0,
      lunarDayCn: '',
      term: '',
      lunarMonthCn: ''
    };
  }
}

function buildMonthMatrix(baseMonth) {
  if (!baseMonth.isValid()) return [];
  
  const startOfMonth = baseMonth.startOf('month').clone();
  const startOffset = startOfMonth.day();
  const gridStart = startOfMonth.subtract(startOffset, 'day').clone();
  
  const cells = [];
  for (let i = 0; i < 42; i++) { // 6行7列，覆盖所有月份情况
    cells.push(gridStart.add(i, 'day').clone());
  }
  
  return cells;
}

function getWeekData(anchor) {
  if (!anchor.isValid()) return [];
  
  const dayOfWeek = anchor.day();
  const weekStart = anchor.subtract(dayOfWeek, 'day').clone();
  
  const row = [];
  for (let i = 0; i < 7; i++) {
    row.push(weekStart.add(i, 'day').clone());
  }
  return row;
}

// ———————————————— 主日历组件 ————————————————
export default function Calendar({ value, onChange }) {
  // 核心状态：当前基准日期（月视图用base，周视图用anchor）、视图模式、滑动状态、当前渲染数据
  const [base, setBase] = useState(() => value ? dayjs(value) : dayjs());
  const [anchor, setAnchor] = useState(() => value ? dayjs(value) : dayjs());
  const [expanded, setExpanded] = useState(false); // false=周视图，true=月视图
  const [isSwiping, setIsSwiping] = useState(false);
  const [currentData, setCurrentData] = useState(() => {
    // 初始化当前页面数据（根据初始视图模式）
    const initialDate = value ? dayjs(value) : dayjs();
    return expanded ? buildMonthMatrix(initialDate) : getWeekData(initialDate);
  });
  
  const today = dayjs();
  
  // ———————————————— 数据更新逻辑 ————————————————
  // 获取当前视图的日期数据（月/周）
  const getCurrentData = useCallback(() => {
    const targetDate = expanded ? base : anchor;
    if (!targetDate.isValid()) return [];
    return expanded ? buildMonthMatrix(targetDate) : getWeekData(targetDate);
  }, [expanded, base, anchor]);
  
  // 视图模式（周/月）或基准日期变化时，更新当前渲染数据
  useEffect(() => {
    setCurrentData(getCurrentData());
  }, [getCurrentData]);
  
  // 外部value变化时同步内部状态
  useEffect(() => {
    if (!value) return;
    const newDate = dayjs(value);
    if (!newDate.isValid()) return;
    
    setBase(newDate.clone());
    setAnchor(newDate.clone());
    setCurrentData(expanded ? buildMonthMatrix(newDate) : getWeekData(newDate));
  }, [value, expanded]);
  
  // ———————————————— 切换逻辑 ————————————————
  // 上一个月/周
  const handlePrev = useCallback(() => {
    if (expanded) {
      setBase(prev => prev.subtract(1, 'month'));
    } else {
      setAnchor(prev => prev.subtract(1, 'week'));
    }
  }, [expanded]);
  
  // 下一个月/周
  const handleNext = useCallback(() => {
    if (expanded) {
      setBase(prev => prev.add(1, 'month'));
    } else {
      setAnchor(prev => prev.add(1, 'week'));
    }
  }, [expanded]);
  
  // 日期选择
  const handleSelectDate = useCallback((d) => {
    if (!d.isValid() || isSwiping) return;
    
    const newDate = d.clone();
    setAnchor(newDate);
    setBase(newDate);
    onChange?.(newDate);
  }, [isSwiping, onChange]);
  
  // ———————————————— 手势处理 ————————————————
  // 垂直滑动：切换周/月视图
  const verticalPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // 垂直滑动判定：垂直距离>阈值，且远大于水平距离（避免与水平滑动冲突）
        return Math.abs(gesture.dy) > 5 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5;
      },
      onPanResponderGrant: () => setIsSwiping(true),
      onPanResponderRelease: (_, gesture) => {
        setIsSwiping(false);
        const threshold = 50; // 滑动触发阈值
        if (gesture.dy > threshold) {
          setExpanded(true); // 向下滑：周视图→月视图
        } else if (gesture.dy < -threshold) {
          setExpanded(false); // 向上滑：月视图→周视图
        }
      },
      onPanResponderTerminate: () => setIsSwiping(false)
    })
  ).current;
  
  // 水平滑动：切换上下月/周
  const horizontalPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // 水平滑动判定：水平距离>阈值，且远大于垂直距离（避免与垂直滑动冲突）
        return Math.abs(gesture.dx) > 15 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5;
      },
      onPanResponderGrant: () => setIsSwiping(true),
      onPanResponderRelease: (_, gesture) => {
        setIsSwiping(false);
        const threshold = 50; // 滑动触发阈值
        if (gesture.dx > threshold) {
          handlePrev(); // 向右滑：上一个月/周
        } else if (gesture.dx < -threshold) {
          handleNext(); // 向左滑：下一个月/周
        }
      },
      onPanResponderTerminate: () => setIsSwiping(false)
    })
  ).current;
  
  // ———————————————— 渲染逻辑 ————————————————
  // 渲染单个日期单元格
  const renderCell = useCallback((d, idx) => {
    if (!d.isValid()) return null;
    
    // 判断当前日期是否在当前视图周期内（月/周）
    const currentCycleBase = expanded ? base : anchor;
    const inCycle = expanded
      ? d.isSame(currentCycleBase, 'month')
      : d.isSame(currentCycleBase, 'week');
    
    // 日期状态：今天、选中、周末、节日
    const isToday = d.isSame(today, 'day');
    const isSelected = d.isSame(anchor, 'day');
    const isWeekend = d.day() === 0 || d.day() === 6;
    const holidayInfo = getHolidayInfo(d);
    const lunar = lunarInfo(d);
    
    // 农历/节日文本显示优先级：节日 > 农历月（初一）> 农历日
    let lunarText = '';
    if (holidayInfo) {
      lunarText = holidayInfo.name;
    } else {
      lunarText = lunar.lunarDay === 1 ? lunar.lunarMonthCn : lunar.lunarDayCn;
    }
    
    // 文本颜色逻辑
    let dayNumColor = COLORS.text;
    let lunarTextColor = COLORS.dim;
    if (!inCycle) {
      // 非当前周期的日期（月视图中显示的上月/下月日期）
      dayNumColor = COLORS.dim;
      lunarTextColor = COLORS.dim;
    } else if (isToday) {
      dayNumColor = COLORS.today;
    } else if (holidayInfo?.isHoliday) {
      dayNumColor = COLORS.holiday;
      lunarTextColor = COLORS.holiday;
    } else if (isWeekend) {
      dayNumColor = COLORS.weekend;
      lunarTextColor = COLORS.weekend;
    }
    
    return (
      <Pressable
        key={`cell-${idx}`}
        style={[styles.cell, isSelected && styles.cellSelected]}
        delayPressIn={150} // 防误触
        onPress={() => inCycle && handleSelectDate(d)}
        android_ripple={inCycle ? { color: 'rgba(0,0,0,0.1)' } : null}
        disabled={!inCycle || isSwiping} // 非当前周期或滑动中禁用点击
      >
        <View style={[styles.cellInner, isToday && styles.cellToday]}>
          <Text style={[styles.dayNum, { color: dayNumColor }]}>
            {d.date()}
          </Text>
          <Text style={[styles.lunarText, { color: lunarTextColor }]}>
            {lunarText}
          </Text>
        </View>
      </Pressable>
    );
  }, [base, anchor, today, expanded, isSwiping, handleSelectDate]);
  
  // 渲染日期行（7列一行）
  const renderPageRows = useCallback((data) => {
    if (!data || data.length === 0) return null;
    
    const rows = [];
    for (let i = 0; i < data.length; i += 7) {
      const rowData = data.slice(i, i + 7);
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowData.map((d, idx) => renderCell(d, idx))}
        </View>
      );
    }
    return rows;
  }, [renderCell]);
  
  // 空状态处理
  if (currentData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          {WEEK_LABELS.map((label, idx) => (
            <View key={`empty-week-${idx}`} style={styles.weekCell}>
              <Text style={[styles.weekText, (idx === 0 || idx === 6) && styles.weekendText]}>
                {label}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>加载日历中...</Text>
        </View>
      </View>
    );
  }
  
  // ———————————————— 最终渲染 ————————————————
  return (
    <View
      style={styles.container}
      {...verticalPanResponder.panHandlers} // 绑定垂直滑动手势
      {...horizontalPanResponder.panHandlers} // 绑定水平滑动手势
    >
      {/* 星期标题栏 */}
      <View style={styles.row}>
        {WEEK_LABELS.map((label, idx) => (
          <View key={`week-${idx}`} style={styles.weekCell}>
            <Text style={[styles.weekText, (idx === 0 || idx === 6) && styles.weekendText]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
      
      {/* 日历内容区（单页渲染） */}
      <View style={styles.pageContainer}>
        {renderPageRows(currentData)}
      </View>
      
      {/* 底部下拉/上拉指示器 */}
      <View style={styles.footer}>
        <View style={styles.lineIcon} />
      </View>
    </View>
  );
}

// ———————————————— 样式定义 ————————————————
const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pageContainer: {
    width: screenWidth - 20, // 减去容器的左右padding(10*2)
    flexShrink: 0,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.dim,
  },
  weekendText: {
    color: COLORS.weekend,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cellInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 6,
    borderRadius: 8,
  },
  cellToday: {
    backgroundColor: `${COLORS.today}15`, // 淡绿色背景
  },
  cellSelected: {
    backgroundColor: `${COLORS.primary}15`, // 淡蓝色背景
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lunarText: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 12,
  },
  footer: {
    marginTop: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  lineIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 30,
    height: 4,
    backgroundColor: COLORS.dim,
    borderRadius: 2,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.dim,
  },
});