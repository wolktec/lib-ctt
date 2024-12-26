import { EquipmentProductivity, EquipmentProductivityFront } from "../interfaces/performanceIndicators.interface";
import { Equipment } from "../interfaces/availabilityAllocation.interface";
export declare function convertHourToDecimal(hour: string): number;
export declare function calcMechanicalAvailability(totalMaintenance: number, countMaintenance: number, currentHour: number): number;
export declare function normalizeCalc(value: number, fixed?: number): number;
export declare const getCurrentHour: (date: number) => number;
export declare const isSameDay: (date1: number, date2: number) => boolean;
export declare const dateFilter: (start_date?: string, splitSeparator?: string) => number;
export declare const dateParts: (date: string, splitSeparator?: string) => {
    day: number;
    month: number;
    year: number;
};
export declare const translations: {
    [key: string]: string;
};
export declare const groupEquipmentsProductivityByFront: (equipmentsProductivity: EquipmentProductivity[], equipments: Equipment[]) => EquipmentProductivityFront[];
