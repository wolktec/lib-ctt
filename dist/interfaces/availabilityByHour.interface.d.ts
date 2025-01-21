export interface HoursValue {
    hour: string;
    value: number;
}
export interface CttAvailabilityWorkFrontData {
    workFrontCode: number;
    equipments: number;
    shift: string;
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
