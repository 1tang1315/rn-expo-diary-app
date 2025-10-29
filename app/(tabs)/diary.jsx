import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions, FlatList, Modal, StyleSheet, Text,
  TextInput, TouchableOpacity, View, Alert, TouchableWithoutFeedback
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  deleteNote, deleteNotes, getAllNotes, getAllFolders,
  createFolder, updateFolder, deleteFolder, getFolderById
} from '@/db/notesDB';
import dayjs from 'dayjs';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import CategoryTab from "@/components/common/CategoryTab";

const { width } = Dimensions.get("window");

export default function Diary() {
  const navigation = useNavigation();
  const searchInputRef = useRef(null);
  const [searchText, setSearchText] = useState('');
  
  // 文件夹与笔记分类相关状态
  const [folders, setFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState('all');
  const [allNotes, setAllNotes] = useState([]);
  const [unclassifiedNotes, setUnclassifiedNotes] = useState([]);
  const [folderNotes, setFolderNotes] = useState({});
  
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
  
  // 按月份分组数据
  const groupByMonth = (notes) => {
    if(!notes.length) return [];
    
    // 匹配标题中的YYYY-MM-DD格式
    const dateTitleReg = /\b(\d{4}-\d{2}-\d{2})\b/;
    
    const groups = {};
    notes.forEach(item => {
      // 确定用于分组的日期（优先标题中的日期）
      let targetDate = item.time;
      const dateMatch = item.title.match(dateTitleReg);
      if(dateMatch && dateMatch[1]) {
        targetDate = dateMatch[1];
      }
      
      // 生成用于排序的数字格式（如202510）和展示格式（2025年10月）
      const monthNumber = parseInt(dayjs(targetDate).format('YYYYMM'), 10);
      const monthDisplay = dayjs(targetDate).format('YYYY年MM月');
      
      if(!groups[monthNumber]) {
        groups[monthNumber] = {
          month: monthDisplay,
          monthNumber: monthNumber,
          data: []
        };
      }
      groups[monthNumber].data.push(item);
    });
    
    // 先按月份数字倒序排序（202510在202509之前）
    const sortedGroups = Object.values(groups).sort((a, b) => {
      return b.monthNumber - a.monthNumber; // 数字大的排在前（倒序）
    });
    
    // 每个月份组内的笔记按标题字典倒序排序
    sortedGroups.forEach(group => {
      group.data.sort((a, b) => b.title.localeCompare(a.title));
    });
    
    return sortedGroups;
  };
  
  // 数据过滤（支持文件夹筛选+搜索筛选）
  const filterData = () => {
    let filtered = [];
    
    // 按文件夹筛选
    if(currentFolderId === 'all') {
      filtered = [...unclassifiedNotes];
      Object.values(folderNotes).forEach(notes => filtered.push(...notes));
    } else if(currentFolderId === 'unclassified') {
      filtered = unclassifiedNotes;
    } else {
      filtered = folderNotes[currentFolderId] || [];
    }
    
    // 定义两类标题的正则表达式
    const diaryTitleReg = /\d{4}-\d{2}-\d{2}$/; // 2025-10-05
    const stageTitleReg = /\d{4}-\d{2}-\d{2}~\d{4}-\d{2}-\d{2}$/; // 2025-10-05~2025-10-10
    
    // 获取当前选中的文件夹名称
    let currentFolderName = '';
    if(currentFolderId !== 'all' && currentFolderId !== 'unclassified') {
      const targetFolder = folders.find(folder => folder.id.toString() === currentFolderId);
      currentFolderName = targetFolder?.name || '';
    }
    
    // 仅在「日记」或「阶段总结」分类下执行标题过滤
    if(currentFolderName === '日记') {
      filtered = filtered.filter(item => diaryTitleReg.test(item.title));
    } else if(currentFolderName === '阶段总结') {
      filtered = filtered.filter(item => stageTitleReg.test(item.title));
    }
    
    // 搜索筛选
    if(searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(lowerSearch) ||
        item.content.toLowerCase().includes(lowerSearch)
      );
    }
    
    return filtered;
  };
  
  // 加载文件夹和笔记数据
  const loadAllData = async () => {
    // 加载文件夹
    const folderList = await getAllFolders();
    const formattedFolders = folderList.map(folder => ({
      ...folder,
      id: folder.id.toString()
    }));
    setFolders(formattedFolders);
    
    // 加载并格式化笔记（folder_id 转为字符串）
    const noteList = await getAllNotes();
    const formattedData = noteList.map(note => ({
      id: note.id.toString(), // 笔记 id 也转为字符串
      folderId: note.folder_id ? note.folder_id.toString() : null, // 外键转为字符串
      title: note.title,
      content: note.content.substring(0, 100),
      time: note.updated_at,
    }));
    setAllNotes(formattedData);
    
    // 分类未分类笔记
    const unclassified = formattedData.filter(note =>
      !note.folderId || !formattedFolders.some(f => f.id === note.folderId)
    );
    setUnclassifiedNotes(unclassified);
    
    // 按文件夹分组笔记
    const groupedNotes = formattedFolders.reduce((acc, folder) => {
      acc[folder.id] = formattedData.filter(note => note.folderId === folder.id);
      return acc;
    }, {});
    setFolderNotes(groupedNotes);
  };
  
  // 初始加载数据
  useEffect(() => {
    loadAllData().then();
    return navigation.addListener('focus', loadAllData);
  }, [navigation]);
  
  // 全选/取消全选逻辑
  const handleSelectAll = () => {
    const filtered = filterData();
    if(isSelectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(item => item.id));
    }
    setIsSelectAll(!isSelectAll);
  };
  
  // 监听选中项变化，更新全选状态
  useEffect(() => {
    const filtered = filterData();
    setIsSelectAll(
      filtered.length > 0 &&
      selectedIds.length === filtered.length
    );
  }, [selectedIds, currentFolderId, searchText]);
  
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
    const isDeleted = await deleteNotes(selectedIds);
    if(isDeleted) {
      // 更新所有笔记相关状态
      const updatedAllNotes = allNotes.filter(note => !selectedIds.includes(note.id));
      setAllNotes(updatedAllNotes);
      
      const updatedUnclassified = unclassifiedNotes.filter(note => !selectedIds.includes(note.id));
      setUnclassifiedNotes(updatedUnclassified);
      
      const updatedFolderNotes = {};
      Object.entries(folderNotes).forEach(([folderId, notes]) => {
        updatedFolderNotes[folderId] = notes.filter(note => !selectedIds.includes(note.id));
      });
      setFolderNotes(updatedFolderNotes);
      
      setSelectedIds([]);
      setIsDeleting(false);
      showToastMessage(`已删除 ${selectedIds.length} 篇日记`);
    }
  };
  
  // 单个删除
  const deleteDiary = async (id) => {
    if(id) {
      const isDeleted = await deleteNote(id);
      if(isDeleted) {
        // 更新所有笔记相关状态
        const updatedAllNotes = allNotes.filter(note => note.id !== id);
        setAllNotes(updatedAllNotes);
        
        const updatedUnclassified = unclassifiedNotes.filter(note => note.id !== id);
        setUnclassifiedNotes(updatedUnclassified);
        
        const updatedFolderNotes = {};
        Object.entries(folderNotes).forEach(([folderId, notes]) => {
          updatedFolderNotes[folderId] = notes.filter(note => note.id !== id);
        });
        setFolderNotes(updatedFolderNotes);
        
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
    <TouchableOpacity
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
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text numberOfLines={1} style={styles.itemContent}>
          {item.content}
        </Text>
        <Text style={styles.itemTime}>
          {dayjs(item.time).format('YYYY-MM-DD dddd')}
        </Text>
      </View>
      
      {/* 删除按钮 */}
      {isDeleting && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            deleteDiary(item.id).then();
          }}
        >
          <Ionicons name="trash" size={18} color="#ff3b30" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
    const folder = await getFolderById(folderId);
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
    
    await createFolder({ name });
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
    
    const result = await updateFolder(currentEditFolderId, name);
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
            await deleteFolder(folderId);
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
    <View style={styles.folderItemContainer}>
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
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="搜索日记标题或内容..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.settingButton}
          onPress={() => setSettingModalVisible(true)}
        >
          <Ionicons name="settings" size={22} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* 文件夹横向选择栏 */}
      <CategoryTab
        categories={[
          {
            id: 'all',
            name: '全部',
            isFixed: true
          },
          {
            id: 'unclassified',
            name: '未分类'
          },
          ...folders?.map(f => ({
            id: f.id.toString(),
            name: f.name
          }))
        ]}
        currentTab={currentFolderId}
        setCurrentTab={setCurrentFolderId}
      />
      
      {/* 批量删除栏 */}
      {isDeleting && (
        <View style={styles.batchDeleteBar}>
          <TouchableOpacity
            style={styles.exitDeleteButton}
            onPress={() => {
              setIsDeleting(false);
              setSelectedIds([]);
              setIsSelectAll(false);
            }}
          >
            <Ionicons name="close" size={20} color="#333" />
          </TouchableOpacity>
          
          <Text style={styles.selectedCount}>
            {`已选择 ${selectedIds.length} 项`}
          </Text>
          
          <View style={styles.deleteActionGroup}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={handleSelectAll}
            >
              <Text style={styles.selectAllText}>
                {isSelectAll ? '取消全选' : '全选'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.batchDeleteButton,
                selectedIds.length === 0 && styles.batchDeleteButtonDisabled
              ]}
              onPress={deleteSelected}
              disabled={selectedIds.length === 0}
            >
              <Text style={styles.batchDeleteText}>批量删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* 笔记列表 */}
      <FlatList
        contentContainerStyle={styles.flatList}
        data={groupByMonth(filterData())}
        keyExtractor={(group) => group.month}
        renderItem={({ item: group }) => (
          <View style={styles.monthGroup}>
            <Text
              style={styles.monthTitle}
              numberOfLines={1}
              ellipsizeMode="tail"
            >{group.month}</Text>
            <FlatList
              data={group.data}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              numColumns={2}
              contentContainerStyle={styles.monthGroupList}
              scrollEnabled={false}
            />
          </View>
        )}
        ListEmptyComponent={renderEmpty}
      />
      
      {/* 新增日记按钮 */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('diary-edit')}
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
                    navigation.navigate('ai-diary-generator');
                  }}
                >
                  <Text style={styles.modalItemText}>ai日记选择</Text>
                </TouchableOpacity>
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
          <View style={styles.folderManageModalContainer}>
            <View style={styles.folderManageHeader}>
              <Text style={styles.folderManageTitle}>文件夹管理</Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setFolderManageModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* 新增文件夹按钮 */}
            <TouchableOpacity
              style={styles.addFolderButton}
              onPress={handleOpenAddFolderModal}
            >
              <Ionicons name="add-circle" size={18} color="#007AFF" style={styles.addFolderIcon} />
              <Text style={styles.addFolderText}>新增文件夹</Text>
            </TouchableOpacity>
            
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
          </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafd"
  },
  
  // 搜索栏
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff'
  },
  searchInput: {
    flex: 1,
    minHeight: 30,
    lineHeight: 30,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    fontSize: 14,
    color: '#333'
  },
  settingButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  
  // 列表容器
  flatList: {
    flexGrow: 1,
    backgroundColor: '#fff'
  },
  
  // 月份分组
  monthGroup: {
    marginBottom: 15
  },
  monthTitle: {
    marginLeft: 8,
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  monthGroupList: {
    paddingHorizontal: 10
  },
  
  // 列表项
  listItem: {
    flex: 1,
    margin: 6,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f6f6f6",
    minHeight: 100,
    position: 'relative'
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333"
  },
  itemContent: {
    marginTop: 4,
    fontSize: 14,
    color: "#555"
  },
  itemTime: {
    marginTop: 4,
    fontSize: 12,
    color: "#999"
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
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  exitDeleteButton: {
    marginRight: 10,
    width: 30,
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
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ff3b30'
  },
  selectedCount: {
    fontSize: 16,
    color: '#333'
  },
  batchDeleteButtonDisabled: {
    opacity: 0.5
  },
  batchDeleteText: {
    fontSize: 16,
    color: '#fff'
  },
  
  // 全选按钮
  selectAllButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0'
  },
  selectAllText: {
    fontSize: 14,
    color: '#333'
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
    backgroundColor: '#007AFF',
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
    backgroundColor: '#fff',
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
    fontWeight: 'bold',
    color: '#333'
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
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