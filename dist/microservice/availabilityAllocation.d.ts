import { Equipment, EquipmentsGroupsType, Event } from "../interfaces/availabilityAllocation.interface";
export default class availabilityAllocation {
    createAvailabilityAllocation: (equipments: Equipment[], events: Event[]) => Promise<{
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
    /**
      * GET the online equipments quantity based on the events registered by FRONT and GROUP
      * @param equipments the group of equipments allocated in the front
      * @param events the events of the equipment
     */
    sumEquipmentsByGroup: (equipments: Equipment[], events: Event[]) => Promise<EquipmentsGroupsType>;
    /**
     * GET the mechanical availability by equipment
     * @param interferences
     */
    getMechanicalAvailability: (interferences: Event[], currentHour: string) => Promise<number>;
    formatAvailabilityReturn: (groupedEquipments: EquipmentsGroupsType) => Promise<{
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
}
