import { dateFilter, getCurrentHour, normalizeCalc } from "../helper/helper";
import { DeliveredReturn, EstimatedTons, PartialDeliveredResult, Ton, WorkFronts } from "../interfaces/partialDelivered.interface";

const createPartialDelivered = async (workFronts: WorkFronts[], realTons: Ton, date: string): Promise<PartialDeliveredResult> => {
  let startDate = dateFilter(date, '-');
  let currentHour = getCurrentHour(startDate);
  const estimatedTons = calcEstimatedTons(realTons, currentHour);
  const tonPerHour = calcTonPerHour(realTons, currentHour);
  let estimatedPerGoal = calcEstimatedPerGoal(workFronts, estimatedTons);

  return formatDeliveredPartialReturn(estimatedTons, tonPerHour, estimatedPerGoal, realTons, workFronts);
}

const calcEstimatedTons = (realTons: Ton, currentHour: number): EstimatedTons => {
  let estimatedTons: EstimatedTons = {
    estimated: {
      total: 0,
      goal: 0,
      progress: 0,
    },
  };
  Object.entries(realTons).forEach(([workFront, ton]) => {
    estimatedTons[+workFront] = normalizeCalc((ton / currentHour) * 24, 2);
    estimatedTons.estimated.total += normalizeCalc((ton / currentHour) * 24, 2);
  });
  return estimatedTons;
}

const calcTonPerHour = (realTons: Ton, currentHour: number): Ton => {
  let tonPerHour: Ton = {};
  Object.entries(realTons).forEach(([workFront, ton]) => {
    tonPerHour[+workFront] = normalizeCalc(ton / currentHour, 2);
  });
  return tonPerHour;
}

const calcEstimatedPerGoal = (workFronts: WorkFronts[], estimatedTons: EstimatedTons): Ton => {
  let estimatedPerGoal: Ton = {}
  workFronts.forEach(workFrontGoal => {
    Object.entries(estimatedTons).forEach(([workFront, ton]) => {
      if (workFront !== "estimated" && typeof ton === "number") {
        if (workFrontGoal.code == +workFront) {
          estimatedPerGoal[+workFront] = normalizeCalc((ton / workFrontGoal.goal) * 100);
        }
      }
    });
  });

  return estimatedPerGoal;
}

const formatDeliveredPartialReturn = async (estimatedTons: EstimatedTons, tonPerHour: Ton, estimatedPerGoal: Ton, realTons: Ton, workFronts: WorkFronts[]): Promise<PartialDeliveredResult> => {
  const delivered: DeliveredReturn[] = [];
  const goalMap = new Map(workFronts.map((workFront) => [workFront.code, workFront.goal]));

  for (const key of Object.keys(estimatedTons)) {
    if (key === 'estimated') {
      continue;
    }

    const workFrontCode = Number(key);
    delivered.push({
      workFrontCode,
      goal: goalMap.get(workFrontCode) || 0,
      realTons: realTons[key] || 0,
      estimatedTons: estimatedTons[key] as number,
      tonPerHour: tonPerHour[key] || 0,
      estimatedPerGoal: estimatedPerGoal[key] || 0,
    });
  }

  return {
    delivered,
    estimated: estimatedTons.estimated,
  };

}
export default createPartialDelivered;