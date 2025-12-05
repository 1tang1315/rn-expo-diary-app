import React, { useState } from 'react';
import Header from "@/components/common/Header";
import Calendar from "@/components/common/Calendar";
import TimelinePanel from "@/components/event";
import dayjs from 'dayjs';
import ThemeSafeAreaView from "@/components/Theme/ThemeSafeAreaView";
import ThemeCard from "@/components/Theme/ThemeCard";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  
  return (
    <ThemeSafeAreaView>
      <ThemeCard>
        <Header
          selectedDate={selectedDate}
          onToday={() => setSelectedDate(dayjs())}
        />
        <Calendar
          value={selectedDate}
          onChange={(d) => setSelectedDate(d)}
        />
      </ThemeCard>
      
      <TimelinePanel selectedDate={selectedDate} />
    </ThemeSafeAreaView>
  );
}
