import Calendar from "@/components/common/Calendar";
import Header from "@/components/common/Header";
import TimelinePanel from "@/components/event";
import ThemeCard from "@/components/theme/ThemeCard";
import ThemeSafeAreaView from "@/components/theme/ThemeSafeAreaView";
import dayjs from 'dayjs';
import React, { useState } from 'react';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  
  return (
    <ThemeSafeAreaView>
      <ThemeCard>
        <Header
          selectedDate={selectedDate}
          onToday={() => setSelectedDate(dayjs())}
          onDateChange={(date) => setSelectedDate(date)}
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
