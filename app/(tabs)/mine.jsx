import { SafeAreaView } from 'react-native-safe-area-context';
import DatabaseViewer  from "@/db/DatabaseViewer";
import PieChartWithLabels from "@/components/chart/PieChartWithLabels";

const exampleData = [
  { label: "Search Engine", value: 1048, color: "#5b8ff9" },
  { label: "Direct", value: 735, color: "#6fcf97" },
  { label: "Email", value: 580, color: "#4f546c" },
  { label: "Union Ads", value: 484, color: "#f9845b" },
  { label: "Video Ads", value: 300, color: "#5bc0f8" },
];

export default function Mine() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <DatabaseViewer />
      <PieChartWithLabels data={exampleData} />
    </SafeAreaView>
  );
}
