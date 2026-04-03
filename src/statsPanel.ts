import * as vscode from 'vscode';
import { StatsStore } from './statsStore';
import { DailyStats } from './types';

export class StatsPanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aiMaster.statsView';
  private _view?: vscode.WebviewView;

  constructor(
    private extensionUri: vscode.Uri,
    private stats: StatsStore,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    this.refresh();
  }

  refresh(): void {
    if (!this._view) {
      return;
    }
    const today = this.stats.getToday();
    const recent = this.stats.getRecentDays(7);
    const streak = this.stats.getStreak();
    this._view.webview.html = this.buildHtml(today, recent, streak);
  }

  private buildHtml(today: DailyStats, recent: DailyStats[], streak: number): string {
    const totalManual7d = recent.reduce((s, d) => s + d.manualEditFiles.length, 0);
    const totalAgent7d = recent.reduce((s, d) => s + d.agentEditFiles.length, 0);
    const totalEdits7d = totalManual7d + totalAgent7d;
    const manualPct = totalEdits7d > 0 ? Math.round((totalManual7d / totalEdits7d) * 100) : 0;

    const unlockMinutes = Math.round(today.unlockTotalSeconds / 60);

    const fileTypeMap: Record<string, number> = {};
    for (const day of recent) {
      for (const rec of day.unlockRecords) {
        const ext = rec.file.split('.').pop() ?? 'unknown';
        fileTypeMap[ext] = (fileTypeMap[ext] ?? 0) + 1;
      }
    }
    const topFileTypes = Object.entries(fileTypeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const chartData = recent
      .slice()
      .reverse()
      .map(d => ({
        date: d.date.slice(5),
        unlocks: d.unlockCount,
        manual: d.manualEditFiles.length,
        agent: d.agentEditFiles.length,
      }));

    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  :root {
    --fg: var(--vscode-foreground);
    --bg: var(--vscode-sideBar-background);
    --border: var(--vscode-panel-border);
    --accent: var(--vscode-textLink-foreground);
    --warn: var(--vscode-editorWarning-foreground);
  }
  body { font-family: var(--vscode-font-family); color: var(--fg); background: var(--bg); padding: 12px; margin: 0; font-size: 13px; }
  h2 { font-size: 14px; margin: 0 0 8px 0; }
  .card { background: var(--vscode-editor-background); border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 10px; }
  .metric { display: flex; justify-content: space-between; padding: 4px 0; }
  .metric-value { font-weight: bold; color: var(--accent); }
  .metric-warn { color: var(--warn); font-weight: bold; }
  .bar-chart { display: flex; align-items: flex-end; gap: 4px; height: 60px; margin-top: 8px; }
  .bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; }
  .bar { width: 100%; border-radius: 2px 2px 0 0; min-height: 2px; }
  .bar-unlock { background: var(--warn); }
  .bar-label { font-size: 10px; margin-top: 4px; opacity: 0.7; }
  .streak { text-align: center; font-size: 20px; font-weight: bold; color: var(--accent); padding: 8px 0; }
  .streak-label { font-size: 11px; opacity: 0.7; text-align: center; }
  .file-type { display: inline-block; background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); border-radius: 3px; padding: 2px 6px; margin: 2px; font-size: 11px; }
</style>
</head>
<body>

<div class="card">
  <h2>Today</h2>
  <div class="metric">
    <span>Unlocks</span>
    <span class="${today.unlockCount > 0 ? 'metric-warn' : 'metric-value'}">${today.unlockCount}</span>
  </div>
  <div class="metric">
    <span>Unlock duration</span>
    <span class="metric-value">${unlockMinutes} min</span>
  </div>
  <div class="metric">
    <span>Manual edits</span>
    <span class="metric-value">${today.manualEditFiles.length} files</span>
  </div>
  <div class="metric">
    <span>Agent edits</span>
    <span class="metric-value">${today.agentEditFiles.length} files</span>
  </div>
</div>

<div class="card">
  <h2>7-Day Overview</h2>
  <div class="metric">
    <span>Manual edit ratio</span>
    <span class="${manualPct > 30 ? 'metric-warn' : 'metric-value'}">${manualPct}%</span>
  </div>
  <div class="bar-chart">
    ${chartData.map(d => {
      const maxUnlocks = Math.max(...chartData.map(x => x.unlocks), 1);
      const h = Math.max(2, (d.unlocks / maxUnlocks) * 50);
      return `<div class="bar-group">
        <div class="bar bar-unlock" style="height:${h}px" title="${d.unlocks} unlocks"></div>
        <div class="bar-label">${d.date}</div>
      </div>`;
    }).join('')}
  </div>
</div>

<div class="card">
  <div class="streak">${streak}</div>
  <div class="streak-label">consecutive zero-unlock days</div>
</div>

${topFileTypes.length > 0 ? `
<div class="card">
  <h2>Most Unlocked File Types</h2>
  <div>${topFileTypes.map(([ext, count]) => `<span class="file-type">.${ext} (${count})</span>`).join('')}</div>
</div>` : ''}

</body>
</html>`;
  }
}
