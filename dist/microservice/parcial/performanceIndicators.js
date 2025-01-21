"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper/helper");
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
const createPerformanceIndicators = async (equipmentProductivity, events, equipments, idleEvents, telemetry, tonPerHour, workFronts, interferences) => {
    try {
        const tripQtd = getTripQtdByFront(equipmentProductivity, workFronts);
        const averageWeight = getAverageWeight(equipmentProductivity, workFronts);
        const awaitingTransshipment = getAwaitingTransshipment(events);
        const idleTime = getIdleTime(events, idleEvents);
        const hourmeterByFront = (0, helper_1.groupEquipmentTelemetryByFront)(equipments, telemetry.filter((hourMeter) => hourMeter.sensor_name === "hour_meter"));
        const engineHours = (0, helper_1.calcTelemetryByFront)(hourmeterByFront);
        const autoPilotByFront = (0, helper_1.groupEquipmentTelemetryByFront)(equipments, telemetry.filter((hourMeter) => hourMeter.sensor_name === "autopilot_hour_meter"));
        const autoPilot = (0, helper_1.calcTelemetryByFront)(autoPilotByFront);
        const autoPilotUse = calcAutopilotUse(autoPilot, engineHours);
        const trucksLack = calcTrucksLack(events);
        const tOffenders = calcTOffenders(trucksLack.trucksLack, tonPerHour);
        const elevatorHoursByFront = (0, helper_1.groupEquipmentTelemetryByFront)(equipments, telemetry.filter((hourMeter) => hourMeter.sensor_name === "elevator_conveyor_belt_hour_meter"));
        const elevatorHours = (0, helper_1.calcTelemetryByFront)(elevatorHoursByFront);
        const agriculturalEfficiency = calcAgriculturalEfficiency(elevatorHours, engineHours);
        const maneuvers = calcManuvers(events);
        const filteredEvents = (0, helper_1.getHarvesterEvents)(equipments, events);
        const unproductiveTime = (await (0, helper_1.calcJourneyByFront)(filteredEvents, interferences)).totalInterferenceTime;
        const ctOffenders = await calcCtOffenders(unproductiveTime, equipments, tonPerHour);
        const unproductiveTimeFormatted = formatUnproductiveTime(unproductiveTime);
        const averageRadius = await calcAverageRadius(events, telemetry.filter((hourMeter) => hourMeter.sensor_name === "odometer"));
        const summary = calcSummary(ctOffenders);
        const formatPerformanceIndicator = formatPerformanceIndicatorReturn(tripQtd, averageWeight, awaitingTransshipment, idleTime, autoPilotUse, trucksLack.formattedTrucksLack, tOffenders, agriculturalEfficiency, maneuvers, workFronts, ctOffenders, unproductiveTimeFormatted, averageRadius, summary);
        return formatPerformanceIndicator;
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
/**
 * GET the trips quantity by Front
 * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getTripQtdByFront = (equipmentProductivity, workFronts) => {
    let tripQtd = {};
    workFronts.forEach((workFront) => {
        let totalTrips = 0;
        equipmentProductivity.forEach((equipment) => {
            if (equipment.workFrontCode === workFront.code) {
                totalTrips += equipment.trips;
            }
        });
        if (tripQtd[workFront.code]) {
            tripQtd[workFront.code] += totalTrips;
        }
        else {
            tripQtd[workFront.code] = totalTrips;
        }
    });
    return tripQtd;
};
/**
 * GET the average weight by Front
 * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getAverageWeight = (equipmentsProductivity, workFronts) => {
    const groupedAverageData = equipmentsProductivity.reduce((account, equipment) => {
        const { workFrontCode, averageWeight } = equipment;
        if (!account[workFrontCode]) {
            account[workFrontCode] = { sum: 0, count: 0 };
        }
        account[workFrontCode].sum += averageWeight;
        account[workFrontCode].count++;
        return account;
    }, {});
    const averages = Object.fromEntries(workFronts.map(({ code }) => {
        const data = groupedAverageData[code] || { sum: 0, count: 0 };
        const average = data.count > 0 ? data.sum / data.count : 0;
        return [code, (0, helper_1.normalizeCalc)(average, 2)];
    }));
    return averages;
};
const getAwaitingTransshipment = (events) => {
    let awaitingTransshipment = {};
    events.forEach((event) => {
        if (event.interference &&
            event.interference.name === "Aguardando Transbordo") {
            const { workFront } = event;
            if (event.time.end > 0) {
                if (awaitingTransshipment[workFront.code]) {
                    awaitingTransshipment[workFront.code] += (0, helper_1.getEventTime)(event) / 3600;
                }
                else {
                    awaitingTransshipment[workFront.code] = (0, helper_1.getEventTime)(event) / 3600;
                }
            }
        }
    });
    const formattedTransshipment = {};
    if (awaitingTransshipment) {
        for (const [code, timeInHours] of Object.entries(awaitingTransshipment)) {
            if (!timeInHours) {
                formattedTransshipment[code] = "00:00:00";
            }
            else {
                const timeInMs = timeInHours * 3600 * 1000;
                formattedTransshipment[code] = (0, helper_1.msToTime)(timeInMs);
            }
        }
    }
    return formattedTransshipment;
};
const getIdleTime = (events, idleEvents) => {
    let idleTime = {};
    for (const event of events) {
        const diffS = (event.time.end - event.time.start) / 1000;
        const idleEvent = idleEvents?.find((idleEvent) => idleEvent.name === event.name);
        if (idleEvent &&
            idleEvent.engine_idle_sec &&
            diffS > idleEvent.engine_idle_sec &&
            event.time.end > 0) {
            if (idleTime[event.workFront.code]) {
                idleTime[event.workFront.code] += diffS - idleEvent.engine_idle_sec;
            }
            else {
                idleTime[event.workFront.code] = diffS - idleEvent.engine_idle_sec;
            }
        }
    }
    const formattedIdle = {};
    for (const [code, timeInHours] of Object.entries(idleTime)) {
        const timeInMs = timeInHours * 1000;
        formattedIdle[code] = (0, helper_1.msToTime)(timeInMs);
    }
    return formattedIdle;
};
const calcAutopilotUse = (autoPilot, engineHours) => {
    const autopilotUse = {};
    for (const workFrontCode in autoPilot) {
        autopilotUse[workFrontCode] = { value: 0, goal: 75 };
        if (engineHours[workFrontCode]) {
            autopilotUse[workFrontCode].value = (0, helper_1.normalizeCalc)((autoPilot[workFrontCode] / engineHours[workFrontCode]) * 100, 2);
        }
        else {
            autopilotUse[workFrontCode].value = 0;
        }
    }
    return autopilotUse;
};
const calcTrucksLack = (events) => {
    let trucksLack = {};
    events.forEach((event) => {
        if (event.interference && event.interference.name === "Falta caminhão") {
            const { workFront } = event;
            if (trucksLack[workFront.code]) {
                trucksLack[workFront.code] += (0, helper_1.getEventTime)(event);
            }
            else {
                trucksLack[workFront.code] = (0, helper_1.getEventTime)(event);
            }
        }
    });
    const formattedTrucksLack = {};
    if (trucksLack) {
        for (const [code, timeInHours] of Object.entries(trucksLack)) {
            const timeInMs = timeInHours * 1000;
            formattedTrucksLack[code] = (0, helper_1.msToTime)(timeInMs);
        }
    }
    return {
        formattedTrucksLack: formattedTrucksLack,
        trucksLack: trucksLack,
    };
};
const calcTOffenders = (trucksLack, delivered) => {
    let tOffenders = {};
    for (const workFrontCode in trucksLack) {
        const tonPerHourEntry = delivered.find((entry) => entry.workFrontCode === +workFrontCode);
        if (tonPerHourEntry) {
            if (tOffenders[workFrontCode]) {
                tOffenders[workFrontCode] +=
                    trucksLack[workFrontCode] * tonPerHourEntry.tonPerHour;
            }
            else {
                tOffenders[workFrontCode] =
                    trucksLack[workFrontCode] * tonPerHourEntry.tonPerHour;
            }
        }
    }
    return tOffenders;
};
const calcAgriculturalEfficiency = (elevatorHours, engineHours) => {
    let agriculturalEfficiency = {};
    for (const workFrontCode in elevatorHours) {
        if (engineHours.hasOwnProperty(workFrontCode)) {
            if (agriculturalEfficiency[workFrontCode]) {
                agriculturalEfficiency[workFrontCode].value += (0, helper_1.normalizeCalc)((elevatorHours[workFrontCode] / engineHours[workFrontCode]) * 100, 2);
            }
            else {
                agriculturalEfficiency[workFrontCode] = { value: 0, goal: 70 };
                agriculturalEfficiency[workFrontCode].value = (0, helper_1.normalizeCalc)((elevatorHours[workFrontCode] / engineHours[workFrontCode]) * 100, 2);
            }
        }
    }
    return agriculturalEfficiency;
};
const calcManuvers = (events) => {
    let manuvers = {};
    events.forEach((event) => {
        if (event.time.end > 0 && event.name === "Manobra") {
            if (manuvers[event.workFront.code]) {
                manuvers[event.workFront.code] += (0, helper_1.getEventTime)(event) / 3600;
            }
            else {
                manuvers[event.workFront.code] = (0, helper_1.getEventTime)(event) / 3600;
            }
        }
    });
    const formattedManuvers = {};
    for (const [code, timeInHours] of Object.entries(manuvers)) {
        if (!timeInHours) {
            formattedManuvers[code] = "00:00:00";
        }
        else {
            const timeInMs = timeInHours * 3600 * 1000;
            formattedManuvers[code] = (0, helper_1.msToTime)(timeInMs);
        }
    }
    return formattedManuvers;
};
const calcCtOffenders = async (unproductiveTime, equipments, delivered) => {
    const harvesterEquipments = {};
    let ctOffenders = {};
    if (!unproductiveTime || typeof unproductiveTime !== "object") {
        throw new Error("unproductiveTime is not a valid object");
    }
    for (const [workFrontCode, time] of Object.entries(unproductiveTime)) {
        for (const equipment of equipments) {
            if (equipment.work_front_code !== +workFrontCode ||
                equipment.description !== "Colhedoras") {
                continue;
            }
            harvesterEquipments[workFrontCode] =
                (harvesterEquipments[workFrontCode] || 0) + 1;
        }
        const tonPerHourEntry = delivered.find((entry) => entry.workFrontCode === +workFrontCode);
        if (tonPerHourEntry) {
            if (ctOffenders[workFrontCode]) {
                ctOffenders[workFrontCode] += (0, helper_1.normalizeCalc)((time * tonPerHourEntry.tonPerHour) /
                    harvesterEquipments[workFrontCode], 2);
            }
            else {
                ctOffenders[workFrontCode] = (0, helper_1.normalizeCalc)((time * tonPerHourEntry.tonPerHour) /
                    harvesterEquipments[workFrontCode], 2);
            }
        }
    }
    return ctOffenders;
};
const calcAverageRadius = async (events, odometerReadings) => {
    try {
        const displacementEvents = events.filter((event) => event.name === "Deslocamento Carregamento" ||
            event.name === "Deslocamento Descarga");
        const distances = await Promise.all(displacementEvents.map(async (event) => {
            return (0, helper_1.getTotalHourmeter)(odometerReadings);
        }));
        let averageRadius = {};
        events.forEach((event) => {
            const { workFront } = event;
            const totalDistance = distances.reduce((sum, distance) => sum + distance, 0);
            averageRadius[workFront.code] =
                displacementEvents.length > 0
                    ? (0, helper_1.normalizeCalc)(totalDistance / displacementEvents.length)
                    : 0;
        });
        return averageRadius;
    }
    catch (err) {
        throw err;
    }
};
const formatUnproductiveTime = (unproductiveTime) => {
    const formatUnproductiveTime = {};
    for (const [code, timeInHours] of Object.entries(unproductiveTime)) {
        if (!timeInHours) {
            formatUnproductiveTime[code] = "00:00:00";
        }
        else {
            const timeInMs = timeInHours * 3600 * 1000;
            formatUnproductiveTime[code] = (0, helper_1.msToTime)(timeInMs);
        }
    }
    return formatUnproductiveTime;
};
const calcSummary = (ctOffenders) => {
    let total = 0;
    const formatCtOffender = {};
    for (const [workFrontCode, ctOffender] of Object.entries(ctOffenders)) {
        total += ctOffender;
        if (formatCtOffender[workFrontCode]) {
            formatCtOffender[workFrontCode] += ctOffender;
        }
        else {
            formatCtOffender[workFrontCode] = ctOffender;
        }
    }
    let summary = [];
    let totalPercentage = 0;
    for (const [workFrontCode, ctOffender] of Object.entries(formatCtOffender)) {
        totalPercentage += (ctOffender / total) * 100;
        summary.push({
            label: `Frente ${workFrontCode}`,
            lostTons: ctOffender,
            progress: +((ctOffender / total) * 100).toFixed(2),
        });
    }
    summary.push({
        label: `Geral`,
        lostTons: total,
        progress: (0, helper_1.normalizeCalc)(totalPercentage, 2),
    });
    return summary;
};
const formatPerformanceIndicatorReturn = (tripQtd, averageWeight, awaitingTransshipment, idleTime, autoPilotUse, trucksLack, tOffenders, agriculturalEfficiency, maneuvers, workFronts, ctOffenders, unproductiveTime, averageRadius, summary) => {
    const availabilityAllocation = {
        workFronts: workFronts.map((workfront) => {
            const workfrontCode = workfront.code;
            return {
                workFrontCode: workfrontCode,
                trips: tripQtd[workfrontCode] || 0,
                averageWeight: averageWeight[workfrontCode] || 0,
                trucksLack: trucksLack[workfrontCode] || "00:00:00",
                awaitingTransshipment: awaitingTransshipment[workfrontCode] || "00:00:00",
                engineIdle: idleTime[workfrontCode] || "00:00:00",
                autopilotUse: {
                    value: autoPilotUse[workfrontCode]?.value || 0,
                    goal: autoPilotUse[workfrontCode]?.goal || 0,
                },
                elevatorUse: 0,
                unproductiveTime: unproductiveTime[workfrontCode],
                ctOffenders: ctOffenders[workfrontCode] || 0,
                tOffenders: tOffenders[workfrontCode] || 0,
                agriculturalEfficiency: {
                    value: agriculturalEfficiency[workfrontCode]?.value || 0,
                    goal: agriculturalEfficiency[workfrontCode]?.goal || 0,
                },
                maneuvers: maneuvers[workfrontCode] || "00:00:00",
                zone: 0,
                averageRadius: averageRadius[workfrontCode] || 0,
            };
        }),
        summary: summary,
    };
    return availabilityAllocation;
};
exports.default = createPerformanceIndicators;
//# sourceMappingURL=performanceIndicators.js.map