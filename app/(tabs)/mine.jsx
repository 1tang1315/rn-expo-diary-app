import { SafeAreaView } from 'react-native-safe-area-context';
import Demo from '@/components/Demo'

export default function Home() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <Demo />
    </SafeAreaView>
  );
}
