import {
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import Header from "@/components/Header";
import Calendar from "@/components/Calendar";
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
      <TimelinePanel />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafd'
  },
  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 2
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffb300'
  }
});
