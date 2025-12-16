import React from 'react';
import { Editor } from './components/Editor';
import { Toolbar } from './components/Toolbar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Header } from './components/Header';
import { CoBlocksEditor } from './components/CoBlocksEditor';
import { TouchControls } from './components/TouchControls';
import { useStore } from './services/store';

const App: React.FC = () => {
  const { isPlaying, isCodeOpen } = useStore();

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden font-sans">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Editor />
      </div>

      {/* UI Overlay Layer */}
      <Header />
      
      {!isPlaying && (
        <>
          <Toolbar />
          
          {/* Conditional Right Panel */}
          {isCodeOpen ? <CoBlocksEditor /> : <PropertiesPanel />}
        </>
      )}

      {/* Play Mode Overlay */}
      {isPlaying && (
        <>
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-1 rounded-full text-xs font-mono pointer-events-none backdrop-blur-sm">
             PLAY MODE ACTIVE
          </div>
          <TouchControls />
        </>
      )}
    </div>
  );
};

export default App;
