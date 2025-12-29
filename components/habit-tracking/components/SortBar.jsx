import ThemeText from "@/components/theme/ThemeText";
import { SORT_TYPES, useSortConfig } from "@/context/SortConfigContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SortModal = ({ visible, onClose, sortOptions, currentSort, onSelect, theme }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: theme.colors.innerCard }]}>
        <View style={styles.modalHeader}>
          <ThemeText style={styles.modalTitle}>选择排序方式</ThemeText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemeText style={styles.closeText}>×</ThemeText>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={sortOptions}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.sortOptionItem,
                currentSort === item.value && { backgroundColor: theme.colors.primary + '20' }
              ]}
              onPress={() => {
                onSelect(item.value);
                onClose();
              }}
            >
              <ThemeText style={styles.optionText}>{item.label}</ThemeText>
              {currentSort === item.value && (
                <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]} />
              )}
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.value}
          style={styles.optionsList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const SortBar = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const { currentSort, updateSort } = useSortConfig();
  
  const sortOptions = [
    { label: '默认排序', value: SORT_TYPES.DEFAULT },
    { label: '名称升序', value: SORT_TYPES.NAME_ASC },
    { label: '名称降序', value: SORT_TYPES.NAME_DESC },
    { label: '次数升序', value: SORT_TYPES.COUNT_ASC },
    { label: '次数降序', value: SORT_TYPES.COUNT_DESC },
    { label: '时长升序', value: SORT_TYPES.DURATION_ASC },
    { label: '时长降序', value: SORT_TYPES.DURATION_DESC },
    { label: '自定义排序', value: SORT_TYPES.CUSTOM },
  ];
  
  const label = sortOptions.find(i => i.value === currentSort)?.label || '默认排序';
  
  const handleSelectSort = (sortType) => {
    if (sortType === SORT_TYPES.CUSTOM) {
      setModalVisible(false);
      router.push('/drag-drop-list-page');
    } else {
      updateSort(sortType);
      setModalVisible(false);
    }
  };
  
  return (
    <>
      <View style={[
        styles.sortBarContainer,
        { backgroundColor: theme.colors.innerCard }
      ]}>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.sortText}>{label}</Text>
        </TouchableOpacity>
      </View>
      
      <SortModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        sortOptions={sortOptions}
        currentSort={currentSort}
        onSelect={handleSelectSort}
        theme={theme}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContainer: {
    width: '80%',
    maxWidth: 300,
    padding: 16,
    borderRadius: 12,
    elevation: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold'
  },
  optionsList: {
    maxHeight: 300
  },
  sortOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    padding: 5,
    borderRadius: 8
  },
  optionText: {
    fontSize: 14
  },
  checkIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF'
  },
  sortBarContainer: {
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 5,
    borderRadius: 10
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6
  },
  sortText: {
    marginRight: 4,
    fontSize: 14,
    fontWeight: '500'
  },
});

export default SortBar;