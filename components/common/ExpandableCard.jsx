import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import ThemeCard from "@/components/Theme/ThemeCard";
import ThemeButton from "@/components/Theme/ThemeButton";
import ThemeTitleText from "@/components/Theme/ThemeTitleText";
import { useTheme } from "@/context/ThemeContext";

const ExpandableCard = ({ title, style, children }) => {
  const { theme } = useTheme();
  
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <View style={[styles.sectionCard, style, {
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card
    }]}>
      <View style={styles.sectionHeader}>
        <ThemeTitleText style={styles.sectionTitle}>{title}</ThemeTitleText>
        
        <ThemeButton
          title={isExpanded ? '收起' : '展开'}
          style={styles.sectionToggleButton}
          textStyle={styles.sectionToggleText}
          onPress={handleToggle}
          activeOpacity={0.8}
        ></ThemeButton>
      </View>
      
      {isExpanded && <ThemeCard style={[styles.sectionContent,  {backgroundColor: theme.colors.border}]}>{children}</ThemeCard>}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    marginTop: 1,
    marginBottom: 10,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  sectionToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  },
  sectionToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContent: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 24
  },
});

export default ExpandableCard;