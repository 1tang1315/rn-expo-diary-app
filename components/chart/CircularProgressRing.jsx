import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeText from "@/components/theme/ThemeText";

/**
 * 通用圆形进度环组件
 *
 * props:
 * - size: 直径，默认 140
 * - strokeWidth: 圆环宽度，默认 10
 * - maxValue: 峰值/最大值，默认 100
 * - value: 当前具体值，默认 0
 * - title: 标题文本（显示在中间上方）
 * - description: 描述文本（显示在中间下方）
 * - centerContent: 自定义中间内容（React 节点，优先级高于 title/description 默认内容）
 * - ringColor: 进度颜色
 * - trackColor: 底轨颜色
 * - cardStyle: 外层卡片样式扩展
 * - containerStyle: 圆环容器样式扩展
 */
const CircularProgressRing = ({
  size = 140,
  strokeWidth = 10,
  maxValue = 100,
  value = 0,
  title = "综合评分",
  description = "",
  centerContent,
  ringColor = "#4CAF50",
  trackColor = "rgba(255,255,255,0.15)",
  cardStyle,
  containerStyle
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeMax = maxValue > 0 ? maxValue : 1;
  const progress = Math.min(Math.max(value, 0), safeMax);
  const progressRatio = progress / safeMax;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const renderCenterContent = () => {
    if (centerContent) {
      return centerContent;
    }

    return (
      <View style={styles.centerDefault}>
        <ThemeText style={styles.valueText}>{value}</ThemeText>
        {title ? <ThemeText style={styles.titleText}>{title}</ThemeText> : null}
        {description ? (
          <ThemeText style={styles.descriptionText}>{description}</ThemeText>
        ) : null}
      </View>
    );
  };

  return (
    <ThemeCard style={[styles.card, cardStyle]}>
      <View style={[styles.container, { width: size, height: size }, containerStyle]}>
        <Svg width={size} height={size}>
          <Circle
            stroke={trackColor}
            fill="transparent"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <Circle
            stroke={ringColor}
            fill="transparent"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={size / 2}
            originY={size / 2}
          />
        </Svg>
        <View style={styles.centerWrapper}>{renderCenterContent()}</View>
      </View>
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center"
  },
  container: {
    justifyContent: "center",
    alignItems: "center"
  },
  centerWrapper: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center"
  },
  centerDefault: {
    justifyContent: "center",
    alignItems: "center"
  },
  valueText: {
    fontSize: 32,
    fontWeight: "700"
  },
  titleText: {
    marginTop: 4,
    fontSize: 14
  },
  descriptionText: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.8,
    textAlign: "center"
  }
});

export default CircularProgressRing;

