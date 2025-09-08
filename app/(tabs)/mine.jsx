import { SafeAreaView } from 'react-native-safe-area-context';
import Demo from '@/components/Demo'
import Demo2 from '@/components/Demo2'
import FlatList from "@/db/DatabaseViewer";

export default function Home() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <FlatList />
    </SafeAreaView>
  );
}
