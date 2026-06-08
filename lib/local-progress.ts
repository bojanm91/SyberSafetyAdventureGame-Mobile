import AsyncStorage from "@react-native-async-storage/async-storage";

function completedStorageKey(userId: string) {
  return `csag_completed_scenarios_${userId}`;
}

export async function getLocalCompletedScenarioIds(userId: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(completedStorageKey(userId));
  if (!raw) return new Set();
  try {
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter((v): v is string => typeof v === "string") : []);
  } catch {
    return new Set();
  }
}

export async function rememberLocalCompletedScenario(userId: string, questId: string) {
  const ids = await getLocalCompletedScenarioIds(userId);
  ids.add(questId);
  await AsyncStorage.setItem(completedStorageKey(userId), JSON.stringify([...ids]));
}
