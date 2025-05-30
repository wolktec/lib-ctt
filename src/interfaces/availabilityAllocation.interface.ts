export interface MonitoringCenterAvailabilityWorkFrontData {
  workFrontCode: number;
  allocated?: number | null;
  availability?: number | null;
  available?: number | null;
  unavailable?: number | null;
}

export interface MonitoringCenterAvailabilityGroupData {
  group: string;
  availability: number;
  workFronts: MonitoringCenterAvailabilityWorkFrontData[];
}

export interface MonitoringCenterAvailability {
  goal: number;
  groups: MonitoringCenterAvailabilityGroupData[];
}

interface AvailabilityAndAllocationWorkFrontData {
  workFrontCode: number;
  allocated: number;
  equipments: number;
  availability: number;
}

export interface AvailabilityAndAllocationGroupData {
  group: string;
  average: number;
  workFronts: AvailabilityAndAllocationWorkFrontData[];
}

export type CttAvailabilityAndAllocation = {
  goal: number;
  groups: AvailabilityAndAllocationGroupData[];
};

export type CttEquipmentsGroupsType = Record<string, Record<number, number>>;
