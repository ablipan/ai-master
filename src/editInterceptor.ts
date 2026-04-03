import * as vscode from 'vscode';
import * as fs from 'fs';
import { LockManager } from './lockManager';
import { StatsStore } from './statsStore';

/**
 * Layer 1 — `type` command intercept: blocks standard keyboard input.
 * Layer 2 — keybindings in package.json: blocks paste/cut/delete/enter/tab.
 * Layer 3 — Disk-compare guard for IME and any other buffer-only edits:
 *
 *   When a locked file's buffer changes, we compare buffer content against
 *   the actual file on disk. If the disk hasn't changed but the buffer has,
 *   it's a buffer-only edit (IME, drag-drop, etc.) — revert buffer to disk.
 *   If the disk HAS changed, it's an external write (Agent, Git, etc.) —
 *   accept it and update our record.
 */
export class EditInterceptor {
  private _disposables: vscode.Disposable[] = [];
  private _typeDisposable: vscode.Disposable | undefined;
  private _manualEditActive = false;
  private _restoring = false;

  private _pendingRestores = new Map<string, ReturnType<typeof setTimeout>>();

  /** Last known disk content for locked files */
  private _diskContent = new Map<string, string>();

  constructor(
    private lockManager: LockManager,
    private stats: StatsStore,
  ) {
    this.registerTypeInterceptor();
    this.recordAllOpenDisk();

    this._disposables.push(
      lockManager.onDidChangeLockState(() => {
        this.disposeTypeInterceptor();
        this.registerTypeInterceptor();
        if (this.lockManager.locked) {
          this.recordAllOpenDisk();
        } else {
          this._diskContent.clear();
          this.cancelAllPendingRestores();
        }
      }),
      vscode.workspace.onDidChangeTextDocument(e => this.onDocumentChange(e)),
      vscode.workspace.onDidOpenTextDocument(doc => this.recordDiskIfLocked(doc)),
      vscode.workspace.onDidCloseTextDocument(doc => {
        this._diskContent.delete(doc.uri.toString());
        this.cancelPendingRestore(doc.uri.toString());
      }),
    );
  }

  private recordAllOpenDisk(): void {
    this._diskContent.clear();
    for (const doc of vscode.workspace.textDocuments) {
      this.recordDiskIfLocked(doc);
    }
  }

  private recordDiskIfLocked(doc: vscode.TextDocument): void {
    if (doc.uri.scheme !== 'file') {
      return;
    }
    if (this.lockManager.locked && !this.lockManager.isWhitelisted(doc.uri)) {
      try {
        this._diskContent.set(doc.uri.toString(), fs.readFileSync(doc.uri.fsPath, 'utf-8'));
      } catch {
        // New unsaved file or read error — use buffer content
        this._diskContent.set(doc.uri.toString(), doc.getText());
      }
    }
  }

  private registerTypeInterceptor(): void {
    this.disposeTypeInterceptor();

    this._typeDisposable = vscode.commands.registerCommand('type', (args) => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return vscode.commands.executeCommand('default:type', args);
      }

      if (this.lockManager.canEdit(editor.document.uri)) {
        this._manualEditActive = true;
        setTimeout(() => { this._manualEditActive = false; }, 500);
        return vscode.commands.executeCommand('default:type', args);
      }

      vscode.window.setStatusBarMessage(
        '$(shield) Editing locked — Cmd+Shift+U to unlock',
        2000
      );
    });
  }

  private disposeTypeInterceptor(): void {
    this._typeDisposable?.dispose();
    this._typeDisposable = undefined;
  }

  private onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
    if (this._restoring) {
      return;
    }
    if (e.document.uri.scheme !== 'file' || e.contentChanges.length === 0) {
      return;
    }

    const key = e.document.uri.toString();
    const canEdit = this.lockManager.canEdit(e.document.uri);

    if (canEdit) {
      this._diskContent.delete(key);
      if (this._manualEditActive) {
        this.stats.recordManualEdit(e.document.uri.fsPath);
      }
      return;
    }

    // Locked + non-whitelisted: schedule a disk-compare check
    // Debounce to handle rapid IME events
    this.scheduleCheck(key, e.document.uri);
  }

  private scheduleCheck(key: string, uri: vscode.Uri): void {
    this.cancelPendingRestore(key);
    // 150ms debounce — long enough for IME intermediate events to settle,
    // short enough to feel responsive. Each new event resets the timer.
    this._pendingRestores.set(key, setTimeout(() => {
      this._pendingRestores.delete(key);
      this.checkAndRestore(key, uri);
    }, 150));
  }

  private async checkAndRestore(key: string, uri: vscode.Uri): Promise<void> {
    const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === key);
    if (!doc) {
      return;
    }

    const bufferContent = doc.getText();

    // Read actual disk content right now
    let currentDisk: string;
    try {
      currentDisk = fs.readFileSync(uri.fsPath, 'utf-8');
    } catch {
      return;
    }

    const previousDisk = this._diskContent.get(key);

    if (previousDisk !== undefined && currentDisk !== previousDisk) {
      // Disk changed — external write (Agent, Git Discard, formatter, etc.)
      // Accept the new disk content and reload buffer to match
      this._diskContent.set(key, currentDisk);
      this.stats.recordAgentEdit(uri.fsPath);
      return;
    }

    // Disk hasn't changed but buffer differs = buffer-only edit (IME, drag, etc.)
    if (bufferContent !== currentDisk) {
      this._restoring = true;
      try {
        // Use revert command: it reloads the file from disk and clears dirty state
        // in one atomic operation — cleaner than replace + save
        await vscode.commands.executeCommand('workbench.action.files.revert');
      } finally {
        setTimeout(() => { this._restoring = false; }, 100);
      }

      vscode.window.setStatusBarMessage(
        '$(shield) Input blocked — Cmd+Shift+U to unlock',
        2000
      );
      return;
    }
  }

  private cancelPendingRestore(key: string): void {
    const timer = this._pendingRestores.get(key);
    if (timer) {
      clearTimeout(timer);
      this._pendingRestores.delete(key);
    }
  }

  private cancelAllPendingRestores(): void {
    for (const timer of this._pendingRestores.values()) {
      clearTimeout(timer);
    }
    this._pendingRestores.clear();
  }

  dispose(): void {
    this.disposeTypeInterceptor();
    this.cancelAllPendingRestores();
    this._disposables.forEach(d => d.dispose());
  }
}
