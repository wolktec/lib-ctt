import { getEventTime, groupEquipmentsProductivityByFront, msToTime, normalizeCalc } from "../helper/helper";
import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
import { CttEquipmentProductivity, CttEquipmentProductivityFront, CttIdleEvents } from "../interfaces/performanceIndicators.interface";

/**
  * GET the performance indicators by Front
  * @param equipmentProductivity equipment coming from the productivity API
  * @param events events from the day
  * @param date '2023-12-23 15:41:51' datetime filter
 */
const createPerformanceIndicators = async (equipmentProductivity: CttEquipmentProductivity[], events: CttEvent[], equipments: CttEquipment[], idleEvents: CttIdleEvents[], date: string) => {
  try {
    if (!equipmentProductivity || !events || !equipments) {
      return 'Parametros inválidos';
    }

    let equipmentsProductivityByFront = groupEquipmentsProductivityByFront(equipmentProductivity, equipments);
    const tripQtd = getTripQtdByFront(equipmentsProductivityByFront);
    const averageWeight = getAverageWeight(equipmentsProductivityByFront);
    const awaitingTransshipment = getAwaitingTransshipment(events);
    const idleTime = getIdleTime(events, idleEvents);
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
}

/**
  * GET the trips quantity by Front
  * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getTripQtdByFront = (equipmentProductivity: CttEquipmentProductivityFront[]): Record<string, number> => {
  const tripQtd = equipmentProductivity.reduce((account, equipment) => {
    const { workFrontCode, trips } = equipment;
    if (account[workFrontCode]) {
      account[workFrontCode] += trips;
    } else {
      account[workFrontCode] = trips;
    }
    return account;
  }, {} as Record<string, number>);

  return tripQtd;
}

/**
  * GET the average weight by Front
  * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getAverageWeight = (equipmentsProductivity: CttEquipmentProductivityFront[]): Record<string, number> => {
  const groupedAverageData = equipmentsProductivity.reduce((account, equipment) => {
    const { workFrontCode, averageWeight } = equipment;

    account[workFrontCode] = account[workFrontCode] || { sum: 0, count: 0 };
    account[workFrontCode].sum += averageWeight;
    account[workFrontCode].count++;
    return account;
  }, {} as Record<string, { sum: number; count: number }>);

  const averages = Object.entries(groupedAverageData).reduce((averages, [workFront, averageData]) => {
    averages[workFront] = normalizeCalc(averageData.sum / averageData.count, 2);
    return averages;
  }, {} as Record<string, number>);

  return averages;
}

const getAwaitingTransshipment = (events: CttEvent[]): Record<string, string> => {
  let awaitingTransshipment: Record<string, number> = {};
  events.forEach(event => {
    if (event.interference && event.interference.name === 'Aguardando Transbordo') {
      const { workFront } = event;
      if (awaitingTransshipment[workFront.code]) {
        awaitingTransshipment[workFront.code] += getEventTime(event);
      } else {
        awaitingTransshipment[workFront.code] = getEventTime(event);
      }
    }
  });
  const formattedTransshipment: Record<string, string> = {};
  for (const [code, timeInHours] of Object.entries(awaitingTransshipment)) {
    const timeInMs = timeInHours * 3600 * 1000;
    formattedTransshipment[code] = msToTime(timeInMs);
  }

  return formattedTransshipment;
}

const getIdleTime = (events: CttEvent[], idleEvents: CttIdleEvents[]): Record<string, string> => {
  let idleTime: Record<string, number> = {};

  for (const event of events) {
    const diffS = (event.time.end - event.time.start) / 1000;
    const idleEvent = idleEvents?.find(
      idleEvent => idleEvent.name === event.name
    );

    if (idleEvent && idleEvent.engine_idle_sec && (diffS > idleEvent.engine_idle_sec && event.time.end > 0)) {
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
}

export default createPerformanceIndicators;