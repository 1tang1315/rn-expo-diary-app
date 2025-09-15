import React from 'react';
import { View, Text } from 'react-native';
import { PolarChart, Pie, useSlicePath } from "victory-native";
import { Path, Group, Line, Text as SkiaText } from "@shopify/react-native-skia";

// 自定义切片组件，添加安全检查
// 自定义切片组件，修复Hooks调用顺序问题
const CustomPieSlice = ({ slice }) => {
  // 关键点：将Hooks调用移到条件判断之前
  const path = slice ? useSlicePath(slice) : null;
  
  // 提前计算圆环路径（仍在条件判断前调用Hooks）
  const ringPath = slice ? useSlicePath({
    ...slice,
    outerRadius: slice.outerRadius || 100,
    innerRadius: (slice.outerRadius || 100) * 0.6
  }) : null;
  
  // 条件检查移到Hooks调用之后
  if (!slice || !path || !ringPath) return null;
  
  // 确保内外半径有合理的默认值
  const outerRadius = slice.outerRadius || 100;
  const innerRadius = outerRadius * 0.6;
  
  // 后续代码保持不变...
  const midAngle = (slice.startAngle + slice.endAngle) / 2;
  const center = slice.center || { x: 0, y: 0 };
  
  const centerX = center.x + Math.cos(midAngle) * outerRadius * 0.7;
  const centerY = center.y + Math.sin(midAngle) * outerRadius * 0.7;
  
  const labelRadius = outerRadius * 1.2;
  const labelX = center.x + Math.cos(midAngle) * labelRadius;
  const labelY = center.y + Math.sin(midAngle) * labelRadius;
  
  const textAnchor = midAngle > Math.PI ? "end" : "start";
  
  return (
    <Group>
      <Path
        path={ringPath}
        color={slice.color || "#000000"}
        style="stroke"
        strokeWidth={outerRadius * 0.4}
      />
      <Line
        x1={centerX}
        y1={centerY}
        x2={labelX - (midAngle > Math.PI ? 10 : -10)}
        y2={labelY}
        color={slice.color || "#000000"}
        strokeWidth={2}
      />
      {slice.label && (
        <SkiaText
          x={labelX}
          y={labelY}
          text={slice.label}
          color={slice.color || "#000000"}
          fontSize={12}
          textAnchor={textAnchor}
          alignmentBaseline="middle"
        />
      )}
    </Group>
  );
};

// 主图表组件
export const RingChart = ({ data, totalMinutes, formatDurationByMinutes }) => {
  return (
    <View style={{ height: 300, marginBottom: 20, padding: 20 }}>
      <PolarChart
        data={data || []} // 确保数据有默认值
        labelKey="label"
        valueKey="value"
        colorKey="color"
      >
        <Pie.Chart>
          {/* 传递slice时添加安全检查 */}
          {({ slice }) => <CustomPieSlice slice={slice} />}
        </Pie.Chart>
      </PolarChart>
      
      {/* 总完成时长 */}
      <Text style={{
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20
      }}>
        总完成时长: {totalMinutes !== undefined ? formatDurationByMinutes(totalMinutes) : "0分钟"}
      </Text>
    </View>
  );
};