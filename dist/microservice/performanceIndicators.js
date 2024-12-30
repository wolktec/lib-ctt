"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../helper/helper");
/**
  * GET the performance indicators by Front
  * @param equipmentProductivity equipment coming from the productivity API
  * @param events events from the day
  * @param equipments equipments from the day
  * @param idleEvents data from the operation table
  * @param telemetry telemetry of the day
*/
const createPerformanceIndicators = async (equipmentProductivity, events, equipments, idleEvents, telemetry, tonPerHour) => {
    try {
        if (!equipmentProductivity || !events || !equipments) {
            return 'Parametros inválidos';
        }
        let equipmentsProductivityByFront = (0, helper_1.groupEquipmentsProductivityByFront)(equipmentProductivity, equipments);
        const tripQtd = getTripQtdByFront(equipmentsProductivityByFront);
        const averageWeight = getAverageWeight(equipmentsProductivityByFront);
        const awaitingTransshipment = getAwaitingTransshipment(events);
        const idleTime = getIdleTime(events, idleEvents);
        const hourmeterByFront = (0, helper_1.groupEquipmentTelemetryByFront)(equipments, telemetry.filter(hourMeter => hourMeter.sensor_name === 'hour_meter'));
        const engineHours = (0, helper_1.calcTelemetryByFront)(hourmeterByFront);
        const autoPilotByFront = (0, helper_1.groupEquipmentTelemetryByFront)(equipments, telemetry.filter(hourMeter => hourMeter.sensor_name === 'autopilot_hour_meter'));
        const autoPilot = (0, helper_1.calcTelemetryByFront)(autoPilotByFront);
        const autoPilotUse = calcAutopilotUse(autoPilot, engineHours);
        const trucksLack = calcTrucksLack(events);
        const tOffenders = calcTOffenders(trucksLack.trucksLack, tonPerHour);
        const elevatorHoursByFront = (0, helper_1.groupEquipmentTelemetryByFront)(equipments, telemetry.filter(hourMeter => hourMeter.sensor_name === 'elevator_conveyor_belt_hour_meter'));
        const elevatorHours = (0, helper_1.calcTelemetryByFront)(elevatorHoursByFront);
        const agriculturalEfficiency = calcAgriculturalEfficiency(elevatorHours, engineHours);
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
const getTripQtdByFront = (equipmentProductivity) => {
    const tripQtd = equipmentProductivity.reduce((account, equipment) => {
        const { workFrontCode, trips } = equipment;
        if (account[workFrontCode]) {
            account[workFrontCode] += trips;
        }
        else {
            account[workFrontCode] = trips;
        }
        return account;
    }, {});
    return tripQtd;
};
/**
  * GET the average weight by Front
  * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getAverageWeight = (equipmentsProductivity) => {
    const groupedAverageData = equipmentsProductivity.reduce((account, equipment) => {
        const { workFrontCode, averageWeight } = equipment;
        account[workFrontCode] = account[workFrontCode] || { sum: 0, count: 0 };
        account[workFrontCode].sum += averageWeight;
        account[workFrontCode].count++;
        return account;
    }, {});
    const averages = Object.entries(groupedAverageData).reduce((averages, [workFront, averageData]) => {
        averages[workFront] = (0, helper_1.normalizeCalc)(averageData.sum / averageData.count, 2);
        return averages;
    }, {});
    return averages;
};
const getAwaitingTransshipment = (events) => {
    let awaitingTransshipment = {};
    events.forEach(event => {
        if (event.interference && event.interference.name === 'Aguardando Transbordo') {
            const { workFront } = event;
            if (awaitingTransshipment[workFront.code]) {
                awaitingTransshipment[workFront.code] += (0, helper_1.getEventTime)(event);
            }
            else {
                awaitingTransshipment[workFront.code] = (0, helper_1.getEventTime)(event);
            }
        }
    });
    const formattedTransshipment = {};
    for (const [code, timeInHours] of Object.entries(awaitingTransshipment)) {
        const timeInMs = timeInHours * 3600 * 1000;
        formattedTransshipment[code] = (0, helper_1.msToTime)(timeInMs);
    }
    return formattedTransshipment;
};
const getIdleTime = (events, idleEvents) => {
    let idleTime = {};
    for (const event of events) {
        const diffS = (event.time.end - event.time.start) / 1000;
        const idleEvent = idleEvents?.find(idleEvent => idleEvent.name === event.name);
        if (idleEvent && idleEvent.engine_idle_sec && (diffS > idleEvent.engine_idle_sec && event.time.end > 0)) {
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
        if (engineHours[workFrontCode]) {
            autopilotUse[workFrontCode] = (0, helper_1.normalizeCalc)(autoPilot[workFrontCode] / engineHours[workFrontCode] * 100, 2);
        }
        else {
            autopilotUse[workFrontCode] = 0;
        }
    }
    return autopilotUse;
};
const calcTrucksLack = (events) => {
    let trucksLack = {};
    events.forEach(event => {
        if (event.interference && event.interference.name === 'Falta caminhão') {
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
    for (const [code, timeInHours] of Object.entries(trucksLack)) {
        const timeInMs = timeInHours * 3600 * 1000;
        formattedTrucksLack[code] = (0, helper_1.msToTime)(timeInMs);
    }
    return {
        "formattedTrucksLack": formattedTrucksLack,
        "trucksLack": trucksLack
    };
};
const calcTOffenders = (trucksLack, tonPerHour) => {
    let tOffenders = {};
    for (const workFrontCode in trucksLack) {
        if (tonPerHour.hasOwnProperty(workFrontCode)) {
            if (tOffenders[workFrontCode]) {
                tOffenders[workFrontCode] += trucksLack[workFrontCode] * tonPerHour[workFrontCode];
            }
            else {
                tOffenders[workFrontCode] = trucksLack[workFrontCode] * tonPerHour[workFrontCode];
            }
        }
    }
    return tOffenders;
};
// elevator_conveyor_belt_hour_meter
const calcAgriculturalEfficiency = (elevatorHours, engineHours) => {
    let agriculturalEfficiency = {};
    for (const workFrontCode in elevatorHours) {
        if (engineHours.hasOwnProperty(workFrontCode)) {
            if (agriculturalEfficiency[workFrontCode]) {
                agriculturalEfficiency[workFrontCode].value += (0, helper_1.normalizeCalc)((elevatorHours[workFrontCode] / engineHours[workFrontCode]) * 100);
            }
            else {
                agriculturalEfficiency[workFrontCode] = { value: 0, goal: 70 };
                agriculturalEfficiency[workFrontCode].value = (0, helper_1.normalizeCalc)((elevatorHours[workFrontCode] / engineHours[workFrontCode]) * 100);
            }
        }
    }
    return agriculturalEfficiency;
};
exports.default = createPerformanceIndicators;
//# sourceMappingURL=performanceIndicators.js.map