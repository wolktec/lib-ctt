import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
import { CttTon } from "../interfaces/partialDelivered.interface";
import { CttEquipmentProductivity, CttIdleEvents, CttTelemetry } from "../interfaces/performanceIndicators.interface";
/**
  * GET the performance indicators by Front
  * @param equipmentProductivity equipment coming from the productivity API
  * @param events events from the day
  * @param equipments equipments from the day
  * @param idleEvents data from the operation table
  * @param telemetry telemetry of the day
*/
declare const createPerformanceIndicators: (equipmentProductivity: CttEquipmentProductivity[], events: CttEvent[], equipments: CttEquipment[], idleEvents: CttIdleEvents[], telemetry: CttTelemetry[], tonPerHour: CttTon) => Promise<"Parametros inválidos" | undefined>;
export default createPerformanceIndicators;
