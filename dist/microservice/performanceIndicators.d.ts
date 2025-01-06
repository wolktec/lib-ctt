import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
import { CttTon, CttWorkFronts } from "../interfaces/partialDelivered.interface";
import { CttEquipmentProductivity, CttIdleEvents, CttInterferences, CttPerformanceIndicators, CttTelemetry } from "../interfaces/performanceIndicators.interface";
/**
  * GET the performance indicators by Front
  * @param equipmentProductivity equipment coming from the productivity API
  * @param events events from the day
  * @param equipments equipments from the day
  * @param idleEvents data from the operation table
  * @param telemetry telemetry of the day
  * @param tonPerHour calc of ton per hour in the PartialDelivered
  * @param workFronts the fronts code with the goals
  * @param interferences interferences coming from the interference table
*/
declare const createPerformanceIndicators: (equipmentProductivity: CttEquipmentProductivity[], events: CttEvent[], equipments: CttEquipment[], idleEvents: CttIdleEvents[], telemetry: CttTelemetry[], tonPerHour: CttTon, workFronts: CttWorkFronts[], interferences: CttInterferences[]) => Promise<CttPerformanceIndicators>;
export default createPerformanceIndicators;
