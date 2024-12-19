import { Equipment, Event } from "../interfaces/availabilityAllocation.interface";
/**
  * GET the available equipments based on the events registered by FRONT and GROUP
  * @param equipments the group of equipments allocated in the front
  * @param events the events of the equipment
 */
declare const createAvailabilityAllocation: (equipments: Equipment[], events: Event[], date: string) => Promise<Map<string, number>>;
export default createAvailabilityAllocation;
