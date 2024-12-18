export declare type EquipmentType = "Caminhões" | "Colhedoras" | "Tratores" | "Empilhadeiras" | "Pulverizadores";
export declare type EquipmentTypes = "harvester" | "tractor" | "truck" | "forklift" | "pulverizer";
export interface Equipment {
    code: number;
    description: string;
    work_front_code: number;
}
export interface Event {
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
        code: number;
        name: string;
    };
    time: {
        start: number;
        end: number;
    };
}
export interface AvailabilityAndAllocationResult {
    goal: number;
    groups: [
        {
            group: string;
            average: number;
            workFronts: [
                {
                    workFrontCode: number;
                    equipments: number;
                    availability: number;
                }
            ];
        }
    ];
}
export declare type EquipmentsGroupsType = Record<string, Record<number | 'total', number>>;
