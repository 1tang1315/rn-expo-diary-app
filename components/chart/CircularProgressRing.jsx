import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Circle } from "react-native-svg";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeText from "@/components/theme/ThemeText";
import { toFiniteNumber, toNonNegativeFiniteNumber } from "./utils";

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
  containerStyle
}) => {
  const safeSize = toNonNegativeFiniteNumber(size, 140);
  const safeStrokeWidth = toNonNegativeFiniteNumber(strokeWidth, 10);
  const safeValue = toNonNegativeFiniteNumber(value, 0);
  const safeMax = Math.max(1, toFiniteNumber(maxValue, 100));

  const radius = (safeSize - safeStrokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(safeValue, safeMax);
  const progressRatio = progress / safeMax;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const renderCenterContent = () => {
    if (centerContent) {
      return centerContent;
    }

    return (
      <View style={styles.centerDefault}>
        <ThemeText style={styles.valueText}>{safeValue}</ThemeText>
        {title ? <ThemeText style={styles.titleText}>{title}</ThemeText> : null}
        {description ? (
          <ThemeText style={styles.descriptionText}>{description}</ThemeText>
        ) : null}
      </View>
    );
  };

  return (
    <ThemeCard>
      <View style={[styles.container, { width: safeSize, height: safeSize }, containerStyle]}>
        <Svg width={safeSize} height={safeSize}>
          <Circle
            stroke={trackColor}
            fill="transparent"
            cx={safeSize / 2}
            cy={safeSize / 2}
            r={radius}
            strokeWidth={safeStrokeWidth}
          />
          <Circle
            stroke={ringColor}
            fill="transparent"
            cx={safeSize / 2}
            cy={safeSize / 2}
            r={radius}
            strokeWidth={safeStrokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            originX={safeSize / 2}
            originY={safeSize / 2}
          />
        </Svg>
        <View style={styles.centerWrapper}>{renderCenterContent()}</View>
      </View>
    </ThemeCard>
  );
};

const styles = StyleSheet.create({
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

