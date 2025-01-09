import { CttAvailabilityAndAllocationResult, CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
export declare const localTimeZone = "America/Sao_Paulo";
/**
 * GET the available equipments based on the events registered by FRONT and GROUP
 * @param equipments the group of equipments allocated in the front
 * @param events the events of the equipment
 */
declare const createAvailabilityAllocation: (equipments: CttEquipment[], events: CttEvent[], date: string) => Promise<CttAvailabilityAndAllocationResult>;
export default createAvailabilityAllocation;
