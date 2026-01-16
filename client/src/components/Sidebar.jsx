import React from 'react';

function formatTime(isoString) {
  if (!isoString) return '--:--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString();
}

function formatTimeAgo(isoString) {
  if (!isoString) return 'never';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function SessionCard({ session, isSelected, onClick }) {
  return (
    <div
      className={`session-card ${session.status} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="session-header">
        <span className="session-id">{session.id.slice(0, 12)}...</span>
        <span className={`session-status ${session.status}`}>
          {session.status}
        </span>
      </div>
      <div className="session-meta">
        <span>Tool calls: {session.toolCalls || 0}</span>
        <span>Last: {session.lastTool || 'none'}</span>
        <span>Active: {formatTimeAgo(session.lastActivity)}</span>
      </div>
    </div>
  );
}

function EventItem({ event }) {
  const getEventDetail = () => {
    if (event.tool_name === 'Write' || event.tool_name === 'Read' || event.tool_name === 'Edit') {
      return event.tool_input?.file_path?.split('/').pop() || '';
    }
    if (event.tool_name === 'Bash') {
      const cmd = event.tool_input?.command || '';
      return cmd.length > 40 ? cmd.slice(0, 40) + '...' : cmd;
    }
    if (event.tool_name === 'Grep' || event.tool_name === 'Glob') {
      return event.tool_input?.pattern || '';
    }
    return event.hook_event_name || '';
  };

  return (
    <div className="event-item">
      <span className="event-time">{formatTime(event.timestamp)}</span>
      <span className="event-tool">{event.tool_name || event.hook_event_name}</span>
      <span className="event-detail">{getEventDetail()}</span>
    </div>
  );
}

export default function Sidebar({
  connected,
  sessions,
  events,
  selectedSession,
  onSelectSession,
  activeSessions
}) {
  const filteredEvents = selectedSession
    ? events.filter(e => e.session_id === selectedSession)
    : events;

  return (
    <div className="sidebar">
      <div className="header">
        <h1>
          Claude Hive
        </h1>
        <span className={`status-badge ${connected ? '' : 'disconnected'}`}>
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{sessions.length}</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="stat">
          <span className="stat-value">{activeSessions}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat">
          <span className="stat-value">{events.length}</span>
          <span className="stat-label">Events</span>
        </div>
      </div>

      <div className="sessions-list">
        {sessions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            <p style={{ marginBottom: '8px' }}>No sessions yet</p>
            <p style={{ fontSize: '11px' }}>
              Start using Claude Code and events will appear here
            </p>
          </div>
        ) : (
          sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isSelected={session.id === selectedSession}
              onClick={() => onSelectSession(
                session.id === selectedSession ? null : session.id
              )}
            />
          ))
        )}
      </div>

      <div className="events-panel">
        <div className="events-header">
          {selectedSession ? `Events (${selectedSession.slice(0, 8)}...)` : 'All Events'}
        </div>
        <div className="events-list">
          {filteredEvents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '11px' }}>
              Waiting for events...
            </div>
          ) : (
            [...filteredEvents].reverse().slice(0, 50).map((event, i) => (
              <EventItem key={i} event={event} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
