import ThemeCard from "@/components/theme/ThemeCard";
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const RadarChart = ({
  data = [],
  width,
  height = 250,
  size = 160,
  maxValue = 100,
  fillColor,
  strokeColor,
  labelColor,
  gridColor,
  levels = 4, // 网格层级数
  style,
  title,
}) => {
  const { theme } = useTheme();

  if (!data || data.length === 0) return null;

  // 解析颜色，使用主题默认值
  // 如果可用则使用 theme.colors.primaryTransparent，否则回退或计算
  const resolvedFillColor = fillColor || theme.colors.primaryTransparent || 'rgba(59, 130, 246, 0.2)';
  const resolvedStrokeColor = strokeColor || theme.colors.primary;
  const resolvedLabelColor = labelColor || theme.colors.text;
  const resolvedGridColor = gridColor || theme.colors.border;

  // 如果提供了显式尺寸则使用，否则根据宽高约束计算
  // 如果未提供宽度，则依赖 flexbox 布局或安全默认值（如屏幕宽度减去内边距）
  const containerWidth = width || screenWidth - 20;
  
  // 计算有效图表直径
  // 我们希望适应最小尺寸（宽或高）并减去标签内边距
  const availableSize = Math.min(containerWidth, height);
  const chartDiameter = size || (availableSize - 80); // 每侧预留 40px 用于显示标签
  const radius = chartDiameter / 2;
  
  // 图表绘制区域中心
  const centerX = containerWidth / 2;
  const centerY = height / 2;
  
  const angleSlice = (Math.PI * 2) / data.length;

  // 计算相对于中心的坐标的辅助函数
  const getCoordinates = (value, index, max) => {
    const angle = index * angleSlice - Math.PI / 2; // 从顶部开始
    const r = (value / max) * radius;
    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  // 生成网格点
  const gridLevels = [];
  for (let i = 1; i <= levels; i++) {
    const levelPoints = data.map((_, index) => {
      const { x, y } = getCoordinates(maxValue * (i / levels), index, maxValue);
      return `${x},${y}`;
    }).join(' ');
    gridLevels.push(levelPoints);
  }

  // 生成数据点
  const dataPoints = data.map((item, index) => {
    const { x, y } = getCoordinates(item.value, index, maxValue);
    return `${x},${y}`;
  }).join(' ');
  
  // 生成轴线
  const axisLines = data.map((_, index) => {
      const { x, y } = getCoordinates(maxValue, index, maxValue);
      return { x1: centerX, y1: centerY, x2: x, y2: y };
  });

  return (
    <ThemeCard style={[styles.container, { height }, width ? { width } : { width: '100%' }, style]}>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
      <Svg height={height} width={containerWidth} style={{ alignSelf: 'center' }}>
        {/* 绘制网格层级 */}
        {gridLevels.map((points, index) => (
          <Polygon
            key={`grid-${index}`}
            points={points}
            fill="none"
            stroke={resolvedGridColor}
            strokeWidth="1"
          />
        ))}

        {/* 绘制轴线 */}
        {axisLines.map((line, index) => (
            <Line
                key={`axis-${index}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={resolvedGridColor}
                strokeWidth="1"
            />
        ))}

        {/* 绘制数据多边形 */}
        <Polygon
          points={dataPoints}
          fill={resolvedFillColor}
          stroke={resolvedStrokeColor}
          strokeWidth="2"
        />

        {/* 绘制数据点（圆点） */}
        {data.map((item, index) => {
             const { x, y } = getCoordinates(item.value, index, maxValue);
             return (
                 <Circle
                    key={`point-${index}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={resolvedStrokeColor}
                 />
             )
        })}

        {/* 绘制数值文本 */}
        {data.map((item, index) => {
            const angle = index * angleSlice - Math.PI / 2;
            const rPoint = (item.value / maxValue) * radius;
            // 沿半径向外推文本
            const rText = rPoint + 12; 
            const x = centerX + rText * Math.cos(angle);
            const y = centerY + rText * Math.sin(angle);
            
            return (
                <SvgText
                    key={`value-${index}`}
                    x={x}
                    y={y}
                    fill={resolvedStrokeColor}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                >
                    {item.value}
                </SvgText>
            );
        })}

        {/* 绘制标签 */}
        {data.map((item, index) => {
          const angle = index * angleSlice - Math.PI / 2;
          const labelDist = radius + 20; // 距离中心的距离
          const x = centerX + labelDist * Math.cos(angle);
          const y = centerY + labelDist * Math.sin(angle);
          
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={y}
              fill={resolvedLabelColor}
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {item.label}
            </SvgText>
          );
        })}
      </Svg>
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    position: 'absolute',
    top: 15,
    left: 15,
    fontSize: 16,
    fontWeight: 'bold',
    zIndex: 1,
  },
});

export default RadarChart;
