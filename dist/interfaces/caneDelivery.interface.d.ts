import { CttWorkFronts } from "./partialDelivered.interface";
export interface CttCaneDelivery {
    workFronts: CttWorkFrontsCaneDelivery[];
    units: CttUnitsCaneDelivery[];
    periods: CttPeriodsCaneDelivery[];
}
interface CttWorkFrontsCaneDelivery {
    workFrontCode: number;
    day: number;
    dayGoalPercentage: number;
    month: number;
    tonPerHour: number;
    harvest: number;
    harvestGoalPercentage: number;
}
interface CttUnitsCaneDelivery {
    name: string;
    total: number;
    day: number;
    month: number;
    percentage: number;
    goal: number;
}
interface CttPeriodsCaneDelivery {
    key: string;
    label: string;
    goal: number;
    effectiveDays: string | null;
    data: [
        {
            label: string;
            progress: number;
            value: number;
        }
    ];
}
export interface CttWorkFrontUnit extends CttWorkFronts {
    unitId: number;
    unitName: string;
}
export interface Unit {
    name: string;
    total: number;
    day: number;
    month: number;
    percentage: number;
    goal: number;
}
export {};
