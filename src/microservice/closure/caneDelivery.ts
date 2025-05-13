import { normalizeCalc } from "../../helper/helper";

import {
  CttCaneDelivery,
  CttUnitsCaneDelivery,
  CttPeriodsCaneDelivery,
  CreateCaneDeliveryParams,
  CttWorkFrontsCaneDelivery,
  UnitProductionData,
} from "../../interfaces/caneDelivery.interface";

import { WorkFrontProductionReturn } from "../../interfaces/partialDelivered.interface";

const UNIT_MONTH_CANE_DELIVERY_GOAL_MAP: Record<number, number> = {
  112: 107455,
  115: 148112,
};

const UNIT_HARVEST_CANE_DELIVERY_GOAL_MAP: Record<number, number> = {
  112: 1960000,
  115: 2687880,
};

const getCurrentMonthDate = (date: string): string => {
  const parsedDate = new Date(date);
  const firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
  return firstDay.toISOString().split("T")[0];
};

const processUnitData = (unit: UnitProductionData, currentMonth: string) => {
  const { code, monthlyWorkFrontProductionMap, workFrontProductionMap } = unit;

  const monthGoal = UNIT_MONTH_CANE_DELIVERY_GOAL_MAP[code] || 0;
  const harvestGoal = UNIT_HARVEST_CANE_DELIVERY_GOAL_MAP[code] || 0;

  const totalMonthlyWorkFrontProductionMap: Record<number, number> = {};
  const totalHarvestWorkFrontProductionMap: Record<number, number> = {};

  Object.entries(monthlyWorkFrontProductionMap).forEach(
    ([month, workFrontProductionMap]) => {
      Object.entries(workFrontProductionMap).forEach(
        ([workFrontCode, production]) => {
          const parsedWorkFrontCode = Number(workFrontCode);

          if (!totalHarvestWorkFrontProductionMap[parsedWorkFrontCode]) {
            totalHarvestWorkFrontProductionMap[parsedWorkFrontCode] = 0;
          }

          totalHarvestWorkFrontProductionMap[parsedWorkFrontCode] +=
            production.periodDelivered.total;

          if (month === currentMonth) {
            totalMonthlyWorkFrontProductionMap[parsedWorkFrontCode] =
              production.periodDelivered.total;
          }
        }
      );
    }
  );

  const totalUnitDaily = Object.values(workFrontProductionMap).reduce(
    (sum, production) => sum + production.periodDelivered.total,
    0
  );

  const totalUnitDailyGoal = Object.values(workFrontProductionMap).reduce(
    (sum, production) => sum + production.dailyDelivered.goal,
    0
  );

  const totalUnitMonthly = Object.values(
    totalMonthlyWorkFrontProductionMap
  ).reduce((sum, total) => sum + total, 0);

  const totalUnitHarvest = Object.values(
    totalHarvestWorkFrontProductionMap
  ).reduce((sum, total) => sum + total, 0);

  return {
    unit,
    monthGoal,
    harvestGoal,
    totalMonthlyWorkFrontProductionMap,
    totalHarvestWorkFrontProductionMap,
    totalUnitDaily,
    totalUnitDailyGoal,
    totalUnitMonthly,
    totalUnitHarvest,
  };
};

const formatCttWorkFrontsCaneDelivery = (
  defaultWorkFrontProductionMap: Record<number, WorkFrontProductionReturn>,
  totalMonthlyWorkFrontProductionMap: Record<number, number>,
  totalHarvestWorkFrontProductionMap: Record<number, number>,
  harvestGoal: number
): CttWorkFrontsCaneDelivery[] => {
  return Object.entries(defaultWorkFrontProductionMap).map(
    ([workFrontCode, production]) => {
      const parsedWorkFrontCode = Number(workFrontCode);
      const totalHarvest =
        totalHarvestWorkFrontProductionMap[parsedWorkFrontCode];

      return {
        workFrontCode: parsedWorkFrontCode,
        day: production.periodDelivered.total,
        dayGoalPercentage: production.dailyDelivered.progress,
        tonPerHour: production.hourlyDelivered.total,
        month: totalMonthlyWorkFrontProductionMap[parsedWorkFrontCode],
        harvest: totalHarvest,
        harvestGoalPercentage: (totalHarvest / harvestGoal) * 100,
        goal: production.dailyDelivered.goal,
      };
    }
  );
};

const formatCttUnitCaneDelivery = (
  name: string,
  dailyTotal: number,
  monthlyTotal: number,
  harvestTotal: number,
  harvestGoal: number
): CttUnitsCaneDelivery => ({
  name,
  total: harvestTotal,
  day: dailyTotal,
  month: monthlyTotal,
  percentage: normalizeCalc((harvestTotal / harvestGoal) * 100, 2),
  goal: harvestGoal,
});

const formatCttDayPeriodCaneDelivery = (
  totalDaily: number,
  goal: number,
): CttPeriodsCaneDelivery => {
  const progress = normalizeCalc((totalDaily / goal) * 100, 2);

  return {
    key: "day",
    label: "Dia",
    goal,
    effectiveDays: null,
    data: [
      {
        label: "Realizado",
        progress,
        value: totalDaily,
      },
    ],
  };
};

const formatCttMonthPeriodCaneDelivery = (totalMonthly: number, goal: number): CttPeriodsCaneDelivery => {
  const progress = normalizeCalc((totalMonthly / goal) * 100, 2);

  const toDo = goal - totalMonthly;
  const toDoProgress = normalizeCalc((toDo / goal) * 100, 2);

  return {
    key: "month",
    label: "Mês",
    goal,
    effectiveDays: null,
    data: [
      {
        label: "Realizado",
        progress,
        value: totalMonthly,
      },
      {
        label: "A realizar",
        progress: toDoProgress > 0 ? toDoProgress : 0,
        value: toDo > 0 ? toDo : 0,
      },
    ],
  };
}

const formatCttHarvestPeriodCaneDelivery = (totalHarvest: number, goal: number): CttPeriodsCaneDelivery => {
  const progress = normalizeCalc((totalHarvest / goal) * 100, 2);

  const toDo = goal - totalHarvest;
  const toDoProgress = normalizeCalc((toDo / goal) * 100, 2);

  return {
    key: "harvest",
    label: "Safra",
    goal,
    effectiveDays: null,
    data: [
      {
        label: "Realizado",
        progress,
        value: totalHarvest,
      },
      {
        label: "A realizar/Estimativa",
        progress: toDoProgress > 0 ? toDoProgress : 0,
        value: toDo > 0 ? toDo : 0,
      },
      {
        label: "A realizar/Reestimativa",
        progress: 0,
        value: 0,
      },
    ],
  };
}

/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param date - Date that the cane delivery is being calculated.
 * @param defaultUnit - Default unit data containing unit code, work fronts and productions map.
 * @param secondUnit - Second unit data containing unit code, work fronts and productions map.
 */
const createCaneDelivery = async ({
  date,
  defaultUnit,
  secondUnit,
}: CreateCaneDeliveryParams): Promise<CttCaneDelivery> => {
  const currentMonth = getCurrentMonthDate(date);

  const defaultUnitData = processUnitData(defaultUnit, currentMonth);
  const secondUnitData = processUnitData(secondUnit, currentMonth);

  // Format work fronts
  const workFronts = formatCttWorkFrontsCaneDelivery(
    defaultUnit.workFrontProductionMap,
    defaultUnitData.totalMonthlyWorkFrontProductionMap,
    defaultUnitData.totalHarvestWorkFrontProductionMap,
    defaultUnitData.harvestGoal
  );

  // Format units
  const units: CttUnitsCaneDelivery[] = [
    formatCttUnitCaneDelivery(
      defaultUnit.name,
      defaultUnitData.totalUnitDaily,
      defaultUnitData.totalUnitMonthly,
      defaultUnitData.totalUnitHarvest,
      defaultUnitData.harvestGoal
    ),
    formatCttUnitCaneDelivery(
      secondUnit.name,
      secondUnitData.totalUnitDaily,
      secondUnitData.totalUnitMonthly,
      secondUnitData.totalUnitHarvest,
      secondUnitData.harvestGoal
    ),
  ];

  const periods: CttPeriodsCaneDelivery[] = [
    formatCttDayPeriodCaneDelivery(defaultUnitData.totalUnitDaily, defaultUnitData.totalUnitDailyGoal),
    formatCttMonthPeriodCaneDelivery(defaultUnitData.totalUnitMonthly, defaultUnitData.monthGoal),
    formatCttHarvestPeriodCaneDelivery(defaultUnitData.totalUnitHarvest, defaultUnitData.harvestGoal),
  ]

  return {
    workFronts,
    units,
    periods,
  };
};

export default createCaneDelivery;
