import { AvailabilityAndAllocationResult, Equipment, Event } from "../interfaces/availabilityAllocation.interface";
export declare const localTimeZone = "America/Sao_Paulo";
/**
  * GET the available equipments based on the events registered by FRONT and GROUP
  * @param equipments the group of equipments allocated in the front
  * @param events the events of the equipment
 */
declare const createAvailabilityAllocation: (equipments: Equipment[], events: Event[], date: string) => Promise<AvailabilityAndAllocationResult>;
export default createAvailabilityAllocation;
