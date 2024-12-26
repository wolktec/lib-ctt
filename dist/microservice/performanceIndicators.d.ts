import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
import { CttEquipmentProductivity } from "../interfaces/performanceIndicators.interface";
/**
  * GET the performance indicators by Front
  * @param equipmentProductivity equipment coming from the productivity API
  * @param events events from the day
  * @param date '2023-12-23 15:41:51' datetime filter
 */
declare const createPerformanceIndicators: (equipmentProductivity: CttEquipmentProductivity[], events: CttEvent[], equipments: CttEquipment[], date: string) => Promise<void>;
export default createPerformanceIndicators;
