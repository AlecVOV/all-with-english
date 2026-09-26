/** Lưu tiến trình vào localStorage theo testId (CLAUDE.md §6.2). */

export interface Highlight {
  paragraph: string;
  text: string;
  note?: string;
}

export interface SessionState {
  testId: string;
  mode: 'exam' | 'practice';
  candidate: string;
  answers: Record<number, string>;
  flagged: number[];
  highlights: Highlight[];
  /** giây còn lại (exam) hoặc đã trôi (practice) */
  seconds: number;
  limitSeconds?: number;
  /** chỉ làm một số block — dùng cho "làm lại dạng sai" */
  onlyTypes?: number[];
  submitted: boolean;
  updatedAt: number;
}

const KEY = (id: string): string => `ielts-reading:${id}`;

export function loadSession(testId: string): SessionState | null {
  try {
    const raw = localStorage.getItem(KEY(testId));
    return raw ? (JSON.parse(raw) as SessionState) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: SessionState): void {
  try {
    localStorage.setItem(KEY(s.testId), JSON.stringify({ ...s, updatedAt: Date.now() }));
  } catch {
    /* hết quota hoặc bị chặn — không được làm vỡ bài đang làm */
  }
}

export function clearSession(testId: string): void {
  try {
    localStorage.removeItem(KEY(testId));
  } catch {
    /* bỏ qua */
  }
}

const PREF_KEY = 'ielts-reading:prefs';

export interface Prefs {
  candidate: string;
  fontSize: 0 | 1 | 2;
  paper: 'white' | 'cream';
}

export const defaultPrefs: Prefs = { candidate: 'Candidate', fontSize: 1, paper: 'white' };

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    return raw ? { ...defaultPrefs, ...(JSON.parse(raw) as Partial<Prefs>) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {
    /* bỏ qua */
  }
}
