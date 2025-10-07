import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from "react-native";
import Svg, { Path, G, Text as SvgText, Circle } from "react-native-svg";

const { width: screenWidth } = Dimensions.get('window');

/**
 * SVG 饼图组件
 * @props {Array} data - 格式：[{ label, value, color }]
 * @props {number} size - 饼图尺寸（宽高）
 */
const PieChart = ({ data, title, subtitle, width = screenWidth - 40, height = 250 }) => {
  // 计算总和 & 每个扇形的角度
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const sectors = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    return { ...item, percentage, angle, index };
  });
  
  // 常量定义
  const radius = Math.min(width, height) / 3; // 饼图半径
  const centerX = width / 2; // 圆心X坐标
  const centerY = height / 2; // 圆心Y坐标
  
  // 辅助函数：角度转弧度
  const degreesToRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
  };
  
  // 生成扇形的 SVG Path
  const getSectorPath = (startAngle, endAngle) => {
    const radStart = degreesToRadians(startAngle);
    const radEnd = degreesToRadians(endAngle);
    
    // 圆弧起点 & 终点坐标
    const startX = centerX + radius * Math.cos(radStart);
    const startY = centerY + radius * Math.sin(radStart);
    const endX = centerX + radius * Math.cos(radEnd);
    const endY = centerY + radius * Math.sin(radEnd);
    
    // 大弧标志（角度 > 180 时为 1，否则为 0）
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    // SVG Path 指令：M(移动到起点) → A(画圆弧) → L(连到圆心) → Z(闭合)
    return `M ${startX} ${startY}
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
            L ${centerX} ${centerY}
            Z`;
  };
  
  // 渲染单个扇形
  const renderSector = (sector, startAngle, endAngle) => {
    return (
      <Path
        key={`sector-${sector.index}`}
        d={getSectorPath(startAngle, endAngle)}
        fill={sector.color}
      />
    );
  };
  
  // 计算引导线坐标
  const calculateGuideLines = (midAngle) => {
    const radMid = degreesToRadians(midAngle);
    
    // 折线的两段长度定义
    const radialLength = 8; // 径向延伸长度
    const horizontalLength = 10; // 水平延伸长度
    
    // 扇形边缘的引导线起点
    const guideStartX = centerX + radius * Math.cos(radMid);
    const guideStartY = centerY + radius * Math.sin(radMid);
    
    // 径向终点（离圆心更远的点）
    const radialEndX = centerX + (radius + radialLength) * Math.cos(radMid);
    const radialEndY = centerY + (radius + radialLength) * Math.sin(radMid);
    
    // 判断左右半区，决定水平延伸方向
    const isLeft = midAngle > 90 && midAngle < 270;
    const horizontalEndX = isLeft ? radialEndX - horizontalLength : radialEndX + horizontalLength;
    const horizontalEndY = radialEndY;
    
    // 标签位置：基于水平终点调整
    const labelX = isLeft ? horizontalEndX - 5 : horizontalEndX + 5;
    const labelY = horizontalEndY;
    
    return {
      guideStartX,
      guideStartY,
      radialEndX,
      radialEndY,
      horizontalEndX,
      horizontalEndY,
      labelX,
      labelY,
      isLeft
    };
  };
  
  // 渲染引导线
  const renderGuideLines = (sector, midAngle) => {
    const {
      guideStartX,
      guideStartY,
      radialEndX,
      radialEndY,
      horizontalEndX,
      horizontalEndY
    } = calculateGuideLines(midAngle);
    
    return (
      <Path
        key={`guide-${sector.index}`}
        d={`M ${guideStartX} ${guideStartY} L ${radialEndX} ${radialEndY} L ${horizontalEndX} ${horizontalEndY}`}
        stroke={sector.color}
        strokeWidth={1.5}
        fill="none"
      />
    );
  };
  
  // 渲染标签文本
  const renderLabel = (sector, midAngle) => {
    const { labelX, labelY, isLeft } = calculateGuideLines(midAngle);
    
    // 限制文字长度，超出添加省略号
    const label = sector.label.length > 6
      ? sector.label.slice(0, 6) + '...'
      : sector.label;
    
    return (
      <G key={`label-${sector.index}`}>
        <SvgText
          x={labelX}
          y={labelY + 4}
          fontSize={12}
          fill={sector.color}
          textAnchor={isLeft ? "end" : "start"}
          dominantBaseline="ideographic"
        >
          {label}
        </SvgText>
      </G>
    );
  };
  
  // 渲染所有元素
  const renderAllElements = () => {
    // 单项特殊处理
    if (sectors.length === 1) {
      const sector = sectors[0];
      const midAngle = 180; // 固定中间角度（水平向右）
      
      return (
        <G key={sector.index}>
          <Circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill={sector.color}
          />
          {renderGuideLines(sector, midAngle)}
          {renderLabel(sector, midAngle)}
        </G>
      );
    }
    
    const elements = [];
    let cumulativeAngle = 0;
    
    sectors.forEach(sector => {
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + sector.angle;
      const midAngle = startAngle + sector.angle / 2;
      cumulativeAngle = endAngle;
      
      // 创建一个组，包含扇形、引导线和标签
      elements.push(
        <G key={sector.index}>
          {renderSector(sector, startAngle, endAngle)}
          {renderGuideLines(sector, midAngle)}
          {renderLabel(sector, midAngle)}
        </G>
      );
    });
    
    return elements;
  };
  
  return (
    <View style={styles.container}>
      {/* 标题 */}
      {title && <Text style={styles.title}>{title}</Text>}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      
      {/* 饼图主体和标签 */}
      <TouchableWithoutFeedback>
        <Svg width={width} height={height}>
          {renderAllElements()}
        </Svg>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  tooltipText: {
    color: "#fff",
    fontSize: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#666"
  },
});

export default PieChart;