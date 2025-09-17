import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from "react";
import { getEventsByDateRange } from "@/db/eventDB";
import dayjs from "dayjs";
import DateSelector from "@/components/statistics/DateSelector";
import Platform from "react-native";
import { processStatistics } from "@/utils/statisticsUtils";
import { formatDurationByMinutes } from "@/utils/formatTimeUtils";
import PieChartWithLabels from "@/components/chart/PieChartWithLabels";
import DateTimePicker from "@react-native-community/datetimepicker";

/**
 * 高精度除法计算（无浮点数精度误差）
 * @param {number} dividend - 被除数
 * @param {number} divisor - 除数
 * @param {number} decimalPlaces - 保留的小数位数（非负整数）
 * @returns {number} 精确的除法结果
 * @throws {Error} 当除数为0或小数位数无效时抛出错误
 */
function precisionDivide(dividend, divisor, decimalPlaces) {
  // 验证参数有效性
  if(typeof dividend !== 'number' || typeof divisor !== 'number' || isNaN(dividend) || isNaN(divisor)) {
    throw new Error('被除数和除数必须是有效数字');
  }
  if(divisor === 0) {
    throw new Error('除数不能为0');
  }
  if(!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new Error('小数位数必须是非负整数');
  }
  
  // 计算放大倍数（10的decimalPlaces次方）
  const SCALE = 10 ** decimalPlaces;
  
  // 将被除数和除数转为整数（放大后取整，消除浮点数误差）
  const dividendInt = Math.round(dividend * SCALE);
  const divisorInt = Math.round(divisor * SCALE);
  
  // 整数运算：(被除数/除数)保留decimalPlaces位小数 → 先放大再取整
  const resultInt = Math.round((dividendInt / divisorInt) * SCALE);
  
  // 还原为小数（此时结果已保证精确到指定小数位数）
  return resultInt / SCALE;
}

/**
 * 精确乘法并四舍五入到指定小数位
 * @param {number} num1
 * @param {number} num2
 * @param {number} decimalPlaces 非负整数
 * @returns {number}
 */
function precisionMultiply(num1, num2, decimalPlaces) {
  if(typeof num1 !== 'number' || typeof num2 !== 'number' || !isFinite(num1) || !isFinite(num2)) {
    throw new Error('两个乘数必须是有效数字');
  }
  if(!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new Error('小数位数必须是非负整数');
  }
  
  // 转整数
  const toInt = n => {
    const s = String(n).replace('-', '');
    if(!s.includes('.')) return {
      i: BigInt(s),
      d: 0
    };
    const [a, b] = s.split('.');
    return {
      i: BigInt(a + b),
      d: b.length
    };
  };
  
  const a = toInt(num1), b = toInt(num2);
  let product = a.i * b.i;
  const totalDec = a.d + b.d;
  const neg = (num1 < 0) ^ (num2 < 0);
  
  // 调整小数位并四舍五入
  if(totalDec > decimalPlaces) {
    const diff = totalDec - decimalPlaces;
    const div = 10n ** BigInt(diff);
    const r = product % div;
    product = product / div + (r * 2n >= div ? 1n : 0n);
  } else {
    product *= 10n ** BigInt(decimalPlaces - totalDec);
  }
  
  // 转字符串并加小数点
  let s = product.toString().padStart(decimalPlaces + 1, '0');
  if(decimalPlaces) {
    s = s.slice(0, -decimalPlaces) + '.' + s.slice(-decimalPlaces);
  }
  return Number((neg ? '-' : '') + s);
}

export default function Statistics() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dateType, setDateType] = useState('single');
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState('single');
  
  useEffect(() => {
    setLoading(true);
    const queryStart = dateType === 'single' ? selectedDate : startDate;
    const queryEnd = dateType === 'single' ? selectedDate : endDate;
    
    getEventsByDateRange(queryStart, queryEnd)
      .then(data => setStatsData(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [dateType, endDate, selectedDate, startDate]);
  
  const handleShowDatePicker = (target) => {
    setDatePickerTarget(target);
    setShowDatePicker(true);
  };
  
  const handleDateChange = (event, newDate) => {
    setShowDatePicker(Platform.OS === 'ios'); // iOS保持显示，Android选择后关闭
    if (!newDate) return;
    
    // 转换为dayjs对象处理
    const dayjsDate = dayjs(newDate);
    
    if (datePickerTarget === 'single') {
      setSelectedDate(dayjsDate);
    } else if (datePickerTarget === 'start') {
      setStartDate(dayjsDate);
    } else if (datePickerTarget === 'end') {
      setEndDate(dayjsDate);
    }
  };
  
  const {
    chartData,
    totalMinutes,
    completedEvents
  } = processStatistics(statsData);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.contentContainer}>
        <DateSelector
          dateType={dateType}
          setDateType={setDateType}
          selectedDate={selectedDate.toDate()} // 转换为Date对象供组件使用
          startDate={startDate.toDate()}
          endDate={endDate.toDate()}
          handleShowDatePicker={handleShowDatePicker}
          styles={styles}
        />
        
        {loading ? (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>加载统计数据中...</Text>
          </View>
        ) : error ? (
          <View style={styles.statusContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : completedEvents.length === 0 ? (
          <View style={styles.statusContainer}>
            <Text style={styles.noDataText}>暂无已完成的事件数据</Text>
          </View>
        ) : (
          <View>
            {/* 饼图区域 */}
            <View style={styles.chartContainer}>
              <PieChartWithLabels data={chartData} title={`总完成时长: ${formatDurationByMinutes(totalMinutes)}`} />
            </View>
            
            {/* 图例区域 */}
            <View style={styles.legendContainer}>
              {chartData.map((item, index) => {
                const progress = precisionDivide(item.value, totalMinutes, 4);
                
                return (<View key={index} style={styles.legendItem}>
                  {/* 右边颜色块 */}
                  <View style={[styles.colorBox, { backgroundColor: item.color }]} />
                  
                  <View style={styles.legendRightContainer}>
                    <Text style={styles.legendText}>
                      {item.label}
                      ({item.useCount}次,
                      {formatDurationByMinutes(item.value)},
                      {precisionMultiply(progress, 100, 2)}%
                      )
                    </Text>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            backgroundColor: item.color,
                            width: `${precisionMultiply(progress, 100, 2)}%`
                          }
                        ]}
                      />
                    </View>
                  </View>
                </View>)
              })}
            </View>
          </View>
        )}
      </ScrollView>
      
      {showDatePicker && (
        <DateTimePicker
          value={
            datePickerTarget === 'single' ? selectedDate.toDate() :
              datePickerTarget === 'start' ? startDate.toDate() : endDate.toDate()
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()} // 禁止选择未来日期
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd'
  },
  contentContainer: {
    flex: 1
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: '#fff'
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    textAlign: "center"
  },
  errorText: {
    fontSize: 16,
    color: "#e74c3c",
    textAlign: "center"
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  dateTypeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateTypeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
  },
  dateTypeBtnActive: {
    backgroundColor: '#4A6CF7',
  },
  dateTypeText: {
    fontSize: 14,
    color: '#666',
  },
  dateTypeTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  datePickerContainer: {
    gap: 8,
  },
  dateSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F7FA',
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#333',
  },
  sectionCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    display: "flex",
    justifyContent: "center",
    height: 280,
    elevation: 2,
    backgroundColor: "#fff",
    boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  totalTimeText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    textAlign: "center"
  },
  legendContainer: {
    marginVertical: 10,
    padding: 20,
    backgroundColor: "#fff",
    boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  legendItem: {
    flex: 1,
    display: "flex",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 4
  },
  colorBox: {
    width: 16,
    height: 16,
    marginRight: 8,
    borderRadius: 4
  },
  legendRightContainer: {
    flex: 1
  },
  legendText: {
    fontSize: 14,
    color: "#333"
  },
  progressBarContainer: {
    height: 6,
    marginTop: 4,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s ease'
  },
});