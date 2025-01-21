import { CttPartialDeliveredResult, CttTon, CttWorkFronts } from "../../interfaces/partialDelivered.interface";
/**
 * GET the partial develired tons by Front
 * @param workFronts the fronts code with the goals
 * @param realTons object with the tons by Front, it comes from the productivity API
 * @param date '2023-12-23 15:41:51' datetime filter
 */
declare const createPartialDelivered: (workFronts: CttWorkFronts[], realTons: CttTon, date: string) => Promise<CttPartialDeliveredResult>;
export default createPartialDelivered;
