// app/index.tsx
import { Redirect } from 'expo-router';
import { LogBox } from 'react-native';

LogBox.ignoreLogs([
  'Text strings must be rendered within a <Text> component',
  // Add any other warnings you want to hide here
]);
export default function Index() {
  return <Redirect href="/login" />;
}
