import {
  ActivityIndicator, ScrollView, StyleSheet, Text, View, Button
} from "react-native";
import React, { useCallback, useState } from "react";
import { eventApi } from "@/api/EventApi";
import DateSelector from "@/components/statistics/DateSelector";
import { processStatistics } from "@/utils/statisticsUtils";
import { formatDurationByMinutes } from "@/utils/formatTimeUtils";
import PieChart from "@/components/chart/PieChart";
import CategoryTab from "@/components/common/CategoryTab";
import { categories } from "@/constants/commonConstans";
import BarChart from "@/components/chart/BarChart";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import { useFocusEffect } from "expo-router";
import dayjs from "dayjs";
import ThemeCard from "@/components/theme/ThemeCard";

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
  const [statsData, setStatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const handleDateChange = useCallback((startDate = dayjs().startOf('day'), endDate) => {
    setLoading(true);
    
    eventApi.getByDateRangeAndCategory({ startDate, endDate })
      .then(data => setStatsData(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, []);
  
  useFocusEffect(
    useCallback(() => {
      handleDateChange();
    }, [handleDateChange])
  );
  
  const [currentTab, setCurrentTab] = useState('all');
  // 根据当前选中的分类筛选数据
  const filteredStatsData = currentTab === 'all'
    ? statsData
    : statsData.filter(item => item.category === currentTab);
  
  const {
    chartData,
    totalMinutes,
    completedEvents
  } = processStatistics(filteredStatsData, currentTab === 'all');
  
  const [chartType, setChartType] = useState('pie'); // 'bar' 或 'pie'
  const [chartTypeName, setChartTypeName] = useState('饼'); // 'bar' 或 'pie'
  const toggleChart = () => {
    setChartType(prev => (prev === 'pie' ? 'bar' : 'pie'));
    setChartTypeName(prev => (prev === '饼' ? '条' : '饼'));
  };
  
  chartData.map(item => {
    const progress = totalMinutes === 0 ? 0 : precisionDivide(item.value, totalMinutes, 4);
    const percentage = precisionMultiply(progress, 100, 2);
    return {
      ...item,
      progress,
      percentage
    };
  });
  
  return (
    <ThemeSafeAreaView>
      <DateSelector hasRadius={false} onDataChange={handleDateChange} />
      
      {/* 状态判断(加载中 错误 无事件)与图表内容的容器 */}
      <ThemeCard style={{ flex: 1 }}>
        <CategoryTab
          categories={categories}
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
        />
        
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
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
          ) : totalMinutes === 0 ? (
            <View style={styles.statusContainer}>
              <Text style={styles.noDataText}>所选时间段内的事件总时长为0分钟</Text>
            </View>
          ) : (
            <>
              {/* 饼图区域 */}
              <View style={styles.chartContainer}>
                <View style={styles.toggleButton}>
                  <Button title={chartTypeName} onPress={toggleChart} />
                </View>
                {chartType === 'pie' ? (
                  <PieChart data={chartData} title={`总完成时长: ${formatDurationByMinutes(totalMinutes)}`} />
                ) : (
                  <BarChart data={chartData} title={`总完成时长: ${formatDurationByMinutes(totalMinutes)}`} />
                )}
              </View>
              
              {/* 图例区域 */}
              <View style={styles.legendContainer}>
                {chartData.map(item => {
                  const progress = precisionDivide(item.value, totalMinutes, 4);
                  
                  return (
                    <View key={item.label} style={styles.legendItem}>
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
                    </View>
                  )
                })}
              </View>
            </>
          )}
        </ScrollView>
      </ThemeCard>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1
  },
  statusContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 450,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    boxShadow: '0 2px 2px rgba(0, 0, 0, 0.05)'
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
  chartContainer: {
    display: "flex",
    justifyContent: "center",
    height: 280
  },
  toggleButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 35,
    height: 35,
    borderRadius: '50%',
    fontSize: 12,
    overflow: "hidden",
    zIndex: 10,
  },
  legendContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)'
  },
  legendItem: {
    display: "flex",
    width: "45%",
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