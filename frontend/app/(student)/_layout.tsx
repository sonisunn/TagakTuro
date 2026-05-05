import { Tabs } from "expo-router";
import BottomNav from "../../components/BottomNav";

export default function StudentLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade', // Use fade instead of swipe for a smoother feel
      }}
    >
      <Tabs.Screen name="homepage" />
      <Tabs.Screen name="book" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="feedback" />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
