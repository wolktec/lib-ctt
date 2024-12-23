import { dateFilter, getCurrentHour, normalizeCalc } from "../helper/helper";
import { Ton, WorkFronts } from "../interfaces/partialDelivered.interface";

const createPartialDelivered = async (workFronts: WorkFronts[], realTons: Ton, date: string) => {
  let startDate = dateFilter(date, '-');
  let currentHour = getCurrentHour(startDate);
  const estimatedTons = calcEstimatedTons(realTons, currentHour);
  const tonPerHour = calcTonPerHour(realTons, currentHour);
  let estimatedPerGoal = calcEstimatedPerGoal(workFronts, estimatedTons);
}

const calcEstimatedTons = (realTons: Ton, currentHour: number): Ton => {
  let estimatedTons: Ton = {};
  Object.entries(realTons).forEach(([workFront, ton]) => {
    estimatedTons[+workFront] = normalizeCalc((ton / currentHour) * 24, 2);
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

const calcEstimatedPerGoal = (workFronts: WorkFronts[], estimatedTons: Ton) => {
  let estimatedPerGoal: Ton = {}
  workFronts.forEach(workFrontGoal => {
    Object.entries(estimatedTons).forEach(([workFront, ton]) => {
      if (workFrontGoal.code == +workFront) {
        console.log(workFrontGoal)
        estimatedPerGoal[+workFront] =  normalizeCalc((ton / workFrontGoal.goal) * 100);
      }
    });
  });
  
  return estimatedPerGoal;
}

const formatDeliveredPartialReturn = async () => {

}
export default createPartialDelivered;