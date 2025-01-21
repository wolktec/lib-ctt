import dayjs from "dayjs";
import {
  getEventTime,
  normalizeCalc,
  secToTime,
} from "../../helper/helper";
import {
  CttEvent,
} from "../../interfaces/availabilityAllocation.interface";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  CttAvailabilityAwaitingTransshipment,
  AvailabilityAwaitingTransshipmentData,
} from "../../interfaces/availabilityAwaitingTransshipment.interface";
dayjs.extend(utc);
dayjs.extend(timezone);

export const localTimeZone = "America/Sao_Paulo";

/**
 * CALCULATE percentage and time awaiting transshipment by TYPE 
 * @param partialEvents the equipment's events
 * @param closureEvents the equipment's events
 */
const createAvailabilityAwaitingTransshipment = async (
  partialEvents: CttEvent[],
  closureEvents: CttEvent[],
): Promise<CttAvailabilityAwaitingTransshipment> => {
  // Partial
  let groupedEventsByFrontPartial = await groupEventsByFront(
    partialEvents
  );

  let timeAwaitingTransshipmentByFrontPartial = await calcAwaitingTransshipmentTime(
    groupedEventsByFrontPartial
  );
  
  let percentageWeightByFrontPartial = calcProgressWeightByFront(timeAwaitingTransshipmentByFrontPartial);

  // Closure
  let groupedEventsByFrontClosure = await groupEventsByFront(
    closureEvents
  );

  let timeAwaitingTransshipmentByFrontClosure = await calcAwaitingTransshipmentTime(
    groupedEventsByFrontClosure
  );
  
  let percentageWeightByFrontClosure = calcProgressWeightByFront(timeAwaitingTransshipmentByFrontClosure);

  const formattedValues = formatAvailabilityReturn(
    timeAwaitingTransshipmentByFrontPartial,
    percentageWeightByFrontPartial,
    timeAwaitingTransshipmentByFrontClosure,
    percentageWeightByFrontClosure
  );

  return formattedValues;
};

/**
 * GROUP events by equipment FRONT
 * @param events
 */
const groupEventsByFront = (
  events: CttEvent[],
): Map<number, CttEvent[]> => {
  let eventsByFront = new Map<number, CttEvent[]>();
  let workFrontCode: number = 0;

  for (const [_, event] of Object.entries(events)) {
    workFrontCode = +event.workFront.code;

    const workFrontMap = eventsByFront.get(workFrontCode)!;

    if (!workFrontMap) {
      eventsByFront.set(workFrontCode, []);
    }

    eventsByFront.get(workFrontCode)!.push(event);
  }

  return eventsByFront;
};

/**
 * CALC average awaiting transshipment time by FRONT
 * @param eventsByFront
 */
const calcAwaitingTransshipmentTime = (
  eventsByFront: Map<number, CttEvent[]>
): Map<number, number> => {
  const averageByType = new Map<number, number>();
  let diff: number = 0;
  let time: number = 0;

  for (const [workFrontCode, events] of eventsByFront.entries()) {
    diff = 0;
    time = 0;

    for (const [_, event] of events.entries()) {
      diff += getEventTime(event);
    }

    const frontTime = averageByType.get(workFrontCode);

    if (!frontTime) {
      averageByType.set(workFrontCode, diff);
    }

    averageByType.set(workFrontCode, diff);
  }
  return averageByType;
};

/**
 * CALC percentage awaiting transshipment time by FRONT
 * @param frontsWithTime
 */
const calcProgressWeightByFront = (
  frontsWithTime: Map<number, number>
): Map<number, number> => {
  const progressByFront = new Map<number, number>();
  let progress: number = 0;
  let valueTotal: number = 0;

  for (const [_, totalSeconds] of frontsWithTime.entries()) {
    valueTotal += totalSeconds;
  }

  for (const [workFrontCode, frontSeconds] of frontsWithTime.entries()) {
    progress = frontSeconds/valueTotal;
    progressByFront.set(workFrontCode, normalizeCalc(progress*100, 2));
  }

  return progressByFront;
};

/**
 * FORMAT Partial and Closure time and percentage data by TYPE,
 * @param timeAwaitingPartial
 * @param percentageWeightPartial
 * @param timeAwaitingClosure
 * @param percentageWeightClosure
 */
const formatAvailabilityReturn = async(
  timeAwaitingPartial: Map<number,  number>,
  percentageWeightPartial: Map<number,  number>,
  timeAwaitingClosure: Map<number,  number>,
  percentageWeightClosure: Map<number,  number>
): Promise<CttAvailabilityAwaitingTransshipment> => {

  let partialData: AvailabilityAwaitingTransshipmentData[] = [];
  let closureData: AvailabilityAwaitingTransshipmentData[] = [];

  for (const workFrontCode of timeAwaitingPartial.keys()) {
    // Partial
    const timePartial = timeAwaitingPartial.get(workFrontCode) || 0;
    const progressPartial = percentageWeightPartial.get(workFrontCode) || 0;
    partialData.push({
      workFrontCode,
      time: secToTime(timePartial),
      progress: progressPartial,
    });

    // Closure
    const timeClosure = timeAwaitingClosure.get(workFrontCode) || 0;
    const progressClosure = percentageWeightClosure.get(workFrontCode) || 0;
    closureData.push({
        workFrontCode,
        time: secToTime(timeClosure),
        progress: progressClosure,
    });
  }

  const availabilityResult: CttAvailabilityAwaitingTransshipment = {
    partial: partialData,
    closure: closureData,
  };

  return availabilityResult;
}

export default createAvailabilityAwaitingTransshipment;
