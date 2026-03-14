export type NodeType = 'metric' | 'habit' | 'goal' | 'resource' | 'note';

export abstract class Node {
  constructor(
    public id: string,
    public type: NodeType,
    public name: string,
    public description: string,
    public created_at: Date
  ) {}
}

export class MetricNode extends Node {
  constructor(
    id: string,
    name: string,
    public measurementType: 'numeric' | 'rating' | 'binary' | 'percentage' | 'derived' | 'manual',
    public currentValue: number,
    public formula?: string
  ) {
    super(id, 'metric', name, '', new Date());
  }
}

export class HabitNode extends Node {
  constructor(
    id: string,
    name: string,
    public frequency: string,
    public decayRate: number
  ) {
    super(id, 'habit', name, '', new Date());
  }
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  weight: number;
  delayDays: number;
  confidence: number;
}
