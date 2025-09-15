import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Header from "@/components/common/Header";
import Calendar from "@/components/common/Calendar";
import TimelinePanel from "@/components/TimelinePanel";
import dayjs from 'dayjs';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  
  return (
    <SafeAreaView style={styles.container}>
      <Header
        selectedDate={selectedDate}
        onToday={() => setSelectedDate(dayjs())}
      />
      <Calendar
        value={selectedDate}
        onChange={(d) => setSelectedDate(d)}
      />
      <TimelinePanel selectedDate={selectedDate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd'
  }
});
