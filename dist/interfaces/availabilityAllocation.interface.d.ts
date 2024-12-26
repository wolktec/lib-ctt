export interface CttEquipment {
    code: number;
    description: string;
    work_front_code: number;
}
export interface CttEvent {
    code: string;
    equipment: {
        code: number;
    };
    workFront: {
        id: number;
        code: number;
        name: string;
    };
    name: string;
    interference?: {
        id: number;
        name: string;
    };
    time: {
        start: number;
        end: number;
    };
}
export declare type CttAvailabilityAndAllocationResult = {
    goal: number;
    groups: [
        {
            group: string;
            average: number;
            workFronts: {
                workFrontCode: number;
                equipments: number;
                availability: number;
            }[];
        }
    ] | {
        group: string;
        average: number;
        workFronts: {
            workFrontCode: number;
            equipments: number;
            availability: number;
        }[];
    }[];
};
export declare type CttEquipmentsGroupsType = Record<string, Record<number, number>>;
