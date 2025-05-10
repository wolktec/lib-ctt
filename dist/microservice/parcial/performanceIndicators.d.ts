import { CttEquipment } from "../../interfaces/availabilityAllocation.interface";
import { CttDeliveredReturn, CttWorkFronts } from "../../interfaces/partialDelivered.interface";
import { CttEquipmentProductivity, CttPerformanceIndicators, CttTelemetry, CttShiftInefficiencyByFront, JourneyResponse } from "../../interfaces/performanceIndicators.interface";
/**
 * GET the performance indicators by Front
 * @param equipmentProductivity equipment coming from the productivity API
 * @param equipments equipments from the day
 * @param telemetry telemetry of the day
 * @param tonPerHour calc of ton per hour in the PartialDelivered
 * @param workFronts the fronts code with the goals
 * @param shiftsInefficiency
 * @param journeys
 */
declare const createPerformanceIndicators: (equipmentProductivity: CttEquipmentProductivity[], equipments: CttEquipment[], telemetry: CttTelemetry[], tonPerHour: CttDeliveredReturn[], workFronts: CttWorkFronts[], shiftsInefficiency: CttShiftInefficiencyByFront[], journeys: Record<string, JourneyResponse>) => Promise<CttPerformanceIndicators>;
export default createPerformanceIndicators;
