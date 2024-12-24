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