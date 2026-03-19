import { useTheme } from "@/context/ThemeContext";
import React, { useEffect, useRef } from "react";
import { ScrollView, View } from "react-native";
import Svg, { Circle, G, Path, Polyline, Text as SvgText } from "react-native-svg";

const LineChart = ({
  data,
  title, subtitle,
  width = 300,
  height = 200,
  itemWidth = 50,
  pointRadius = 6,
  lineWidth = 2,
  showArea = true,
  showPoints = true,
  showValues = true,
  curveType = "straight"
}) => {
  const { theme } = useTheme();
  const scrollRef = useRef(null);
  const totalWidth = data.length * itemWidth;
  
  // 初始居中
  useEffect(() => {
    if (scrollRef.current && totalWidth > width) {
      scrollRef.current.scrollTo({
        x: (totalWidth - width - 80) / 2,
        y: 0,
        animated: false,
      });
    }
  }, [totalWidth, width, data]);
  
  if(!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const scaleY = height / maxValue;
  
  const containerStyle = {
    alignItems: "center",
    borderRadius: 10
  };
  
  // 计算点坐标
  const points = data.map((item, index) => ({
    x: index * itemWidth + (Math.max(totalWidth, width) - totalWidth) / 2 + itemWidth / 2,
    y: height - item.value * scaleY,
    value: item.value,
    label: item.label,
    color: item.color || theme.colors.primary
  }));
  
  // 生成折线路径数据
  const getPolylinePoints = () => {
    return points.map(p => `${p.x},${p.y}`).join(" ");
  };
  
  // 生成曲线路径（使用贝塞尔曲线）
  const getCurvePath = () => {
    if(points.length < 2) return "";
    
    let d = `M ${points[0].x} ${points[0].y}`;
    
    for(let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      
      d += ` Q ${curr.x + (next.x - curr.x) / 4} ${curr.y}, ${midX} ${(curr.y + next.y) / 2}`;
      d += ` Q ${next.x - (next.x - curr.x) / 4} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return d;
  };
  
  // 生成填充区域路径
  const getAreaPath = () => {
    if(points.length < 2) return "";
    
    const linePath = curveType === "curve" ? getCurvePath() : `L ${points.map(p => `${p.x} ${p.y}`).join(" L ")}`;
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    
    return `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;
  };

  return (
    <View style={containerStyle}>
      <ScrollView
        ref={scrollRef}
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          width: Math.max(totalWidth, width),
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Svg
          width={Math.max(totalWidth, width)}
          height={height + 60}
          viewBox={`0 -40 ${Math.max(totalWidth, width)} ${height + 70}`}
        >
          {/* 标题组 */}
          <G>
            <SvgText
              x={Math.max(totalWidth, width) / 2}
              y={-20}
              fontSize="16"
              fontWeight="bold"
              fill={theme.colors.text}
              textAnchor="middle"
            >{title}</SvgText>
            <SvgText
              x={Math.max(totalWidth, width) / 2}
              y={-5}
              fontSize="12"
              fill={theme.colors.subText}
              textAnchor="middle"
            >{subtitle}</SvgText>
          </G>
          
          {/* 填充区域 */}
          {showArea && points.length > 1 && (
            <Path
              d={getAreaPath()}
              fill={points[0].color + "20"}
              opacity={0.3}
            />
          )}
          
          {/* 折线 */}
          {points.length > 1 && (
            curveType === "curve" ? (
              <Path
                d={getCurvePath()}
                stroke={points[0].color}
                strokeWidth={lineWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <Polyline
                points={getPolylinePoints()}
                stroke={points[0].color}
                strokeWidth={lineWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          )}
          
          {/* 数据点 */}
          {showPoints && points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={pointRadius + 2}
                fill={theme.colors.card}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={pointRadius}
                fill={point.color}
              />
            </G>
          ))}
          
          {/* 数据值标签 */}
          {showValues && points.map((point, index) => (
            <SvgText
              key={index}
              x={point.x}
              y={point.y - 15}
              fontSize="11"
              fill={theme.colors.text}
              textAnchor="middle"
              fontWeight="500"
            >{point.value}</SvgText>
          ))}
          
          {/* X轴标签 */}
          {data.map((item, index) => {
            const x = index * itemWidth + (Math.max(totalWidth, width) - totalWidth) / 2 + itemWidth / 2;
            const shortLabel = item.label.length <= 3 ? item.label : item.label.slice(0, 2) + "...";
            return (
              <SvgText
                key={index}
                x={x}
                y={height + 20}
                fontSize="12"
                fill={theme.colors.subText}
                textAnchor="middle"
              >{shortLabel}</SvgText>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

export default LineChart;