import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import ThemeCard from "@/components/theme/ThemeCard";
import { useTheme } from '@/context/ThemeContext';

import LoadingContainer from "@/components/common/LoadingContainer";
import EmptyContainer from "@/components/common/EmptyContainer";

const { width: screenWidth } = Dimensions.get('window');

const RingChart = ({
  data = [],
  loading = false,
  width,
  height = 200,
  innerRadius,
  outerRadius,
  title,
  subtitle,
  centerLabel,
  centerSubLabel,
  style,
  hideLegend = false,
  showText = true,
}) => {
  const { theme } = useTheme();
  const containerWidth = width || screenWidth - 20;
  
  const centerX = containerWidth / 2;
  const centerY = height / 2;
  
  const minDim = Math.min(containerWidth, height);
  const computedOuterRadius = outerRadius || (minDim / 2) - 10;
  const computedInnerRadius = innerRadius || computedOuterRadius * 0.65;
  
  const total = data ? data.reduce((sum, item) => sum + item.value, 0) : 0;
  
  const d2r = (d) => (d * Math.PI) / 180;
  
  const createSectorPath = (startAngle, endAngle, rIn, rOut) => {
    // 处理接近360度的情况
    if(Math.abs(endAngle - startAngle) >= 360) {
      endAngle = startAngle + 359.99;
    }
    
    const x1 = centerX + rOut * Math.cos(d2r(startAngle));
    const y1 = centerY + rOut * Math.sin(d2r(startAngle));
    const x2 = centerX + rOut * Math.cos(d2r(endAngle));
    const y2 = centerY + rOut * Math.sin(d2r(endAngle));
    
    const x3 = centerX + rIn * Math.cos(d2r(endAngle));
    const y3 = centerY + rIn * Math.sin(d2r(endAngle));
    const x4 = centerX + rIn * Math.cos(d2r(startAngle));
    const y4 = centerY + rIn * Math.sin(d2r(startAngle));
    
    const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
    
    return `
      M ${x1} ${y1}
      A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;
  };
  
  let currentAngle = -90;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <LoadingContainer />
        </View>
      );
    }

    if (!data || data.length === 0) {
      return (
        <View style={{ height: height - 60, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <EmptyContainer text="暂无数据" />
        </View>
      );
    }

    return (
      <>
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={containerWidth} height={height}>
            {data.map((item, index) => {
              const percentage = total === 0 ? 0 : item.value / total;
              const angle = percentage * 360;
              const startAngle = currentAngle;
              const endAngle = startAngle + angle;
              
              const path = createSectorPath(startAngle, endAngle, computedInnerRadius, computedOuterRadius);
              
              // 计算文字位置
              const midAngle = startAngle + angle / 2;
              const textRadius = (computedInnerRadius + computedOuterRadius) / 2;
              const textX = centerX + textRadius * Math.cos(d2r(midAngle));
              const textY = centerY + textRadius * Math.sin(d2r(midAngle));
              
              currentAngle = endAngle;
              
              return (
                <G key={`sector-${index}`}>
                  <Path
                    d={path}
                    fill={item.color || theme.colors.primary}
                    stroke={theme.colors.card || '#fff'}
                    strokeWidth={2}
                  />
                  {/* 仅在切片足够大时显示数值 */}
                  {showText && percentage > 0.08 && (
                    <SvgText
                      x={textX}
                      y={textY}
                      fill="#fff"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {item.value}
                    </SvgText>
                  )}
                </G>
              );
            })}
            
            {/* 中心文字 */}
            <SvgText
              x={centerX}
              y={centerY - 5}
              fill={theme.colors.text}
              fontSize="24"
              fontWeight="bold"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {centerLabel || total}
            </SvgText>
            <SvgText
              x={centerX}
              y={centerY + 18}
              fill={theme.colors.subText || '#888'}
              fontSize="12"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {centerSubLabel !== undefined ? centerSubLabel : '总计'}
            </SvgText>
          </Svg>
        </View>
        
        {/* 底部标签 */}
        {!hideLegend && (
          <View style={styles.legendContainer}>
            {data.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color || theme.colors.primary }]} />
                <Text style={[styles.legendText, { color: theme.colors.text }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  return (
    <ThemeCard style={[styles.container, { width: containerWidth, minHeight: height }, style]}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>}
          {subtitle && <Text style={[styles.subtitle, { color: theme.colors.subText || '#888' }]}>{subtitle}</Text>}
        </View>
      )}
      
      {renderContent()}
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: "center"
  },
  header: {
    marginBottom: 10,
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 5
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
});

export default RingChart;
