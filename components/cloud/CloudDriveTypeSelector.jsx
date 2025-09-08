import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// 支持的网盘类型
const SUPPORTED_DRIVES = [
  { type: 'nutstore', name: '坚果云盘' },
  { type: 'dropbox', name: 'Dropbox' },
  { type: 'onedrive', name: 'OneDrive' },
  { type: 'baidu', name: '百度网盘' }
];

const CloudDriveTypeSelector = ({ visible, onClose, onSelectDrive }) => {
  const renderDriveItem = ({ item }) => (
    <TouchableOpacity
      style={styles.driveItem}
      onPress={() => {
        onSelectDrive(item.type);
        onClose();
      }}
    >
      <View style={styles.driveIcon}>
        {/* 根据网盘类型显示不同图标 */}
        {item.type === 'nutstore' && (
          <Ionicons name="cloud-circle-outline" size={24} color="#3498db" />
        )}
        {item.type === 'dropbox' && (
          <Ionicons name="cloud-outline" size={24} color="#0061FE" />
        )}
        {item.type === 'onedrive' && (
          <Ionicons name="cloud-done-outline" size={24} color="#0078D4" />
        )}
        {item.type === 'baidu' && (
          <Ionicons name="cloud-download-outline" size={24} color="#2D82FF" />
        )}
      </View>
      <Text style={styles.driveName}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>选择网盘</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={SUPPORTED_DRIVES}
            renderItem={renderDriveItem}
            keyExtractor={item => item.type}
            style={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    marginTop: 10,
  },
  driveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  driveIcon: {
    marginRight: 15,
    width: 30,
  },
  driveName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default CloudDriveTypeSelector;