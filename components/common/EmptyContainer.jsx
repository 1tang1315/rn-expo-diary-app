import Icon from "@/components/common/Icon";
import { useTheme } from "@/context/ThemeContext";
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const EmptyContainer = ({
  iconLib="FontAwesome",
  iconName,
  text = "暂无数据",
  model = 'txt'
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={[
      styles.container,
      model === 'box' && {
        borderRadius: 10,
        backgroundColor: theme.colors.innerCard
      }
    ]}>
      {iconName && (
        <Icon lib={iconLib} name={iconName} size={40} />
      )}
      <Text style={[
        styles.text,
        { color: theme.colors.interactive }
      ]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
});

export default EmptyContainer;