import { create } from 'zustand';
import { ISceneObject, IUser, ObjectType, Vector3Array, EulerArray, IScript, IBlock, BlockType } from '../types';
import { nanoid } from 'nanoid';

interface AppState {
  // Scene State
  objects: ISceneObject[];
  selectedObjectId: string | null;
  environmentColor: string;
  
  // User/Collab State
  currentUser: IUser;
  playerIndex: number; // Which player am I? (0 = host, 1 = guest 1, etc.)
  collaborators: IUser[];
  
  // UI State
  isAREnabled: boolean;
  isVREnabled: boolean;
  isLoading: boolean;
  isPlaying: boolean;
  isCodeOpen: boolean;
  
  // Publishing State
  publishedUrl: string | null;

  // Actions
  addObject: (type: ObjectType) => void;
  updateObject: (id: string, updates: Partial<ISceneObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setEnvironmentColor: (color: string) => void;
  updateCollaboratorCursor: (userId: string, position: Vector3Array) => void;
  setLoading: (loading: boolean) => void;
  
  // Play/Code Actions
  setPlaying: (playing: boolean) => void;
  setCodeOpen: (open: boolean) => void;
  addScript: (objectId: string) => void;
  addBlockToScript: (objectId: string, scriptId: string, type: BlockType, parentBlockId?: string) => void;
  updateBlockParameters: (objectId: string, scriptId: string, blockId: string, params: Record<string, any>) => void;
  removeBlockFromScript: (objectId: string, scriptId: string, blockId: string) => void;
  reorderBlock: (objectId: string, scriptId: string, sourceBlockId: string, targetBlockId: string) => void;
  
  // Publish Actions
  publishWorld: () => void;
  joinWorld: () => boolean; // Returns true if joined, false if full
}

const DEFAULT_OBJECTS: ISceneObject[] = [
  {
    id: 'floor',
    name: 'Ground',
    type: ObjectType.PLANE,
    position: [0, -0.5, 0],
    rotation: [-Math.PI / 2, 0, 0],
    scale: [20, 20, 1],
    color: '#e5e7eb',
    behaviors: [],
    scripts: [],
    locked: true,
    createdBy: 'system'
  }
];

export const useStore = create<AppState>((set, get) => ({
  objects: DEFAULT_OBJECTS,
  selectedObjectId: null,
  environmentColor: '#f3f4f6',
  
  currentUser: {
    id: 'me',
    name: 'Host',
    color: '#3b82f6'
  },
  playerIndex: 0,
  collaborators: [], // Start empty for single player default
  
  isAREnabled: false,
  isVREnabled: false,
  isLoading: false,
  isPlaying: false,
  isCodeOpen: false,
  publishedUrl: null,

  addObject: (type: ObjectType) => {
    let defaults: Partial<ISceneObject> = {
      scale: [1, 1, 1],
      color: '#' + Math.floor(Math.random()*16777215).toString(16),
      rotation: [0, 0, 0],
    };

    if (type === ObjectType.SPAWN) {
      defaults = {
        name: 'Spawn Pad',
        scale: [1, 0.2, 1], // Physical Platform
        color: '#374151', // Dark metal
        rotation: [0, 0, 0],
        position: [0, 0.1, 0]
      };
    }

    const newObject: ISceneObject = {
      id: nanoid(),
      name: type === ObjectType.SPAWN ? 'Spawn Pad' : `New ${type}`,
      type,
      position: (type === ObjectType.SPAWN ? [0, 0.1, 0] : [Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2]) as Vector3Array,
      rotation: defaults.rotation as EulerArray,
      scale: defaults.scale as Vector3Array,
      color: defaults.color as string,
      behaviors: [],
      scripts: [],
      locked: false,
      createdBy: get().currentUser.id
    };
    
    // Auto-select unless it's a spawn point in play mode (logic handled in UI)
    set((state) => ({ objects: [...state.objects, newObject], selectedObjectId: newObject.id }));
  },

  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((obj) => 
        obj.id === id ? { ...obj, ...updates } : obj
      )
    }));
  },

  removeObject: (id) => {
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId
    }));
  },

  selectObject: (id) => set({ selectedObjectId: id }),

  setEnvironmentColor: (color) => set({ environmentColor: color }),

  updateCollaboratorCursor: (userId, position) => {
    set((state) => ({
      collaborators: state.collaborators.map(c => 
        c.id === userId ? { ...c, cursorPosition: position } : c
      )
    }));
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setPlaying: (playing) => set({ isPlaying: playing, selectedObjectId: null }),
  setCodeOpen: (open) => set({ isCodeOpen: open }),

  addScript: (objectId) => {
    const newScript: IScript = {
      id: nanoid(),
      name: 'New Script',
      blocks: [
        { id: nanoid(), type: 'EVENT_START', parameters: {}, children: [] }
      ]
    };
    
    set((state) => ({
      objects: state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        return { ...obj, scripts: [...(obj.scripts || []), newScript] };
      })
    }));
  },

  addBlockToScript: (objectId, scriptId, type, parentBlockId) => {
    let defaultParams = {};
    switch (type) {
        case 'ACTION_MOVE': defaultParams = { axis: 'z', distance: 1, duration: 1 }; break;
        case 'ACTION_ROTATE': defaultParams = { axis: 'y', angle: 90, duration: 1 }; break;
        case 'ACTION_SCALE': defaultParams = { scale: 1.5, duration: 0.5 }; break;
        case 'ACTION_COLOR': defaultParams = { color: '#ff0000' }; break;
        case 'CONTROL_WAIT': defaultParams = { duration: 1 }; break;
        case 'CONTROL_REPEAT': defaultParams = { times: 5 }; break;
    }

    const newBlock: IBlock = {
      id: nanoid(),
      type,
      parameters: defaultParams,
      children: []
    };

    set((state) => {
      const newObjects = state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        
        const newScripts = obj.scripts.map(script => {
          if (script.id !== scriptId) return script;

          const addBlockRecursive = (blocks: IBlock[]): IBlock[] => {
            if (!parentBlockId) {
              return [...blocks, newBlock];
            }
            return blocks.map(block => {
              if (block.id === parentBlockId) {
                return { ...block, children: [...(block.children || []), newBlock] };
              }
              if (block.children) {
                return { ...block, children: addBlockRecursive(block.children) };
              }
              return block;
            });
          };

          return { ...script, blocks: addBlockRecursive(script.blocks) };
        });

        return { ...obj, scripts: newScripts };
      });
      return { objects: newObjects };
    });
  },

  updateBlockParameters: (objectId, scriptId, blockId, params) => {
    set((state) => {
      const newObjects = state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        const newScripts = obj.scripts.map(script => {
          if (script.id !== scriptId) return script;
          
          const updateRecursive = (blocks: IBlock[]): IBlock[] => {
            return blocks.map(b => {
              if (b.id === blockId) {
                return { ...b, parameters: { ...b.parameters, ...params } };
              }
              if (b.children) {
                return { ...b, children: updateRecursive(b.children) };
              }
              return b;
            });
          };

          return { ...script, blocks: updateRecursive(script.blocks) };
        });
        return { ...obj, scripts: newScripts };
      });
      return { objects: newObjects };
    });
  },

  removeBlockFromScript: (objectId, scriptId, blockId) => {
     set((state) => {
      const newObjects = state.objects.map(obj => {
        if (obj.id !== objectId) return obj;
        
        const newScripts = obj.scripts.map(script => {
          if (script.id !== scriptId) return script;

          const removeRecursive = (blocks: IBlock[]): IBlock[] => {
            return blocks.filter(b => b.id !== blockId).map(b => ({
              ...b,
              children: b.children ? removeRecursive(b.children) : []
            }));
          };

          return { ...script, blocks: removeRecursive(script.blocks) };
        });

        return { ...obj, scripts: newScripts };
      });
      return { objects: newObjects };
    });
  },

  reorderBlock: (objectId, scriptId, sourceBlockId, targetBlockId) => {
      console.log("Reorder requested", sourceBlockId, targetBlockId);
  },

  publishWorld: () => {
    const projectId = nanoid(8);
    // In a real app, this would save JSON to backend
    set({ publishedUrl: `https://cocreate.xr/play/${projectId}` });
  },

  joinWorld: () => {
    const state = get();
    const spawnPoints = state.objects.filter(o => o.type === ObjectType.SPAWN);
    const currentPlayers = 1 + state.collaborators.length; // Me + others
    
    if (currentPlayers < spawnPoints.length) {
      // Simulate joining as the next player
      // In real app, backend assigns this
      set({ playerIndex: currentPlayers }); 
      return true;
    }
    return false;
  }
}));
