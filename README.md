# AI Master

**Stop typing. Start directing.**

AI Master is a VSCode extension that puts you in AI-native development mode by default — where agents write code and you focus on intent, review, and decisions.

The premise is simple: the highest-leverage developers of the next decade won't be the fastest typists. They'll be the best at decomposing problems, providing context, and verifying results. AI Master helps you build that muscle.

## Why

Every developer knows they should work more with AI agents. But habits are strong — when you can just type, you will just type.

AI Master changes the default. It makes agent-first the natural way to work:

- You start in **AI Mode** — agents write, you direct
- You **review diffs**, then **accept or reject**
- Need to edit by hand? Switch to **Manual Mode** for a timed session
- Your progress is tracked — watch yourself evolve from coder to orchestrator

Think of it as a catalyst for the leap from *writing code* to *directing code*.

## How It Works

1. Install the extension
2. You're in **AI Mode** — agents handle the writing
3. AI agents (Cursor, Copilot, etc.) write code; you review the diffs
4. Need a manual edit? Press `Cmd+Shift+U` — you get 60 seconds of Manual Mode
5. When time's up, you're back in AI Mode automatically
6. Open the AI Master sidebar to see your evolution

## Features

### AI Mode / Manual Mode

- **AI Mode (default)**: agents write code, you review and direct
- **Manual Mode**: press `Cmd+Shift+U` (configurable) for a timed manual session
- **Countdown**: the status bar shows remaining manual time
- **Auto-return**: when the timer expires, you return to AI Mode

### Configuration

| Setting | Default | Description |
|---|---|---|
| `aiMaster.enabled` | `true` | Enable AI Master |
| `aiMaster.unlockDurationSeconds` | `60` | Seconds per manual session (10–600) |
| `aiMaster.dailyUnlockLimit` | `0` | Max manual switches per day (0 = unlimited) |
| `aiMaster.whitelistGlobs` | `["**/*.json", "**/*.md", ...]` | Files always hand-editable |
| `aiMaster.showUnlockReason` | `false` | Ask why you're switching to manual |

### Always-Editable Files

Config files, documentation, and other non-code files are hand-editable by default. Customize via `aiMaster.whitelistGlobs`.

Defaults:
- `**/.env*`, `**/*.json`, `**/*.yml`, `**/*.yaml`, `**/*.toml`
- `**/*.md`, `**/*.txt`, `**/Makefile`, `**/Dockerfile`, `**/.gitignore`

### Progress Panel

The sidebar tracks your evolution:

- **Manual fallbacks** — how many times you switched today
- **Manual time** — minutes spent in manual mode
- **Agent-driven vs hand-edited files** — the ratio tells the story
- **7-day evolution** — visual trend of your progress
- **Streak** — consecutive days in pure AI mode
- **Most manual file types** — where you still rely on hand-editing

## Compatibility

AI Master works with any VSCode-based IDE:

- **VSCode**
- **Cursor**
- **Trae**
- **Windsurf**
- Any IDE built on the VSCode extension API

## Installation

### From Marketplace

Search for **AI Master** in the VSCode Extensions panel.

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

> The future of programming is not about typing faster. It's about thinking at a higher level — defining intent, delegating execution, and verifying outcomes. AI Master doesn't restrict you. It elevates you.

If you've ever said *"I should use AI agents more but I keep just writing the code myself"* — this is your catalyst.

## License

MIT
