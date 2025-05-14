import { AwaitingTransshipmentData, CttAvailabilityAwaitingTransshipment } from "../../interfaces/availabilityAwaitingTransshipment.interface";
/**
 * CALCULATE percentage and time awaiting transshipment by TYPE
 * @param partialEvents the equipment's events
 * @param closureEvents the equipment's events
 * @param workFronts logistic work fronts
 */
declare const createAvailabilityAwaitingTransshipment: (partialAwaitingTransshipmentMap: Record<number, AwaitingTransshipmentData>, closureAwaitingTransshipmentMap: Record<number, AwaitingTransshipmentData>) => Promise<CttAvailabilityAwaitingTransshipment>;
export default createAvailabilityAwaitingTransshipment;
