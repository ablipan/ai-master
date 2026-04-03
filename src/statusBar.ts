import * as vscode from 'vscode';
import { LockManager } from './lockManager';

const ICON_AGENT = '$(rocket)';
const ICON_MANUAL = '$(edit)';
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
      this.item.text = `${ICON_AGENT} AI Mode`;
      this.item.backgroundColor = undefined;
      this.item.color = undefined;
      this.item.tooltip = new vscode.MarkdownString(
        `${ICON_AGENT} **AI Master — Agent Mode**\n\n` +
        'You are in AI-native flow. Agents write, you direct.\n\n' +
        '`Cmd+Shift+U` to switch to manual mode temporarily.',
        true,
      );
    } else {
      const sec = Math.ceil(this.lockManager.unlockRemainingMs / 1000);
      this.item.text = `${ICON_MANUAL} Manual ${sec}s`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.item.color = undefined;
      this.item.tooltip = new vscode.MarkdownString(
        `${ICON_MANUAL} **AI Master — Manual Mode**\n\n` +
        `${sec}s remaining. Click to return to AI mode.`,
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
      this.item.text = `${ICON_MANUAL} Manual ${sec}s`;
      this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
  }

  dispose(): void {
    this.item.dispose();
    this._disposables.forEach(d => d.dispose());
  }
}
