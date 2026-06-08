import { apiGetScenarios, type ScenarioSummary } from "./api";
import { getLocalCompletedScenarioIds } from "./local-progress";

export type MissionStats = {
  completed: number;
  total: number;
};

export function countMissionStats(scenarios: ScenarioSummary[]): MissionStats {
  return {
    completed: scenarios.filter((s) => s.completed).length,
    total: scenarios.length,
  };
}

export async function getMergedScenarios(userId: string, topic?: string) {
  const [items, localCompleted] = await Promise.all([
    apiGetScenarios(topic),
    getLocalCompletedScenarioIds(userId),
  ]);

  return items.map((s) => (
    localCompleted.has(s.id) ? { ...s, completed: true } : s
  ));
}

export async function getMissionStats(userId: string) {
  return countMissionStats(await getMergedScenarios(userId));
}
