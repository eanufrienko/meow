import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Trash2, Lock, Unlock, Wand2, Play, Sparkles } from 'lucide-react';
import { generateBehaviorFromText } from '../services/aiService';
import { nanoid } from 'nanoid';

export const PropertiesPanel: React.FC = () => {
  const { objects, selectedObjectId, updateObject, removeObject, setLoading, isLoading } = useStore();
  const selectedObject = objects.find(o => o.id === selectedObjectId);
  const [prompt, setPrompt] = useState('');

  // Hide panel if no object is selected (clicked on empty space)
  if (!selectedObject) {
    return null;
  }

  const handleGenerateLogic = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const result = await generateBehaviorFromText(prompt);
      if (result) {
        const newBehavior = {
          id: nanoid(),
          type: result.type,
          parameters: result.parameters,
          description: result.explanation
        };
        updateObject(selectedObject.id, {
          behaviors: [...selectedObject.behaviors, newBehavior]
        });
        setPrompt('');
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate logic. Check API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-4 top-20 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/50 flex flex-col max-h-[80vh] overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 className="font-bold text-gray-800">Properties</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => updateObject(selectedObject.id, { locked: !selectedObject.locked })}
            className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600"
          >
            {selectedObject.locked ? <Lock size={16} /> : <Unlock size={16} />}
          </button>
          <button 
            onClick={() => removeObject(selectedObject.id)}
            className="p-1.5 hover:bg-red-100 text-red-500 rounded-md"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto space-y-6">
        
        {/* Transform Info */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Transform</label>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-400 text-xs block">X</span>
              {selectedObject.position[0].toFixed(2)}
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-400 text-xs block">Y</span>
              {selectedObject.position[1].toFixed(2)}
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-400 text-xs block">Z</span>
              {selectedObject.position[2].toFixed(2)}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Appearance</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={selectedObject.color}
              onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })}
              className="h-8 w-14 rounded cursor-pointer border-0 p-0"
            />
            <span className="text-sm text-gray-600 font-mono">{selectedObject.color}</span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* AI Logic Builder */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-500" size={16} />
            <label className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">AI Behavior</label>
          </div>
          
          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
            <textarea 
              className="w-full bg-white border border-indigo-200 rounded p-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
              rows={3}
              placeholder="e.g. 'Spin continuously' or 'Bounce up and down'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button 
              onClick={handleGenerateLogic}
              disabled={isLoading || !prompt}
              className={`mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                isLoading 
                ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
              }`}
            >
              {isLoading ? (
                <span>Thinking...</span>
              ) : (
                <>
                  <Wand2 size={16} />
                  <span>Generate Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Behaviors List */}
        {selectedObject.behaviors.length > 0 && (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Scripts</label>
            <div className="space-y-2">
              {selectedObject.behaviors.map((b, idx) => (
                <div key={b.id} className="group bg-white border border-gray-200 p-2 rounded-md shadow-sm flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Play size={12} className="text-green-500" />
                      <span className="text-sm font-semibold text-gray-700">{b.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{b.description}</p>
                  </div>
                  <button 
                    onClick={() => {
                       const newBehaviors = selectedObject.behaviors.filter(bh => bh.id !== b.id);
                       updateObject(selectedObject.id, { behaviors: newBehaviors });
                    }}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
