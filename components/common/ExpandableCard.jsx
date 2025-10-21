import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const ExpandableCard = ({ title, style, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <View style={[styles.sectionCard, style]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        
        <TouchableOpacity
          style={styles.sectionToggleButton}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.sectionToggleText}>
            {isExpanded ? '收起' : '展开'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {isExpanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    marginTop: 1,
    marginBottom: 10,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
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
    fontWeight: '600',
    color: '#333'
  },
  sectionToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  sectionToggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionContent: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: '#f5f5f5'
  },
});

export default ExpandableCard;