import { CttPerformanceIndicators, JourneyResponse, EfficiencyResponse, WorkFrontWeightReturn } from "../../interfaces/performanceIndicators.interface";
import { GetProductionReturn } from "../../interfaces/partialDelivered.interface";
/**
 * GET the performance indicators by Front
 * @param workFrontJourneyMap - Map of journeys received from the API journey service.
 * @param workFrontEfficiencyMap - Map of efficiencies received from the API efficiency service.
 * @param workFrontShiftInefficiencyMap - Map of shifts inefficiencies received from the API shift service.
 * @param workFrontProductionMap - Map of workFront productions received from the API production service.
 * @param workFrontWeightMap - Map of workFront weights received from the API weight service.
 */
declare const createPerformanceIndicators: (workFrontJourneyMap: Record<number, JourneyResponse>, workFrontJourneyTractorMap: Record<number, JourneyResponse>, workFrontEfficiencyMap: Record<number, EfficiencyResponse>, workFrontShiftInefficiencyMap: Record<number, string>, workFrontProductionMap: Record<number, GetProductionReturn>, workFrontWeightMap: Record<number, WorkFrontWeightReturn>, tonPerHourGoalByTractor: number) => Promise<CttPerformanceIndicators>;
export default createPerformanceIndicators;
