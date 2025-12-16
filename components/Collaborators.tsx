import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../services/store';
import { Html } from '@react-three/drei';
import { Vector3 } from 'three';

export const Collaborators: React.FC = () => {
  const collaborators = useStore((state) => state.collaborators);
  const updateCursor = useStore((state) => state.updateCollaboratorCursor);

  // Simulate movement for liveness
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    collaborators.forEach((c, i) => {
       // Simple Lissajous curve for fake movement
       const x = Math.sin(time * 0.5 + i) * 3;
       const z = Math.cos(time * 0.3 + i * 2) * 3;
       updateCursor(c.id, [x, 1, z]);
    });
  });

  return (
    <group>
      {collaborators.map((user) => (
        <group key={user.id} position={user.cursorPosition ? new Vector3(...user.cursorPosition) : [0,0,0]}>
          {/* Avatar Body */}
          <mesh castShadow position={[0, 0, 0]}>
             <sphereGeometry args={[0.3, 16, 16]} />
             <meshStandardMaterial color={user.color} />
          </mesh>
          {/* Name Tag */}
          <Html position={[0, 0.5, 0]} center>
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap backdrop-blur-sm">
              {user.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
};
