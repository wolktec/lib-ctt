export declare type CttTon = Record<string, number>;
export interface CttWorkFronts {
    code: number;
    goal: number;
}
export interface CttEstimatedTons {
    estimated: {
        total: number;
        goal: number;
        progress: number;
    };
    [key: string]: number | {
        total: number;
        goal: number;
        progress: number;
    };
}
export interface CttDeliveredReturn {
    workFrontCode: number;
    goal: number;
    realTons: number;
    estimatedTons: number;
    tonPerHour: number;
    estimatedPerGoal: number;
}
export interface CttPartialDeliveredResult {
    delivered: CttDeliveredReturn[];
    estimated: {
        total: number;
        goal: number;
        progress: number;
    };
}
