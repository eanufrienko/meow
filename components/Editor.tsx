import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, GridHelper, Environment, ContactShadows } from '@react-three/drei';
import { XR, createXRStore } from '@react-three/xr';
import { useStore } from '../services/store';
import { SceneObject } from './SceneObject';
import { Collaborators } from './Collaborators';
import { PlayerController } from './PlayerController';
import { ObjectType, Vector3Array, EulerArray } from '../types';

const store = createXRStore();

export const Editor: React.FC = () => {
  const { objects, selectedObjectId, selectObject, updateObject, environmentColor, isPlaying } = useStore();
  
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  const handleTransformEnd = (e: any) => {
    if (selectedObject && e.target && e.target.object) {
      const obj = e.target.object;
      updateObject(selectedObject.id, {
        position: [obj.position.x, obj.position.y, obj.position.z] as Vector3Array,
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z] as EulerArray,
        scale: [obj.scale.x, obj.scale.y, obj.scale.z] as Vector3Array
      });
    }
  };

  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas 
        shadows 
        camera={{ position: [5, 5, 5], fov: 50 }}
        onPointerMissed={(e) => {
          // Deselect if clicking on background (not an object)
          // Only in edit mode
          if (!isPlaying) {
             selectObject(null);
          }
        }}
      >
        <XR store={store}>
          <color attach="background" args={[environmentColor]} />
          
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            castShadow 
            shadow-mapSize={[1024, 1024]} 
          />
          
          <group>
            {objects.map((obj) => (
              <SceneObject 
                key={obj.id} 
                data={obj} 
                isSelected={selectedObjectId === obj.id}
                onSelect={(e) => {
                  e.stopPropagation();
                  selectObject(obj.id);
                }}
              />
            ))}
            
            {/* Edit Mode Gizmos */}
            {!isPlaying && selectedObject && !selectedObject.locked && (
              <TransformControls 
                object={undefined} 
                position={[selectedObject.position[0], selectedObject.position[1], selectedObject.position[2]]}
                rotation={[selectedObject.rotation[0], selectedObject.rotation[1], selectedObject.rotation[2]]}
                mode="translate"
                onMouseUp={handleTransformEnd}
              />
            )}
            
            <Collaborators />
            
            <ContactShadows opacity={0.5} scale={20} blur={2} far={4.5} />
            <gridHelper args={[20, 20, '#6b7280', '#e5e7eb']} position={[0, -0.51, 0]} />
            
            {/* Play Mode Controller */}
            {isPlaying && <PlayerController objects={objects} />}
          </group>
          
          {/* Edit Mode Camera */}
          {!isPlaying && <OrbitControls makeDefault />}
        </XR>
      </Canvas>
      
      {/* Play Mode Instructions Overlay */}
      {isPlaying && (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 text-white/50 text-xs pointer-events-none text-center">
           {!('ontouchstart' in window) && <p>Click to capture mouse. WASD to Move. ESC to unlock.</p>}
        </div>
      )}

      {/* XR Buttons Overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4 pointer-events-none">
         <button onClick={() => store.enterAR()} className="pointer-events-auto bg-white/90 text-black px-4 py-2 rounded-full font-bold shadow-lg hover:bg-white transition">
           Enter AR
         </button>
         <button onClick={() => store.enterVR()} className="pointer-events-auto bg-indigo-600/90 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-600 transition">
           Enter VR
         </button>
      </div>
    </div>
  );
};
