export type Ton = Record<string, number>;

export interface WorkFronts {
  code: number,
  goal: number
}

export interface EstimatedTons {
  estimated: {
    total: number;
    goal: number;
    progress: number;
  };
  [key: string]: number | { total: number; goal: number; progress: number };
}

export interface DeliveredReturn {
  workFrontCode: number;
  goal: number;
  realTons: number;
  estimatedTons: number;
  tonPerHour: number;
  estimatedPerGoal: number;
}

export interface PartialDeliveredResult {
  delivered: DeliveredReturn[];
  estimated: {
    total: number;
    goal: number;
    progress: number;
  };
}