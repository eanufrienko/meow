export type Vector3Array = [number, number, number];
export type EulerArray = [number, number, number];

export enum ObjectType {
  CUBE = 'CUBE',
  SPHERE = 'SPHERE',
  CYLINDER = 'CYLINDER',
  PLANE = 'PLANE',
  MODEL = 'MODEL',
  SPAWN = 'SPAWN'
}

// AI Behaviors (Legacy/Easy mode)
export interface IBehavior {
  id: string;
  type: 'SPIN' | 'BOUNCE' | 'FLOAT' | 'HOVER';
  parameters: Record<string, number | string | boolean>;
  description?: string;
}

// CoBlocks (Scratch-like) Types
export type BlockType = 
  // Events
  | 'EVENT_START' 
  | 'EVENT_ON_CLICK'
  // Control
  | 'CONTROL_FOREVER' 
  | 'CONTROL_REPEAT'
  | 'CONTROL_WAIT'
  | 'CONTROL_IF'
  // Actions
  | 'ACTION_MOVE'   // Move by distance over time
  | 'ACTION_ROTATE' // Rotate by angle over time
  | 'ACTION_SCALE'  // Set scale
  | 'ACTION_COLOR'; // Set color

export interface IBlock {
  id: string;
  type: BlockType;
  parameters: Record<string, any>;
  children?: IBlock[]; // For nesting
}

export interface IScript {
  id: string;
  name: string;
  blocks: IBlock[];
}

export interface ISceneObject {
  id: string;
  name: string;
  type: ObjectType;
  position: Vector3Array;
  rotation: EulerArray;
  scale: Vector3Array;
  color: string;
  behaviors: IBehavior[];
  scripts: IScript[];
  locked: boolean;
  createdBy: string;
}

export interface IUser {
  id: string;
  name: string;
  color: string;
  cursorPosition?: Vector3Array;
}

export interface AILogicResponse {
  type: 'SPIN' | 'BOUNCE' | 'FLOAT' | 'HOVER';
  parameters: {
    speed?: number;
    axis?: 'x' | 'y' | 'z';
    height?: number;
  };
  explanation: string;
}
