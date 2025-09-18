import { SafeAreaView } from 'react-native-safe-area-context';
import DatabaseViewer  from "@/db/DatabaseViewer";
import { Demo2 } from "@/components/Demo2";

export default function Mine() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <DatabaseViewer />
      <Demo2 />
    </SafeAreaView>
  );
}
