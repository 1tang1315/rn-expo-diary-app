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
import solarLunar from 'solarlunar';

const screenWidth = Dimensions.get('window').width;
const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

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

// 公历节日
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

// 农历节日
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

// 获取节日信息
function getHolidayInfo(d) {
  if(!d.isValid()) return null;
  const m = d.month() + 1;
  const dd = d.date();
  const solarKey = `${m}-${dd}`;
  if(SOLAR_HOLIDAYS[solarKey]) return {
    name: SOLAR_HOLIDAYS[solarKey],
    isHoliday: true,
    isSolar: true
  };
  const lunar = lunarInfo(d);
  if(lunar.term) return {
    name: lunar.term,
    isHoliday: false,
    isSolar: false
  };
  const lunarKey = `${lunar.lunarMonth}-${lunar.lunarDay}`;
  if(LUNAR_HOLIDAYS[lunarKey]) return {
    name: LUNAR_HOLIDAYS[lunarKey],
    isHoliday: true,
    isSolar: false
  };
  return null;
}

// 农历信息
function lunarInfo(d) {
  if(!d.isValid()) return {
    lunarMonth: 0,
    lunarDay: 0,
    lunarDayCn: '',
    term: '',
    lunarMonthCn: ''
  };
  try {
    const info = solarLunar.solar2lunar(d.year(), d.month() + 1, d.date());
    return {
      lunarMonth: info.lMonth || 0,
      lunarDay: info.lDay || 0,
      lunarDayCn: info.dayCn || '',
      term: info.term || '',
      lunarMonthCn: info.monthCn || ''
    };
  } catch {
    return {
      lunarMonth: 0,
      lunarDay: 0,
      lunarDayCn: '',
      term: '',
      lunarMonthCn: ''
    };
  }
}

// 构建月视图矩阵(6行7列)
function buildMonthMatrix(baseMonth) {
  if(!baseMonth.isValid()) return [];
  const startOfMonth = baseMonth.startOf('month');
  const startOffset = startOfMonth.day();
  const gridStart = startOfMonth.subtract(startOffset, 'day');
  const cells = [];
  for(let i = 0; i < 42; i++) cells.push(gridStart.add(i, 'day'));
  return cells;
}

// 获取周数据
function getWeekData(anchor) {
  if(!anchor.isValid()) return [];
  const dayOfWeek = anchor.day();
  const weekStart = anchor.subtract(dayOfWeek, 'day');
  const row = [];
  for(let i = 0; i < 7; i++) row.push(weekStart.add(i, 'day'));
  return row;
}

export default function Calendar({
  value,
  onChange
}) {
  // 当天日期
  const [base, setBase] = useState(() => value ? dayjs(value) : dayjs());
  // 选中的日期
  const [anchor, setAnchor] = useState(() => value ? dayjs(value) : dayjs());
  const [expanded, setExpanded] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  // 视图数据(周/月)
  const [currentData, setCurrentData] = useState(() => {
    const initialDate = value ? dayjs(value) : dayjs();
    return expanded ? buildMonthMatrix(initialDate) : getWeekData(initialDate);
  });
  
  const today = dayjs();
  const isSwipingRef = useRef(false);
  const combinedPanResponder = useRef(null);
  // 保持用户切换 周/月 选中日期
  const selectedPosRef = useRef({
    row: null,
    col: null
  });
  
  // 选中位置更新(月: 行 + 列; 周: 列)
  useEffect(() => {
    const targetDate = anchor;
    if(!targetDate.isValid()) return;
    if(expanded) {
      const matrix = buildMonthMatrix(base);
      const idx = matrix.findIndex(d => d.isSame(targetDate, 'day'));
      if(idx >= 0) selectedPosRef.current = {
        row: Math.floor(idx / 7),
        col: idx % 7
      };
    } else {
      const weekData = getWeekData(anchor);
      const col = weekData.findIndex(d => d.isSame(targetDate, 'day'));
      if(col >= 0) selectedPosRef.current = {
        row: 0,
        col
      };
    }
  }, [base, anchor, expanded]);
  
  // 切换 上/下 一个 周/月, 接收(prev, next)作为方向
  const handlePeriodChange = useCallback((direction) => {
    if (!['prev', 'next'].includes(direction)) return; // 校验参数合法性
    
    const adjustMethod = direction === 'next' ? 'add' : 'subtract';
    const unit = expanded ? 'month' : 'week'; // 根据视图模式自动判断单位
    
    if (expanded) {
      // 月视图逻辑
      setBase(prev => {
        const next = prev[adjustMethod](1, unit);
        const { row, col } = selectedPosRef.current;
        
        if (row != null && col != null) {
          const newData = buildMonthMatrix(next);
          const target = newData[row * 7 + col];
          if (target?.isValid()) {
            setAnchor(target);
            onChange?.(target);
          }
        }
        return next;
      });
    } else {
      // 周视图逻辑
      setAnchor(prev => {
        const next = prev[adjustMethod](1, unit);
        const { col } = selectedPosRef.current;
        
        if (col != null) {
          const newData = getWeekData(next);
          const target = newData[col];
          if (target?.isValid()) {
            setBase(target);
            onChange?.(target);
          }
        }
        return next;
      });
    }
  }, [expanded, onChange]);
  
  // 初始化/更新手势(上下 折叠/展开; 左右 上/下 一个月)
  useEffect(() => {
    combinedPanResponder.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const dxAbs = Math.abs(gesture.dx);
        const dyAbs = Math.abs(gesture.dy);
        return dxAbs > 10 || dyAbs > 10;
      },
      onPanResponderStart: () => {
        isSwipingRef.current = true;
        setIsSwiping(true);
      },
      onPanResponderMove: () => {
      },
      onPanResponderRelease: (_, gesture) => {
        const dxAbs = Math.abs(gesture.dx);
        const dyAbs = Math.abs(gesture.dy);
        const triggerThreshold = expanded ? 30 : 40;
        if(dxAbs > dyAbs * 1.2 && dxAbs > triggerThreshold) {
          gesture?.dx > 0 ? handlePeriodChange('prev') : handlePeriodChange('next');
        } else if(dyAbs > dxAbs * 1.5 && dyAbs > 40) {
          gesture?.dy > 0 ? setExpanded(true) : setExpanded(false);
        }
        isSwipingRef.current = false;
        setTimeout(() => setIsSwiping(false), 100);
      },
      onPanResponderTerminate: () => {
        isSwipingRef.current = false;
        setTimeout(() => setIsSwiping(false), 100);
      },
      onShouldBlockNativeResponder: () => true,
    });
    return () => {
      combinedPanResponder.current = null;
    };
  }, [expanded]);
  
  const getCurrentData = useCallback(() => {
    const targetDate = expanded ? base : anchor;
    return !targetDate.isValid() ? [] : expanded ? buildMonthMatrix(targetDate) : getWeekData(targetDate);
  }, [expanded, base, anchor]);
  
  useEffect(() => {
    setCurrentData(getCurrentData());
  }, [getCurrentData]);
  
  useEffect(() => {
    if(!value) return;
    const newDate = dayjs(value);
    if(!newDate.isValid()) return;
    setBase(newDate.clone());
    setAnchor(newDate.clone());
    setCurrentData(expanded ? buildMonthMatrix(newDate) : getWeekData(newDate));
  }, [value, expanded]);
  
  const handleSelectDate = useCallback((d, row, col) => {
    if(!d.isValid() || isSwiping) return;
    const newDate = d.clone();
    setAnchor(newDate);
    setBase(newDate); // 更新选中锚点
    onChange?.(newDate); // 更新月视图基准（确保月视图显示选中日期所在月)
    selectedPosRef.current = {
      row,
      col
    };
  }, [isSwiping, onChange]);
  
  const renderCell = useCallback((d, idx, row, col) => {
    if(!d.isValid()) return null;
    const currentCycleBase = expanded ? base : anchor;
    const inCycle = expanded ? d.isSame(currentCycleBase, 'month') : d.isSame(currentCycleBase, 'week');
    const isToday = d.isSame(today, 'day');
    const isSelected = d.isSame(anchor, 'day');
    const isWeekend = d.day() === 0 || d.day() === 6;
    const holidayInfo = getHolidayInfo(d);
    const lunar = lunarInfo(d);
    let lunarText = holidayInfo ? holidayInfo.name : (lunar.lunarDay === 1 ? lunar.lunarMonthCn : lunar.lunarDayCn);
    let dayNumColor = COLORS.text, lunarTextColor = COLORS.dim;
    if(!inCycle) {
      dayNumColor = lunarTextColor = COLORS.dim;
    } else if(isToday) dayNumColor = COLORS.today;
    else if(holidayInfo?.isHoliday) {
      dayNumColor = lunarTextColor = COLORS.holiday;
    } else if(isWeekend) {
      dayNumColor = lunarTextColor = COLORS.weekend;
    }
    
    return (
      <Pressable
        key={`cell-${idx}`}
        style={[styles.cell, isSelected && styles.cellSelected]}
        delayPressIn={200}
        onPress={() => !isSwipingRef.current && inCycle && handleSelectDate(d, row, col)}
        android_ripple={!isSwipingRef.current && inCycle ? { color: 'rgba(0,0,0,0.1)' } : null}
        disabled={isSwipingRef.current || !inCycle}
      >
        <View style={[styles.cellInner, isToday && styles.cellToday]}>
          <Text style={[styles.dayNum, { color: dayNumColor }]}>{d.date()}</Text>
          <Text style={[styles.lunarText, { color: lunarTextColor }]}>{lunarText}</Text>
        </View>
      </Pressable>
    );
  }, [base, anchor, today, expanded, handleSelectDate]);
  
  const renderPageRows = useCallback((data) => {
    if(!data || data.length === 0) return null;
    const rows = [];
    for(let i = 0; i < data.length; i += 7) {
      const rowData = data.slice(i, i + 7);
      const rowIdx = Math.floor(i / 7);
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowData.map((d, colIdx) => renderCell(d, colIdx, rowIdx, colIdx))}
        </View>
      );
    }
    return rows;
  }, [renderCell]);
  
  if(currentData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.row}>
          {WEEK_LABELS.map((label, idx) => (
            <View key={`empty-week-${idx}`} style={styles.weekCell}>
              <Text style={[styles.weekText, (idx === 0 || idx === 6) && styles.weekendText]}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>加载日历中...</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container} {...(combinedPanResponder.current ? combinedPanResponder.current.panHandlers : {})}>
      {/* 星期标签栏 */}
      <View style={styles.row}>
        {WEEK_LABELS.map((label, idx) => (
          <View key={`week-${idx}`} style={styles.weekCell}>
            <Text style={[styles.weekText, (idx === 0 || idx === 6) && styles.weekendText]}>{label}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.pageContainer}>{renderPageRows(currentData)}</View>
      
      <View style={styles.footer}><View style={styles.lineIcon} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: COLORS.bg,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  },
  pageContainer: {
    width: screenWidth - 20,
    flexShrink: 0,
    paddingVertical: 8
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between'
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8
  },
  weekText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.dim
  },
  weekendText: { color: COLORS.weekend },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4
  },
  cellInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 6,
    borderRadius: 8
  },
  cellToday: {
    borderWidth: 1,
    borderRadius: '50%',
    borderColor: COLORS.today
  },
  cellSelected: {
    borderRadius: '50%',
    backgroundColor: `${COLORS.primary}15`
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2
  },
  lunarText: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 12
  },
  footer: {
    marginTop: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  lineIcon: {
    marginLeft: 'auto',
    marginRight: 'auto',
    width: 30,
    height: 4,
    backgroundColor: COLORS.dim,
    borderRadius: 2
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.dim
  },
});
