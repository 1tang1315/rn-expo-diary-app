import React, { useEffect, useRef } from "react";
import { View, ScrollView } from "react-native";
import Svg, { Rect, G, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/context/ThemeContext";

const BarChart = ({
  data,
  title, subtitle,
  width = 300,
  height = 200,
  barWidth = 30,
  spacing = 20
}) => {
  const { theme } = useTheme();
  const scrollRef = useRef(null);
  const totalWidth = data.length * (barWidth + spacing); // 总宽度
  
  // 初始居中
  useEffect(() => {
    if (scrollRef.current && totalWidth > width) {
      scrollRef.current.scrollTo({
        x: (totalWidth - width - 80) / 2,
        y: 0,
        animated: false,
      });
    }
  }, [totalWidth, width]);
  
  if(!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const scaleY = height / maxValue;
  
  const containerStyle = {
    alignItems: "center",
    borderRadius: 10
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
          
          {data.map((item, index) => {
            const barHeight = item.value * scaleY;
            const x = index * (barWidth + spacing) + (Math.max(totalWidth, width) - totalWidth) / 2;
            const y = height - barHeight;
            
            const shortLabel =
              item.label.length <= 3 ? item.label : item.label.slice(0, 2) + "...";
            
            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color}
                  rx={6}
                />
                
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="12"
                  fill={theme.colors.text}
                  textAnchor="middle"
                >{item.value}</SvgText>
                
                <SvgText
                  x={x + barWidth / 2}
                  y={height + 20}
                  fontSize="12"
                  fill={theme.colors.subText}
                  textAnchor="middle"
                >{shortLabel}</SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
};

export default BarChart;
