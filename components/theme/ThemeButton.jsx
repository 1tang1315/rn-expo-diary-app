import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import Icon from "@/components/common/Icon";
export default function ThemeButton({
  style,
  title,
  iconLib,
  iconName,
  iconSize,
  iconColor,
  onPress,
  disabled = false,
  active = true,
  textStyle,
  children,
  ...rest
}) {
  const { theme } = useTheme();
  
  // 基础容器样式
  const baseContainerStyle = {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: (iconName && title) ? 'row' : 'column',
    gap: (iconName && title) ? 8 : 0,
  };
  
  const getColors = () => {
    if (disabled) {
      return {
        backgroundColor: theme.colors.disabledBackground,
        borderColor: theme.colors.disabledBorder,
        textColor: theme.colors.disabledText,
        iconColor: theme.colors.disabledText, // 禁用状态下的图标颜色
      };
    }
    if (active) {
      return {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.interactive,
        textColor: theme.colors.interactive,
        iconColor: theme.colors.interactive, // 激活状态下的图标颜色
      };
    }
    return {
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.border,
      textColor: theme.colors.text,
      iconColor: theme.colors.text, // 默认状态下的图标颜色
    };
  };
  
  const colors = getColors();
  
  // 合并最终的容器样式
  const containerStyle = [
    baseContainerStyle,
    {
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
    },
    style, // 用户传入的样式会覆盖上面的
  ];
  
  // 文字基础样式
  const baseTextStyle = {
    color: colors.textColor,
    fontSize: 14,
    fontWeight: '500',
  };
  
  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled}
      {...rest}
    >
      <View style={styles.contentContainer}>
        {children ? (
          children
        ) : (
          <>
            {iconName && (
              <Icon
                lib={iconLib}
                name={iconName}
                size={iconSize}
                color={iconColor || colors.iconColor}
              />
            )}
            {title && <Text style={[baseTextStyle, textStyle]}>{title}</Text>}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});