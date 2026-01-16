# Claude Hive

> Open-source 3D visualization for Claude Code agents - monitor multiple sessions with a hexagonal grid interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **3D Hexagonal Grid** - Beautiful Three.js visualization inspired by RTS games
- **Real-time Monitoring** - Watch tool calls, file operations, and commands as they happen
- **Multi-Session Support** - Track multiple Claude Code instances simultaneously
- **Session Analytics** - Tool usage counts, activity timelines, and status tracking
- **Open Source** - Fully auditable, no telemetry, your code stays local

## Quick Start

```bash
# Install dependencies
npm install

# Install hooks into Claude Code
npm run setup

# Start the server
npm start

# Open dashboard
open http://localhost:4520
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Claude Hive Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐ │
│   │ Claude Code  │────▶│   Hive Hooks    │────▶│ Hive Server │ │
│   │  Instances   │     │ (PostToolUse,   │     │ (localhost: │ │
│   │              │     │  Stop, etc.)    │     │    4520)    │ │
│   └──────────────┘     └─────────────────┘     └──────┬──────┘ │
│                                                        │        │
│                                                        ▼        │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                   WebSocket Stream                        │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                        │        │
│                                                        ▼        │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │              React + Three.js Dashboard                   │ │
│   │                                                           │ │
│   │  ┌─────────────────────┐  ┌────────────────────────────┐ │ │
│   │  │   3D Hex Grid       │  │  Sidebar                   │ │ │
│   │  │   ┌───┐ ┌───┐       │  │  - Session list            │ │ │
│   │  │  ┌───┐ ┌───┐ ┌───┐  │  │  - Event stream            │ │ │
│   │  │   └───┘ └───┘       │  │  - Analytics               │ │ │
│   │  └─────────────────────┘  └────────────────────────────┘ │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start the Hive server |
| `npm run setup` | Install hooks into Claude Code |
| `npm run dev` | Start server + client in dev mode |
| `npm run build` | Build production client |

## CLI Usage

```bash
# Using npx (after publishing)
npx claude-hive           # Start server
npx claude-hive setup     # Install hooks
npx claude-hive doctor    # Diagnose issues
npx claude-hive uninstall # Remove hooks
```

## How It Works

### 1. Hook Integration

Claude Hive uses Claude Code's native [hooks system](https://code.claude.com/docs/en/hooks) to capture events:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{
        "type": "command",
        "command": "node /path/to/send-event.js"
      }]
    }]
  }
}
```

### 2. Event Capture

Each Claude Code hook triggers a small script that forwards the event:

```javascript
// Hook receives JSON from stdin
{
  "session_id": "abc123",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": { "file_path": "/src/app.ts" }
}

// Script POSTs to Hive server
POST http://localhost:4520/events
```

### 3. Real-time Streaming

The server broadcasts events to all connected clients via WebSocket:

```javascript
// Client connects
const ws = new WebSocket('ws://localhost:4520');

// Receives events in real-time
ws.onmessage = (event) => {
  const { type, event, session } = JSON.parse(event.data);
  // Update visualization
};
```

## Project Structure

```
claude-hive/
├── server/
│   └── index.js        # WebSocket + Express server
├── client/
│   ├── src/
│   │   ├── App.jsx           # Main React app
│   │   └── components/
│   │       ├── HexGrid.jsx   # Three.js hex visualization
│   │       └── Sidebar.jsx   # Session list & events
│   └── package.json
├── hooks/
│   └── send-event.js   # Hook script for capturing events
├── cli/
│   ├── index.js        # CLI entry point
│   ├── setup.js        # Hook installation
│   └── doctor.js       # Diagnostics
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/events` | POST | Receive hook events |
| `/api/sessions` | GET | List all sessions |
| `/api/events` | GET | Get event history |
| `/api/stats` | GET | Aggregated statistics |
| `/health` | GET | Health check |
| `ws://` | WebSocket | Real-time event stream |

## Customization

### Change Port

```bash
PORT=8080 npm start
```

### Custom Hook Events

Edit `hooks/send-event.js` to add custom processing:

```javascript
// Add custom metadata
event.custom_field = 'value';

// Filter events
if (event.tool_name === 'Read') return; // Skip read events
```

## Comparison with VibeCraft

| Feature | Claude Hive | VibeCraft |
|---------|-------------|-----------|
| Source | Open | Closed |
| License | MIT | Proprietary |
| 3D Visualization | Yes (hex grid) | Yes (hex grid) |
| Voice Input | No | Yes (Deepgram) |
| Analytics | Basic | Unknown |
| Telemetry | None | Amplitude |

## Contributing

Contributions welcome! Please read the contributing guidelines first.

```bash
# Development setup
git clone https://github.com/your-username/claude-hive
cd claude-hive
npm install
cd client && npm install && cd ..
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Credits

Inspired by [VibeCraft](https://vibecraft.sh/) and the Claude Code monitoring ecosystem.

Built with:
- [React](https://react.dev/) - UI framework
- [Three.js](https://threejs.org/) - 3D visualization
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) - React renderer for Three.js
- [Express](https://expressjs.com/) - Web server
- [ws](https://github.com/websockets/ws) - WebSocket library
