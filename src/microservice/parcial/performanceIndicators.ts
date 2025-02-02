import {
  calcJourneyByFront,
  calcTelemetryByFront,
  getEventTime,
  getHarvesterEvents,
  getTotalHourmeter,
  groupEquipmentTelemetryByFront,
  msToTime,
  normalizeCalc,
} from "../../helper/helper";
import {
  CttEquipment,
  CttEvent,
} from "../../interfaces/availabilityAllocation.interface";
import {
  CttDeliveredReturn,
  CttTon,
  CttWorkFronts,
} from "../../interfaces/partialDelivered.interface";
import {
  CttAgriculturalEfficiency,
  CttAutoPilotUse,
  CttEquipmentProductivity,
  CttEquipmentProductivityFront,
  CttIdleEvents,
  CttInterferences,
  CttPerformanceIndicators,
  CttSummaryReturn,
  CttTelemetry,
  CttTrucksLack,
} from "../../interfaces/performanceIndicators.interface";

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
const createPerformanceIndicators = async (
  equipmentProductivity: CttEquipmentProductivity[],
  events: CttEvent[],
  equipments: CttEquipment[],
  idleEvents: CttIdleEvents[],
  telemetry: CttTelemetry[],
  tonPerHour: CttDeliveredReturn[],
  workFronts: CttWorkFronts[],
  interferences: CttInterferences[]
): Promise<CttPerformanceIndicators> => {
  try {
    const tripQtd = getTripQtdByFront(equipmentProductivity, workFronts);
    const averageWeight = getAverageWeight(equipmentProductivity, workFronts);
    const awaitingTransshipment = getAwaitingTransshipment(events);
    const idleTime = getIdleTime(events, idleEvents);

    const engineHours = groupEquipmentTelemetryByFront(
      equipments,
      telemetry.filter((hourMeter) => hourMeter.sensor_name === "hour_meter")
    );

    const autoPilot = groupEquipmentTelemetryByFront(
      equipments,
      telemetry.filter(
        (hourMeter) => hourMeter.sensor_name === "autopilot_hour_meter"
      )
    );

    const autoPilotUse = calcAutopilotUse(autoPilot, engineHours);
    const trucksLack = calcTrucksLack(events);
    const tOffenders = calcTOffenders(trucksLack.trucksLack, tonPerHour);

    const elevatorHours = groupEquipmentTelemetryByFront(
      equipments,
      telemetry.filter(
        (hourMeter) =>
          hourMeter.sensor_name === "elevator_conveyor_belt_hour_meter"
      )
    );

    const elevatorUse = calcElevatorUse(elevatorHours, engineHours);

    const agriculturalEfficiency = calcAgriculturalEfficiency(
      elevatorHours,
      engineHours
    );
    const maneuvers = calcManuvers(events);

    const filteredEvents = getHarvesterEvents(equipments, events);

    const unproductiveTime = (
      await calcJourneyByFront(filteredEvents, interferences)
    ).totalInterferenceTime;

    const ctOffenders = await calcCtOffenders(
      unproductiveTime,
      equipments,
      tonPerHour
    );
    const unproductiveTimeFormatted = formatUnproductiveTime(unproductiveTime);

    const averageRadius = await calcAverageRadius(
      events,
      telemetry.filter((hourMeter) => hourMeter.sensor_name === "odometer")
    );

    const summary = calcSummary(ctOffenders, workFronts);

    const formatPerformanceIndicator = formatPerformanceIndicatorReturn(
      tripQtd,
      averageWeight,
      awaitingTransshipment,
      idleTime,
      autoPilotUse,
      trucksLack.formattedTrucksLack,
      tOffenders,
      agriculturalEfficiency,
      maneuvers,
      workFronts,
      ctOffenders,
      unproductiveTimeFormatted,
      averageRadius,
      summary,
      elevatorUse
    );

    return formatPerformanceIndicator;
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

/**
 * GET the trips quantity by Front
 * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getTripQtdByFront = (
  equipmentProductivity: CttEquipmentProductivityFront[],
  workFronts: CttWorkFronts[]
): Record<string, number> => {
  let tripQtd: Record<string, number> = {};
  workFronts.forEach((workFront) => {
    let totalTrips = 0;

    equipmentProductivity.forEach((equipment) => {
      if (equipment.workFrontCode === workFront.code) {
        totalTrips += equipment.trips;
      }
    });
    if (tripQtd[workFront.code]) {
      tripQtd[workFront.code] += totalTrips;
    } else {
      tripQtd[workFront.code] = totalTrips;
    }
  });

  return tripQtd;
};
/**
 * GET the average weight by Front
 * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getAverageWeight = (
  equipmentsProductivity: CttEquipmentProductivityFront[],
  workFronts: CttWorkFronts[]
): Record<string, number> => {
  const groupedAverageData = equipmentsProductivity.reduce(
    (account, equipment) => {
      const { workFrontCode, averageWeight } = equipment;

      if (!account[workFrontCode]) {
        account[workFrontCode] = { sum: 0, count: 0 };
      }

      account[workFrontCode].sum += averageWeight;
      account[workFrontCode].count++;
      return account;
    },
    {} as Record<string, { sum: number; count: number }>
  );

  const averages = Object.fromEntries(
    workFronts.map(({ code }) => {
      const data = groupedAverageData[code] || { sum: 0, count: 0 };
      const average = data.count > 0 ? data.sum / data.count : 0;
      return [code, normalizeCalc(average, 2)];
    })
  );

  return averages;
};

const getAwaitingTransshipment = (
  events: CttEvent[]
): Record<string, string> => {
  let awaitingTransshipment: Record<string, number> = {};
  events.forEach((event) => {
    if (
      event.interference &&
      event.interference.name === "Aguardando Transbordo"
    ) {
      const { workFront } = event;
      if (event.time.end > 0) {
        if (awaitingTransshipment[workFront.code]) {
          awaitingTransshipment[workFront.code] += getEventTime(event) / 3600;
        } else {
          awaitingTransshipment[workFront.code] = getEventTime(event) / 3600;
        }
      }
    }
  });
  const formattedTransshipment: Record<string, string> = {};

  if (awaitingTransshipment) {
    for (const [code, timeInHours] of Object.entries(awaitingTransshipment)) {
      if (!timeInHours) {
        formattedTransshipment[code] = "00:00:00";
      } else {
        const timeInMs = timeInHours * 3600 * 1000;
        formattedTransshipment[code] = msToTime(timeInMs);
      }
    }
  }

  return formattedTransshipment;
};

const getIdleTime = (
  events: CttEvent[],
  idleEvents: CttIdleEvents[]
): Record<string, string> => {
  let idleTime: Record<string, number> = {};

  for (const event of events) {
    const diffS = (event.time.end - event.time.start) / 1000;
    const idleEvent = idleEvents?.find(
      (idleEvent) => idleEvent.name === event.name
    );

    if (
      idleEvent &&
      idleEvent.engine_idle_sec &&
      diffS > idleEvent.engine_idle_sec &&
      event.time.end > 0
    ) {
      if (idleTime[event.workFront.code]) {
        idleTime[event.workFront.code] += diffS - idleEvent.engine_idle_sec;
      } else {
        idleTime[event.workFront.code] = diffS - idleEvent.engine_idle_sec;
      }
    }
  }
  const formattedIdle: Record<string, string> = {};
  for (const [code, timeInHours] of Object.entries(idleTime)) {
    const timeInMs = timeInHours * 1000;
    formattedIdle[code] = msToTime(timeInMs);
  }

  return formattedIdle;
};

const calcAutopilotUse = (
  autoPilot: Record<string, number>,
  engineHours: Record<string, number>
): CttAutoPilotUse => {
  const autopilotUse: CttAutoPilotUse = {};
  for (const workFrontCode in autoPilot) {
    autopilotUse[workFrontCode] = { value: 0, goal: 75 };
    if (engineHours[workFrontCode]) {
      autopilotUse[workFrontCode].value = normalizeCalc(
        (autoPilot[workFrontCode] / engineHours[workFrontCode]) * 100,
        2
      );
    } else {
      autopilotUse[workFrontCode].value = 0;
    }
  }
  return autopilotUse;
};

const calcTrucksLack = (events: CttEvent[]): CttTrucksLack => {
  let trucksLack: Record<string, number> = {};
  events.forEach((event) => {
    if (event.interference && event.interference.name === "Falta caminhão") {
      const { workFront } = event;
      if (trucksLack[workFront.code]) {
        trucksLack[workFront.code] += getEventTime(event);
      } else {
        trucksLack[workFront.code] = getEventTime(event);
      }
    }
  });
  const formattedTrucksLack: Record<string, string> = {};
  if (trucksLack) {
    for (const [code, timeInHours] of Object.entries(trucksLack)) {
      const timeInMs = timeInHours * 1000;
      formattedTrucksLack[code] = msToTime(timeInMs);
    }
  }
  return {
    formattedTrucksLack: formattedTrucksLack,
    trucksLack: trucksLack,
  };
};

const calcTOffenders = (
  trucksLack: Record<string, number>,
  delivered: CttDeliveredReturn[]
): Record<string, number> => {
  let tOffenders: Record<string, number> = {};

  for (const workFrontCode in trucksLack) {
    const tonPerHourEntry = delivered.find(
      (entry) => entry.workFrontCode === +workFrontCode
    );

    if (tonPerHourEntry) {
      if (tOffenders[workFrontCode]) {
        tOffenders[workFrontCode] +=
          trucksLack[workFrontCode] * tonPerHourEntry.tonPerHour;
      } else {
        tOffenders[workFrontCode] =
          trucksLack[workFrontCode] * tonPerHourEntry.tonPerHour;
      }
    }
  }
  return tOffenders;
};

const calcAgriculturalEfficiency = (
  elevatorHours: Record<string, number>,
  engineHours: Record<string, number>
): CttAgriculturalEfficiency => {
  let agriculturalEfficiency: CttAgriculturalEfficiency = {};
  for (const workFrontCode in elevatorHours) {
    if (engineHours.hasOwnProperty(workFrontCode)) {
      if (agriculturalEfficiency[workFrontCode]) {
        agriculturalEfficiency[workFrontCode].value +=
          (elevatorHours[workFrontCode] / engineHours[workFrontCode]) * 100;
      } else {
        agriculturalEfficiency[workFrontCode] = { value: 0, goal: 70 };
        agriculturalEfficiency[workFrontCode].value =
          (elevatorHours[workFrontCode] / engineHours[workFrontCode]) * 100;
      }
    }
  }
  return agriculturalEfficiency;
};

const calcManuvers = (events: CttEvent[]): Record<string, string> => {
  let manuvers: Record<string, number> = {};
  let teste: Record<string, CttEvent[]> = {};
  events.forEach((event) => {
    if (event.time.end > 0 && event.name === "Manobra" && event.type === "AUTOMATIC") {
      if (manuvers[event.workFront.code]) {
        manuvers[event.workFront.code] += getEventTime(event) / 3600;
        teste[event.workFront.code].push(event)
      } else {
        teste[event.workFront.code] = [event]
        manuvers[event.workFront.code] = getEventTime(event) / 3600;
      }
    }
  });
console.log(teste["274"].length)
  const formattedManuvers: Record<string, string> = {};
  for (const [code, timeInHours] of Object.entries(manuvers)) {
    if (!timeInHours) {
      formattedManuvers[code] = "00:00:00";
    } else {
      const timeInMs = timeInHours * 3600 * 1000;
      formattedManuvers[code] = msToTime(timeInMs);
    }
  }

  return formattedManuvers;
};

const calcCtOffenders = async (
  unproductiveTime: Record<string, number>,
  equipments: CttEquipment[],
  delivered: CttDeliveredReturn[]
): Promise<Record<string, number>> => {
  const harvesterEquipments: Record<string, number> = {};
  let ctOffenders: Record<string, number> = {};

  if (!unproductiveTime || typeof unproductiveTime !== "object") {
    throw new Error("unproductiveTime is not a valid object");
  }

  for (const [workFrontCode, time] of Object.entries(unproductiveTime)) {
    for (const equipment of equipments) {
      if (
        equipment.work_front_code !== +workFrontCode ||
        equipment.description !== "Colhedoras"
      ) {
        continue;
      }
      harvesterEquipments[workFrontCode] =
        (harvesterEquipments[workFrontCode] || 0) + 1;
    }
    const tonPerHourEntry = delivered.find(
      (entry) => entry.workFrontCode === +workFrontCode
    );

    if (tonPerHourEntry) {
      if (ctOffenders[workFrontCode]) {
        ctOffenders[workFrontCode] += normalizeCalc(
          (time * tonPerHourEntry.tonPerHour) /
            harvesterEquipments[workFrontCode],
          2
        );
      } else {
        ctOffenders[workFrontCode] = normalizeCalc(
          (time * tonPerHourEntry.tonPerHour) /
            harvesterEquipments[workFrontCode],
          2
        );
      }
    }
  }

  return ctOffenders;
};

const calcAverageRadius = async (
  events: CttEvent[],
  odometerReadings: CttTelemetry[]
): Promise<Record<string, number>> => {
  try {
    const displacementEvents = events.filter(
      (event) =>
        event.name === "Deslocamento Carregamento" ||
        event.name === "Deslocamento Descarga"
    );

    const distances = await Promise.all(
      displacementEvents.map(async (event) => {
        return getTotalHourmeter(odometerReadings);
      })
    );

    let averageRadius: Record<string, number> = {};
    events.forEach((event) => {
      const { workFront } = event;
      const totalDistance = distances.reduce(
        (sum, distance) => sum + distance,
        0
      );
      averageRadius[workFront.code] =
        displacementEvents.length > 0
          ? normalizeCalc(totalDistance / displacementEvents.length)
          : 0;
    });

    return averageRadius;
  } catch (err) {
    throw err;
  }
};

const formatUnproductiveTime = (
  unproductiveTime: Record<string, number>
): Record<string, string> => {
  const formatUnproductiveTime: Record<string, string> = {};
  for (const [code, timeInHours] of Object.entries(unproductiveTime)) {
    if (!timeInHours) {
      formatUnproductiveTime[code] = "00:00:00";
    } else {
      const timeInMs = timeInHours * 3600 * 1000;
      formatUnproductiveTime[code] = msToTime(timeInMs);
    }
  }

  return formatUnproductiveTime;
};

const calcElevatorUse = (
  elevatorHours: Record<string, number>,
  engineHours: Record<string, number>
) => {
  let elevatorUse: Record<string, number> = {};
  for (const [workFront, value] of Object.entries(elevatorHours)) {
    if (elevatorUse[workFront]) {
      elevatorUse[workFront] += +(
        (value / engineHours[workFront]) *
        100
      ).toFixed(2);
    } else {
      elevatorUse[workFront] = +(
        (value / engineHours[workFront]) *
        100
      ).toFixed(2);
    }
  }
  return elevatorUse;
};

const calcSummary = (
  ctOffenders: Record<string, number>,
  workFronts: CttWorkFronts[]
): CttSummaryReturn[] => {
  let total: number = 0;
  const formatCtOffender: Record<string, number> = {};

  for (const workFront of workFronts) {
    const workFrontCode = workFront.code;

    if (ctOffenders[workFrontCode] !== undefined) {
      const ctOffender = ctOffenders[workFrontCode];
      total += ctOffender;

      if (formatCtOffender[workFrontCode]) {
        formatCtOffender[workFrontCode] += ctOffender;
      } else {
        formatCtOffender[workFrontCode] = ctOffender;
      }
    } else {
      if (!formatCtOffender[workFrontCode]) {
        formatCtOffender[workFrontCode] = 0;
      }
    }
  }

  let summary: CttSummaryReturn[] = [];

  let totalPercentage: number = 0;

  for (const [workFrontCode, ctOffender] of Object.entries(formatCtOffender)) {
    totalPercentage += (ctOffender / total) * 100;
    summary.push({
      label: `Frente ${workFrontCode}`,
      lostTons: ctOffender,
      progress: ctOffender ? +((ctOffender / total) * 100).toFixed(2) : 0,
    });
  }

  summary.unshift({
    label: `Geral`,
    lostTons: total,
    progress: normalizeCalc(totalPercentage, 2),
  });

  return summary;
};

const formatPerformanceIndicatorReturn = (
  tripQtd: Record<string, number>,
  averageWeight: Record<string, number>,
  awaitingTransshipment: Record<string, string>,
  idleTime: Record<string, string>,
  autoPilotUse: CttAutoPilotUse,
  trucksLack: Record<string, string>,
  tOffenders: Record<string, number>,
  agriculturalEfficiency: CttAgriculturalEfficiency,
  maneuvers: Record<string, string>,
  workFronts: CttWorkFronts[],
  ctOffenders: Record<string, number>,
  unproductiveTime: Record<string, string>,
  averageRadius: Record<string, number>,
  summary: CttSummaryReturn[],
  elevatorUse: Record<string, number>
): CttPerformanceIndicators => {
  const availabilityAllocation: CttPerformanceIndicators = {
    workFronts: workFronts.map((workfront) => {
      const workfrontCode = workfront.code;

      return {
        workFrontCode: workfrontCode,
        trips: tripQtd[workfrontCode] || 0,
        averageWeight: averageWeight[workfrontCode] || 0,
        trucksLack: trucksLack[workfrontCode] || "00:00:00",
        awaitingTransshipment:
          awaitingTransshipment[workfrontCode] || "00:00:00",
        engineIdle: idleTime[workfrontCode] || "00:00:00",
        autopilotUse: {
          value: autoPilotUse[workfrontCode]?.value || 0,
          goal: autoPilotUse[workfrontCode]?.goal || 0,
        },
        elevatorUse: {
          value: elevatorUse[workfrontCode] || 0,
          goal: 69,
        },
        unproductiveTime: unproductiveTime[workfrontCode] || "00:00:00",
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
export default createPerformanceIndicators;
