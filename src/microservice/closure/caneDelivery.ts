import dayjs from "dayjs";
import { normalizeCalc } from "../../helper/helper";
import {
  CttCaneDelivery,
  CttWorkFrontUnit,
  CttUnitsCaneDelivery,
  CttPeriodsCaneDelivery,
} from "../../interfaces/caneDelivery.interface";
import {
  CttTon,
  CttWorkFronts,
} from "../../interfaces/partialDelivered.interface";
import Decimal from "decimal.js";

/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param frontsDayProductivity Productivity grouped by front and day
 * @param frontsMonthProductivity Productivity grouped by front and month
 * @param frontsHarvestProductivity Productivity grouped by front and harvest
 * @param workFronts Workfronts with units
 * @param otherUnitDayProductivity Productivity from the other UNIT available grouped by front and day
 * @param otherMonthProductivity Productivity from the other UNIT available by front and month
 */
const createCaneDelivery = async (
  frontsDayProductivity: CttTon,
  frontsMonthProductivity: CttTon,
  frontsHarvestProductivity: CttTon,
  workFronts: CttWorkFrontUnit[],
  otherUnitDayProductivity: CttTon,
  otherMonthProductivity: CttTon
): Promise<any> => {
  const workFrontsUnits = workFronts;
  workFronts = workFronts.filter(
    (workFront) => workFront.code in frontsDayProductivity
  );

  const dayGoalPercentage = calcDailyGoalDelivery(
    frontsDayProductivity,
    workFronts
  );

  Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
    frontsDayProductivity[workFront] = new Decimal(ton)
      .toDecimalPlaces(2)
      .toNumber();
  });

  Object.entries(frontsMonthProductivity).forEach(([workFront, ton]) => {
    frontsMonthProductivity[workFront] = new Decimal(ton)
      .toDecimalPlaces(2)
      .toNumber();
  });

  Object.entries(otherUnitDayProductivity).forEach(([workFront, ton]) => {
    otherUnitDayProductivity[workFront] = new Decimal(ton)
      .toDecimalPlaces(2)
      .toNumber();
  });

  Object.entries(otherMonthProductivity).forEach(([workFront, ton]) => {
    otherMonthProductivity[workFront] = new Decimal(ton)
      .toDecimalPlaces(2)
      .toNumber();
  });

  const tonPerHour = calcTonPerHour(frontsDayProductivity);

  const harvestGoalPercentage = calcHarvestGoal(
    frontsHarvestProductivity,
    workFronts
  );

  const unitTotalHarvest = calcUnitHarvest(
    frontsHarvestProductivity,
    workFronts
  );

  const unitTotalDay = calcUnitDayTotal(
    frontsDayProductivity,
    workFrontsUnits,
    otherUnitDayProductivity
  );

  const unitTotalMonth = calcUnitMonthTotal(
    frontsMonthProductivity,
    workFrontsUnits,
    otherMonthProductivity
  );

  const dayPeriodCaneDelivery = getDayPeriodCaneDelivery(
    unitTotalDay,
    workFrontsUnits
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
    unitTotalMonth,
    workFrontsUnits
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
    tonPerHour[workFront] = normalizeCalc(
      ton / new Decimal(24).toDecimalPlaces(2).toNumber(),
      2
    );
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
  workFronts: CttWorkFrontUnit[],
  otherUnitDayProductivity: Record<string, number>
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

  Object.entries(otherUnitDayProductivity).forEach(([workFront, ton]) => {
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
  workFronts: CttWorkFrontUnit[],
  otherMonthProductivity: Record<string, number>
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

  Object.entries(otherMonthProductivity).forEach(([workFront, ton]) => {
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

const getDayPeriodCaneDelivery = (
  unitTotalDay: Record<string, number>,
  workFronts: CttWorkFrontUnit[]
): CttPeriodsCaneDelivery => {
  let goalUnit = 0;
  let unitTotal = 0;

  workFronts.forEach((workFront) => {
    goalUnit += workFront.goal;

    if (unitTotalDay[workFront.unitId]) {
      unitTotal = unitTotalDay[workFront.unitId];
    }
  });

  const unitTotalDayPercentage = normalizeCalc((unitTotal / goalUnit) * 100);

  const dayPeriod = {
    key: "day",
    label: "Dia",
    goal: goalUnit,
    effectiveDays: null,
    data: [
      {
        label: "Realizado",
        progress: unitTotalDayPercentage,
        value: unitTotal,
      },
    ],
  };

  return dayPeriod;
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
  unitTotalMonth: Record<string, number>,
  workFrontsUnits: CttWorkFrontUnit[]
) => {
  const seenUnitIds = new Set();
  const unitsReturn: CttUnitsCaneDelivery[] = workFrontsUnits.reduce(
    (acc: CttUnitsCaneDelivery[], unit) => {
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
    },
    []
  );

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
