import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Play, Repeat, Move, Rotate3D, Box, Plus, Trash, X, Clock, MousePointer, Expand, Palette, GitBranch, ArrowRight, ZoomIn, ZoomOut } from 'lucide-react';
import { IBlock, BlockType } from '../types';

export const CoBlocksEditor: React.FC = () => {
  const { objects, selectedObjectId, setCodeOpen, addScript, addBlockToScript, updateBlockParameters, removeBlockFromScript } = useStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const [zoom, setZoom] = useState(1);

  if (!selectedObject) return null;

  const handleAddBlock = (scriptId: string, type: BlockType, parentId?: string) => {
    addBlockToScript(selectedObject.id, scriptId, type, parentId);
  };

  const handleParamChange = (scriptId: string, blockId: string, key: string, value: any) => {
    updateBlockParameters(selectedObject.id, scriptId, blockId, { [key]: value });
  };

  const onDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('blockType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const onDrop = (e: React.DragEvent, scriptId: string, parentId?: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent containers
    const type = e.dataTransfer.getData('blockType') as BlockType;
    if (type) {
      handleAddBlock(scriptId, type, parentId);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // --- Render Functions ---

  const renderSidebarItem = (type: BlockType, label: string, icon: React.ReactNode, colorClass: string) => (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, type)}
      className={`flex items-center gap-2 p-3 mb-2 rounded-lg cursor-grab active:cursor-grabbing text-white text-xs font-bold shadow-sm hover:shadow-md hover:scale-[1.02] transition-all ${colorClass}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );

  const renderBlock = (block: IBlock, scriptId: string) => {
    const isContainer = ['CONTROL_FOREVER', 'CONTROL_REPEAT', 'CONTROL_IF', 'EVENT_START', 'EVENT_ON_CLICK'].includes(block.type);
    
    let style = { bg: 'bg-gray-500', border: 'border-gray-600', icon: <Box size={16} /> };
    
    switch (block.type) {
      case 'EVENT_START': style = { bg: 'bg-yellow-500', border: 'border-yellow-600', icon: <Play size={16} /> }; break;
      case 'EVENT_ON_CLICK': style = { bg: 'bg-yellow-600', border: 'border-yellow-700', icon: <MousePointer size={16} /> }; break;
      case 'CONTROL_FOREVER': style = { bg: 'bg-orange-500', border: 'border-orange-600', icon: <Repeat size={16} /> }; break;
      case 'CONTROL_REPEAT': style = { bg: 'bg-orange-500', border: 'border-orange-600', icon: <Repeat size={16} /> }; break;
      case 'CONTROL_WAIT': style = { bg: 'bg-orange-400', border: 'border-orange-500', icon: <Clock size={16} /> }; break;
      case 'CONTROL_IF': style = { bg: 'bg-orange-500', border: 'border-orange-600', icon: <GitBranch size={16} /> }; break;
      case 'ACTION_MOVE': style = { bg: 'bg-indigo-500', border: 'border-indigo-600', icon: <Move size={16} /> }; break;
      case 'ACTION_ROTATE': style = { bg: 'bg-blue-500', border: 'border-blue-600', icon: <Rotate3D size={16} /> }; break;
      case 'ACTION_SCALE': style = { bg: 'bg-purple-500', border: 'border-purple-600', icon: <Expand size={16} /> }; break;
      case 'ACTION_COLOR': style = { bg: 'bg-pink-500', border: 'border-pink-600', icon: <Palette size={16} /> }; break;
    }

    const inputClass = "bg-white text-gray-900 text-sm px-2 py-1 rounded-md shadow-sm border-0 focus:ring-2 focus:ring-white/50 outline-none min-w-[3rem] text-center font-bold font-mono";
    const selectClass = "bg-white text-gray-900 text-sm pl-2 pr-6 py-1 rounded-md shadow-sm border-0 focus:ring-2 focus:ring-white/50 outline-none cursor-pointer font-bold appearance-none";
    const labelClass = "text-[11px] uppercase tracking-wider font-semibold opacity-90";

    return (
      <div key={block.id} className="relative w-full mb-1 group/block">
        {/* Block Header */}
        <div className={`
          ${style.bg} text-white px-3 py-2.5 shadow-sm 
          flex flex-wrap items-center gap-3 min-w-[200px] 
          ${isContainer ? 'rounded-t-xl rounded-br-xl' : 'rounded-xl'}
          border-b border-white/10 transition-transform
        `}>
          <div className="flex items-center gap-2 text-xs font-bold font-mono whitespace-nowrap mr-2">
            {style.icon}
            {/* Friendly Name Logic */}
            <span className="text-sm">
              {block.type === 'EVENT_START' && "When Play Clicked"}
              {block.type === 'EVENT_ON_CLICK' && "When Clicked"}
              {block.type === 'CONTROL_FOREVER' && "Forever"}
              {block.type === 'CONTROL_REPEAT' && "Repeat"}
              {block.type === 'CONTROL_WAIT' && "Wait"}
              {block.type === 'CONTROL_IF' && "If"}
              {block.type === 'ACTION_MOVE' && "Move"}
              {block.type === 'ACTION_ROTATE' && "Turn"}
              {block.type === 'ACTION_SCALE' && "Set Scale to"}
              {block.type === 'ACTION_COLOR' && "Set Color to"}
            </span>
          </div>
          
          {/* Parameters */}
          <div className="flex-1 flex flex-wrap gap-2 items-center" onClick={(e) => e.stopPropagation()}>
             {block.type === 'CONTROL_REPEAT' && (
                <>
                   <input 
                     type="number" className={inputClass}
                     value={block.parameters.times} onChange={(e) => handleParamChange(scriptId, block.id, 'times', parseFloat(e.target.value))} 
                   />
                   <span className={labelClass}>times</span>
                </>
             )}
             
             {block.type === 'CONTROL_WAIT' && (
                <>
                  <input type="number" className={inputClass} value={block.parameters.duration} onChange={(e) => handleParamChange(scriptId, block.id, 'duration', parseFloat(e.target.value))} />
                  <span className={labelClass}>seconds</span>
                </>
             )}
             
             {block.type === 'ACTION_MOVE' && (
                <div className="flex items-center gap-2 bg-black/10 px-2 py-1 rounded-lg">
                   <select className={selectClass} value={block.parameters.axis} onChange={(e) => handleParamChange(scriptId, block.id, 'axis', e.target.value)}>
                     <option value="z">Forward</option><option value="x">Right</option><option value="y">Up</option>
                   </select>
                   <ArrowRight size={12} className="opacity-50" />
                   <input type="number" className={inputClass} value={block.parameters.distance} onChange={(e) => handleParamChange(scriptId, block.id, 'distance', parseFloat(e.target.value))} />
                   <span className={labelClass}>m</span>
                   <div className="w-px h-4 bg-white/20 mx-1"></div>
                   <Clock size={14} className="opacity-80"/>
                   <input type="number" className={inputClass} value={block.parameters.duration} onChange={(e) => handleParamChange(scriptId, block.id, 'duration', parseFloat(e.target.value))} />
                   <span className={labelClass}>s</span>
                </div>
             )}
             
             {block.type === 'ACTION_ROTATE' && (
                <div className="flex items-center gap-2 bg-black/10 px-2 py-1 rounded-lg">
                   <span className={labelClass}>Axis</span>
                   <select className={selectClass} value={block.parameters.axis} onChange={(e) => handleParamChange(scriptId, block.id, 'axis', e.target.value)}>
                     <option value="y">Y (Spin)</option><option value="x">X (Flip)</option><option value="z">Z (Roll)</option>
                   </select>
                   <ArrowRight size={12} className="opacity-50" />
                   <input type="number" className={inputClass} value={block.parameters.angle} onChange={(e) => handleParamChange(scriptId, block.id, 'angle', parseFloat(e.target.value))} />
                   <span className={labelClass}>deg</span>
                </div>
             )}
             
             {block.type === 'ACTION_COLOR' && (
                <div className="flex items-center gap-2 bg-white rounded-md pl-1 pr-2 py-1 shadow-sm">
                   <input type="color" className="w-8 h-6 rounded cursor-pointer border-none p-0 bg-transparent" value={block.parameters.color} onChange={(e) => handleParamChange(scriptId, block.id, 'color', e.target.value)} />
                   <span className="text-gray-600 font-mono text-xs">{block.parameters.color}</span>
                </div>
             )}
             
             {block.type === 'ACTION_SCALE' && (
                <>
                  <input type="number" step="0.1" className={inputClass} value={block.parameters.scale} onChange={(e) => handleParamChange(scriptId, block.id, 'scale', parseFloat(e.target.value))} />
                  <span className={labelClass}>x size</span>
                </>
             )}
          </div>

          {!block.type.startsWith('EVENT') && (
            <button onClick={() => removeBlockFromScript(selectedObject.id, scriptId, block.id)} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-md transition-colors ml-auto">
              <Trash size={14} />
            </button>
          )}
        </div>

        {/* C-Block Container Body */}
        {isContainer && (
          <div className="flex flex-col w-full">
             <div 
               className={`
                  pl-4 py-2 w-full
                  border-l-[16px] ${style.border} 
                  bg-gray-100/50
                  min-h-[40px]
                  flex flex-col gap-1
                  rounded-r-xl
               `}
               onDrop={(e) => onDrop(e, scriptId, block.id)}
               onDragOver={onDragOver}
             >
                {block.children?.map(child => renderBlock(child, scriptId))}
                
                {(!block.children || block.children.length === 0) && (
                  <div className="text-xs text-gray-400 italic p-3 border-2 border-dashed border-gray-300 rounded-lg m-1 text-center bg-white/50">
                    Drag actions inside here
                  </div>
                )}
             </div>
             {/* Bottom Cap */}
             <div className={`h-4 w-full ${style.bg} rounded-b-xl rounded-tr-xl border-t border-white/10 opacity-90`}></div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-20 flex border-l border-gray-200">
      
      {/* Sidebar: Block Palette */}
      <div className="w-44 bg-slate-50 border-r border-gray-200 p-4 flex flex-col gap-2 overflow-y-auto shrink-0 z-10">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 mt-1">Events</h3>
        {renderSidebarItem('EVENT_START', 'When Play', <Play size={14}/>, 'bg-yellow-500 border-yellow-600')}
        {renderSidebarItem('EVENT_ON_CLICK', 'When Click', <MousePointer size={14}/>, 'bg-yellow-600 border-yellow-700')}
        
        <div className="h-px bg-gray-200 my-2"></div>

        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Control</h3>
        {renderSidebarItem('CONTROL_FOREVER', 'Forever', <Repeat size={14}/>, 'bg-orange-500 border-orange-600')}
        {renderSidebarItem('CONTROL_REPEAT', 'Repeat', <Repeat size={14}/>, 'bg-orange-500 border-orange-600')}
        {renderSidebarItem('CONTROL_WAIT', 'Wait', <Clock size={14}/>, 'bg-orange-400 border-orange-500')}
        {renderSidebarItem('CONTROL_IF', 'If', <GitBranch size={14}/>, 'bg-orange-500 border-orange-600')}

        <div className="h-px bg-gray-200 my-2"></div>

        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Actions</h3>
        {renderSidebarItem('ACTION_MOVE', 'Move', <Move size={14}/>, 'bg-indigo-500 border-indigo-600')}
        {renderSidebarItem('ACTION_ROTATE', 'Turn', <Rotate3D size={14}/>, 'bg-blue-500 border-blue-600')}
        {renderSidebarItem('ACTION_SCALE', 'Scale', <Expand size={14}/>, 'bg-purple-500 border-purple-600')}
        {renderSidebarItem('ACTION_COLOR', 'Color', <Palette size={14}/>, 'bg-pink-500 border-pink-600')}
      </div>

      {/* Main Area: Workspace */}
      <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden relative">
        {/* Header */}
        <div className="p-4 bg-white border-b flex justify-between items-center shadow-sm z-30 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-100 shrink-0" />
            <div className="truncate">
              <h2 className="font-bold text-gray-800 text-sm">Block Editor</h2>
              <p className="text-xs text-gray-500 truncate">Editing: <span className="font-semibold text-indigo-600">{selectedObject.name}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            {/* Zoom Controls */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} 
                className="p-1.5 hover:bg-white rounded-md text-gray-500 transition shadow-sm"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-[10px] font-mono font-bold w-10 text-center text-gray-600">
                {Math.round(zoom * 100)}%
              </span>
              <button 
                onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} 
                className="p-1.5 hover:bg-white rounded-md text-gray-500 transition shadow-sm"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            <button onClick={() => setCodeOpen(false)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-gray-500 transition">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scripts Canvas */}
        <div className="flex-1 p-6 overflow-auto relative scroll-smooth bg-slate-50/50">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} 
          />
          
          <div 
            className="space-y-12 pb-32 transition-transform duration-200 ease-out origin-top-left"
            style={{ 
               transform: `scale(${zoom})`,
               width: `${100 / zoom}%` // Compensate width so dragging works across full area
            }}
          >
            {selectedObject.scripts?.map(script => (
              <div 
                key={script.id} 
                className="bg-white/80 p-5 rounded-2xl border-2 border-dashed border-gray-200 min-h-[160px] shadow-sm backdrop-blur-sm transition-colors hover:border-indigo-200"
                onDrop={(e) => onDrop(e, script.id)}
                onDragOver={onDragOver}
              >
                {script.blocks.map(block => renderBlock(block, script.id))}
                {script.blocks.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-3 py-10">
                      <div className="p-4 bg-slate-50 rounded-full shadow-sm border border-slate-100"><Plus size={24} className="text-gray-300"/></div>
                      <span className="font-medium">Drag an <span className="text-yellow-600 font-bold">Event</span> block here to start</span>
                   </div>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => addScript(selectedObject.id)}
              className="group flex items-center gap-3 bg-white border-2 border-gray-200 text-gray-600 px-6 py-4 rounded-2xl text-sm font-bold shadow-sm hover:shadow-md hover:border-indigo-400 hover:text-indigo-600 transition-all w-full justify-center border-dashed"
            >
              <div className="bg-indigo-50 p-1.5 rounded-lg group-hover:bg-indigo-100 transition-colors">
                <Plus size={18} /> 
              </div>
              <span>Create New Script Group</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
