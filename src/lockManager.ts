import * as vscode from 'vscode';
import * as path from 'path';
import { minimatch } from './minimatch';
import { StatsStore } from './statsStore';

export class LockManager {
  private _locked = true;
  private _unlockTimer: ReturnType<typeof setTimeout> | undefined;
  private _unlockRemainingMs = 0;
  private _unlockStartTime = 0;
  private _disposables: vscode.Disposable[] = [];
  private _onDidChangeLockState = new vscode.EventEmitter<boolean>();
  private _onDidTickTimer = new vscode.EventEmitter<number>();
  private _tickInterval: ReturnType<typeof setInterval> | undefined;

  readonly onDidChangeLockState = this._onDidChangeLockState.event;
  readonly onDidTickTimer = this._onDidTickTimer.event;

  constructor(private stats: StatsStore) {}

  get locked(): boolean {
    return this._locked;
  }

  get unlockRemainingMs(): number {
    if (!this._locked && this._unlockStartTime > 0) {
      const elapsed = Date.now() - this._unlockStartTime;
      return Math.max(0, this._unlockRemainingMs - elapsed);
    }
    return 0;
  }

  isWhitelisted(uri: vscode.Uri): boolean {
    const config = vscode.workspace.getConfiguration('aiMaster');
    const globs: string[] = config.get('whitelistGlobs') ?? [];
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const relativePath = workspaceFolders
      ? path.relative(workspaceFolders[0].uri.fsPath, uri.fsPath)
      : path.basename(uri.fsPath);

    return globs.some(pattern => minimatch(relativePath, pattern));
  }

  canEdit(uri: vscode.Uri): boolean {
    if (!this.isEnabled()) {
      return true;
    }
    if (!this._locked) {
      return true;
    }
    if (this.isWhitelisted(uri)) {
      return true;
    }
    return false;
  }

  unlock(file: string, reason?: string): boolean {
    if (!this.isEnabled()) {
      return true;
    }

    const config = vscode.workspace.getConfiguration('aiMaster');
    const dailyLimit = config.get<number>('dailyUnlockLimit') ?? 0;
    if (dailyLimit > 0) {
      const todayStats = this.stats.getToday();
      if (todayStats.unlockCount >= dailyLimit) {
        vscode.window.showWarningMessage(
          `AI Master: You've reached today's manual mode limit (${dailyLimit}). Stay in AI mode — you've got this.`
        );
        return false;
      }
    }

    const durationSec = config.get<number>('unlockDurationSeconds') ?? 60;
    this._locked = false;
    this._unlockRemainingMs = durationSec * 1000;
    this._unlockStartTime = Date.now();

    this.stats.recordUnlock(file, reason);
    this._onDidChangeLockState.fire(false);

    vscode.commands.executeCommand('setContext', 'aiMaster.locked', false);

    this._tickInterval = setInterval(() => {
      const remaining = this.unlockRemainingMs;
      this._onDidTickTimer.fire(remaining);
      if (remaining <= 0) {
        this.lock();
      }
    }, 1000);

    this._unlockTimer = setTimeout(() => {
      this.lock();
      this.stats.addUnlockDuration(durationSec);
    }, durationSec * 1000);

    return true;
  }

  lock(): void {
    this._locked = true;
    this._unlockRemainingMs = 0;
    this._unlockStartTime = 0;

    if (this._unlockTimer) {
      clearTimeout(this._unlockTimer);
      this._unlockTimer = undefined;
    }
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = undefined;
    }

    this._onDidChangeLockState.fire(true);
    vscode.commands.executeCommand('setContext', 'aiMaster.locked', true);
  }

  toggle(): void {
    if (this._locked) {
      const editor = vscode.window.activeTextEditor;
      const file = editor?.document.uri.fsPath ?? 'unknown';
      this.unlock(file);
    } else {
      this.lock();
    }
  }

  private isEnabled(): boolean {
    return vscode.workspace.getConfiguration('aiMaster').get<boolean>('enabled') ?? true;
  }

  dispose(): void {
    if (this._unlockTimer) {
      clearTimeout(this._unlockTimer);
    }
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
    }
    this._onDidChangeLockState.dispose();
    this._onDidTickTimer.dispose();
    this._disposables.forEach(d => d.dispose());
  }
}
