import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://cybersafetyadventuregame-backend-production.up.railway.app/api";



async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem("csag_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;


  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Greška na serveru." }));
    throw new Error((err as { message?: string }).message ?? "Greška na serveru.");
  }
  return res.json() as Promise<T>;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  status: string;
  level: number;
  points: number;
  streak: number;
  codename: string | null;
  avatarBase: string | null;
  avatarColor: string | null;
  avatarGear: string | null;
  onboardingDone: boolean;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function apiLogin(email: string, password: string) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function apiRegister(username: string, email: string, password: string, confirmPassword: string) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, email, password, confirmPassword }),
  });
}

export function apiDeleteProfile() {
  return request<{ deleted: boolean }>("/auth/me", {
    method: "DELETE",
  });
}

export interface DisciplineInfo {
  id: string;
  name: string;
  slug: string;
  icon: string;
  colorClass: string;
}

export interface QuestSummary {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  basePoints: number;
  questType: string;
  orderInDiscipline: number;
  discipline: DisciplineInfo;
  status: "available" | "locked" | "completed" | "mastered";
  score: number | null;
}

export interface QuestOption {
  id: string;
  text: string;
  order: number;
}

export interface QuestDetail {
  id: string;
  title: string;
  difficulty: string;
  basePoints: number;
  questType: string;
  scenario: string;
  taskText: string;
  hintText: string;
  miniConclusion: string;
  discipline: { id: string; name: string; slug: string; icon: string };
  options: QuestOption[];
  userProgress: {
    status: string;
    score: number;
    usedHint: boolean;
    correctOptionId: string;
  } | null;
}

export function apiGetQuests() {
  return request<QuestSummary[]>("/quests");
}

export function apiGetQuest(id: string) {
  return request<QuestDetail>(`/quests/${id}`);
}

export interface SubmitResult {
  correct: boolean;
  score: number;
  correctOptionId: string;
  feedbackCorrect: string;
  miniConclusion: string;
  selectedOptionExplanation: string | null;
  earnedBadges: Array<{ name: string; icon: string }>;
  user: { points: number; level: number; status: string; streak: number };
}

export function apiSubmitAnswer(questId: string, optionId: string, usedHint: boolean) {
  return request<SubmitResult>("/quests/submit", {
    method: "POST",
    body: JSON.stringify({ questId, optionId, usedHint }),
  });
}

export interface ProgressData {
  profile: {
    id: string;
    username: string;
    email: string;
    status: string;
    level: number;
    points: number;
    streak: number;
  };
  stats: {
    xpPercentage: number;
    xpToNextLevel: number;
    completedQuests: number;
    totalQuests: number;
    badgesCount: number;
  };
  badges: Array<{ id: string; name: string; icon: string; description: string; earnedAt: string }>;
  disciplineStats: Record<string, { total: number; completed: number; points: number }>;
  nextRecommended: { id: string; title: string; discipline: string } | null;
}

export function apiGetProgress() {
  return request<ProgressData>("/progress/me");
}

// ─── GAME API ───────────────────────────────────────────────────────────────

export interface GameTopic {
  slug: string;
  name: string;
  icon: string;
  lekcija: string | null;
  count: number;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  interactionType: string;
  difficulty: string;
  xp: number;
  discipline: { slug: string; name: string; icon: string };
  completed: boolean;
}

export interface ScenarioDetail {
  id: string;
  title: string;
  interactionType: string;
  difficulty: string;
  xp: number;
  tekst: string;
  gameData: Record<string, unknown>;
  correctData: Record<string, unknown>;
  objasnjenje: string;
  discipline: { slug: string; name: string; icon: string };
}

export interface SubmitResultPayload {
  questId: string;
  correct: boolean;
  xpEarned: number;
  timeMs?: number;
}

export interface SubmitResultResponse {
  correct: boolean;
  xpEarned: number;
  leveledUp: boolean;
  newLevel: number;
  newRank: string;
  xpTotal: number;
  xpToNextLevel: number;
  streak: number;
  earnedBadges: Array<{ name: string; icon: string }>;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  codename: string | null;
  avatarBase: string | null;
  avatarColor: string | null;
  level: number;
  points: number;
  rankTier: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  discipline: string;
  xp: number;
  interactionType: string;
  date: string;
}

export function apiGetTopics() {
  return request<GameTopic[]>("/game/topics");
}

export function apiGetScenarios(topic?: string) {
  const qs = topic ? `?topic=${topic}` : "";
  return request<ScenarioSummary[]>(`/game/scenarios${qs}`);
}

export function apiGetScenario(id: string) {
  return request<ScenarioDetail>(`/game/scenarios/${id}`);
}

export function apiSubmitGameResult(payload: SubmitResultPayload) {
  return request<SubmitResultResponse>("/game/results", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function apiGetLeaderboard() {
  return request<LeaderboardEntry[]>("/game/leaderboard");
}

export function apiUpdateAvatar(data: { codename?: string; avatarBase?: string; avatarColor?: string; avatarGear?: string; onboardingDone?: boolean }) {
  return request<{ codename: string | null; avatarBase: string | null; avatarColor: string | null; avatarGear: string | null; onboardingDone: boolean }>("/game/avatar", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function apiGetDailyChallenge() {
  return request<DailyChallenge | null>("/game/daily-challenge");
}

export function apiGetMastery() {
  return request<Record<string, number>>("/game/mastery");
}

export function apiGetXpHistory() {
  return request<Array<{ date: string; xp: number }>>("/game/xp-history");
}

export interface ByteFact {
  fact: string;
  source: "ai" | "fallback";
}

export function apiGetByteFact() {
  return request<ByteFact>("/game/byte-fact");
}
