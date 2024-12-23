import { Ton, WorkFronts } from "../interfaces/partialDelivered.interface";
declare const createPartialDelivered: (workFronts: WorkFronts[], realTons: Ton, date: string) => Promise<void>;
export default createPartialDelivered;
