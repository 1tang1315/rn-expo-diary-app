import React, {
  useMemo,
  useState,
  useCallback, useRef, useEffect
} from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  PanResponder,
  Animated
} from 'react-native';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import solarLunar from 'solarlunar';
import { BlurView } from 'expo-blur';

// 基础配置
dayjs.locale('zh-cn');
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

// 工具函数
function getHolidayInfo(d) {
  const m = d.month() + 1;
  const dd = d.date();
  const solarKey = `${m}-${dd}`;
  
  if(SOLAR_HOLIDAYS[solarKey]) {
    return { name: SOLAR_HOLIDAYS[solarKey], isHoliday: true, isSolar: true };
  }
  
  const lunar = lunarInfo(d);
  const lunarKey = `${lunar.lunarMonth}-${lunar.lunarDay}`;
  
  if(LUNAR_HOLIDAYS[lunarKey]) {
    return { name: LUNAR_HOLIDAYS[lunarKey], isHoliday: true, isSolar: false };
  }
  
  if(lunar.term) {
    return { name: lunar.term, isHoliday: false, isSolar: false };
  }
  
  return null;
}

// 农历转公历
function lunarInfo(d) {
  const info = solarLunar.solar2lunar(d.year(), d.month() + 1, d.date());
  return {
    lunarMonth: info.lMonth,
    lunarDay: info.lDay,
    lunarDayCn: info.dayCn,
    term: info.term || '',
    lunarMonthCn: info.monthCn
  };
}

// 6行7列矩阵
function buildMonthMatrix(baseMonth) {
  const startOfMonth = baseMonth.startOf('month');
  const startOffset = startOfMonth.day();
  const gridStart = startOfMonth.subtract(startOffset, 'day');
  const cells = [];
  
  for(let i = 0; i < 42; i++) {
    cells.push(gridStart.add(i, 'day'));
  }
  
  return cells;
}

// 年月选择器组件
const YearMonthPicker = ({ visible, onClose, value, onChange }) => {
  const curY = value.year();
  const curM = value.month() + 1;
  const years = Array.from({ length: 21 }, (_, i) => curY - 10 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalContainer} onPress={onClose}>
        <Pressable>
          <BlurView intensity={80} tint="light" style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>选择年月</Text>
            
            <View style={styles.pickerColumns}>
              <ScrollView style={styles.pickerColumn}>
                {years.map(y => (
                  <Pressable
                    key={y}
                    style={[styles.pill, y === curY && styles.pillActive]}
                    onPress={() => onChange(dayjs(value).year(y))}
                  >
                    <Text style={[styles.pillText, y === curY && styles.pillTextActive]}>
                      {y}年
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              
              <ScrollView style={styles.pickerColumn}>
                {months.map(m => (
                  <Pressable
                    key={m}
                    style={[styles.pill, m === curM && styles.pillActive]}
                    onPress={() => onChange(dayjs(value).month(m - 1))}
                  >
                    <Text style={[styles.pillText, m === curM && styles.pillTextActive]}>
                      {m}月
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            
            <Pressable style={styles.okBtn} onPress={onClose}>
              <Text style={styles.okText}>完成</Text>
            </Pressable>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// 主日历组件
export default function Calendar() {
  const [base, setBase] = useState(dayjs());
  const [anchor, setAnchor] = useState(dayjs());
  const [expanded, setExpanded] = useState(false);
  const [ymOpen, setYmOpen] = useState(false);
  
  const today = dayjs();
  
  // 当anchor跨月时自动更新base
  useEffect(() => {
    if (anchor.month() !== base.month() || anchor.year() !== base.year()) {
      setBase(dayjs(anchor));
    }
  }, [anchor]);
  
  // 周数据生成逻辑
  const oneRow = useMemo(() => {
    // 直接以anchor为基准计算当前周，不再依赖base的月份矩阵
    const dayOfWeek = anchor.day(); // 0是周日
    const weekStart = anchor.subtract(dayOfWeek, 'day');
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push(weekStart.add(i, 'day'));
    }
    return row;
  }, [anchor]);
  
  const monthCells = useMemo(() => buildMonthMatrix(base), [base]);
  const data = expanded ? monthCells : oneRow;
  
 
  // 跟踪滑动状态
  const [isSwiping, setIsSwiping] = useState(false);
  const [offsetX] = useState(0);
  
  // 滑动手势相关
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        // 只要水平位移超过 6，就开始响应
        return Math.abs(g.dx) > 6;
      },
      onPanResponderMove: () => {
        setIsSwiping(true);
      },
      onPanResponderRelease: (_, g) => {
        const distanceThreshold = 40;  // 位移阈值
        const velocityThreshold = 0.5; // 速度阈值
        
        if (Math.abs(g.dx) > distanceThreshold || Math.abs(g.vx) > velocityThreshold) {
          g.dx < 0 ? handleNext() : handlePrev();
        }
        setIsSwiping(false);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderTerminate: () => {
        setIsSwiping(false);
      },
    })
  ).current;
  
  // 根据展开状态处理上一个（月/周）
  const handlePrev = () => {
    if(expanded) {
      // 展开状态 - 切换到上一个月
      setBase(p => p.subtract(1, 'month'));
    } else {
      // 未展开状态 - 切换到上一周
      setAnchor(a => a.subtract(1, 'week'));
    }
  };
  
  // 根据展开状态处理下一个（月/周）
  const handleNext = () => {
    if(expanded) {
      // 展开状态 - 切换到下一个月
      setBase(p => p.add(1, 'month'));
    } else {
      // 未展开状态 - 切换到下一周
      setAnchor(a => a.add(1, 'week'));
    }
  }
  
  // 生成日期行（每行7个元素）
  const renderRows = () => {
    const rows = [];
    for(let i = 0; i < data.length; i += 7) {
      const rowData = data.slice(i, i + 7);
      rows.push(
        <View key={i} style={styles.row}>
          {rowData.map((d, idx) => renderCell(d, idx))}
        </View>
      );
    }
    return rows;
  };
  
  const renderCell = useCallback((d, i) => {
    const inMonth = d.month() === base.month();
    const isToday = d.isSame(today, 'day');
    const isSelected = d.isSame(anchor, 'day');
    const dow = d.day();
    const weekend = dow === 0 || dow === 6;
    
    const holidayInfo = getHolidayInfo(d);
    const lunar = lunarInfo(d);
    
    let displayText = holidayInfo
      ? holidayInfo.name
      : (lunar.lunarDay === 1 ? lunar.lunarMonthCn : lunar.lunarDayCn);
    
    let textColor = COLORS.text;
    if(isToday) textColor = COLORS.today;
    else if(holidayInfo && holidayInfo.isHoliday) textColor = COLORS.holiday;
    else if(weekend) textColor = COLORS.weekend;
    
    const dim = !inMonth;
    
    return (
      <Pressable
        key={i}
        style={[styles.cell, isSelected && styles.cellSelected]}
        // 滑动过程中禁用点击
        onPress={() => !isSwiping && setAnchor(d)}
        // 滑动时不触发高亮
        android_ripple={isSwiping ? null : { color: 'rgba(0,0,0,0.1)' }}
        disabled={isSwiping}
      >
        <View style={[styles.cellInner, isToday && styles.cellToday]}>
          <Text style={[styles.dayNum, { color: dim ? COLORS.dim : textColor }]}>
            {d.date()}
          </Text>
          <Text
            style={[styles.lunarText, { color: dim ? COLORS.dim : (holidayInfo?.isHoliday ? COLORS.holiday : (weekend ? COLORS.weekend : COLORS.dim)) }]}>
            {displayText}
          </Text>
        </View>
      </Pressable>
    );
  }, [base, today, anchor]);
  
  return (
    <View style={[styles.wrap]} {...(!expanded ? panResponder.panHandlers : {})}>
      {/* 头部导航 */}
      <View style={styles.header}>
        <Pressable style={styles.navButton} onPress={handlePrev}>
          <Text style={styles.navArrow}>{'‹'}</Text>
        </Pressable>
        
        <View style={styles.headerCenter}>
          <Pressable onPress={() => setYmOpen(true)}>
            <Text style={styles.ymText}>
              {base.year()}年{base.month() + 1}月
            </Text>
          </Pressable>
          <Pressable style={styles.todayBtn} onPress={() => {
            setBase(today);
            setAnchor(today);
          }}>
            <Text style={styles.todayText}>今</Text>
          </Pressable>
        </View>
        
        <Pressable style={styles.navButton} onPress={handleNext}>
          <Text style={styles.navArrow}>{'›'}</Text>
        </Pressable>
      </View>
      
      {/* 星期标签行 */}
      <View style={styles.row}>
        {WEEK_LABELS.map((l, i) => (
          <View key={l} style={styles.weekCell}>
            <Text style={[styles.weekText, (i === 0 || i === 6) && styles.weekendText]}>
              {l}
            </Text>
          </View>
        ))}
      </View>
      
      {/* 日期网格（固定每行7个） */}
      <View style={styles.calendarBody}>
        {renderRows()}
      </View>
      
      {/* 展开/收起按钮 */}
      <View style={styles.footer}>
        <Pressable style={styles.dropdown} onPress={() => setExpanded(e => !e)}>
          <Text style={styles.dropIcon}>{expanded ? '︿' : '﹀'}</Text>
        </Pressable>
      </View>
      
      {/* 年月选择器 */}
      <YearMonthPicker
        visible={ymOpen}
        value={base}
        onChange={setBase}
        onClose={() => setYmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  navButton: {
    padding: 8,
    borderRadius: 20,
  },
  navArrow: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ymText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  todayText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  
  // 星期行样式（固定7列）
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  weekCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.dim,
  },
  weekendText: {
    color: COLORS.weekend,
  },
  
  // 日期单元格样式（固定7列）
  calendarBody: {
    width: '100%',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  },
  cellInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: 2,
    borderRadius: 8,
  },
  cellToday: {
    backgroundColor: `${COLORS.today}20`,
  },
  cellSelected: {
    backgroundColor: `${COLORS.primary}15`,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lunarText: {
    fontSize: 11,
    fontWeight: '400',
  },
  
  // 底部样式
  footer: {
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dropdown: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  dropIcon: {
    fontSize: 16,
    color: COLORS.text,
  },
  
  // 选择器样式
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.modalBg,
    padding: 20,
  },
  pickerCard: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: COLORS.text,
  },
  pickerColumns: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  pickerColumn: {
    flex: 1,
    maxHeight: 220,
  },
  pill: {
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: COLORS.primary,
  },
  pillText: {
    fontSize: 14,
    color: COLORS.text,
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  okBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  okText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});