import { WebSocketServer } from 'ws';
import express from 'express';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 4520;
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// In-memory storage for sessions and events
const sessions = new Map();
const events = [];
const MAX_EVENTS = 10000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '../client/dist')));

// Track connected WebSocket clients
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Hive] Client connected (${clients.size} total)`);

  // Send current state to new client
  ws.send(JSON.stringify({
    type: 'init',
    sessions: Object.fromEntries(sessions),
    recentEvents: events.slice(-100)
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Hive] Client disconnected (${clients.size} total)`);
  });

  ws.on('error', (err) => {
    console.error('[Hive] WebSocket error:', err.message);
  });
});

// Broadcast to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  }
}

// Receive hook events from Claude Code
app.post('/events', (req, res) => {
  const event = {
    ...req.body,
    receivedAt: new Date().toISOString()
  };

  // Store event
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.shift();
  }

  // Update session state
  const sessionId = event.session_id || 'unknown';
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      toolCalls: 0,
      status: 'active',
      project: event.project_dir || 'unknown'
    });
  }

  const session = sessions.get(sessionId);
  session.lastActivity = new Date().toISOString();
  session.toolCalls++;
  session.lastTool = event.tool_name;
  session.status = getSessionStatus(event);

  // Broadcast to clients
  broadcast({
    type: 'event',
    event,
    session
  });

  res.json({ ok: true });
});

// Get session status from event
function getSessionStatus(event) {
  if (event.hook_event_name === 'Stop') return 'idle';
  if (event.hook_event_name === 'Notification') {
    if (event.tool_name === 'permission_prompt') return 'waiting';
    if (event.tool_name === 'idle_prompt') return 'idle';
  }
  return 'active';
}

// API endpoints
app.get('/api/sessions', (req, res) => {
  res.json(Object.fromEntries(sessions));
});

app.get('/api/events', (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const sessionId = req.query.session;

  let filtered = events;
  if (sessionId) {
    filtered = events.filter(e => e.session_id === sessionId);
  }

  res.json(filtered.slice(-limit));
});

app.get('/api/stats', (req, res) => {
  const toolCounts = {};
  const eventCounts = {};

  for (const event of events) {
    toolCounts[event.tool_name] = (toolCounts[event.tool_name] || 0) + 1;
    eventCounts[event.hook_event_name] = (eventCounts[event.hook_event_name] || 0) + 1;
  }

  res.json({
    totalSessions: sessions.size,
    totalEvents: events.length,
    activeSessions: [...sessions.values()].filter(s => s.status === 'active').length,
    toolCounts,
    eventCounts
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: clients.size, sessions: sessions.size });
});

// Serve client for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'));
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🐝 Claude Hive - Agent Visualization Server         ║
║                                                       ║
║   Dashboard:  http://localhost:${PORT}                  ║
║   WebSocket:  ws://localhost:${PORT}                    ║
║   Events:     POST http://localhost:${PORT}/events      ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`);
});
