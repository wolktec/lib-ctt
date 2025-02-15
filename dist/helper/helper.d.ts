import { CttInterferences, CttTelemetry, CttTelemetryByFront, Journey, JourneyFront } from "../interfaces/performanceIndicators.interface";
import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
import { HoursValue } from "../interfaces/availabilityByHour.interface";
export declare function convertHourToDecimal(hour: string): number;
export declare function calcMechanicalAvailabilitySeconds(totalMaintenance: number, countMaintenance: number, currentHour: number): number;
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
export declare const defaultFronts: {
    [key: string]: number;
};
export declare const getEventTime: (event: CttEvent) => number;
export declare const msToTime: (ms: number) => string;
export declare const secToTime: (sec: number) => string;
export declare const groupEquipmentTelemetryByFront: (equipments: CttEquipment[], telemetry: CttTelemetry[]) => Record<string, any>;
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
export declare const calcJourneyByFront: (events: CttEvent[], interferences: CttInterferences[]) => Promise<JourneyFront>;
export declare const getDaysInMonth: (dateString: string) => number;
export declare const getDaysBetweenDates: (startDate: string, endDate: string) => number;
export declare const getHarvestDateRange: (date: string) => {
    startDate: string;
    endDate: string;
};
export declare const getHarvesterEvents: (equipments: CttEquipment[], events: CttEvent[]) => CttEvent[];
export declare const getDefaultHoursData: (currentHour: number) => HoursValue[];
export declare const groupTelemetryByEquipmentCode: (telemetry: CttTelemetry[]) => {
    [key: string]: CttTelemetry[];
};
