import {
  AvailabilityAwaitingTransshipmentData,
  AwaitingTransshipmentData,
  CttAvailabilityAwaitingTransshipment,
} from "../../interfaces/availabilityAwaitingTransshipment.interface";

const processAwaitingTransshipmentData = (
  awaitingTransshipmentMap: Record<number, AwaitingTransshipmentData>
) => {
  const formattedValues: AvailabilityAwaitingTransshipmentData[] = [];

  const totalWorkFrontsTime = Object.values(awaitingTransshipmentMap).reduce(
    (acc, data) => {
      return acc + data.totalTime;
    },
    0
  );

  for (const [workFrontCode, workFrontData] of Object.entries(
    awaitingTransshipmentMap
  )) {
    const { time, totalTime } = workFrontData;

    const progress = (totalTime / totalWorkFrontsTime) * 100;

    formattedValues.push({
      workFrontCode: Number(workFrontCode),
      progress: Number(progress.toFixed(2)),
      time,
    });
  }

  return formattedValues;
};

/**
 * CALCULATE percentage and time awaiting transshipment by TYPE
 * @param partialEvents the equipment's events
 * @param closureEvents the equipment's events
 * @param workFronts logistic work fronts
 */
const createAvailabilityAwaitingTransshipment = async (
  partialAwaitingTransshipmentMap: Record<number, AwaitingTransshipmentData>,
  closureAwaitingTransshipmentMap: Record<number, AwaitingTransshipmentData>
): Promise<CttAvailabilityAwaitingTransshipment> => {
  return {
    partial: processAwaitingTransshipmentData(partialAwaitingTransshipmentMap),
    closure: processAwaitingTransshipmentData(closureAwaitingTransshipmentMap),
  };
};

export default createAvailabilityAwaitingTransshipment;
