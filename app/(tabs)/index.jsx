import React, { useState } from 'react';
import Header from "@/components/common/Header";
import Calendar from "@/components/common/Calendar";
import TimelinePanel from "@/components/event";
import dayjs from 'dayjs';
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  
  return (
    <ThemeSafeAreaView>
      <Header
        selectedDate={selectedDate}
        onToday={() => setSelectedDate(dayjs())}
      />
      <Calendar
        value={selectedDate}
        onChange={(d) => setSelectedDate(d)}
      />
      <TimelinePanel selectedDate={selectedDate} />
    </ThemeSafeAreaView>
  );
}
