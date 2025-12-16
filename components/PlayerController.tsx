import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { PointerLockControls } from '@react-three/drei';
import { ISceneObject, ObjectType } from '../types';
import { useStore } from '../services/store';

interface PlayerControllerProps {
  objects: ISceneObject[];
}

export const PlayerController: React.FC<PlayerControllerProps> = ({ objects }) => {
  const { camera } = useThree();
  const playerIndex = useStore(state => state.playerIndex);
  const controlsRef = useRef<any>(null);
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  // Spawn Logic
  useEffect(() => {
    // Find all spawn points
    const spawnPoints = objects.filter(o => o.type === ObjectType.SPAWN);
    
    if (spawnPoints.length > 0) {
       // Determine which spawn point to use based on player index
       // If playerIndex is 0 (Host), use Spawn 0. If 1, use Spawn 1. Wrap around if more players than spawns.
       const spawnIndex = playerIndex % spawnPoints.length;
       const spawn = spawnPoints[spawnIndex];

       if (spawn) {
          // Teleport Camera
          // Y + 1.6 simulates average eye height
          camera.position.set(spawn.position[0], spawn.position[1] + 1.6, spawn.position[2]);
          
          // Set Rotation (convert Euler array to rotation)
          camera.rotation.set(spawn.rotation[0], spawn.rotation[1], spawn.rotation[2]);
       }
    }
  }, [objects, camera, playerIndex]);

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.current.forward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.current.left = true; break;
        case 'ArrowDown':
        case 'KeyS': moveState.current.backward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveState.current.right = true; break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.current.forward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.current.left = false; break;
        case 'ArrowDown':
        case 'KeyS': moveState.current.backward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveState.current.right = false; break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Movement Loop
  useFrame((state, delta) => {
    if (!controlsRef.current?.isLocked && !('ontouchstart' in window)) return;

    const speed = 5.0 * delta;
    const direction = new Vector3();
    const frontVector = new Vector3(
      0,
      0,
      Number(moveState.current.backward) - Number(moveState.current.forward)
    );
    const sideVector = new Vector3(
      Number(moveState.current.left) - Number(moveState.current.right),
      0,
      0
    );

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)
      .applyEuler(camera.rotation);

    const nextPos = camera.position.clone().add(direction);
    
    // Basic Ground Collision (stay above y=1.6)
    // To strictly support "Spawn Points have physics", we should check if we are standing on them.
    // For MVP, we assume global floor at y=0, eye height 1.6.
    if (nextPos.y < 1.6) nextPos.y = 1.6;

    camera.position.copy(nextPos);
  });
  
  return (
    <PointerLockControls ref={controlsRef} />
  );
};
