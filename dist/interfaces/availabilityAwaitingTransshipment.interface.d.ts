export interface CttAvailabilityAwaitingTransshipment {
    partial: AvailabilityAwaitingTransshipmentData[];
    closure: AvailabilityAwaitingTransshipmentData[];
}
export interface AvailabilityAwaitingTransshipmentData {
    workFrontCode: number;
    progress: number;
    time: string;
}
