import dayjs from "dayjs";
import {
  getDaysBetweenDates,
  getDaysInMonth,
  getHarvestDateRange,
  normalizeCalc,
} from "../../helper/helper";
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
 * @param otherHarvestProductivity Productivity from the other UNIT available by front and harvest
 * @param date Filtered date
 */
const createCaneDelivery = async (
  frontsDayProductivity: CttTon,
  frontsMonthProductivity: CttTon,
  frontsHarvestProductivity: CttTon,
  workFronts: CttWorkFrontUnit[],
  otherUnitDayProductivity: CttTon,
  otherMonthProductivity: CttTon,
  otherHarvestProductivity: CttTon,
  date: string
): Promise<CttCaneDelivery> => {
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

  Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
    frontsHarvestProductivity[workFront] = new Decimal(ton)
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
    workFronts,
    date
  );

  const unitTotalHarvest = calcUnitHarvest(
    frontsHarvestProductivity,
    workFrontsUnits,
    otherHarvestProductivity
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
    workFronts
  );

  const monthPeriodCaneDelivery = getMonthPeriodCaneDelivery(
    unitTotalMonth,
    workFronts,
    date
  );

  const harvestPeriodCaneDelivery = getHarvestPeriodCaneDelivery(
    unitTotalHarvest,
    workFronts,
    date
  );

  const unitHarvestGoal = calcUnitHarvestGoal(
    unitTotalHarvest,
    workFrontsUnits,
    date
  );

  const periodDelivery = [
    ...dayPeriodCaneDelivery,
    ...monthPeriodCaneDelivery,
    ...harvestPeriodCaneDelivery,
  ];

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
    workFrontsUnits,
    periodDelivery,
    unitHarvestGoal
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
  workFronts: CttWorkFronts[],
  date: string
): Record<string, number> => {
  let harvestGoal: Record<string, number> = {};
  const dateHarvest = getHarvestDateRange(date);

  const daysHarvest = getDaysBetweenDates(
    dateHarvest.startDate,
    dateHarvest.endDate
  );

  Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
    const workFrontGoal = workFronts.find((wkf) => wkf.code === +workFront);
    if (workFrontGoal) {
      const goalHarvest = workFrontGoal?.goal * daysHarvest;
      harvestGoal[workFront] = normalizeCalc((ton / goalHarvest) * 100, 2);
    } else {
      harvestGoal[workFront] = 0;
    }
  });
  return harvestGoal;
};

const calcUnitHarvest = (
  frontsHarvestProductivity: CttTon,
  workFronts: CttWorkFrontUnit[],
  otherHarvestProductivity: CttTon
): Record<string, number> => {
  let unitTotalHarvest: Record<string, number> = {};

  Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
    const unit = workFronts.find((wkf) => wkf.code === +workFront);

    if (unit) {
      if (unitTotalHarvest[unit.unitId]) {
        unitTotalHarvest[unit.unitId] += ton;
      } else {
        unitTotalHarvest[unit.unitId] = ton;
      }
    }
  });

  Object.entries(otherHarvestProductivity).forEach(([workFront, ton]) => {
    const unit = workFronts.find((wkf) => wkf.code === +workFront);

    if (unit) {
      if (unitTotalHarvest[unit.unitId]) {
        unitTotalHarvest[unit.unitId] += ton;
      } else {
        unitTotalHarvest[unit.unitId] = ton;
      }
    }
  });
  return unitTotalHarvest;
};

/* Goal and percentage */
const calcUnitHarvestGoal = (
  unitTotalHarvest: Record<string, number>,
  workFronts: CttWorkFrontUnit[],
  date: string
) => {
  let harvestUnitGoalPercentage: Record<string, number> = {};
  let harvestUnitGoal: Record<string, number> = {};

  const dateHarvest = getHarvestDateRange(date);
  const daysHarvest = getDaysBetweenDates(
    dateHarvest.startDate,
    dateHarvest.endDate
  );

  workFronts.forEach((workFront) => {
    if (!harvestUnitGoal[workFront.unitId]) {
      harvestUnitGoal[workFront.unitId] = 0;
    }

    harvestUnitGoal[workFront.unitId] += workFront.goal;
  });

  Object.keys(harvestUnitGoal).forEach((unitId) => {
    harvestUnitGoal[unitId] *= daysHarvest;

    harvestUnitGoalPercentage[unitId] = harvestUnitGoal[unitId]
      ? normalizeCalc(
          (unitTotalHarvest[unitId] / harvestUnitGoal[unitId]) * 100,
          2
        )
      : 0;
  });

  return { harvestUnitGoal, harvestUnitGoalPercentage };
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
): CttPeriodsCaneDelivery[] => {
  let goalUnit = 0;
  let unitTotal = 0;

  workFronts.forEach((workFront) => {
    goalUnit += workFront.goal;

    if (unitTotalDay[workFront.unitId]) {
      unitTotal = unitTotalDay[workFront.unitId];
    }
  });

  const unitTotalDayPercentage = normalizeCalc((unitTotal / goalUnit) * 100);

  const dayPeriod = [
    {
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
    },
  ];

  return dayPeriod;
};

const getMonthPeriodCaneDelivery = (
  unitTotalMonth: Record<string, number>,
  workFronts: CttWorkFrontUnit[],
  date: string
): CttPeriodsCaneDelivery[] => {
  let goalUnit = 0;
  let unitTotal = 0;
  const daysMonth = getDaysInMonth(date);

  workFronts.forEach((workFront) => {
    goalUnit += workFront.goal;

    if (unitTotalMonth[workFront.unitId]) {
      unitTotal = unitTotalMonth[workFront.unitId];
    }
  });

  goalUnit = goalUnit * daysMonth;
  const unitTotalMonthPercentage = normalizeCalc((unitTotal / goalUnit) * 100);

  const toDo = goalUnit - unitTotal;
  const toDoPercentage = normalizeCalc((toDo / goalUnit) * 100, 2);

  const monthPeriod = [
    {
      key: "month",
      label: "Mês",
      goal: goalUnit,
      effectiveDays: null,
      data: [
        {
          label: "Realizado",
          progress: unitTotalMonthPercentage,
          value: unitTotal,
        },
        {
          label: "A realizar",
          progress: toDoPercentage,
          value: toDo,
        },
      ],
    },
  ];

  return monthPeriod;
};

//TODO: calcular a reestimativa do 3 grafico
const getHarvestPeriodCaneDelivery = (
  unitTotalHarvest: Record<string, number>,
  workFronts: CttWorkFrontUnit[],
  date: string
): CttPeriodsCaneDelivery[] => {
  let goalUnit = 0;
  let unitTotal = 0;
  const dateHarvest = getHarvestDateRange(date);
  const daysHarvest = getDaysBetweenDates(
    dateHarvest.startDate,
    dateHarvest.endDate
  );

  workFronts.forEach((workFront) => {
    goalUnit += workFront.goal;

    if (unitTotalHarvest[workFront.unitId]) {
      unitTotal = unitTotalHarvest[workFront.unitId];
    }
  });

  goalUnit = goalUnit * daysHarvest;
  const unitTotalHarvestPercentage = normalizeCalc(
    (unitTotal / goalUnit) * 100
  );

  const toDo = goalUnit - unitTotal;
  const toDoPercentage = normalizeCalc((toDo / goalUnit) * 100, 2);

  const harvestPeriod = [
    {
      key: "harvest",
      label: "Safra",
      goal: goalUnit,
      effectiveDays: null,
      data: [
        {
          label: "Realizado",
          progress: unitTotalHarvestPercentage,
          value: unitTotal,
        },
        {
          label: "A realizar/Estimativa",
          progress: toDoPercentage,
          value: toDo,
        },
        {
          label: "A realizar/Reestimativa",
          progress: 0,
          value: 0,
        },
      ],
    },
  ];

  return harvestPeriod;
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
  workFrontsUnits: CttWorkFrontUnit[],
  dayPeriodCaneDelivery: CttPeriodsCaneDelivery[],
  unitHarvestGoal: any
): CttCaneDelivery => {
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
          percentage: +unitHarvestGoal.harvestUnitGoalPercentage[unitId],
          goal: unitHarvestGoal.harvestUnitGoal[unitId],
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
    periods: dayPeriodCaneDelivery,
  };

  return caneDeliveryReturn;
};
export default createCaneDelivery;
