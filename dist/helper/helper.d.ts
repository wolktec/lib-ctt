import { HoursValue } from "../interfaces/availabilityByHour.interface";
export declare function normalizeCalc(value: number, fixed?: number): number;
export declare const isSameDay: (date1: number, date2: number) => boolean;
export declare const getCurrentHour: (date: number) => number;
export declare const hourToTime: (hoursValue: number) => string;
export declare const getDefaultHoursData: (currentHour: number) => HoursValue[];
