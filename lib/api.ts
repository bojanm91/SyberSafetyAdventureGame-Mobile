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
