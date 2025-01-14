import { normalizeCalc } from "../../helper/helper";
import {
  CttCaneDelivery,
  CttWorkFrontUnit,
  Unit,
} from "../../interfaces/caneDelivery.interface";
import {
  CttTon,
  CttWorkFronts,
} from "../../interfaces/partialDelivered.interface";

/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param frontsDayProductivity Productivity grouped by front and day
 * @param frontsMonthProductivity Productivity grouped by front and month
 * @param frontsHarvestProductivity Productivity grouped by front and harvest
 * @param workFronts Workfronts with units
 */
const createCaneDelivery = async (
  frontsDayProductivity: CttTon,
  frontsMonthProductivity: CttTon,
  frontsHarvestProductivity: CttTon,
  workFronts: CttWorkFrontUnit[]
): Promise<any> => {
  const dayGoalPercentage = calcDailyGoalDelivery(
    frontsDayProductivity,
    workFronts
  );

  const tonPerHour = calcTonPerHour(frontsDayProductivity);

  const harvestGoalPercentage = calcHarvestGoal(
    frontsHarvestProductivity,
    workFronts
  );

  const unitTotalHarvest = calcUnitHarvest(
    frontsHarvestProductivity,
    workFronts
  );

  const unitTotalDay = calcUnitDayTotal(frontsHarvestProductivity, workFronts);

  const unitTotalMonth = calcUnitMonthTotal(
    frontsHarvestProductivity,
    workFronts
  );

  return formatCaneDeliveryReturn(
    workFronts,
    frontsDayProductivity,
    dayGoalPercentage,
    frontsMonthProductivity,
    tonPerHour,
    frontsHarvestProductivity,
    harvestGoalPercentage,
    unitTotalHarvest,
    unitTotalDay,
    unitTotalMonth
  );
};

const calcDailyGoalDelivery = (
  frontsDayProductivity: CttTon,
  workFronts: CttWorkFronts[]
): Record<string, number> => {
  let dailyGoal: Record<string, number> = {};
  Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
    const workFrontGoal = workFronts.find((wkf) => wkf.code === +workFront);

    if (workFrontGoal) {
      dailyGoal[workFront] = normalizeCalc((ton / workFrontGoal.goal) * 100, 2);
    } else {
      dailyGoal[workFront] = 0;
    }
  });

  return dailyGoal;
};

const calcTonPerHour = (
  frontsDayProductivity: CttTon
): Record<string, number> => {
  let tonPerHour: Record<string, number> = {};
  Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
    tonPerHour[workFront] = normalizeCalc(ton / 24.0, 2);
  });

  return tonPerHour;
};

const calcHarvestGoal = (
  frontsHarvestProductivity: CttTon,
  workFronts: CttWorkFronts[]
): Record<string, number> => {
  let harvestGoal: Record<string, number> = {};

  Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
    const workFrontGoal = workFronts.find((wkf) => wkf.code === +workFront);

    if (workFrontGoal) {
      harvestGoal[workFront] = normalizeCalc(ton / workFrontGoal.goal, 2);
    } else {
      harvestGoal[workFront] = 0;
    }
  });
  return harvestGoal;
};

const calcUnitHarvest = (
  frontsHarvestProductivity: CttTon,
  workFronts: CttWorkFrontUnit[]
): Record<string, number> => {
  let unitTotalHarvest: Record<string, number> = {};

  Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
    const unit = workFronts.find((wkf) => wkf.code === +workFront);

    if (unit) {
      if (unitTotalHarvest[workFront]) {
        unitTotalHarvest[unit.unitId] += ton;
      } else {
        unitTotalHarvest[unit.unitId] = ton;
      }
    }
  });
  return unitTotalHarvest;
};

const calcUnitDayTotal = (
  frontsDayProductivity: Record<string, number>,
  workFronts: CttWorkFrontUnit[]
): Record<string, number> => {
  let unitTotalDay: Record<string, number> = {};

  Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
    const unit = workFronts.find((wkf) => wkf.code === +workFront);

    if (unit) {
      if (unitTotalDay[unit.unitId]) {
        unitTotalDay[unit.unitId] += ton;
      } else {
        unitTotalDay[unit.unitId] = ton;
      }
    }
  });
  return unitTotalDay;
};

const calcUnitMonthTotal = (
  frontsMonthProductivity: Record<string, number>,
  workFronts: CttWorkFrontUnit[]
): Record<string, number> => {
  let unitTotalMonth: Record<string, number> = {};

  Object.entries(frontsMonthProductivity).forEach(([workFront, ton]) => {
    const unit = workFronts.find((wkf) => wkf.code === +workFront);

    if (unit) {
      if (unitTotalMonth[unit.unitId]) {
        unitTotalMonth[unit.unitId] += ton;
      } else {
        unitTotalMonth[unit.unitId] = ton;
      }
    }
  });
  return unitTotalMonth;
};

const formatCaneDeliveryReturn = (
  workFronts: CttWorkFrontUnit[],
  frontsDayProductivity: Record<string, number>,
  dayGoalPercentage: Record<string, number>,
  frontsMonthProductivity: Record<string, number>,
  tonPerHour: Record<string, number>,
  frontsHarvestProductivity: Record<string, number>,
  harvestGoalPercentage: Record<string, number>,
  unitTotalHarvest: Record<string, number>,
  unitTotalDay: Record<string, number>,
  unitTotalMonth: Record<string, number>
) => {
  const seenUnitIds = new Set();
  const unitsReturn: Unit[] = workFronts.reduce((acc: Unit[], unit) => {
    const unitId = unit.unitId;

    if (!seenUnitIds.has(unitId)) {
      acc.push({
        name: unit.unitName || "",
        total: unitTotalHarvest[unitId] || 0,
        day: unitTotalDay[unitId] || 0,
        month: unitTotalMonth[unitId] || 0,
        percentage: 0,
        goal: 0,
      });

      seenUnitIds.add(unitId);
    }

    return acc;
  }, []);

  const caneDeliveryReturn = {
    workFronts: workFronts.map((workFront) => {
      const workFrontCode = workFront.code;

      return {
        workFrontCode: workFrontCode,
        day: frontsDayProductivity[workFrontCode.toString()] || 0,
        dayGoalPercentage: dayGoalPercentage[workFrontCode.toString()] || 0,
        month: frontsMonthProductivity[workFrontCode.toString()] || 0,
        tonPerHour: tonPerHour[workFrontCode.toString()] || 0,
        harvest: frontsHarvestProductivity[workFrontCode.toString()] || 0,
        harvestGoalPercentage:
          harvestGoalPercentage[workFrontCode.toString()] || 0,
      };
    }),
    units: unitsReturn,
    periods: {
      key: "",
      label: "",
      goal: 0,
      effectiveDays: "",
      data: [
        {
          label: "",
          progress: 0,
          value: 0,
        },
      ],
    },
  };

  return caneDeliveryReturn;
};
export default createCaneDelivery;
