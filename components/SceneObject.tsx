import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3, MathUtils, Color, DoubleSide } from 'three';
import { ISceneObject, ObjectType, IBlock } from '../types';
import { useStore } from '../services/store';
import { Html } from '@react-three/drei';
import { MapPin } from 'lucide-react';

interface SceneObjectProps {
  data: ISceneObject;
  isSelected: boolean;
  onSelect: (e: any) => void;
}

// Helper to interpolate values
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

// Execution Context for a running script
type ScriptContext = {
  stack: { block: IBlock; index: number; loopCounter?: number }[]; 
  waitEndTime: number; 
  action?: { 
    type: 'MOVE' | 'ROTATE' | 'SCALE';
    startVal: any;
    targetVal: any;
    startTime: number;
    duration: number;
  };
  running: boolean;
};

export const SceneObject: React.FC<SceneObjectProps> = ({ data, isSelected, onSelect }) => {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isPlaying = useStore(state => state.isPlaying);
  
  // Script States
  const contexts = useRef<Map<string, ScriptContext>>(new Map());

  // Initialize scripts on Play
  useEffect(() => {
    if (isPlaying) {
      contexts.current.clear();
      data.scripts.forEach(script => {
        const startBlocks = script.blocks.filter(b => b.type === 'EVENT_START');
        if (startBlocks.length > 0) {
           contexts.current.set(script.id, {
             stack: [{ block: startBlocks[0], index: 0 }],
             waitEndTime: 0,
             running: true
           });
        }
      });
    } else {
      contexts.current.clear();
    }
  }, [isPlaying, data.scripts]);

  const handleEventTrigger = (eventType: 'EVENT_ON_CLICK') => {
    if (!isPlaying) return;
    data.scripts.forEach(script => {
      const eventBlock = script.blocks.find(b => b.type === eventType);
      if (eventBlock) {
        contexts.current.set(script.id, {
          stack: [{ block: eventBlock, index: 0 }],
          waitEndTime: 0,
          running: true
        });
      }
    });
  };

  // --- GAME LOOP ---
  useFrame((state, delta) => {
    if (!meshRef.current || data.locked) return;

    if (!isPlaying) {
      // Preview AI behaviors in Edit Mode
      data.behaviors.forEach(behavior => {
        if (behavior.type === 'SPIN') {
           const speed = Number(behavior.parameters.speed || 1);
           const axis = String(behavior.parameters.axis || 'y');
           if (axis === 'y') meshRef.current!.rotation.y += speed * delta;
        }
      });
      return;
    }

    // Process Scripts
    const time = state.clock.elapsedTime;
    contexts.current.forEach((ctx) => {
      if (!ctx.running || ctx.stack.length === 0) return;
      if (time < ctx.waitEndTime) return;

      if (ctx.action) {
        const elapsed = time - ctx.action.startTime;
        const t = Math.min(elapsed / ctx.action.duration, 1);
        const easeT = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; 

        if (ctx.action.type === 'MOVE') {
           const s = ctx.action.startVal as Vector3;
           const e = ctx.action.targetVal as Vector3;
           meshRef.current!.position.lerpVectors(s, e, easeT);
        } else if (ctx.action.type === 'ROTATE') {
           const s = ctx.action.startVal as Vector3;
           const e = ctx.action.targetVal as Vector3;
           meshRef.current!.rotation.set(
             lerp(s.x, e.x, easeT), 
             lerp(s.y, e.y, easeT), 
             lerp(s.z, e.z, easeT)
           );
        } else if (ctx.action.type === 'SCALE') {
           const s = ctx.action.startVal as number;
           const e = ctx.action.targetVal as number;
           const current = lerp(s, e, easeT);
           meshRef.current!.scale.set(current, current, current);
        }

        if (t >= 1) ctx.action = undefined;
        else return;
      }

      let instructionsProcessed = 0;
      const MAX_INSTRUCTIONS = 20;

      while (ctx.stack.length > 0 && instructionsProcessed < MAX_INSTRUCTIONS && !ctx.action && time >= ctx.waitEndTime) {
        instructionsProcessed++;
        const frame = ctx.stack[ctx.stack.length - 1]; 
        
        if (!frame.block.children || frame.index >= frame.block.children.length) {
          ctx.stack.pop();
          if (frame.block.type === 'CONTROL_FOREVER') {
             ctx.stack.push({ block: frame.block, index: 0 });
             instructionsProcessed = MAX_INSTRUCTIONS; 
          } else if (frame.block.type === 'CONTROL_REPEAT') {
             const limit = frame.block.parameters.times || 1;
             const current = frame.loopCounter || 0;
             if (current + 1 < limit) {
                ctx.stack.push({ block: frame.block, index: 0, loopCounter: current + 1 });
                instructionsProcessed = MAX_INSTRUCTIONS;
             }
          }
          continue;
        }

        const currentBlock = frame.block.children[frame.index];
        frame.index++; 

        if (currentBlock.type.startsWith('CONTROL_')) {
           if (currentBlock.type === 'CONTROL_WAIT') {
              ctx.waitEndTime = time + (currentBlock.parameters.duration || 1);
              break; 
           } 
           else if (currentBlock.type === 'CONTROL_FOREVER' || currentBlock.type === 'CONTROL_REPEAT') {
              ctx.stack.push({ block: currentBlock, index: 0, loopCounter: 0 });
           }
        }
        else if (currentBlock.type.startsWith('ACTION_')) {
           if (currentBlock.type === 'ACTION_COLOR') {
              const c = new Color(currentBlock.parameters.color || '#fff');
              (meshRef.current!.material as any).color.set(c);
           }
           else if (currentBlock.type === 'ACTION_SCALE') {
              const targetS = currentBlock.parameters.scale || 1;
              const duration = currentBlock.parameters.duration || 0;
              if (duration > 0) {
                 ctx.action = {
                   type: 'SCALE',
                   startVal: meshRef.current!.scale.x,
                   targetVal: targetS,
                   startTime: time,
                   duration: duration
                 };
                 break;
              } else {
                 meshRef.current!.scale.set(targetS, targetS, targetS);
              }
           }
           else if (currentBlock.type === 'ACTION_MOVE') {
              const dist = currentBlock.parameters.distance || 0;
              const axis = currentBlock.parameters.axis || 'z';
              const duration = currentBlock.parameters.duration || 0;
              
              const moveVec = new Vector3();
              if (axis === 'x') moveVec.setX(dist);
              if (axis === 'y') moveVec.setY(dist);
              if (axis === 'z') moveVec.setZ(dist);
              moveVec.applyEuler(meshRef.current!.rotation);
              const targetPos = meshRef.current!.position.clone().add(moveVec);

              if (duration > 0) {
                 ctx.action = {
                   type: 'MOVE',
                   startVal: meshRef.current!.position.clone(),
                   targetVal: targetPos,
                   startTime: time,
                   duration: duration
                 };
                 break;
              } else {
                 meshRef.current!.position.copy(targetPos);
              }
           }
           else if (currentBlock.type === 'ACTION_ROTATE') {
              const angle = MathUtils.degToRad(currentBlock.parameters.angle || 90);
              const axis = currentBlock.parameters.axis || 'y';
              const duration = currentBlock.parameters.duration || 0;
              const startRot = new Vector3(meshRef.current!.rotation.x, meshRef.current!.rotation.y, meshRef.current!.rotation.z);
              const targetRot = startRot.clone();
              if (axis === 'x') targetRot.x += angle;
              if (axis === 'y') targetRot.y += angle;
              if (axis === 'z') targetRot.z += angle;

              if (duration > 0) {
                 ctx.action = {
                   type: 'ROTATE',
                   startVal: startRot,
                   targetVal: targetRot,
                   startTime: time,
                   duration: duration
                 };
                 break;
              } else {
                 meshRef.current!.rotation.set(targetRot.x, targetRot.y, targetRot.z);
              }
           }
        }
      }
    });
  });

  const materialColor = (isSelected && !isPlaying) ? '#ff9f1c' : hovered && !isPlaying ? '#a5b4fc' : data.color;

  const renderGeometry = () => {
    switch (data.type) {
      case ObjectType.CUBE: return <boxGeometry args={[1, 1, 1]} />;
      case ObjectType.SPHERE: return <sphereGeometry args={[0.5, 32, 32]} />;
      case ObjectType.CYLINDER: return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case ObjectType.PLANE: return <planeGeometry args={[1, 1]} />;
      case ObjectType.SPAWN: return <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />; // Flat pad
      default: return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <group position={data.position} rotation={data.rotation} scale={data.scale}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          if (isPlaying) {
            handleEventTrigger('EVENT_ON_CLICK');
          } else {
            onSelect(e);
          }
        }}
        onPointerOver={() => !isPlaying && setHovered(true)}
        onPointerOut={() => !isPlaying && setHovered(false)}
        castShadow={true} // Even spawn points cast shadows now (solid)
        receiveShadow
        // Spawn points are always visible as physical pads
      >
        {renderGeometry()}
        
        {/* Material Logic */}
        {data.type === ObjectType.SPAWN ? (
          <meshStandardMaterial 
            color="#333" 
            roughness={0.2} 
            metalness={0.8}
            emissive="#10b981"
            emissiveIntensity={0.2}
          />
        ) : (
          <meshStandardMaterial 
            color={materialColor}
            roughness={0.5}
            metalness={0.1}
          />
        )}

        {isSelected && !isPlaying && (
          <lineSegments>
            <edgesGeometry args={[meshRef.current?.geometry]} />
            <lineBasicMaterial color="white" />
          </lineSegments>
        )}
      </mesh>
      
      {/* Visual Decor for Spawn Point (Rings) */}
      {data.type === ObjectType.SPAWN && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
           <ringGeometry args={[0.3, 0.4, 32]} />
           <meshBasicMaterial color="#10b981" transparent opacity={0.5} side={DoubleSide} />
        </mesh>
      )}

      {/* Spawn Indicator Icon (Only in Edit Mode) */}
      {data.type === ObjectType.SPAWN && !isPlaying && (
         <Html position={[0, 1.5, 0]} center distanceFactor={10}>
            <div className="bg-green-600/90 text-white p-2 rounded-full animate-bounce shadow-lg backdrop-blur-sm border border-green-400">
               <MapPin size={24} fill="white" />
            </div>
         </Html>
      )}
    </group>
  );
};
