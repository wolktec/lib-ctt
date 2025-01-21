import { CttEvent } from "../../interfaces/availabilityAllocation.interface";
import { CttAvailabilityAwaitingTransshipment } from "../../interfaces/availabilityAwaitingTransshipment.interface";
export declare const localTimeZone = "America/Sao_Paulo";
/**
 * CALCULATE percentage and time awaiting transshipment by TYPE
 * @param partialEvents the equipment's events
 * @param closureEvents the equipment's events
 */
declare const createAvailabilityAwaitingTransshipment: (partialEvents: CttEvent[], closureEvents: CttEvent[]) => Promise<CttAvailabilityAwaitingTransshipment>;
export default createAvailabilityAwaitingTransshipment;
