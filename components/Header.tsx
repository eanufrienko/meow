import React from 'react';
import { Share2, Menu, Cloud, Play, Square, Code, AlertCircle, Globe, Users, Copy, Check } from 'lucide-react';
import { useStore } from '../services/store';
import { ObjectType } from '../types';

export const Header: React.FC = () => {
  const { isPlaying, setPlaying, isCodeOpen, setCodeOpen, selectedObjectId, objects, publishedUrl, publishWorld, collaborators } = useStore();
  const [copied, setCopied] = React.useState(false);

  const spawnPoints = objects.filter(o => o.type === ObjectType.SPAWN);
  const maxPlayers = spawnPoints.length;
  const currentPlayers = 1 + collaborators.length; // Host + peers

  const handleCopy = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full z-10 p-4 pointer-events-none">
      <div className="flex justify-between items-start pointer-events-auto">
        
        {/* Left: Branding */}
        <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-white/50 flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <Cloud className="text-white" size={20} />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-gray-800 leading-tight">CoCreate XR</h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Education Edition</p>
          </div>
        </div>

        {/* Center: Play Control */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-4 flex flex-col items-center gap-2">
           <button 
             onClick={() => maxPlayers > 0 && setPlaying(!isPlaying)}
             disabled={maxPlayers === 0 && !isPlaying}
             className={`
               ${maxPlayers === 0 && !isPlaying 
                  ? 'bg-gray-400 cursor-not-allowed opacity-80' 
                  : isPlaying 
                    ? 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95' 
                    : 'bg-green-500 hover:bg-green-600 hover:scale-105 active:scale-95'
               } 
               text-white px-8 py-2.5 rounded-full shadow-lg flex items-center gap-2 font-bold transition-all text-sm tracking-wide
             `}
           >
             {isPlaying ? <Square fill="currentColor" size={14} /> : <Play fill="currentColor" size={14} />}
             {isPlaying ? "STOP" : "PLAY SCENE"}
           </button>
           
           {maxPlayers === 0 && !isPlaying && (
             <div className="bg-black/80 text-white text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm animate-bounce shadow-lg">
               <AlertCircle size={12} className="text-yellow-400"/>
               <span>Add a <b>Spawn Point</b> to play</span>
             </div>
           )}

            {/* Multiplayer Status (Visible when Published) */}
            {publishedUrl && (
              <div className="bg-white/90 backdrop-blur text-gray-700 text-[10px] px-3 py-1 rounded-full shadow-sm border border-white/50 flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${currentPlayers <= maxPlayers ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 <Users size={10} />
                 <span>{currentPlayers} / {maxPlayers} Players</span>
              </div>
            )}
        </div>

        {/* Right: Actions */}
        <div className="flex gap-3 items-start">
          
          {/* Publish Button / Link */}
          {!isPlaying && (
            <>
              {!publishedUrl ? (
                <button 
                  onClick={publishWorld}
                  disabled={maxPlayers === 0}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-full shadow-md font-semibold text-sm transition-all
                    ${maxPlayers === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}
                  `}
                >
                  <Globe size={16} />
                  <span>Publish</span>
                </button>
              ) : (
                <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                   <div className="px-4 py-2 border-b border-gray-100 bg-blue-50/50 flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                        <Globe size={12}/> LIVE
                      </span>
                      <span className="text-[10px] text-blue-600/70 uppercase font-semibold tracking-wider">Read-Only Link</span>
                   </div>
                   <div className="p-2 flex gap-1">
                      <input 
                        readOnly 
                        value={publishedUrl} 
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1.5 rounded border-none w-32 outline-none"
                      />
                      <button 
                        onClick={handleCopy}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                        title="Copy Link"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                   </div>
                </div>
              )}
            </>
          )}

          {selectedObjectId && !isPlaying && (
            <button 
              onClick={() => setCodeOpen(!isCodeOpen)}
              className={`${isCodeOpen ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-500' : 'bg-white text-gray-700'} hover:bg-indigo-50 px-4 py-2.5 rounded-full shadow-md transition flex items-center gap-2 font-semibold`}
            >
              <Code size={20} />
              <span className="hidden sm:inline">Code</span>
            </button>
          )}

          <button className="bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-full shadow-md transition">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
