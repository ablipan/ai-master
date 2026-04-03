# AI Master

**Stop typing. Start directing.**

AI Master is a VSCode extension that locks manual editing by default and trains you to work with AI agents instead of writing code by hand.

The premise is simple: the future of programming is not about typing faster — it's about defining intent, delegating to agents, and reviewing results. AI Master enforces this workflow by making your editor read-only until you explicitly choose to break the rule.

## Why

Every developer knows they should use AI agents more. But habits are strong — when you can just type, you will just type.

AI Master removes the default. It makes agent-first the path of least resistance:

- Your files are **read-only by default**
- AI agents can still modify files normally
- You **review diffs**, then **accept or reject**
- When you absolutely must edit manually, you click the lock for a **timed unlock**
- Every unlock is tracked — you see exactly how often you fall back to old habits

Think of it as training wheels for the transition from *writing code* to *directing code*.

## How It Works

1. Install the extension
2. A lock icon appears in the status bar — your workspace is now read-only
3. AI agents (Cursor, Copilot, etc.) write code; you review the diffs
4. Need to make a manual edit? Click the lock or press `Cmd+Shift+U` — you get 60 seconds
5. When time's up, the lock re-engages automatically
6. Open the AI Master sidebar to see your stats

## Features

### Lock / Unlock

- **Default locked**: all files are read-only; manual edits are intercepted and reverted
- **Timed unlock**: click the status bar lock or press `Cmd+Shift+U` (configurable) to unlock temporarily
- **Countdown**: the status bar shows remaining unlock time
- **Auto re-lock**: when the timer expires, editing is locked again

### Configuration

| Setting | Default | Description |
|---|---|---|
| `aiMaster.enabled` | `true` | Enable/disable the lock |
| `aiMaster.unlockDurationSeconds` | `60` | Seconds per unlock (10–600) |
| `aiMaster.dailyUnlockLimit` | `0` | Max unlocks per day (0 = unlimited) |
| `aiMaster.whitelistGlobs` | `["**/*.json", "**/*.md", ...]` | Files always editable (config, docs) |
| `aiMaster.showUnlockReason` | `false` | Prompt for a reason on each unlock |

### Whitelist

Config files, documentation, and other non-code files are editable by default. Customize the whitelist via `aiMaster.whitelistGlobs`.

Default whitelist:
- `**/.env*`, `**/*.json`, `**/*.yml`, `**/*.yaml`, `**/*.toml`
- `**/*.md`, `**/*.txt`, `**/Makefile`, `**/Dockerfile`, `**/.gitignore`

### Statistics Panel

The sidebar panel tracks your transition progress:

- **Today's unlocks** — how many times you broke the rule
- **Unlock duration** — total minutes spent in manual mode
- **Manual vs Agent edits** — file count comparison
- **7-day trend** — visual chart of daily unlocks
- **Streak** — consecutive days with zero unlocks
- **Top file types** — which file types trigger the most unlocks

## Compatibility

AI Master works with any VSCode-based IDE:

- **VSCode**
- **Cursor**
- **Trae**
- **Windsurf**
- Any IDE built on the VSCode extension API

## Installation

### From Source

```bash
git clone https://github.com/ablipan/ai-master.git
cd ai-master
npm install
npm run build
```

Then press `F5` in VSCode to launch the Extension Development Host.

### From VSIX

```bash
npm run vscode:prepublish
npx @vscode/vsce package
code --install-extension ai-master-0.1.0.vsix
```

## Philosophy

This extension is built on a belief:

> The highest-leverage developers of the next decade won't be the fastest typists. They'll be the best at decomposing problems, providing context, and verifying results. AI Master is a tool that forces you to practice this — not by adding features, but by removing the default escape hatch.

If you've ever said *"I should use AI agents more but I keep just writing the code myself"* — this is for you.

## Support

If AI Master helped you make the transition, consider buying me a coffee:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support-yellow?style=flat&logo=buy-me-a-coffee)](https://buymeacoffee.com/aimaster)

## License

MIT
