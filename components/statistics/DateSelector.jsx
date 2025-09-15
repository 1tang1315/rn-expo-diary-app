import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

const DateSelector = ({ dateType, setDateType, selectedDate, startDate, endDate, handleShowDatePicker, styles }) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>选择日期范围</Text>
      <View style={styles.dateTypeSwitcher}>
        <TouchableOpacity
          style={[styles.dateTypeBtn, dateType === 'single' && styles.dateTypeBtnActive]}
          onPress={() => setDateType('single')}
        >
          <Text style={[styles.dateTypeText, dateType === 'single' && styles.dateTypeTextActive]}>单个日期</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateTypeBtn, dateType === 'range' && styles.dateTypeBtnActive]}
          onPress={() => setDateType('range')}
        >
          <Text style={[styles.dateTypeText, dateType === 'range' && styles.dateTypeTextActive]}>日期范围</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.datePickerContainer}>
        {dateType === 'single' ? (
          <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('single')}>
            <Ionicons name="calendar-outline" size={18} color="#666" style={styles.dateIcon} />
            <Text style={styles.dateText}>{dayjs(selectedDate).format('YYYY-MM-DD')}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('start')}>
              <Ionicons name="calendar-outline" size={18} color="#666" style={styles.dateIcon} />
              <Text style={styles.dateText}>开始：{dayjs(startDate).format('YYYY-MM-DD')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateSelectBtn} onPress={() => handleShowDatePicker('end')}>
              <Ionicons name="calendar-outline" size={18} color="#666" style={styles.dateIcon} />
              <Text style={styles.dateText}>结束：{dayjs(endDate).format('YYYY-MM-DD')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

export default DateSelector;
