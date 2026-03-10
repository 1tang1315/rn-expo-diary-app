import { folderApi, noteApi } from "@/api";
import CategoryTab from "@/components/common/CategoryTab";
import Icon from "@/components/common/Icon";
import ThemeButton from "@/components/theme/ThemeButton";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import ThemeSubTitleText from "@/components/theme/ThemeSubTitleText";
import ThemeText from "@/components/theme/ThemeText";
import ThemeTextInput from "@/components/theme/ThemeTextInput";
import ThemeTitleText from "@/components/theme/ThemeTitleText";
import ThemeTouchableOpacity from "@/components/theme/ThemeTouchableOpacity";
import ThemeView from "@/components/theme/ThemeView";
import { useTheme } from "@/context/ThemeContext";
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import dayjs from 'dayjs';
import { parseInt } from "lodash/string";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions, FlatList, Modal, StyleSheet, Text,
  TextInput, TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";

const { width } = Dimensions.get("window");

export default function Diary() {
  const { theme } = useTheme();
  
  const navigation = useNavigation();
  const searchInputRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  
  // 文件夹与笔记分类相关状态
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState('all');
  const [filteredNotes, setFilteredNotes] = useState([]);
  
  // 处理搜索文本变化
  const handleSearchTextChange = (text) => {
    setSearchText(text);
  };
  
  // 处理分类切换
  const handleFolderChange = (folderId) => {
    setCurrentFolderId(folderId);
  };
  
  // 监听搜索文本和分类变化，更新数据
  useEffect(() => {
    loadFilteredData().then();
  }, [searchText, currentFolderId]);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentDiaryId, setCurrentDiaryId] = useState(null);
  
  // 文件夹管理相关状态
  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const [folderManageModalVisible, setFolderManageModalVisible] = useState(false);
  const [addFolderModalVisible, setAddFolderModalVisible] = useState(false);
  const [editFolderModalVisible, setEditFolderModalVisible] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [currentEditFolderId, setCurrentEditFolderId] = useState(null);
  const [toastText, setToastText] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  // 加载文件夹和笔记数据
  const loadAllData = async () => {
    // 加载文件夹
    const folderList = await folderApi.getAll();
    const formattedFolders = folderList.map(folder => ({
      ...folder,
      id: folder.id.toString()
    }));
    setFolders(formattedFolders);
    
    // 加载笔记数据
    await loadFilteredData();
  };
  
  // 加载过滤后的笔记数据
  const loadFilteredData = async () => {
    try {
      let notes = [];
      
      // 根据分类条件直接从 API 获取数据
      if (searchText.trim()) {
        // 有搜索关键词时使用搜索接口
        let folderId = null;
        if (currentFolderId !== 'all' && currentFolderId !== 'uncategorized') {
          folderId = parseInt(currentFolderId);
        }
        notes = await noteApi.searchNotes(searchText, folderId);
      } else {
        // 无搜索关键词时根据分类获取
        if (currentFolderId === 'all') {
          // 获取所有笔记
          notes = await noteApi.getAll();
        } else if (currentFolderId === 'uncategorized') {
          // 获取未分类笔记
          const allNotes = await noteApi.getAll();
          notes = allNotes.filter(note => !note.folderId);
        } else {
          // 获取指定文件夹的笔记
          const folderId = parseInt(currentFolderId);
          notes = await noteApi.getByFolderId(folderId);
        }
      }
      
      // 格式化笔记数据
      const formattedNotes = notes.map(note => ({
        id: note.id.toString(),
        folderId: note.folderId ? note.folderId.toString() : null,
        title: note.title,
        content: note.content.substring(0, 100),
        time: note.updatedAt,
      }));
      
      // 按时间倒序排序
      formattedNotes.sort((a, b) => new Date(b.time) - new Date(a.time));
      setFilteredNotes(formattedNotes);
    } catch (error) {
      console.error('加载过滤数据失败:', error);
      setFilteredNotes([]);
    }
  };
  
  // 初始加载数据
  useEffect(() => {
    loadAllData().then();

    return navigation.addListener('focus', () => {
      loadAllData().then();
    });
  }, [navigation]);
  
  // 全选/取消全选逻辑
  const handleSelectAll = () => {
    if(isSelectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotes.map(item => item.id));
    }
    setIsSelectAll(!isSelectAll);
  };
  
  // 监听选中项变化，更新全选状态
  useEffect(() => {
    setIsSelectAll(
      filteredNotes.length > 0 &&
      selectedIds.length === filteredNotes.length
    );
  }, [selectedIds, filteredNotes]);
  
  // 切换选中状态
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };
  
  // 批量删除
  const deleteSelected = async () => {
    if(selectedIds.length === 0) return;
    Alert.alert(
      '确认删除',
      `确定要删除这 ${selectedIds.length} 篇日记吗？此操作不可撤销。`,
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const deleteResponse = await noteApi.deleteBatch(selectedIds);
            const isDeleted = deleteResponse.success;
            if(isDeleted) {
              // 重新加载过滤数据
              await loadFilteredData();
              setSelectedIds([]);
              setIsDeleting(false);
              showToastMessage(`已删除 ${selectedIds.length} 篇日记`);
            }
          }
        }
      ]
    );
  };
  
  // 单个删除
  const deleteDiary = async (id) => {
    if(id) {
      const deleteResponse = await noteApi.delete(id);
      const isDeleted = deleteResponse.success;
      if(isDeleted) {
        // 重新加载过滤数据
        await loadFilteredData();
        if(selectedIds.includes(id)) {
          setSelectedIds(prev => prev.filter(itemId => itemId !== id));
        }
        showToastMessage('已删除 1 篇日记');
      }
    }
    setDeleteModalVisible(false);
    setCurrentDiaryId(null);
  };
  
  // 列表项渲染
  const renderItem = ({ item }) => (
    <ThemeTouchableOpacity
      style={styles.listItem}
      onPress={() => {
        if(isDeleting) {
          toggleSelect(item.id);
        } else {
          navigation.navigate('diary-edit', { nodeId: item.id });
        }
      }}
      onLongPress={() => setIsDeleting(true)}
    >
      {/* 勾选框 */}
      {isDeleting && (
        <View
          style={[
            styles.checkCircle,
            selectedIds.includes(item.id) && styles.checkCircleSelected
          ]}
        >
          {selectedIds.includes(item.id) && (
            <AntDesign name="check" size={14} color="#fff" />
          )}
        </View>
      )}
      
      <View style={styles.itemContentContainer}>
        <ThemeSubTitleText style={styles.itemTitle}>{item.title}</ThemeSubTitleText>
        <ThemeText numberOfLines={1} style={styles.itemContent}>
          {item.content}
        </ThemeText>
        <Text style={[styles.itemTime, { color: theme.colors.dim }]}>
          {dayjs(item.time).format('YYYY-MM-DD dddd')}
        </Text>
      </View>
      
      {/* 删除按钮 */}
      {isDeleting && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            setCurrentDiaryId(item.id);
            setDeleteModalVisible(true);
          }}
        >
          <Ionicons name="trash" size={18} color="#ff3b30" />
        </TouchableOpacity>
      )}
    </ThemeTouchableOpacity>
  );
  
  // 空列表提示
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>暂无日记记录</Text>
      <Text style={styles.emptySubText}>切换文件夹或创建新日记</Text>
    </View>
  );
  
  // 显示提示
  const showToastMessage = (text) => {
    setToastText(text);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };
  
  // 打开新增文件夹弹窗
  const handleOpenAddFolderModal = () => {
    setFolderName('');
    setAddFolderModalVisible(true);
  };
  
  // 打开编辑文件夹弹窗
  const handleOpenEditFolderModal = async (folderId) => {
    const folder = await folderApi.getById(folderId);
    if(folder) {
      setFolderName(folder.name);
      setCurrentEditFolderId(folderId);
      setEditFolderModalVisible(true);
    }
  };
  
  // 确认新增文件夹
  const handleConfirmAddFolder = async () => {
    const name = folderName.trim();
    if(!name) {
      showToastMessage('文件夹名称不能为空');
      return;
    }
    
    await folderApi.create({ name });
    showToastMessage('文件夹创建成功');
    setAddFolderModalVisible(false);
    await loadAllData();
  };
  
  // 确认编辑文件夹
  const handleConfirmEditFolder = async () => {
    const name = folderName.trim();
    if(!name) {
      showToastMessage('文件夹名称不能为空');
      return;
    }
    
    const result = await folderApi.update(currentEditFolderId, { name });
    if(result.success) {
      showToastMessage('文件夹修改成功');
      setEditFolderModalVisible(false);
      await loadAllData(); // 刷新文件夹列表
    } else {
      showToastMessage(result.message);
    }
  };
  
  // 确认删除文件夹
  const handleConfirmDeleteFolder = async (folderId) => {
    Alert.alert(
      '确认删除',
      '删除文件夹后，旗下笔记将转为未分类，是否继续？',
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await folderApi.delete(folderId);
            showToastMessage('文件夹删除成功');
            // 如果当前选中的是被删除的文件夹，切换到全部
            if(currentFolderId === folderId.toString()) {
              setCurrentFolderId('all');
            }
            await loadAllData();
          }
        }
      ]
    );
  };
  
  // 渲染文件夹列表项（文件夹管理弹窗内）
  const renderFolderItem = ({ item }) => (
    <ThemeCard style={styles.folderItemContainer}>
      <Text style={styles.folderItemText}>{item.name}</Text>
      <View style={styles.folderItemActionGroup}>
        <TouchableOpacity
          style={styles.folderEditButton}
          onPress={() => handleOpenEditFolderModal(item.id)}
        >
          <Ionicons name="pencil" size={16} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.folderDeleteButton}
          onPress={() => handleConfirmDeleteFolder(item.id)}
        >
          <Ionicons name="trash" size={16} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </ThemeCard>
  );
  
  return (
    <ThemeSafeAreaView>
      {/* 搜索栏 */}
      <ThemeView style={styles.searchContainer}>
        <ThemeTextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="搜索日记标题或内容..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={handleSearchTextChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setSettingModalVisible(true)}
        >
          <Icon lib="Ionicons" name="settings" size={22} />
        </TouchableOpacity>
      </ThemeView>
      
      {/* 文件夹横向选择栏 */}
      <CategoryTab
        categories={[
          { id: 'all', name: '全部' },
          ...folders?.map(f => ({
            id: f.id.toString(),
            name: f.name
          })),
          { id: 'uncategorized', name: '未分类' }
        ]}
        currentTab={currentFolderId}
        setCurrentTab={handleFolderChange}
      />
      
      {/* 批量删除栏 */}
      {isDeleting && (
        <ThemeCard style={styles.batchDeleteBar}>
          <TouchableOpacity
            style={styles.exitDeleteButton}
            onPress={() => {
              setIsDeleting(false);
              setSelectedIds([]);
              setIsSelectAll(false);
            }}
          >
            <Icon lib="Ionicons" name="close" size={25} />
          </TouchableOpacity>
          
          <ThemeText style={styles.selectedCount}>
            {`已选择 ${selectedIds.length} 项`}
          </ThemeText>
          
          <View style={styles.deleteActionGroup}>
            <ThemeButton
              title={isSelectAll ? '取消全选' : '全选'}
              style={styles.selectAllButton}
              textStyle={styles.selectAllText}
              onPress={handleSelectAll}
            ></ThemeButton>
            
            <ThemeButton
              title="批量删除"
              textStyle={styles.batchDeleteText}
              style={[
                styles.batchDeleteButton,
                selectedIds.length === 0 && styles.batchDeleteButtonDisabled
              ]}
              onPress={deleteSelected}
              disabled={selectedIds.length === 0}
            ></ThemeButton>
          </View>
        </ThemeCard>
      )}
      
      {/* 笔记列表 */}
      <FlatList
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatList}
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        ListEmptyComponent={renderEmpty}
      />
      
      {/* 新增日记按钮 */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.colors.interactive}]}
        onPress={() => {
          let folderId = null;
          if (currentFolderId !== 'all' && currentFolderId !== 'uncategorized') {
            folderId = parseInt(currentFolderId);
          }
          navigation.navigate('diary-edit', { folderId });
        }}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* 通用提示Toast */}
      {showToast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastText}</Text>
        </View>
      )}
      
      {/* 原设置弹窗 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingModalVisible}
        onRequestClose={() => setSettingModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setSettingModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSettingModalVisible(false);
                    setFolderManageModalVisible(true);
                  }}
                >
                  <Text style={styles.modalItemText}>文件夹管理</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* 文件夹管理弹窗 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={folderManageModalVisible}
        onRequestClose={() => setFolderManageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemeCard style={styles.folderManageModalContainer}>
            <View style={styles.folderManageHeader}>
              <ThemeTitleText style={styles.folderManageTitle}>文件夹管理</ThemeTitleText>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setFolderManageModalVisible(false)}
              >
                <Icon lib="Ionicons" name="close" size={20} />
              </TouchableOpacity>
            </View>
            
            {/* 文件夹列表 */}
            <FlatList
              data={folders}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFolderItem}
              contentContainerStyle={styles.folderListContainer}
              ListEmptyComponent={() => (
                <View style={styles.emptyFolderContainer}>
                  <Text style={styles.emptyFolderText}>暂无自定义文件夹</Text>
                </View>
              )}
            />
            
            {/* 新增文件夹按钮 */}
            <TouchableOpacity
              style={styles.addFolderButton}
              onPress={handleOpenAddFolderModal}
            >
              <Ionicons name="add-circle" size={18} color="#007AFF" style={styles.addFolderIcon} />
              <Text style={styles.addFolderText}>新增文件夹</Text>
            </TouchableOpacity>
          </ThemeCard>
        </View>
      </Modal>
      
      {/* 新增文件夹弹窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={addFolderModalVisible}
        onRequestClose={() => setAddFolderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.folderFormModalContainer}>
            <Text style={styles.folderFormTitle}>新增文件夹</Text>
            <TextInput
              style={styles.folderNameInput}
              placeholder="请输入文件夹名称"
              placeholderTextColor="#999"
              value={folderName}
              onChangeText={setFolderName}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <View style={styles.folderFormButtonGroup}>
              <TouchableOpacity
                style={styles.folderFormCancelButton}
                onPress={() => setAddFolderModalVisible(false)}
              >
                <Text style={styles.folderFormCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.folderFormConfirmButton}
                onPress={handleConfirmAddFolder}
              >
                <Text style={styles.folderFormConfirmText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* 编辑文件夹弹窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editFolderModalVisible}
        onRequestClose={() => setEditFolderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.folderFormModalContainer}>
            <Text style={styles.folderFormTitle}>编辑文件夹</Text>
            <TextInput
              style={styles.folderNameInput}
              placeholder="请输入文件夹名称"
              placeholderTextColor="#999"
              value={folderName}
              onChangeText={setFolderName}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <View style={styles.folderFormButtonGroup}>
              <TouchableOpacity
                style={styles.folderFormCancelButton}
                onPress={() => setEditFolderModalVisible(false)}
              >
                <Text style={styles.folderFormCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.folderFormConfirmButton}
                onPress={handleConfirmEditFolder}
              >
                <Text style={styles.folderFormConfirmText}>确认</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* 单个删除确认弹窗 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>确认删除</Text>
            <Text style={styles.deleteModalContent}>此操作不可撤销，确定要删除这篇日记吗？</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.deleteModalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.deleteModalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteModalConfirmButton}
                onPress={() => deleteDiary(currentDiaryId)}
              >
                <Text style={styles.deleteModalConfirmText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemeSafeAreaView>
  );
}

const styles = StyleSheet.create({
  // 搜索栏
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    borderRadius: 20,
    fontSize: 14
  },
  settingButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  // 列表容器
  flatList: {
    flexGrow: 1
  },
  monthTitle: {
    marginLeft: 8,
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // 列表项
  listItem: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 12,
    minHeight: 100,
    position: 'relative'
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold"
  },
  itemContent: {
    marginTop: 4,
    fontSize: 14
  },
  itemTime: {
    marginTop: 4,
    fontSize: 12
  },
  
  // 勾选框
  checkCircle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1
  },
  checkCircleSelected: {
    borderColor: '#ff3b30',
    backgroundColor: '#ff3b30'
  },
  itemContentContainer: {
    flex: 1,
    zIndex: 0
  },
  
  // 删除按钮
  deleteButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  
  // 批量删除栏
  batchDeleteBar: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  exitDeleteButton: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteActionGroup: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 'auto'
  },
  batchDeleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    borderWidth: 0
  },
  selectedCount: {
    fontSize: 16
  },
  batchDeleteButtonDisabled: {
    opacity: 0.5
  },
  batchDeleteText: {
    fontSize: 14,
    color: '#fff'
  },
  
  // 全选按钮
  selectAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1
  },
  selectAllText: {
    fontSize: 14
  },
  
  // 空列表提示
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40
  },
  emptyText: {
    fontSize: 16,
    color: "#666"
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8
  },
  
  // 新增按钮
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100
  },
  
  // 通用提示
  toast: {
    position: 'absolute',
    top: '60%',
    left: '50%',
    transform: [{ translateX: -width / 4 }, { translateY: '-50%' }],
    width: width / 2,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  toastText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center'
  },
  
  // 原有弹窗样式
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContainer: {
    width: width * 0.7,
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 15
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalItemText: {
    fontSize: 16,
    color: '#333'
  },
  
  // 删除确认弹窗
  deleteModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  deleteModalContainer: {
    width: width * 0.8,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 20,
    gap: 15
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center'
  },
  deleteModalContent: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  deleteModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  deleteModalCancelText: {
    fontSize: 16,
    color: '#333'
  },
  deleteModalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ff3b30',
    alignItems: 'center'
  },
  deleteModalConfirmText: {
    fontSize: 16,
    color: '#fff'
  },
  
  // 文件夹管理弹窗容器
  folderManageModalContainer: {
    width: width * 0.85,
    borderRadius: 12,
    maxHeight: "80%"
  },
  // 文件夹管理弹窗头部
  folderManageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  folderManageTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeModalButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // 新增文件夹按钮
  addFolderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  addFolderIcon: {
    marginRight: 10
  },
  addFolderText: {
    fontSize: 16,
    color: '#007AFF'
  },
  // 文件夹列表容器
  folderListContainer: {
    padding: 10
  },
  // 文件夹列表项
  folderItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f6f6f6'
  },
  folderItemText: {
    fontSize: 16,
    color: '#333'
  },
  folderItemActionGroup: {
    flexDirection: 'row',
    gap: 15
  },
  folderEditButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  folderDeleteButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  // 空文件夹提示
  emptyFolderContainer: {
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyFolderText: {
    fontSize: 16,
    color: '#666'
  },
  // 文件夹表单弹窗（新增/编辑）
  folderFormModalContainer: {
    width: width * 0.8,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 20,
    gap: 15
  },
  folderFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center'
  },
  folderNameInput: {
    width: '100%',
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    fontSize: 16,
    color: '#333'
  },
  folderFormButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10
  },
  folderFormCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  folderFormCancelText: {
    fontSize: 16,
    color: '#333'
  },
  folderFormConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center'
  },
  folderFormConfirmText: {
    fontSize: 16,
    color: '#fff'
  }
});