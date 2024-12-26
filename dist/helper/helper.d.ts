import { CttEquipmentProductivity, CttEquipmentProductivityFront } from "../interfaces/performanceIndicators.interface";
import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
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
export declare const groupEquipmentsProductivityByFront: (equipmentsProductivity: CttEquipmentProductivity[], equipments: CttEquipment[]) => CttEquipmentProductivityFront[];
export declare const getEventTime: (event: CttEvent) => number;
export declare const msToTime: (ms: number) => string;
export declare const secToTime: (sec: number) => string;
