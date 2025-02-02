
export interface HoursValue {
  hour: string;
  value?: number | null;
}

export interface CttAvailabilityWorkFrontData {
  workFrontCode: number;
  equipments: number;
  average: number;
  hours: HoursValue[];
}

export interface CttAvailabilityGroupData {
  group: string;
  average: number;
  workFronts: CttAvailabilityWorkFrontData[];
}

export interface CttAvailability {
  goal: number;
  groups: CttAvailabilityGroupData[];
}
