import React from 'react';
import { Box, Circle, Cylinder, Info, MapPin } from 'lucide-react';
import { useStore } from '../services/store';
import { ObjectType } from '../types';

export const Toolbar: React.FC = () => {
  const addObject = useStore((state) => state.addObject);

  const tools = [
    { icon: MapPin, label: 'Spawn Point', type: ObjectType.SPAWN },
    { icon: Box, label: 'Cube', type: ObjectType.CUBE },
    { icon: Circle, label: 'Sphere', type: ObjectType.SPHERE },
    { icon: Cylinder, label: 'Cylinder', type: ObjectType.CYLINDER },
  ];

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-xl flex flex-col gap-4 border border-white/50">
      {tools.map((tool) => (
        <button
          key={tool.label}
          onClick={() => addObject(tool.type)}
          className={`group relative p-3 rounded-lg transition-all ${tool.type === ObjectType.SPAWN ? 'hover:bg-green-100 text-green-700' : 'hover:bg-indigo-100 text-gray-700 hover:text-indigo-600'}`}
          title={`Add ${tool.label}`}
        >
          <tool.icon size={24} />
          <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition whitespace-nowrap z-50">
            {tool.label}
          </span>
        </button>
      ))}
      <div className="h-px bg-gray-300 my-1" />
      <button 
        className="p-3 rounded-lg hover:bg-indigo-100 text-gray-700 transition"
        title="Help"
        onClick={() => alert("Drag to rotate. Shift+Drag to pan. Scroll to zoom. Click objects to select. Place a Spawn Point to play!")}
      >
        <Info size={24} />
      </button>
    </div>
  );
};
