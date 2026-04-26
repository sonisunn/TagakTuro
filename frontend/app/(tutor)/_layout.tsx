import { Tabs } from "expo-router";
import TutorBottomNav from "../../components/TutorBottomNav";

export default function TutorLayout() {
  return (
    <Tabs
      tabBar={(props) => <TutorBottomNav {...props} />}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Tabs.Screen name="tutor-homepage" />
      <Tabs.Screen name="session-availability" />
      <Tabs.Screen name="tutor-messages" />
      <Tabs.Screen name="tutor-feedback" />
    </Tabs>
  );
}
