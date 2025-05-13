export type CttTon = Record<string, number>;

export interface CttWorkFronts {
  code: number,
  goal: number
}

export interface WorkFrontProductionReturn {
  activeEquipments: number[];
  actualHours: number;
  periodDelivered: {
    total: number;
    projected: number;
    progress: number;
  };
  dailyDelivered: {
    total: number;
    goal: number;
    progress: number;
  };
  hourlyDelivered: {
    total: number;
    goal: number;
    progress: number;
  };
}

export interface CttDeliveredReturn {
  workFrontCode: number;
  goal: number;
  realTons: number;
  estimatedTons: number;
  tonPerHour: number;
  estimatedPerGoal: number;
}

export interface CttEstimatedDelivered {
  total: number;
  goal: number;
  progress: number;
}

export interface CttPartialDeliveredResult {
  delivered: CttDeliveredReturn[];
  estimated: CttEstimatedDelivered;
}
