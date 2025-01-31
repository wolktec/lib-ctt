import { CttEvent } from "../../interfaces/availabilityAllocation.interface";
import { CttAvailabilityAwaitingTransshipment } from "../../interfaces/availabilityAwaitingTransshipment.interface";
export declare const localTimeZone = "America/Sao_Paulo";
/**
 * CALCULATE percentage and time awaiting transshipment by TYPE
 * @param partialEvents the equipment's events
 * @param closureEvents the equipment's events
 * @param workFronts logistic work fronts
 */
declare const createAvailabilityAwaitingTransshipment: (partialEvents: CttEvent[], closureEvents: CttEvent[], workFronts: number[]) => Promise<CttAvailabilityAwaitingTransshipment>;
export default createAvailabilityAwaitingTransshipment;
