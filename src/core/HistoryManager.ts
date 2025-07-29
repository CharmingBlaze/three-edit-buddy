import { EditableMesh } from './EditableMesh.js';
import type { Vector3Like } from '../types/index.js';

/**
 * Types of operations that can be undone/redone
 */
export type OperationType = 
  | 'moveVertex'
  | 'moveEdge'
  | 'moveFace'
  | 'extrudeFaces'
  | 'mergeVertices'
  | 'subdivideEdge'
  | 'deleteElements'
  | 'bevelEdge'
  | 'insetFaces'
  | 'loopCut'
  | 'bridgeEdges'
  | 'custom';

/**
 * Base interface for all operation states
 */
export interface OperationState {
  type: OperationType;
  timestamp: number;
  description: string;
}

/**
 * State for vertex movement operations
 */
export interface MoveVertexState extends OperationState {
  type: 'moveVertex';
  vertexId: number;
  oldPosition: Vector3Like;
  newPosition: Vector3Like;
}

/**
 * State for edge movement operations
 */
export interface MoveEdgeState extends OperationState {
  type: 'moveEdge';
  edgeId: number;
  vertexIds: number[];
  oldPositions: Vector3Like[];
  newPositions: Vector3Like[];
}

/**
 * State for face movement operations
 */
export interface MoveFaceState extends OperationState {
  type: 'moveFace';
  faceId: number;
  vertexIds: number[];
  oldPositions: Vector3Like[];
  newPositions: Vector3Like[];
}

/**
 * State for custom operations
 */
export interface CustomState extends OperationState {
  type: 'custom';
  undoFn: () => void;
  redoFn: () => void;
}

/**
 * Union type for all operation states
 */
export type HistoryState = 
  | MoveVertexState
  | MoveEdgeState
  | MoveFaceState
  | CustomState;

/**
 * Options for the history manager
 */
export interface HistoryManagerOptions {
  /** Maximum number of operations to store (default: 50) */
  maxOperations?: number;
  /** Whether to enable history (default: true) */
  enabled?: boolean;
  /** Whether to group operations by timestamp (default: false) */
  groupOperations?: boolean;
  /** Time window for grouping operations in milliseconds (default: 100) */
  groupTimeWindow?: number;
}

/**
 * Manages undo/redo history for mesh editing operations
 */
export class HistoryManager {
  private mesh: EditableMesh;
  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private options: Required<HistoryManagerOptions>;
  private isExecuting = false;

  constructor(mesh: EditableMesh, options: HistoryManagerOptions = {}) {
    this.mesh = mesh;
    this.options = {
      maxOperations: options.maxOperations ?? 50,
      enabled: options.enabled ?? true,
      groupOperations: options.groupOperations ?? false,
      groupTimeWindow: options.groupTimeWindow ?? 100,
    };
  }

  /**
   * Records a vertex movement operation
   */
  recordMoveVertex(
    vertexId: number,
    oldPosition: Vector3Like,
    newPosition: Vector3Like,
    description?: string
  ): void {
    if (!this.options.enabled || this.isExecuting) return;

    const state: MoveVertexState = {
      type: 'moveVertex',
      timestamp: Date.now(),
      description: description ?? `Move vertex ${vertexId}`,
      vertexId,
      oldPosition,
      newPosition,
    };

    this.addOperation(state);
  }

  /**
   * Records an edge movement operation
   */
  recordMoveEdge(
    edgeId: number,
    vertexIds: number[],
    oldPositions: Vector3Like[],
    newPositions: Vector3Like[],
    description?: string
  ): void {
    if (!this.options.enabled || this.isExecuting) return;

    const state: MoveEdgeState = {
      type: 'moveEdge',
      timestamp: Date.now(),
      description: description ?? `Move edge ${edgeId}`,
      edgeId,
      vertexIds,
      oldPositions,
      newPositions,
    };

    this.addOperation(state);
  }

  /**
   * Records a face movement operation
   */
  recordMoveFace(
    faceId: number,
    vertexIds: number[],
    oldPositions: Vector3Like[],
    newPositions: Vector3Like[],
    description?: string
  ): void {
    if (!this.options.enabled || this.isExecuting) return;

    const state: MoveFaceState = {
      type: 'moveFace',
      timestamp: Date.now(),
      description: description ?? `Move face ${faceId}`,
      faceId,
      vertexIds,
      oldPositions,
      newPositions,
    };

    this.addOperation(state);
  }

  /**
   * Records a custom operation with custom undo/redo functions
   */
  recordCustom(
    undoFn: () => void,
    redoFn: () => void,
    description: string
  ): void {
    if (!this.options.enabled || this.isExecuting) return;

    const state: CustomState = {
      type: 'custom',
      timestamp: Date.now(),
      description,
      undoFn,
      redoFn,
    };

    this.addOperation(state);
  }

  /**
   * Adds an operation to the history stack
   */
  private addOperation(state: HistoryState): void {
    // Clear redo stack when new operation is added
    this.redoStack = [];

    // Group operations if enabled
    if (this.options.groupOperations && this.undoStack.length > 0) {
      const lastOperation = this.undoStack[this.undoStack.length - 1];
      if (state.timestamp - lastOperation.timestamp < this.options.groupTimeWindow) {
        // Group with previous operation
        this.undoStack[this.undoStack.length - 1] = this.mergeOperations(lastOperation, state);
        return;
      }
    }

    // Add new operation
    this.undoStack.push(state);

    // Limit stack size
    if (this.undoStack.length > this.options.maxOperations) {
      this.undoStack.shift();
    }
  }

  /**
   * Merges two operations of the same type
   */
  private mergeOperations(prev: HistoryState, current: HistoryState): HistoryState {
    if (prev.type !== current.type) return current;

    switch (prev.type) {
      case 'moveVertex':
        if (current.type === 'moveVertex' && prev.vertexId === current.vertexId) {
          return {
            ...prev,
            newPosition: current.newPosition,
            description: `Move vertex ${prev.vertexId}`,
          };
        }
        break;

      case 'moveEdge':
        if (current.type === 'moveEdge' && prev.edgeId === current.edgeId) {
          return {
            ...prev,
            newPositions: current.newPositions,
            description: `Move edge ${prev.edgeId}`,
          };
        }
        break;

      case 'moveFace':
        if (current.type === 'moveFace' && prev.faceId === current.faceId) {
          return {
            ...prev,
            newPositions: current.newPositions,
            description: `Move face ${prev.faceId}`,
          };
        }
        break;
    }

    return current;
  }

  /**
   * Undoes the last operation
   */
  undo(): boolean {
    if (this.undoStack.length === 0 || this.isExecuting) return false;

    this.isExecuting = true;

    try {
      const operation = this.undoStack.pop()!;
      this.redoStack.push(operation);

      this.executeUndo(operation);
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Redoes the last undone operation
   */
  redo(): boolean {
    if (this.redoStack.length === 0 || this.isExecuting) return false;

    this.isExecuting = true;

    try {
      const operation = this.redoStack.pop()!;
      this.undoStack.push(operation);

      this.executeRedo(operation);
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Executes the undo operation
   */
  private executeUndo(operation: HistoryState): void {
    switch (operation.type) {
      case 'moveVertex':
        this.mesh.moveVertex(operation.vertexId, operation.oldPosition);
        break;

      case 'moveEdge':
        for (let i = 0; i < operation.vertexIds.length; i++) {
          this.mesh.moveVertex(operation.vertexIds[i], operation.oldPositions[i]);
        }
        break;

      case 'moveFace':
        for (let i = 0; i < operation.vertexIds.length; i++) {
          this.mesh.moveVertex(operation.vertexIds[i], operation.oldPositions[i]);
        }
        break;

      case 'custom':
        operation.undoFn();
        break;
    }
  }

  /**
   * Executes the redo operation
   */
  private executeRedo(operation: HistoryState): void {
    switch (operation.type) {
      case 'moveVertex':
        this.mesh.moveVertex(operation.vertexId, operation.newPosition);
        break;

      case 'moveEdge':
        for (let i = 0; i < operation.vertexIds.length; i++) {
          this.mesh.moveVertex(operation.vertexIds[i], operation.newPositions[i]);
        }
        break;

      case 'moveFace':
        for (let i = 0; i < operation.vertexIds.length; i++) {
          this.mesh.moveVertex(operation.vertexIds[i], operation.newPositions[i]);
        }
        break;

      case 'custom':
        operation.redoFn();
        break;
    }
  }

  /**
   * Clears all history
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Gets the number of operations that can be undone
   */
  getUndoCount(): number {
    return this.undoStack.length;
  }

  /**
   * Gets the number of operations that can be redone
   */
  getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * Gets the description of the last undo operation
   */
  getLastUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null;
    return this.undoStack[this.undoStack.length - 1].description;
  }

  /**
   * Gets the description of the last redo operation
   */
  getLastRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null;
    return this.redoStack[this.redoStack.length - 1].description;
  }

  /**
   * Checks if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Checks if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Updates the history manager options
   */
  updateOptions(options: Partial<HistoryManagerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Gets the current options
   */
  getOptions(): Required<HistoryManagerOptions> {
    return { ...this.options };
  }
}