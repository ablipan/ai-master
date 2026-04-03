import * as vscode from 'vscode';
import { StatsStore } from './statsStore';
import { LockManager } from './lockManager';
import { EditInterceptor } from './editInterceptor';
import { StatusBarController } from './statusBar';
import { StatsPanelProvider } from './statsPanel';

export function activate(context: vscode.ExtensionContext) {
  const stats = new StatsStore(context.globalState);
  const lockManager = new LockManager(stats);
  const interceptor = new EditInterceptor(lockManager, stats);
  const statusBar = new StatusBarController(lockManager);
  const statsPanel = new StatsPanelProvider(context.extensionUri, stats);

  vscode.commands.executeCommand('setContext', 'aiMaster.locked', true);
  updateWhitelistedContext(lockManager);

  context.subscriptions.push(
    vscode.commands.registerCommand('aiMaster.noop', () => {
      vscode.window.setStatusBarMessage(
        '$(rocket) You\'re in AI mode — Cmd+Shift+U for manual mode',
        2000
      );
    }),

    vscode.commands.registerCommand('aiMaster.toggleLock', () => {
      if (lockManager.locked) {
        vscode.commands.executeCommand('aiMaster.unlock');
      } else {
        lockManager.lock();
        statsPanel.refresh();
      }
    }),

    vscode.commands.registerCommand('aiMaster.unlock', async () => {
      if (!lockManager.locked) {
        return;
      }

      const config = vscode.workspace.getConfiguration('aiMaster');
      const showReason = config.get<boolean>('showUnlockReason') ?? false;
      let reason: string | undefined;

      if (showReason) {
        reason = await vscode.window.showInputBox({
          prompt: 'Why do you need to edit manually?',
          placeHolder: 'e.g. fixing a typo, config change...',
        });
        if (reason === undefined) {
          return;
        }
      }

      const editor = vscode.window.activeTextEditor;
      const file = editor?.document.uri.fsPath ?? 'unknown';
      lockManager.unlock(file, reason);
      statsPanel.refresh();
    }),

    vscode.commands.registerCommand('aiMaster.showStats', () => {
      vscode.commands.executeCommand('aiMaster.statsView.focus');
    }),

    vscode.commands.registerCommand('aiMaster.resetDailyStats', () => {
      stats.resetToday();
      statsPanel.refresh();
      vscode.window.showInformationMessage('AI Master: Daily stats reset.');
    }),

    vscode.window.registerWebviewViewProvider(
      StatsPanelProvider.viewType,
      statsPanel,
    ),

    lockManager.onDidChangeLockState(() => {
      statsPanel.refresh();
    }),

    vscode.window.onDidChangeActiveTextEditor(() => {
      updateWhitelistedContext(lockManager);
    }),

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('aiMaster.whitelistGlobs')) {
        updateWhitelistedContext(lockManager);
      }
    }),
  );

  context.subscriptions.push(interceptor, statusBar, lockManager);
}

function updateWhitelistedContext(lockManager: LockManager): void {
  const editor = vscode.window.activeTextEditor;
  const whitelisted = editor ? lockManager.isWhitelisted(editor.document.uri) : false;
  vscode.commands.executeCommand('setContext', 'aiMaster.whitelisted', whitelisted);
}

export function deactivate() {}
