export type CttTon = Record<string, number>;

export interface CttWorkFronts {
  code: number;
  goal: number;
}

export interface EquipmentAllocation {
  code: number;
  workFront: {
    name: string;
    code: number;
  };
}

export interface GetProductionReturn {
  unitCode: number;
  month?: number;
  year?: number;
  workFrontCode?: number;
  workFrontName?: string;
  actualHours: number;
  activeEquipments: EquipmentAllocation[];
  allocatedEquipments: EquipmentAllocation[];
  delivered: {
    total: number;
    goal: number;
    projected: number;
    totalOverProjected: number;
    totalOverGoal: number;
  };
  hourlyDelivered: {
    total: number;
    goal: number;
    totalOverGoal: number;
  };
  dailyProjectedDelivered: {
    total: number;
    goal: number;
    totalOverGoal: number;
  };
  tonPerHourmeter: number;
  fuelConsumption: {
    total: number;
    perHour: number;
    perHourGoal: number;
    perTon: number;
  } | null;
  tonPerElevator: {
    total: number;
    goal: number;
  } | null;
  harvestedHectares: {
    total: number;
    perHour: number;
    tch: number;
  } | null;
}

export interface CttDeliveredReturn {
  workFrontCode: number;
  goal: number;
  realTons: number;
  estimatedTons: number;
  tonPerHour: number;
  tonPerHourmeter: number;
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
