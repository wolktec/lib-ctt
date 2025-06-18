import { CttPartialDeliveredResult, GetProductionReturn } from "../../interfaces/partialDelivered.interface";
/**
 * GET the partial delivered tons by Front
 * @param workFrontProductionMap - Map of workFront productions received from the API production service.
 */
declare const createPartialDelivered: (workFrontProductionMap: Record<number, GetProductionReturn>) => Promise<CttPartialDeliveredResult>;
export default createPartialDelivered;
