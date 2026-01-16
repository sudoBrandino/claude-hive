import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

// Hexagon geometry helper
function createHexagonGeometry(radius, height) {
  const shape = new THREE.Shape();
  const sides = 6;

  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();

  const extrudeSettings = {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

// Convert axial coordinates to world position
function axialToWorld(q, r, radius) {
  const x = radius * (3 / 2 * q);
  const z = radius * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
  return [x, 0, z];
}

// Generate hex grid positions
function generateHexPositions(count, radius) {
  const positions = [];
  const rings = Math.ceil(Math.sqrt(count));

  let index = 0;
  for (let ring = 0; ring <= rings && index < count; ring++) {
    if (ring === 0) {
      positions.push({ q: 0, r: 0 });
      index++;
    } else {
      // Generate positions in hexagonal ring
      let q = ring;
      let r = 0;

      const directions = [
        [-1, 1], [-1, 0], [0, -1], [1, -1], [1, 0], [0, 1]
      ];

      for (let side = 0; side < 6 && index < count; side++) {
        for (let step = 0; step < ring && index < count; step++) {
          positions.push({ q, r });
          index++;
          q += directions[side][0];
          r += directions[side][1];
        }
      }
    }
  }

  return positions.slice(0, count).map(({ q, r }) => axialToWorld(q, r, radius * 1.8));
}

// Status to color mapping
const STATUS_COLORS = {
  active: '#4aff9f',
  waiting: '#ffda4a',
  idle: '#444455'
};

// Single hexagon cell component
function HexCell({ position, session, isSelected, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();

  const color = STATUS_COLORS[session?.status] || STATUS_COLORS.idle;
  const height = session?.status === 'active' ? 1.5 : 0.5;

  // Animation
  useFrame((state) => {
    if (meshRef.current && session?.status === 'active') {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  const geometry = useMemo(() => createHexagonGeometry(1, height), [height]);

  if (!session) {
    // Empty hex placeholder
    return (
      <group position={position}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[0.8, 1, 6]} />
          <meshBasicMaterial color="#1a1a25" transparent opacity={0.5} />
        </mesh>
      </group>
    );
  }

  return (
    <group position={position} onClick={onClick}>
      {/* Main hexagon */}
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={session.status === 'active' ? 0.3 : 0.1}
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Glow effect for active sessions */}
      {session.status === 'active' && (
        <mesh ref={glowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 0.1, 0]}>
          <circleGeometry args={[1.5, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 0.2, 0]}>
          <ringGeometry args={[1.1, 1.3, 6]} />
          <meshBasicMaterial color="#4a9eff" />
        </mesh>
      )}

      {/* Session ID label */}
      <Text
        position={[0, height + 0.8, 0]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {session.id.slice(0, 8)}
      </Text>

      {/* Tool indicator */}
      {session.lastTool && (
        <Text
          position={[0, height + 0.4, 0]}
          fontSize={0.2}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          {session.lastTool}
        </Text>
      )}
    </group>
  );
}

export default function HexGrid({ sessions, selectedSession, onSelectSession }) {
  // Generate grid positions for up to 19 cells (3 rings)
  const maxCells = Math.max(19, sessions.length);
  const positions = useMemo(() => generateHexPositions(maxCells, 1), [maxCells]);

  return (
    <group>
      {positions.map((pos, index) => (
        <HexCell
          key={index}
          position={pos}
          session={sessions[index]}
          isSelected={sessions[index]?.id === selectedSession}
          onClick={() => sessions[index] && onSelectSession(sessions[index].id)}
        />
      ))}
    </group>
  );
}
