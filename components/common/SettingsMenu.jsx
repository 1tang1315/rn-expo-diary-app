import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// 设置选项列表
const SETTINGS_OPTIONS = [
  { id: 'account', name: '账户设置', icon: 'person-outline' },
  { id: 'notifications', name: '通知设置', icon: 'notifications-outline' },
  { id: 'data-generation', name: '数据生成', icon: 'create-outline' },
  { id: 'about', name: '关于我们', icon: 'information-circle-outline' },
  { id: 'help', name: '帮助中心', icon: 'help-circle-outline' }
];

const SettingsMenu = ({ visible, onClose, onSelectOption }) => {
  const handleOptionSelect = (optionId) => {
    onSelectOption(optionId);
    onClose();
  };
  
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
            <Text style={styles.title}>设置</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsList}>
            {SETTINGS_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionItem}
                onPress={() => handleOptionSelect(option.id)}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon} size={22} color="#666" />
                </View>
                <Text style={styles.optionName}>{option.name}</Text>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
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
  optionsList: {
    marginTop: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  optionIcon: {
    marginRight: 15,
    width: 30,
  },
  optionName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default SettingsMenu;
