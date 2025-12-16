import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

export const TouchControls: React.FC = () => {
  // We simulate Key Events so the PlayerController picks them up without complex state sharing
  const triggerKey = (code: string, type: 'keydown' | 'keyup') => {
    const event = new KeyboardEvent(type, { code, bubbles: true });
    document.dispatchEvent(event);
  };

  const btnClass = "w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white active:bg-white/40 active:scale-95 transition touch-none select-none";

  const bind = (code: string) => ({
    onPointerDown: (e: any) => { e.preventDefault(); triggerKey(code, 'keydown'); },
    onPointerUp: (e: any) => { e.preventDefault(); triggerKey(code, 'keyup'); },
    onPointerLeave: (e: any) => { e.preventDefault(); triggerKey(code, 'keyup'); }
  });

  if (!('ontouchstart' in window) && !navigator.maxTouchPoints) return null; // Hide on desktop

  return (
    <div className="absolute bottom-8 left-8 z-50 flex flex-col items-center gap-2">
      <div {...bind('KeyW')} className={btnClass}><ArrowUp size={24}/></div>
      <div className="flex gap-2">
         <div {...bind('KeyA')} className={btnClass}><ArrowLeft size={24}/></div>
         <div {...bind('KeyS')} className={btnClass}><ArrowDown size={24}/></div>
         <div {...bind('KeyD')} className={btnClass}><ArrowRight size={24}/></div>
      </div>
    </div>
  );
};
