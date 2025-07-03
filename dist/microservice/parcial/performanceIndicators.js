"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper/helper");
const AUTOPILOT_USE_GOAL = 75;
const AGRICULTURAL_EFFICIENCY_GOAL = 70;
const formatPerformanceIndicatorsWorkFronts = (workFrontJourneyMap, workFrontEfficiencyMap, workFrontShiftInefficiencyMap, workFrontProductionMap, workFrontWeightMap) => {
    const formattedWorkFronts = Object.entries(workFrontJourneyMap).map(([workFrontCode, workFrontJourney]) => {
        const parsedWorkFrontCode = Number(workFrontCode);
        const workFrontEfficiency = workFrontEfficiencyMap[parsedWorkFrontCode];
        const workFrontShiftInefficiency = workFrontShiftInefficiencyMap[parsedWorkFrontCode];
        const workFrontProduction = workFrontProductionMap[parsedWorkFrontCode];
        const workFrontWeight = workFrontWeightMap[parsedWorkFrontCode];
        const tonPerHour = workFrontProduction.hourlyDelivered.total;
        const awaitingTransshipmentData = workFrontJourney?.eventsDetails?.find((event) => event.name === "Aguardando Transbordo" && event.type === "MANUAL");
        const awaitingTransshipmentTime = (0, helper_1.hourToTime)(awaitingTransshipmentData?.totalTime || 0);
        const trucksLackData = workFrontJourney?.eventsDetails?.find((event) => event.name === "Falta caminhão" && event.type === "MANUAL");
        const trucksLackTotalTime = trucksLackData?.totalTime || 0;
        const trucksLackTime = (0, helper_1.hourToTime)(trucksLackTotalTime);
        const maneuversData = workFrontJourney?.eventsDetails?.find((event) => event.name === "Manobra" && event.type === "AUTOMATIC");
        const maneuversTime = (0, helper_1.hourToTime)(maneuversData?.averageTime || 0);
        const engineIdleTime = (0, helper_1.hourToTime)(workFrontJourney.engineIdle.time);
        const unproductiveTotalTime = workFrontJourney.unproductive.time + workFrontJourney.maintenance.time;
        const unproductiveTime = (0, helper_1.hourToTime)(unproductiveTotalTime);
        const autopilotUseValue = workFrontEfficiency.automaticPilot.usePilotAutomatic;
        const autopilotUse = {
            value: autopilotUseValue > 100 ? 100 : autopilotUseValue,
            goal: AUTOPILOT_USE_GOAL,
        };
        const ctOffenders = (unproductiveTotalTime * tonPerHour) /
            workFrontJourney.activeEquipments.total;
        const tOffenders = trucksLackTotalTime * tonPerHour;
        const agriculturalEfficiency = {
            value: workFrontEfficiency.elevator.utilization,
            goal: AGRICULTURAL_EFFICIENCY_GOAL,
        };
        const zones = workFrontJourney.harvestAreas.map((area) => area.split("/")[0]);
        const uniqueZones = Array.from(new Set(zones));
        return {
            workFrontCode: parsedWorkFrontCode,
            trips: workFrontWeight.trips,
            averageWeight: workFrontWeight.averageWeight,
            trucksLack: trucksLackTime,
            awaitingTransshipment: awaitingTransshipmentTime,
            engineIdle: engineIdleTime,
            autopilotUse,
            unproductiveTime,
            ctOffenders: ctOffenders || 0,
            tOffenders: tOffenders || 0,
            agriculturalEfficiency,
            maneuvers: maneuversTime,
            zone: uniqueZones.join(" / "),
            averageRadius: workFrontWeight.averageRadius || 0,
            averageShiftInefficiency: workFrontShiftInefficiency,
        };
    });
    return formattedWorkFronts;
};
const processSummaryData = (formattedWorkFronts) => {
    const summary = [];
    const totalCtOffenders = formattedWorkFronts.reduce((acc, workFront) => acc + workFront.ctOffenders, 0);
    for (const workFront of formattedWorkFronts) {
        const ctOffender = workFront.ctOffenders;
        summary.push({
            label: `Frente ${workFront.workFrontCode}`,
            lostTons: ctOffender,
            progress: ctOffender > 0
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
const createPerformanceIndicators = async (workFrontJourneyMap, workFrontEfficiencyMap, workFrontShiftInefficiencyMap, workFrontProductionMap, workFrontWeightMap) => {
    try {
        const formattedWorkFronts = formatPerformanceIndicatorsWorkFronts(workFrontJourneyMap, workFrontEfficiencyMap, workFrontShiftInefficiencyMap, workFrontProductionMap, workFrontWeightMap);
        const summary = processSummaryData(formattedWorkFronts);
        return {
            workFronts: formattedWorkFronts,
            summary,
        };
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
exports.default = createPerformanceIndicators;
//# sourceMappingURL=performanceIndicators.js.map