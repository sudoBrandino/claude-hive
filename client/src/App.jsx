import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import HexGrid from './components/HexGrid';
import Sidebar from './components/Sidebar';

const WS_URL = `ws://${window.location.hostname}:4520`;

export default function App() {
  const [connected, setConnected] = useState(false);
  const [sessions, setSessions] = useState({});
  const [events, setEvents] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('[Hive] Connected to server');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'init') {
          setSessions(message.sessions || {});
          setEvents(message.recentEvents || []);
        } else if (message.type === 'event') {
          setEvents(prev => [...prev.slice(-199), message.event]);
          if (message.session) {
            setSessions(prev => ({
              ...prev,
              [message.session.id]: message.session
            }));
          }
        }
      } catch (err) {
        console.error('[Hive] Failed to parse message:', err);
      }
    };

    ws.onclose = () => {
      console.log('[Hive] Disconnected');
      setConnected(false);
      // Reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = (err) => {
      console.error('[Hive] WebSocket error:', err);
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sessionArray = Object.values(sessions);
  const activeSessions = sessionArray.filter(s => s.status === 'active').length;

  return (
    <div className="app">
      <div className="canvas-container">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 15, 20]} fov={50} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={5}
            maxDistance={50}
          />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 20, 10]} intensity={1} />
          <pointLight position={[-10, 20, -10]} intensity={0.5} color="#4a9eff" />

          {/* Grid floor */}
          <gridHelper args={[50, 50, '#1a1a25', '#1a1a25']} position={[0, -0.5, 0]} />

          {/* Hexagonal grid of sessions */}
          <HexGrid
            sessions={sessionArray}
            selectedSession={selectedSession}
            onSelectSession={setSelectedSession}
          />
        </Canvas>

        {/* Connection status overlay */}
        <div className="connection-overlay">
          <div className={`pulse ${connected ? '' : 'disconnected'}`} />
          <span>{connected ? 'Connected' : 'Connecting...'}</span>
        </div>
      </div>

      <Sidebar
        connected={connected}
        sessions={sessionArray}
        events={events}
        selectedSession={selectedSession}
        onSelectSession={setSelectedSession}
        activeSessions={activeSessions}
      />
    </div>
  );
}
