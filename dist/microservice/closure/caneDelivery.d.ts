import { CttCaneDelivery, CreateCaneDeliveryParams } from "../../interfaces/caneDelivery.interface";
/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param date - Date that the cane delivery is being calculated.
 * @param defaultUnit - Default unit data containing unit code, work fronts and productions map.
 * @param secondUnit - Second unit data containing unit code, work fronts and productions map.
 */
declare const createCaneDelivery: ({ date, defaultUnit, secondUnit, }: CreateCaneDeliveryParams) => Promise<CttCaneDelivery>;
export default createCaneDelivery;
