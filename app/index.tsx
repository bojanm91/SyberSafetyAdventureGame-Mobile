import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../contexts/auth-context";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="#37d6ff" size="large" />
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)/" : "/login"} />;
}
