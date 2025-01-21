import { CttEquipment, CttEvent } from "../../interfaces/availabilityAllocation.interface";
import { CttAvailability } from "../../interfaces/availabilityByHour.interface";
export declare const localTimeZone = "America/Sao_Paulo";
/**
 * CREATE the equipments availability by TYPE, FRONT and HOUR based on the events sent
 * @param equipments the group of equipments allocated in the front
 * @param events the events of the equipment(s)
 * @param date '2023-12-23 15:41:51' datetime filter
 */
declare const createAvailabilityByHour: (equipments: CttEquipment[], events: CttEvent[], date: string) => Promise<CttAvailability>;
export default createAvailabilityByHour;
