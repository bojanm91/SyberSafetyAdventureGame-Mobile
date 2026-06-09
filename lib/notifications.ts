import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiRegisterPushToken, apiSendTestNotification, apiUnregisterPushToken } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function pushStorageKey(userId: string) {
  return `csag_push_token_${userId}`;
}

function pushEnabledKey(userId: string) {
  return `csag_push_enabled_${userId}`;
}

function pushPromptAnsweredKey(userId: string) {
  return `csag_push_prompt_answered_${userId}`;
}

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

async function prepareAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Bajt podsjetnici",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#22D3EE",
  });
}

export async function getStoredPushToken(userId: string) {
  return AsyncStorage.getItem(pushStorageKey(userId));
}

export async function isPushEnabled(userId: string) {
  return (await AsyncStorage.getItem(pushEnabledKey(userId))) === "true";
}

export async function wasPushPromptAnswered(userId: string) {
  return (await AsyncStorage.getItem(pushPromptAnsweredKey(userId))) === "true";
}

export async function markPushPromptAnswered(userId: string) {
  await AsyncStorage.setItem(pushPromptAnsweredKey(userId), "true");
}

export async function registerForPushNotifications(userId: string) {
  await prepareAndroidChannel();

  if (!Device.isDevice) {
    throw new Error("Push notifikacije rade samo na fizičkom telefonu, ne u simulatoru/emulatoru.");
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;
  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== "granted") {
    throw new Error("Dozvola za push notifikacije nije odobrena.");
  }

  const projectId = getProjectId();
  const tokenResult = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();
  const token = tokenResult.data;

  await apiRegisterPushToken({
    token,
    platform: Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "unknown",
  });
  await AsyncStorage.multiSet([
    [pushStorageKey(userId), token],
    [pushEnabledKey(userId), "true"],
  ]);

  return token;
}

export async function unregisterPushNotifications(userId: string) {
  const token = await getStoredPushToken(userId);
  if (token) {
    await apiUnregisterPushToken({
      token,
      platform: Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "unknown",
    }).catch(() => {});
  }
  await AsyncStorage.multiRemove([pushStorageKey(userId), pushEnabledKey(userId)]);
}

export async function sendTestPushNotification() {
  return apiSendTestNotification();
}
