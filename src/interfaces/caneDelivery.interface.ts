import {
  CttWorkFronts,
  GetProductionReturn,
} from "./partialDelivered.interface";

export interface CttCaneDelivery {
  workFronts: CttWorkFrontsCaneDelivery[];
  units: CttUnitsCaneDelivery[];
  periods: CttPeriodsCaneDelivery[];
}

export interface CttWorkFrontsCaneDelivery {
  workFrontCode: number;
  day: number;
  dayGoalPercentage: number;
  month: number;
  tonPerHour: number;
  tonPerHourmeter: number;
  harvest: number;
  harvestGoalPercentage: number;
  goal: number;
}

export interface CttUnitsCaneDelivery {
  name: string;
  total: number;
  day: number;
  month: number;
  percentage: number;
  goal: number;
}

export interface CttPeriodsCaneDelivery {
  key: string;
  label: string;
  goal: number;
  effectiveDays: string | null;
  data: {
    label: string;
    progress: number;
    value: number;
  }[];
}

export interface CttWorkFrontUnit extends CttWorkFronts {
  unitId: number;
  unitName: string;
}

export interface UnitData {
  code: number;
  name: string;
  workFrontProductionMap: Record<number, GetProductionReturn>;
  monthlyWorkFrontProductionMap: Record<
    string,
    Record<number, GetProductionReturn>
  >;
}

export interface CreateCaneDeliveryParams {
  date: string;
  defaultUnit: UnitData;
}

export interface UnitProductionData {
  code: number;
  name: string;
  monthlyWorkFrontProductionMap: Record<
    string,
    Record<number, GetProductionReturn>
  >;
  workFrontProductionMap: Record<number, GetProductionReturn>;
}
