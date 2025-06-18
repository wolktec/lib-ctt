"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper/helper");
const UNIT_MONTH_CANE_DELIVERY_GOAL_MAP = {
    112: 107455,
    115: 148112,
};
const UNIT_HARVEST_CANE_DELIVERY_GOAL_MAP = {
    112: 1960000,
    115: 2687880,
};
const getCurrentMonthDate = (date) => {
    const parsedDate = new Date(date);
    const firstDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
};
const processUnitData = (unit, currentMonth) => {
    const { code, monthlyWorkFrontProductionMap, workFrontProductionMap } = unit;
    const monthGoal = UNIT_MONTH_CANE_DELIVERY_GOAL_MAP[code] || 0;
    const harvestGoal = UNIT_HARVEST_CANE_DELIVERY_GOAL_MAP[code] || 0;
    const totalMonthlyWorkFrontProductionMap = {};
    const totalHarvestWorkFrontProductionMap = {};
    Object.entries(monthlyWorkFrontProductionMap).forEach(([month, workFrontProductionMap]) => {
        Object.entries(workFrontProductionMap).forEach(([workFrontCode, production]) => {
            const parsedWorkFrontCode = Number(workFrontCode);
            if (!totalHarvestWorkFrontProductionMap[parsedWorkFrontCode]) {
                totalHarvestWorkFrontProductionMap[parsedWorkFrontCode] = 0;
            }
            totalHarvestWorkFrontProductionMap[parsedWorkFrontCode] +=
                production.delivered.total;
            if (month === currentMonth) {
                totalMonthlyWorkFrontProductionMap[parsedWorkFrontCode] =
                    production.delivered.total;
            }
        });
    });
    const totalUnitDaily = Object.values(workFrontProductionMap).reduce((sum, production) => sum + production.delivered.total, 0);
    const totalUnitDailyGoal = Object.values(workFrontProductionMap).reduce((sum, production) => sum + production.delivered.totalOverGoal, 0);
    const totalUnitMonthly = Object.values(totalMonthlyWorkFrontProductionMap).reduce((sum, total) => sum + total, 0);
    const totalUnitHarvest = Object.values(totalHarvestWorkFrontProductionMap).reduce((sum, total) => sum + total, 0);
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
const formatCttWorkFrontsCaneDelivery = (defaultWorkFrontProductionMap, totalMonthlyWorkFrontProductionMap, totalHarvestWorkFrontProductionMap, harvestGoal) => {
    return Object.entries(defaultWorkFrontProductionMap).map(([workFrontCode, production]) => {
        const parsedWorkFrontCode = Number(workFrontCode);
        const totalHarvest = totalHarvestWorkFrontProductionMap[parsedWorkFrontCode];
        return {
            workFrontCode: parsedWorkFrontCode,
            day: production.delivered.total,
            dayGoalPercentage: production.delivered.totalOverGoal,
            tonPerHour: production.hourlyDelivered.total,
            month: totalMonthlyWorkFrontProductionMap[parsedWorkFrontCode],
            harvest: totalHarvest,
            harvestGoalPercentage: (totalHarvest / harvestGoal) * 100,
            goal: production.delivered.goal,
        };
    });
};
const formatCttUnitCaneDelivery = (name, dailyTotal, monthlyTotal, harvestTotal, harvestGoal) => ({
    name,
    total: harvestTotal,
    day: dailyTotal,
    month: monthlyTotal,
    percentage: (0, helper_1.normalizeCalc)((harvestTotal / harvestGoal) * 100, 2),
    goal: harvestGoal,
});
const formatCttDayPeriodCaneDelivery = (totalDaily, goal) => {
    const progress = (0, helper_1.normalizeCalc)((totalDaily / goal) * 100, 2);
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
const formatCttMonthPeriodCaneDelivery = (totalMonthly, goal) => {
    const progress = (0, helper_1.normalizeCalc)((totalMonthly / goal) * 100, 2);
    const toDo = goal - totalMonthly;
    const toDoProgress = (0, helper_1.normalizeCalc)((toDo / goal) * 100, 2);
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
};
const formatCttHarvestPeriodCaneDelivery = (totalHarvest, goal) => {
    const progress = (0, helper_1.normalizeCalc)((totalHarvest / goal) * 100, 2);
    const toDo = goal - totalHarvest;
    const toDoProgress = (0, helper_1.normalizeCalc)((toDo / goal) * 100, 2);
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
};
/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param date - Date that the cane delivery is being calculated.
 * @param defaultUnit - Default unit data containing unit code, work fronts and productions map.
 * @param secondUnit - Second unit data containing unit code, work fronts and productions map.
 */
const createCaneDelivery = async ({ date, defaultUnit, secondUnit, }) => {
    const currentMonth = getCurrentMonthDate(date);
    const defaultUnitData = processUnitData(defaultUnit, currentMonth);
    const secondUnitData = processUnitData(secondUnit, currentMonth);
    // Format work fronts
    const workFronts = formatCttWorkFrontsCaneDelivery(defaultUnit.workFrontProductionMap, defaultUnitData.totalMonthlyWorkFrontProductionMap, defaultUnitData.totalHarvestWorkFrontProductionMap, defaultUnitData.harvestGoal);
    // Format units
    const units = [
        formatCttUnitCaneDelivery(defaultUnit.name, defaultUnitData.totalUnitDaily, defaultUnitData.totalUnitMonthly, defaultUnitData.totalUnitHarvest, defaultUnitData.harvestGoal),
        formatCttUnitCaneDelivery(secondUnit.name, secondUnitData.totalUnitDaily, secondUnitData.totalUnitMonthly, secondUnitData.totalUnitHarvest, secondUnitData.harvestGoal),
    ];
    const periods = [
        formatCttDayPeriodCaneDelivery(defaultUnitData.totalUnitDaily, defaultUnitData.totalUnitDailyGoal),
        formatCttMonthPeriodCaneDelivery(defaultUnitData.totalUnitMonthly, defaultUnitData.monthGoal),
        formatCttHarvestPeriodCaneDelivery(defaultUnitData.totalUnitHarvest, defaultUnitData.harvestGoal),
    ];
    return {
        workFronts,
        units,
        periods,
    };
};
exports.default = createCaneDelivery;
//# sourceMappingURL=caneDelivery.js.map