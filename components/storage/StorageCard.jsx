import { TouchableOpacity, Image, View, Text, StyleSheet } from "react-native";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { formatDate } from "@/utils/formatTimeUtils";

const StorageCard = ({ item, onPress }) => {
  // 判断是否为退役产品（有结束时间且已过期）
  const isRetired = item.endDate && new Date(item.endDate) < new Date();
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.container, isRetired && styles.retiredContainer]}
      onPress={onPress}
    >
      {/* 退役标签 */}
      {isRetired && (
        <View style={styles.retiredTag}>
          <Text style={styles.retiredTagText}>已退役</Text>
        </View>
      )}
      
      {/* 图片/图标 */}
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={[styles.productImage, isRetired && styles.retiredImage]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.productImage, isRetired && styles.retiredImage, styles.iconContainer]}>
          <MaterialIcons
            name={item.icon}
            size={32}
            color={isRetired ? "#bdc3c7" : "#3498db"}
          />
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <View style={styles.headerSection}>
          <Text style={[styles.productName, isRetired && styles.retiredText]}>{item.name}</Text>
          <Text style={[styles.totalPrice, isRetired && styles.retiredText]}>¥{item.price}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={[styles.productDetail, isRetired && styles.retiredText]} numberOfLines={1} ellipsizeMode="tail">{item.detail}</Text>
        </View>
        
        <View style={styles.statsSection}>
          <View>
            <View style={styles.statRow}>
              <Ionicons name="calendar-outline" size={14} color={isRetired ? "#bdc3c7" : "#7f8c8d"} />
              <Text style={[styles.statText, isRetired && styles.retiredText]}>
                开始: {formatDate(item.startDate)}
              </Text>
            </View>
            
            {item.endDate && (
              <View style={styles.statRow}>
                <Ionicons name="calendar-clear-outline" size={14} color={isRetired ? "#bdc3c7" : "#7f8c8d"} />
                <Text style={[styles.statText, isRetired && styles.retiredText]}>结束: {formatDate(item.endDate)}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.statRow}>
            <FontAwesome5 name="coins" size={13} color={isRetired ? "#bdc3c7" : "#7f8c8d"} />
            <Text style={[styles.statText, isRetired && styles.retiredText]}>{item.daysUsed} 天</Text>
            <Text style={[styles.statText, isRetired && styles.retiredText]}>¥{item.dailyPrice}/天</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 2
  },
  
  retiredContainer: {
    backgroundColor: '#fff',
  },
  retiredTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#bdc3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
    borderTopLeftRadius: 12,
  },
  retiredTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  retiredImage: {
    opacity: 0.3,
  },
  retiredText: {
    color: '#95a5a6'
  },
  
  productImage: {
    width: 78,
    height: 75,
    borderRadius: 8,
    marginRight: 12
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flexShrink: 1
  },
  totalPrice: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold'
  },
  detailSection: {
    marginBottom: 5
  },
  productDetail: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 18
  },
  
  // 底部
  statsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7f8c8d'
  },
});

export default StorageCard;
