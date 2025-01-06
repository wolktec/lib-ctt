import { dateFilter, getCurrentHour, normalizeCalc } from "../helper/helper";
import { CttDeliveredReturn, CttEstimatedTons, CttPartialDeliveredResult, CttTon, CttWorkFronts } from "../interfaces/partialDelivered.interface";

/**
  * GET the partial develired tons by Front
  * @param workFronts the fronts code with the goals
  * @param realTons object with the tons by Front, it comes from the productivity API
  * @param date '2023-12-23 15:41:51' datetime filter
 */
const createPartialDelivered = async (workFronts: CttWorkFronts[], realTons: CttTon, date: string): Promise<CttPartialDeliveredResult> => {
  try {
    let startDate = dateFilter(date, '-');
    let currentHour = getCurrentHour(startDate);
    let estimatedTons = calcEstimatedTons(realTons, currentHour);
    const tonPerHour = calcTonPerHour(realTons, currentHour);
    let estimatedPerGoal = calcEstimatedPerGoal(workFronts, estimatedTons);
    estimatedTons = calcEstimatedPercentage(workFronts, estimatedTons);

    return formatDeliveredPartialReturn(estimatedTons, tonPerHour, estimatedPerGoal, realTons, workFronts);
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
}

const calcEstimatedTons = (realTons: CttTon, currentHour: number): CttEstimatedTons => {
  let estimatedTons: CttEstimatedTons = {
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

const calcTonPerHour = (realTons: CttTon, currentHour: number): CttTon => {
  let tonPerHour: CttTon = {};
  Object.entries(realTons).forEach(([workFront, ton]) => {
    tonPerHour[+workFront] = normalizeCalc(ton / currentHour, 2);
  });
  return tonPerHour;
}

const calcEstimatedPerGoal = (workFronts: CttWorkFronts[], estimatedTons: CttEstimatedTons): CttTon => {
  let estimatedPerGoal: CttTon = {}
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

const formatDeliveredPartialReturn = async (estimatedTons: CttEstimatedTons, tonPerHour: CttTon, estimatedPerGoal: CttTon, realTons: CttTon, workFronts: CttWorkFronts[]): Promise<CttPartialDeliveredResult> => {
  const delivered: CttDeliveredReturn[] = [];
  const goalMap = new Map(workFronts.map((workFront) => [workFront.code, workFront.goal]));

  goalMap.forEach(goal => {
    estimatedTons.estimated.goal += goal;
  });

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

const calcEstimatedPercentage = (workFronts: CttWorkFronts[], estimatedTons: CttEstimatedTons): CttEstimatedTons => {
  let frontGoal: number = 0;

  workFronts.forEach(workFront => {
    frontGoal += workFront.goal;
  });

  estimatedTons.estimated.progress = normalizeCalc((estimatedTons.estimated.total / frontGoal) * 100, 2);
  return estimatedTons;
}
export default createPartialDelivered;