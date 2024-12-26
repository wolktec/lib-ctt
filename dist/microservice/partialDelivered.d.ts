import { PartialDeliveredResult, Ton, WorkFronts } from "../interfaces/partialDelivered.interface";
declare const createPartialDelivered: (workFronts: WorkFronts[], realTons: Ton, date: string) => Promise<PartialDeliveredResult>;
export default createPartialDelivered;
