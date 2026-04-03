export interface UnlockRecord {
  timestamp: number;
  file: string;
  reason?: string;
}

export interface DailyStats {
  date: string;
  unlockCount: number;
  unlockTotalSeconds: number;
  manualEditFiles: string[];
  agentEditFiles: string[];
  unlockRecords: UnlockRecord[];
}

export interface StatsData {
  dailyStats: Record<string, DailyStats>;
  streakDays: number;
  lastActiveDate: string;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyDailyStats(date: string): DailyStats {
  return {
    date,
    unlockCount: 0,
    unlockTotalSeconds: 0,
    manualEditFiles: [],
    agentEditFiles: [],
    unlockRecords: [],
  };
}
