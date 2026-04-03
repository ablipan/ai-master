import * as vscode from 'vscode';
import { StatsData, DailyStats, todayKey, emptyDailyStats, UnlockRecord } from './types';

const STORAGE_KEY = 'aiMaster.stats';

export class StatsStore {
  private data: StatsData;

  constructor(private globalState: vscode.Memento) {
    this.data = globalState.get<StatsData>(STORAGE_KEY) ?? {
      dailyStats: {},
      streakDays: 0,
      lastActiveDate: '',
    };
    this.ensureToday();
  }

  private ensureToday(): DailyStats {
    const key = todayKey();
    if (!this.data.dailyStats[key]) {
      this.data.dailyStats[key] = emptyDailyStats(key);
    }
    this.updateStreak(key);
    return this.data.dailyStats[key];
  }

  private updateStreak(today: string) {
    if (this.data.lastActiveDate === today) {
      return;
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    const yesterdayStats = this.data.dailyStats[yesterdayKey];
    if (yesterdayStats && yesterdayStats.unlockCount === 0 && this.data.lastActiveDate === yesterdayKey) {
      this.data.streakDays++;
    } else if (this.data.lastActiveDate !== yesterdayKey) {
      const todayStats = this.data.dailyStats[today];
      this.data.streakDays = todayStats && todayStats.unlockCount === 0 ? 1 : 0;
    }
    this.data.lastActiveDate = today;
  }

  recordUnlock(file: string, reason?: string): void {
    const today = this.ensureToday();
    today.unlockCount++;
    today.unlockRecords.push({
      timestamp: Date.now(),
      file,
      reason,
    });
    this.persist();
  }

  addUnlockDuration(seconds: number): void {
    const today = this.ensureToday();
    today.unlockTotalSeconds += seconds;
    this.persist();
  }

  recordManualEdit(filePath: string): void {
    const today = this.ensureToday();
    if (!today.manualEditFiles.includes(filePath)) {
      today.manualEditFiles.push(filePath);
      this.persist();
    }
  }

  recordAgentEdit(filePath: string): void {
    const today = this.ensureToday();
    if (!today.agentEditFiles.includes(filePath)) {
      today.agentEditFiles.push(filePath);
      this.persist();
    }
  }

  getToday(): DailyStats {
    return this.ensureToday();
  }

  getRecentDays(n: number): DailyStats[] {
    const result: DailyStats[] = [];
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push(this.data.dailyStats[key] ?? emptyDailyStats(key));
    }
    return result;
  }

  getStreak(): number {
    return this.data.streakDays;
  }

  resetToday(): void {
    const key = todayKey();
    this.data.dailyStats[key] = emptyDailyStats(key);
    this.persist();
  }

  private persist(): void {
    this.globalState.update(STORAGE_KEY, this.data);
  }
}
