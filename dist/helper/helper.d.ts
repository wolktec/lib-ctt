import { CttEquipmentProductivity, CttEquipmentProductivityFront, CttInterferences, CttTelemetry, CttTelemetryByFront, Journey } from "../interfaces/performanceIndicators.interface";
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
export declare const groupEquipmentTelemetryByFront: (equipments: CttEquipment[], telemetry: CttTelemetry[]) => CttTelemetryByFront[];
export declare const calcTelemetryByFront: (telemetryByFront: CttTelemetryByFront[]) => Record<string, number>;
export declare const calcJourney: (events: CttEvent[], interferences: CttInterferences[]) => Promise<Journey>;
export declare const calcTotalInterferenceByFront: (totalInterferenceTimeFront: Record<string, number>, totalInterferenceOprtlTimeFront: Record<string, number>) => Record<string, number>;
export declare const getTotalHourmeter: (hourmeters: CttTelemetry[], firstHourmeterValue?: number) => number;
export declare function removeOutliers(values: number[], totalDays?: number): number[];
export declare const createValueWithGoal: (value: number, hasTotalField?: boolean, hasAverageField?: boolean) => any;
/**
 * Convert seconds to HH:MM:SS
 */
export declare const convertSecondstoTimeString: (seconds: number) => string;
