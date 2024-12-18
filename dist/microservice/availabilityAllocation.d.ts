import { Equipment, Event } from "../interfaces/availabilityAllocation.interface";
declare const createAvailabilityAllocation: (equipments: Equipment[], events: Event[]) => Promise<{
    goal: number;
    groups: {
        group: string;
        total: number;
        workFronts: {
            workFrontCode: number;
            equipments: number;
        }[];
    }[];
}>;
export default createAvailabilityAllocation;
