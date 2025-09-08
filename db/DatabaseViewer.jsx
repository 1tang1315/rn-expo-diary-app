import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { getDB, getBusinessTables, exportTable } from "@/db/index";

export default function DatabaseViewer() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState(null);
  
  const headerScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);
  
  const ITEMS_PER_PAGE = 10;
  
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoadingTables(true);
        const businessTables = await getBusinessTables();
        const allTables = [
          { name: "user" },
          { name: "cloud_drive_config" },
          { name: "sync_checkpoint" },
          ...businessTables,
        ];
        setTables(allTables);
        if (allTables.length > 0) {
          setSelectedTable(allTables[0].name);
        }
      } catch (err) {
        setError("获取表列表失败: " + err.message);
      } finally {
        setLoadingTables(false);
      }
    };
    fetchTables();
  }, []);
  
  useEffect(() => {
    if (!selectedTable) return;
    const fetchTableData = async () => {
      try {
        setLoadingData(true);
        const allData = await exportTable(selectedTable);
        
        if (allData.length > 0) {
          setColumns(Object.keys(allData[0]));
        } else {
          try {
            const db = await getDB();
            const tableInfo = await new Promise((resolve, reject) => {
              db.executeSql(
                `PRAGMA table_info(${selectedTable})`,
                [],
                (_, result) => resolve(result),
                (_, err) => reject(err)
              );
            });
            const fields = tableInfo.rows._array.map((item) => item.name);
            setColumns(fields);
          } catch (err) {
            setColumns([]);
          }
        }
        
        const total = Math.ceil(allData.length / ITEMS_PER_PAGE);
        const newTotalPages = total > 0 ? total : 1;
        setTotalPages(newTotalPages);
        
        let targetPage = currentPage;
        if (targetPage > newTotalPages) {
          targetPage = 1;
          setCurrentPage(targetPage);
        }
        
        const startIndex = (targetPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const currentData = allData.slice(startIndex, endIndex);
        
        setData(currentData);
      } catch (err) {
        setError("获取表数据失败: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };
    fetchTableData();
  }, [selectedTable, currentPage]);
  
  const handleTableChange = (tableName) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
  };
  
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  const renderCellContent = (value) => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };
  
  const renderItem = ({ item }) => (
    <View style={styles.dataRow}>
      {columns.map((column) => (
        <Text key={column} style={styles.dataCell} numberOfLines={0}>
          {renderCellContent(item[column])}
        </Text>
      ))}
    </View>
  );
  
  const renderHeader = () => {
    if (columns.length === 0) return null;
    return (
      <ScrollView
        ref={headerScrollRef}
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={styles.headerScroll}
      >
        <View style={styles.headerRow}>
          {columns.map((column) => (
            <Text key={column} style={styles.headerCell}>
              {column}
            </Text>
          ))}
        </View>
      </ScrollView>
    );
  };
  
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
        onPress={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <Text style={styles.pageButtonText}>上一页</Text>
      </TouchableOpacity>
      <Text style={styles.pageInfo}>
        第 {currentPage} / {totalPages} 页
      </Text>
      <TouchableOpacity
        style={[
          styles.pageButton,
          currentPage === totalPages && styles.disabledButton,
        ]}
        onPress={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <Text style={styles.pageButtonText}>下一页</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (loadingTables) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>加载数据库表...</Text>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* 表选择器 */}
      <View style={styles.tableSelectorContainer}>
        <Text style={styles.selectLabel}>选择数据表:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tableScroll}
          contentContainerStyle={styles.tableScrollContent}
        >
          {tables.map((table, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tableButton,
                selectedTable === table.name && styles.selectedTableButton,
              ]}
              onPress={() => handleTableChange(table.name)}
            >
              <Text
                style={[
                  styles.tableButtonText,
                  selectedTable === table.name && styles.selectedTableText,
                ]}
              >
                {table.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* 数据表 */}
      <View style={styles.tableWrap}>
        {renderHeader()}
        <ScrollView
          ref={bodyScrollRef}
          horizontal
          showsHorizontalScrollIndicator={true}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            headerScrollRef.current?.scrollTo({ x, animated: false });
          }}
        >
          <ScrollView showsVerticalScrollIndicator={true}>
            <View style={styles.tableContainer}>
              {loadingData ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#2196F3" />
                  <Text style={styles.loadingText}>加载数据...</Text>
                </View>
              ) : (
                <FlatList
                  data={data}
                  renderItem={renderItem}
                  keyExtractor={(item, index) => `${selectedTable}-${index}`}
                  ListEmptyComponent={() => (
                    <Text style={styles.emptyText}>表中没有数据</Text>
                  )}
                  scrollEnabled={false}
                />
              )}
            </View>
          </ScrollView>
        </ScrollView>
      </View>
      
      {data.length > 0 && renderPagination()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f5f5f5" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingRow: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  loadingText: { marginLeft: 8, color: "#666", fontSize: 14 },
  tableSelectorContainer: { marginBottom: 16 },
  selectLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  tableScroll: { flexDirection: "row" },
  tableScrollContent: { paddingBottom: 8 },
  tableButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
  },
  selectedTableButton: { backgroundColor: "#2196F3" },
  tableButtonText: { fontSize: 14, color: "#333" },
  selectedTableText: { color: "white", fontWeight: "500" },
  tableWrap: {
    flex: 1,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerScroll: { backgroundColor: "#fafafa" },
  tableContainer: { backgroundColor: "white" },
  headerRow: { flexDirection: "row" },
  headerCell: {
    minWidth: 150,
    padding: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    textAlignVertical: "center",
  },
  dataRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  dataCell: {
    minWidth: 150,
    padding: 12,
    fontSize: 14,
    color: "#666",
    borderRightWidth: 1,
    borderRightColor: "#eee",
    textAlignVertical: "top",
  },
  emptyText: {
    padding: 20,
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    width: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#2196F3",
  },
  disabledButton: { backgroundColor: "#cccccc" },
  pageButtonText: { color: "white", fontSize: 14, fontWeight: "500" },
  pageInfo: { fontSize: 14, color: "#333", paddingHorizontal: 8 },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
});
