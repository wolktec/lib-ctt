import { CttAvailabilityAndAllocationResult, CttEquipment, CttEvent } from "../../interfaces/availabilityAllocation.interface";
import { CttInterferences } from "../../interfaces/performanceIndicators.interface";
import { CttWorkFronts } from "../../interfaces/partialDelivered.interface";
export declare const localTimeZone = "America/Sao_Paulo";
/**
 * GET the available equipments based on the events registered by FRONT and GROUP
 * @param equipments the group of equipments allocated in the front
 * @param events the events of the equipment
 * @param date '2023-12-23 15:41:51' datetime filter
 * @param interferences interferences coming from the interference table
 * @param workFronts workFronts coming from the workFront table
 */
declare const createAvailabilityAllocation: (equipments: CttEquipment[], events: CttEvent[], date: string, interferences: CttInterferences[], workFronts: CttWorkFronts[]) => Promise<CttAvailabilityAndAllocationResult>;
export default createAvailabilityAllocation;
