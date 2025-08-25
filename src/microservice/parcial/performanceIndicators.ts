import { hourToTime } from "../../helper/helper";

import {
  CttPerformanceIndicators,
  JourneyResponse,
  EfficiencyResponse,
  WorkFrontWeightReturn,
  PerformanceIndicatorsWorkFront,
  PerformanceIndicatorsSummary,
} from "../../interfaces/performanceIndicators.interface";

import { GetProductionReturn } from "../../interfaces/partialDelivered.interface";

const AUTOPILOT_USE_GOAL = 75;
const AGRICULTURAL_EFFICIENCY_GOAL = 70;

const formatPerformanceIndicatorsWorkFronts = (
  workFrontJourneyMap: Record<number, JourneyResponse>,
  workFrontJourneyTractorMap: Record<number, JourneyResponse>,
  workFrontEfficiencyMap: Record<number, EfficiencyResponse>,
  workFrontShiftInefficiencyMap: Record<number, string>,
  workFrontProductionMap: Record<number, GetProductionReturn>,
  workFrontWeightMap: Record<number, WorkFrontWeightReturn>
): PerformanceIndicatorsWorkFront[] => {
  const formattedWorkFronts: PerformanceIndicatorsWorkFront[] = Object.entries(
    workFrontJourneyMap
  ).map(([workFrontCode, workFrontJourney]) => {
    const parsedWorkFrontCode = Number(workFrontCode);

    const workFrontEfficiency = workFrontEfficiencyMap[parsedWorkFrontCode];
    const workFrontShiftInefficiency =
      workFrontShiftInefficiencyMap[parsedWorkFrontCode];
    const workFrontProduction = workFrontProductionMap[parsedWorkFrontCode];
    const workFrontWeight = workFrontWeightMap[parsedWorkFrontCode];
    const workFrontJourneyTractor =
      workFrontJourneyTractorMap[parsedWorkFrontCode];

    const tonPerHour = workFrontProduction.tonPerHourmeterGoal;

    const awaitingTransshipmentData = workFrontJourney?.eventsDetails?.find(
      (event) =>
        event.name === "Aguardando Transbordo" && event.type === "MANUAL"
    );
    const awaitingTransshipmentTime = hourToTime(
      awaitingTransshipmentData?.totalTime || 0
    );

    const trucksLackData = workFrontJourney?.eventsDetails?.find(
      (event) => event.name === "Falta de Caminhão" && event.type === "MANUAL"
    );
    const trucksLackTotalTime = trucksLackData?.totalTime || 0;
    const trucksLackTime = hourToTime(trucksLackTotalTime);

    const maneuversData = workFrontJourney?.eventsDetails?.find(
      (event) => event.name === "Manobra" && event.type === "AUTOMATIC"
    );
    const maneuversTime = hourToTime(maneuversData?.averageTime || 0);

    const engineIdleTime = hourToTime(workFrontJourney.engineIdle.time);

    const unproductiveTotalTime = workFrontJourney.unproductive.time;
    const unproductiveTime = hourToTime(unproductiveTotalTime);

    const maintenanceTime = hourToTime(workFrontJourney.maintenance.time);

    const loadingTime = hourToTime(
      workFrontJourneyTractor.eventsDetails?.find(
        (event) => event.name === "Carregando" && event.type === "AUTOMATIC"
      )?.averageTime || 0
    );

    const countLoadTime =
      workFrontJourneyTractor.eventsDetails?.find(
        (event) => event.name === "Carregando" && event.type === "AUTOMATIC"
      )?.totalCount || 0;

    const autopilotUseValue =
      workFrontEfficiency.automaticPilot.usePilotAutomatic;

    const autopilotUse = {
      value: autopilotUseValue > 100 ? 100 : autopilotUseValue,
      goal: AUTOPILOT_USE_GOAL,
    };

    const totalHourmeter = workFrontEfficiency.hourmeter.totalHourMeter;

    const ctOffenders = unproductiveTotalTime * tonPerHour;

    const tOffenders = trucksLackTotalTime * tonPerHour;

    const agriculturalEfficiency = {
      value: workFrontEfficiency.elevator.utilization,
      goal: AGRICULTURAL_EFFICIENCY_GOAL,
    };

    const zones = workFrontJourney.harvestAreas.map(
      (area) => area.split("/")[0]
    );

    const uniqueZones = Array.from(new Set(zones));

    return {
      workFrontCode: parsedWorkFrontCode,
      trips: workFrontWeight.trips,
      averageWeight: workFrontWeight.averageTripWeight,
      trucksLack: trucksLackTime,
      awaitingTransshipment: awaitingTransshipmentTime,
      engineIdle: engineIdleTime,
      autopilotUse,
      unproductiveTime,
      maintenanceTime,
      ctOffenders: ctOffenders || 0,
      tOffenders: tOffenders || 0,
      agriculturalEfficiency,
      maneuvers: maneuversTime,
      zone: uniqueZones.join(" / "),
      averageRadius: workFrontWeight.averageRadius || 0,
      averageShiftInefficiency: workFrontShiftInefficiency,
      totalHourmeter,
      loadingTime,
      countLoadTime: countLoadTime,
    };
  });

  return formattedWorkFronts;
};

const processSummaryData = (
  formattedWorkFronts: PerformanceIndicatorsWorkFront[]
): PerformanceIndicatorsSummary[] => {
  const summary: PerformanceIndicatorsSummary[] = [];

  const totalCtOffenders = formattedWorkFronts.reduce(
    (acc, workFront) => acc + workFront.ctOffenders,
    0
  );

  for (const workFront of formattedWorkFronts) {
    const ctOffender = workFront.ctOffenders;

    summary.push({
      label: `Frente ${workFront.workFrontCode}`,
      lostTons: ctOffender,
      progress:
        ctOffender > 0
          ? Number(((ctOffender / totalCtOffenders) * 100).toFixed(2))
          : 0,
    });
  }

  summary.unshift({
    label: `Geral`,
    lostTons: totalCtOffenders,
    progress: 100,
  });

  return summary;
};

/**
 * GET the performance indicators by Front
 * @param workFrontJourneyMap - Map of journeys received from the API journey service.
 * @param workFrontEfficiencyMap - Map of efficiencies received from the API efficiency service.
 * @param workFrontShiftInefficiencyMap - Map of shifts inefficiencies received from the API shift service.
 * @param workFrontProductionMap - Map of workFront productions received from the API production service.
 * @param workFrontWeightMap - Map of workFront weights received from the API weight service.
 */
const createPerformanceIndicators = async (
  workFrontJourneyMap: Record<number, JourneyResponse>,
  workFrontJourneyTractorMap: Record<number, JourneyResponse>,
  workFrontEfficiencyMap: Record<number, EfficiencyResponse>,
  workFrontShiftInefficiencyMap: Record<number, string>,
  workFrontProductionMap: Record<number, GetProductionReturn>,
  workFrontWeightMap: Record<number, WorkFrontWeightReturn>
): Promise<CttPerformanceIndicators> => {
  try {
    const formattedWorkFronts = formatPerformanceIndicatorsWorkFronts(
      workFrontJourneyMap,
      workFrontJourneyTractorMap,
      workFrontEfficiencyMap,
      workFrontShiftInefficiencyMap,
      workFrontProductionMap,
      workFrontWeightMap
    );

    const summary = processSummaryData(formattedWorkFronts);

    return {
      workFronts: formattedWorkFronts,
      summary,
    };
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

export default createPerformanceIndicators;
