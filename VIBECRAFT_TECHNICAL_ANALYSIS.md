# VibeCraft Technical Analysis

> A comprehensive technical analysis of VibeCraft (vibecraft.sh) and the Claude Code visualization/monitoring ecosystem.

## Executive Summary

**VibeCraft** (https://vibecraft.sh) is a 3D visualization application for monitoring and managing Claude Code instances in real-time. It provides a hexagonal grid-based interface that syncs with local Claude Code processes, operating as a visualization layer without transmitting code to external servers.

**Key Finding**: VibeCraft is a closed-source application by Elysian Labs (v0.0.0). While the website and npm CLI are available, no public GitHub repository exists for the vibecraft.sh project itself.

---

## 1. Architecture & Implementation

### 1.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        VibeCraft Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐     ┌─────────────────┐     ┌─────────────┐ │
│   │ Claude Code  │────▶│ VibeCraft Hooks │────▶│ Local Agent │ │
│   │  Instances   │     │  (PostToolUse,  │     │   Server    │ │
│   │   (tmux)     │     │  Notification)  │     │ (localhost) │ │
│   └──────────────┘     └─────────────────┘     └──────┬──────┘ │
│                                                        │        │
│                                                        ▼        │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │              WebSocket Connection                         │ │
│   │           (Real-time event streaming)                     │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                        │        │
│                                                        ▼        │
│   ┌──────────────────────────────────────────────────────────┐ │
│   │                VibeCraft Web Interface                    │ │
│   │    - 3D Hexagonal Grid Visualization                      │ │
│   │    - Real-time Session Monitoring                         │ │
│   │    - Voice Input (Deepgram API)                           │ │
│   │    - Analytics (Amplitude)                                │ │
│   └──────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Local-First Design

VibeCraft operates on a **local-first architecture**:

- **No Code Transmission**: Files and code remain on the user's machine
- **Local Agent Server**: Runs on configurable localhost port
- **Hook-Based Communication**: Integrates via Claude Code's native hook system
- **tmux Session Management**: Uses tmux for process management and debugging

### 1.3 WebSocket Connection Details

Based on analysis of similar monitoring tools (MadameClaude, Multi-Agent Observability), the WebSocket architecture likely follows this pattern:

```javascript
// Typical WebSocket event flow for Claude Code monitoring
const eventFlow = {
  // 1. Claude Code generates hook event
  hookEvent: {
    session_id: "abc123",
    hook_event_name: "PostToolUse",
    tool_name: "Write",
    tool_input: { file_path: "/path/to/file.ts" },
    tool_response: { success: true }
  },

  // 2. Hook script captures and forwards via HTTP POST
  bridge: "HTTP POST to localhost:PORT",

  // 3. Server broadcasts via WebSocket
  websocket: "ws://localhost:PORT/stream",

  // 4. Client receives real-time updates
  client: "Vue/React client renders visualization"
};
```

### 1.4 Technical Stack (Inferred)

| Component | Technology |
|-----------|------------|
| Frontend | 3D visualization (likely Three.js for hexagonal grids) |
| WebSocket | Native WebSocket or Socket.io |
| CLI | Node.js (npx-based) |
| Voice | Deepgram API integration |
| Analytics | Amplitude |
| Process Management | tmux |

### 1.5 Hook Integration

VibeCraft integrates via Claude Code's hook system. Configuration in `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/vibecraft-hook.sh"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/vibecraft-notification.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 2. Gaming Mechanics & Gamification

### 2.1 RTS-Inspired Interface

VibeCraft draws inspiration from real-time strategy games like StarCraft:

| Game Element | VibeCraft Implementation |
|--------------|--------------------------|
| Unit Management | Multiple Claude Code agents as "units" |
| Hexagonal Grid | 3D visualization of agent zones |
| Real-time Updates | Live status monitoring (~300ms intervals) |
| Resource Management | Token consumption tracking |
| Multi-tasking | Parallel agent orchestration |

### 2.2 Hexagonal Grid Visualization

The hexagonal grid serves multiple purposes:

1. **Zone Representation**: Each hex represents a Claude Code session/zone
2. **Status Indication**: Visual state changes for active/idle/stuck agents
3. **Spatial Organization**: Intuitive layout for multiple concurrent sessions
4. **Real-time Animation**: Live updates showing agent activity

### 2.3 Gamification Elements Observed

Based on the ecosystem analysis:

| Element | Implementation |
|---------|----------------|
| Visual Feedback | 3D animations for agent activity |
| Progress Tracking | Session timelines and event logs |
| Achievement-like Metrics | Token consumption, task completion |
| Competitive Elements | viberank leaderboard integration (community) |

### 2.4 The "Vibecoding as Gaming" Philosophy

From the VibeCraft creators:
> "Vibecoding can and should become more fun than video games, and usher in an era where work becomes play."

The mental model maps directly to RTS gameplay:

```
RTS Game                    │  VibeCraft/Parallel Agents
────────────────────────────┼─────────────────────────────────
Hotkey groups (Ctrl+1,2,3)  │  Switch between agent sessions
Supply cap (Pylons)         │  Context window limits
Micro vs Macro balance      │  Direct intervention vs delegation
Scout units                 │  Exploratory/research agents
Production queues           │  Task queues for agents
```

---

## 3. Setup & Configuration

### 3.1 Installation Commands

```bash
# Start the VibeCraft server
npx vibecraft

# Install hooks into Claude Code
npx vibecraft setup

# Diagnose issues
npx vibecraft doctor

# Remove hooks
npx vibecraft uninstall
```

### 3.2 Prerequisites

| Requirement | Details |
|-------------|---------|
| Node.js | Required for npx |
| Claude Code | Must be installed and configured |
| tmux | Used for session management |
| Modern Browser | For web interface |

### 3.3 Voice Input Configuration

```bash
# Add to .env file in project root
DEEPGRAM_API_KEY=your_key_here

# Default volume: 70%
# Activation: Ctrl+M or keyboard shortcut
```

### 3.4 Keyboard Controls

| Shortcut | Action |
|----------|--------|
| Ctrl+M | Activate voice input |
| Enter | Send message |

### 3.5 tmux Session Management

```bash
# List all sessions
tmux ls

# Attach to a session for debugging
tmux attach -t _session_

# Detach from session
Ctrl+B, D
```

---

## 4. Use Cases & Workflow

### 4.1 Primary Use Cases

1. **Multi-Session Monitoring**: Watch multiple Claude Code instances simultaneously
2. **Visual Debugging**: Identify stuck or waiting agents via visual indicators
3. **Real-time Feedback**: Immediate visibility into agent activity
4. **Voice Interaction**: Hands-free communication with agents

### 4.2 Workflow Integration

```
┌─────────────────────────────────────────────────────────────┐
│                   Developer Workflow                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Start VibeCraft: npx vibecraft                           │
│                         │                                    │
│                         ▼                                    │
│  2. Launch Claude Code sessions (multiple terminals/tmux)    │
│                         │                                    │
│                         ▼                                    │
│  3. Monitor via 3D hexagonal grid interface                  │
│       - See active zones                                     │
│       - Track tool usage                                     │
│       - Identify blocked sessions                            │
│                         │                                    │
│                         ▼                                    │
│  4. Interact via voice (Deepgram) or keyboard                │
│                         │                                    │
│                         ▼                                    │
│  5. Debug stuck sessions via tmux attach                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Best-Suited Tasks

| Task Type | Benefit |
|-----------|---------|
| Parallel Feature Development | Monitor multiple feature branches |
| Large Refactoring | Track progress across files |
| Code Review | Watch agent analysis in real-time |
| Learning/Exploration | Visual feedback on agent reasoning |

### 4.4 Troubleshooting Stuck Zones

When a zone gets stuck:
1. The agent may be waiting for input
2. Claude Code may be in an unknown state
3. **Solution**: Attach to tmux session to diagnose

```bash
# List sessions to find the stuck one
tmux ls

# Attach and investigate
tmux attach -t session_name
```

---

## 5. Technical Deep Dive

### 5.1 Source Code Availability

| Project | Source |
|---------|--------|
| vibecraft.sh | **Not publicly available** (closed source) |
| Similar: MadameClaude | https://github.com/williamkapke/MadameClaude |
| Similar: Multi-Agent Observability | https://github.com/disler/claude-code-hooks-multi-agent-observability |

### 5.2 WebSocket Message Protocol (Based on Similar Projects)

**Input Messages (Client → Server)**:
```typescript
interface ClientMessage {
  type: 'user_message' | 'interrupt';
  session_id?: string;
  content?: string;
}
```

**Output Messages (Server → Client)**:
```typescript
interface ServerMessage {
  type: 'connected' | 'sdk_message' | 'error' | 'hook_event';
  timestamp: string;
  data: HookEventData | ErrorData;
}

interface HookEventData {
  session_id: string;
  hook_event_name: 'PreToolUse' | 'PostToolUse' | 'Notification' | 'Stop';
  tool_name: string;
  tool_input: Record<string, any>;
  tool_response?: Record<string, any>;
}
```

### 5.3 Hook Event Structure (Claude Code Standard)

```json
{
  "session_id": "abc123",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "file content here"
  },
  "tool_response": {
    "filePath": "/path/to/file.ts",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

### 5.4 Reference Implementation: Event Capture

Based on MadameClaude and Multi-Agent Observability:

```python
#!/usr/bin/env python3
"""Hook event bridge - captures and forwards events to VibeCraft server."""

import json
import sys
import requests
from datetime import datetime

VIBECRAFT_SERVER = "http://localhost:4519/events"

def main():
    try:
        # Read hook event from stdin (Claude Code provides JSON)
        event_data = json.load(sys.stdin)

        # Add metadata
        event_data["timestamp"] = datetime.utcnow().isoformat()
        event_data["source"] = "vibecraft-hook"

        # Forward to VibeCraft server
        response = requests.post(
            VIBECRAFT_SERVER,
            json=event_data,
            timeout=5
        )

        if response.status_code == 200:
            sys.exit(0)  # Success
        else:
            print(f"Server error: {response.status_code}", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"Hook error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 5.5 WebSocket Server Implementation Pattern

```typescript
// server.ts - WebSocket server pattern for Claude Code monitoring
import { serve } from "bun";

const clients = new Set<WebSocket>();
const events: HookEvent[] = [];

const server = serve({
  port: 4519,

  fetch(req, server) {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("Upgrade failed", { status: 500 });
    }

    // Receive events from hooks
    if (url.pathname === "/events" && req.method === "POST") {
      return handleEventPost(req);
    }

    return new Response("Not found", { status: 404 });
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      ws.send(JSON.stringify({ type: "connected", timestamp: new Date().toISOString() }));
    },
    close(ws) {
      clients.delete(ws);
    },
    message(ws, message) {
      // Handle client messages if needed
    }
  }
});

async function handleEventPost(req: Request): Promise<Response> {
  const event = await req.json();
  event.timestamp = new Date().toISOString();
  events.push(event);

  // Broadcast to all connected clients
  const message = JSON.stringify({ type: "hook_event", data: event });
  for (const client of clients) {
    client.send(message);
  }

  return new Response("OK", { status: 200 });
}
```

### 5.6 Performance Considerations

| Aspect | Implementation |
|--------|----------------|
| Update Frequency | ~300ms intervals (similar to Claude HUD) |
| Event Storage | In-memory with optional SQLite persistence |
| WebSocket | Single connection per client (typical pattern) |
| Hook Overhead | Minimal - async HTTP POST to local server |

---

## 6. Comparison & Alternatives

### 6.1 VibeCraft (vibecraft.sh) vs Related Projects

| Feature | VibeCraft.sh | VibeCraft.build | MadameClaude | Multi-Agent Observability |
|---------|--------------|-----------------|--------------|---------------------------|
| **Purpose** | 3D visualization | Multi-agent manager | Hook monitoring | Agent observability |
| **Interface** | Hexagonal 3D grid | macOS native app | Web dashboard | Vue web client |
| **Platform** | Web (localhost) | macOS only | Web | Web |
| **Source** | Closed | Closed | Open source | Open source |
| **Gaming UX** | Yes (hex grid) | Yes (RTS-inspired) | No | Partial (visual) |
| **Voice Input** | Yes (Deepgram) | Unknown | No | No |
| **Multi-agent** | Yes | Yes | Yes | Yes |

### 6.2 Claude Code Monitoring Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│                Claude Code Monitoring Tools Landscape                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Visualization & Dashboards                                          │
│  ├── VibeCraft (vibecraft.sh) - 3D hexagonal grid                   │
│  ├── MadameClaude - Web UI with sound notifications                 │
│  ├── Multi-Agent Observability - Vue client with charts             │
│  ├── ccflare / better-ccflare - Web dashboards                      │
│  └── Claudex - Conversation history browser                         │
│                                                                      │
│  CLI/Terminal Tools                                                  │
│  ├── Claude Code Usage Monitor - Terminal progress bars             │
│  ├── CC Usage - Token consumption CLI                               │
│  ├── ccstatusline - Terminal status display                         │
│  └── Claude HUD - Statusline API integration                        │
│                                                                      │
│  Multi-Agent Orchestrators (RTS-style)                               │
│  ├── VibeCraft (vibecraft.build) - macOS native                     │
│  ├── VibeMux - TUI for agent orchestration                          │
│  ├── Crystal - Desktop app for parallel agents                      │
│  ├── Vibe Kanban - Task-based orchestration                         │
│  ├── Uzi - Git worktree + tmux automation                           │
│  └── Happy Coder - Mobile/desktop agent swarm                       │
│                                                                      │
│  Analytics & Leaderboards                                            │
│  ├── viberank - Community leaderboard                               │
│  ├── SigNoz + OpenTelemetry - Enterprise observability              │
│  └── Vibe-Log - Session analysis with HTML reports                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.3 Unique Value Propositions

**VibeCraft (vibecraft.sh)**:
- 3D hexagonal grid visualization (unique)
- Voice input via Deepgram (rare)
- Local-first with no code transmission
- Gaming-inspired UX

**VibeCraft (vibecraft.build)**:
- Native macOS app (best OS integration)
- RTS-inspired interface
- Multi-AI support (Claude Code + Codex)

**MadameClaude**:
- Open source
- Sound notifications
- Simple setup

**Multi-Agent Observability**:
- Open source
- SQLite persistence
- Detailed event filtering

### 6.4 Direct CLI Comparison

| Aspect | Raw Claude Code | With VibeCraft |
|--------|-----------------|----------------|
| Visual Feedback | Text only | 3D visualization |
| Multi-session | Manual switching | Unified dashboard |
| Debugging | tmux attach | Visual indicators + tmux |
| Voice Input | Not available | Deepgram integration |
| Progress Tracking | `/context` command | Real-time visual updates |

---

## 7. Security Considerations

### 7.1 Local Connection Security

| Aspect | Implementation |
|--------|----------------|
| Network Exposure | localhost only |
| Data Transmission | No code sent to external servers |
| Authentication | None required (local) |
| Port Configuration | Configurable |

### 7.2 Hook Security Best Practices

From Claude Code's official documentation:

```python
# Security checklist for hooks
security_practices = {
    "validate_inputs": "Never trust input data blindly",
    "quote_variables": 'Use "$VAR" not $VAR',
    "block_path_traversal": "Check for '..' in paths",
    "use_absolute_paths": "Specify full paths",
    "skip_sensitive_files": "Avoid .env, .git/, keys"
}
```

### 7.3 WebSocket Security Advisory

**Note**: In June 2025, a security advisory was released for Claude Code IDE extensions regarding WebSocket connections from arbitrary origins ([GHSA-9f65-56v6-gxw7](https://github.com/anthropics/claude-code/security/advisories/GHSA-9f65-56v6-gxw7)). Ensure Claude Code is updated to patched versions.

---

## 8. Conclusion

### 8.1 Summary

VibeCraft (vibecraft.sh) represents an innovative approach to Claude Code monitoring through:

1. **3D Visualization**: Hexagonal grid provides intuitive multi-agent overview
2. **Gaming Paradigm**: RTS-inspired interface makes AI coding more engaging
3. **Local-First**: Privacy-preserving architecture
4. **Voice Integration**: Hands-free interaction capability

### 8.2 Limitations

- Closed source (no public repository)
- Limited documentation
- Version 0.0.0 indicates early stage
- macOS/Linux focused (tmux dependency)

### 8.3 Recommendations

For teams evaluating Claude Code visualization tools:

| Need | Recommended Tool |
|------|------------------|
| Open source, simple | MadameClaude |
| Detailed analytics | Multi-Agent Observability |
| Gaming-style UX | VibeCraft (vibecraft.sh) |
| macOS native | VibeCraft (vibecraft.build) |
| Enterprise observability | SigNoz + OpenTelemetry |
| Terminal-only | Claude HUD or ccstatusline |

---

## References

### Primary Sources
- [VibeCraft (vibecraft.sh)](https://vibecraft.sh/)
- [VibeCraft (vibecraft.build)](https://vibecraft.build/)
- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks)

### Open Source Projects
- [MadameClaude](https://github.com/williamkapke/MadameClaude)
- [Multi-Agent Observability](https://github.com/disler/claude-code-hooks-multi-agent-observability)
- [claude-agent-server](https://github.com/dzhng/claude-agent-server)
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)

### Related Tools
- [VibeMux](https://github.com/UgOrange/vibemux)
- [Crystal](https://github.com/stravu/crystal)
- [Vibe Kanban](https://www.vibekanban.com/)
- [Claude Code Usage Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor)

### Community Discussions
- [VibeCraft on Hacker News](https://news.ycombinator.com/item?id=45575842)
- [Awesome Claude Code Directory](https://awesomeclaude.ai/awesome-claude-code)

---

*Analysis completed: January 2026*
*VibeCraft version analyzed: v0.0.0 (Elysian Labs)*
