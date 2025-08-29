import { SafeAreaView } from 'react-native-safe-area-context';
import Demo from '@/components/Demo'
import Demo2 from '@/components/Demo2'

export default function Home() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <Demo />
      <Demo2 />
    </SafeAreaView>
  );
}
