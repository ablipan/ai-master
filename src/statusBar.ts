import * as vscode from 'vscode';
import { LockManager } from './lockManager';

const ICON_LOCKED = '$(shield)';
const ICON_UNLOCKED = '$(pulse)';
const ICON_URGENT = '$(flame)';

export class StatusBarController {
  private item: vscode.StatusBarItem;
  private _disposables: vscode.Disposable[] = [];

  constructor(private lockManager: LockManager) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'aiMaster.toggleLock';
    this.update();
    this.item.show();

    this._disposables.push(
      lockManager.onDidChangeLockState(() => this.update()),
      lockManager.onDidTickTimer(remaining => this.updateCountdown(remaining)),
    );
  }

  private update(): void {
    if (this.lockManager.locked) {
      this.item.text = `${ICON_LOCKED} Agent Mode`;
      this.item.backgroundColor = undefined;
      this.item.color = undefined;
      this.item.tooltip = new vscode.MarkdownString(
        `${ICON_LOCKED} **AI Master — Agent Mode**\n\n` +
        'Files are read-only. Let AI agents do the writing.\n\n' +
        '`Cmd+Shift+U` to unlock temporarily.',
        true,
      );
    } else {
      const sec = Math.ceil(this.lockManager.unlockRemainingMs / 1000);
      this.item.text = `${ICON_UNLOCKED} Manual ${sec}s`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.item.color = undefined;
      this.item.tooltip = new vscode.MarkdownString(
        `${ICON_UNLOCKED} **AI Master — Manual Override**\n\n` +
        `${sec}s remaining. Click to re-lock.`,
        true,
      );
    }
  }

  private updateCountdown(remainingMs: number): void {
    if (this.lockManager.locked) {
      return;
    }
    const sec = Math.ceil(remainingMs / 1000);
    if (sec <= 10) {
      this.item.text = `${ICON_URGENT} Manual ${sec}s`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else {
      this.item.text = `${ICON_UNLOCKED} Manual ${sec}s`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  dispose(): void {
    this.item.dispose();
    this._disposables.forEach(d => d.dispose());
  }
}
