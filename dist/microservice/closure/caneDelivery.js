"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper/helper");
const MONTH_CANE_DELIVERY_GOAL_MAP = {
    112: 107455,
    115: 148112,
};
const HARVEST_CANE_DELIVERY_GOAL_MAP = {
    112: 1960000,
    115: 2687880,
};
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
const createCaneDelivery = async (frontsDayProductivity, frontsMonthProductivity, frontsHarvestProductivity, workFronts, otherUnitDayProductivity, otherMonthProductivity, otherHarvestProductivity, date, unitId) => {
    const workFrontsUnits = workFronts;
    workFronts = workFronts.filter((workFront) => workFront.code in frontsDayProductivity);
    const dayGoalPercentage = calcDailyGoalDelivery(frontsDayProductivity, workFronts);
    Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
        frontsDayProductivity[workFront] = (0, helper_1.normalizeCalc)(ton, 2);
    });
    Object.entries(frontsMonthProductivity).forEach(([workFront, ton]) => {
        frontsMonthProductivity[workFront] = (0, helper_1.normalizeCalc)(ton, 2);
    });
    Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
        frontsHarvestProductivity[workFront] = (0, helper_1.normalizeCalc)(ton, 2);
    });
    Object.entries(otherUnitDayProductivity).forEach(([workFront, ton]) => {
        otherUnitDayProductivity[workFront] = (0, helper_1.normalizeCalc)(ton, 2);
    });
    Object.entries(otherMonthProductivity).forEach(([workFront, ton]) => {
        otherMonthProductivity[workFront] = (0, helper_1.normalizeCalc)(ton, 2);
    });
    const tonPerHour = calcTonPerHour(frontsDayProductivity);
    const harvestGoalPercentage = calcHarvestGoal(frontsHarvestProductivity, workFronts, date);
    const unitTotalHarvest = calcUnitHarvest(frontsHarvestProductivity, workFrontsUnits, otherHarvestProductivity);
    const unitTotalDay = calcUnitDayTotal(frontsDayProductivity, workFrontsUnits, otherUnitDayProductivity);
    const unitTotalMonth = calcUnitMonthTotal(frontsMonthProductivity, workFrontsUnits, otherMonthProductivity);
    const dayPeriodCaneDelivery = getDayPeriodCaneDelivery(unitTotalDay, workFronts);
    const monthPeriodCaneDelivery = getMonthPeriodCaneDelivery(unitTotalMonth, workFronts, unitId);
    const harvestPeriodCaneDelivery = getHarvestPeriodCaneDelivery(unitTotalHarvest, workFronts, unitId);
    const unitHarvestGoal = calcUnitHarvestGoal(unitTotalHarvest, workFrontsUnits, date);
    const periodDelivery = [
        ...dayPeriodCaneDelivery,
        ...monthPeriodCaneDelivery,
        ...harvestPeriodCaneDelivery,
    ];
    return formatCaneDeliveryReturn(workFronts, frontsDayProductivity, dayGoalPercentage, frontsMonthProductivity, tonPerHour, frontsHarvestProductivity, harvestGoalPercentage, unitTotalHarvest, unitTotalDay, unitTotalMonth, workFrontsUnits, periodDelivery, unitHarvestGoal);
};
const calcDailyGoalDelivery = (frontsDayProductivity, workFronts) => {
    let dailyGoal = {};
    Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
        const workFrontGoal = workFronts.find((wkf) => wkf.code === +workFront);
        if (workFrontGoal) {
            dailyGoal[workFront] = (0, helper_1.normalizeCalc)((ton / workFrontGoal.goal) * 100, 2);
        }
        else {
            dailyGoal[workFront] = 0;
        }
    });
    return dailyGoal;
};
const calcTonPerHour = (frontsDayProductivity) => {
    let tonPerHour = {};
    Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
        tonPerHour[workFront] = (0, helper_1.normalizeCalc)(ton / 24, 2);
    });
    return tonPerHour;
};
const calcHarvestGoal = (frontsHarvestProductivity, workFronts, date) => {
    let harvestGoal = {};
    const dateHarvest = (0, helper_1.getHarvestDateRange)(date);
    const daysHarvest = (0, helper_1.getDaysBetweenDates)(dateHarvest.startDate, dateHarvest.endDate);
    Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
        const workFrontGoal = workFronts.find((wkf) => wkf.code === +workFront);
        if (workFrontGoal) {
            const goalHarvest = workFrontGoal?.goal * daysHarvest;
            harvestGoal[workFront] = (0, helper_1.normalizeCalc)((ton / goalHarvest) * 100, 2);
        }
        else {
            harvestGoal[workFront] = 0;
        }
    });
    return harvestGoal;
};
const calcUnitHarvest = (frontsHarvestProductivity, workFronts, otherHarvestProductivity) => {
    let unitTotalHarvest = {};
    Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalHarvest[unit.unitId]) {
                unitTotalHarvest[unit.unitId] += ton;
            }
            else {
                unitTotalHarvest[unit.unitId] = ton;
            }
        }
    });
    Object.entries(otherHarvestProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalHarvest[unit.unitId]) {
                unitTotalHarvest[unit.unitId] += ton;
            }
            else {
                unitTotalHarvest[unit.unitId] = ton;
            }
        }
    });
    return unitTotalHarvest;
};
/* Goal and percentage */
const calcUnitHarvestGoal = (unitTotalHarvest, workFronts, date) => {
    let harvestUnitGoalPercentage = {};
    let harvestUnitGoal = {};
    const dateHarvest = (0, helper_1.getHarvestDateRange)(date);
    const daysHarvest = (0, helper_1.getDaysBetweenDates)(dateHarvest.startDate, dateHarvest.endDate);
    workFronts.forEach((workFront) => {
        if (!harvestUnitGoal[workFront.unitId]) {
            harvestUnitGoal[workFront.unitId] = 0;
        }
        harvestUnitGoal[workFront.unitId] += workFront.goal;
    });
    Object.keys(harvestUnitGoal).forEach((unitId) => {
        harvestUnitGoal[unitId] *= daysHarvest;
        harvestUnitGoalPercentage[unitId] = harvestUnitGoal[unitId]
            ? (0, helper_1.normalizeCalc)((unitTotalHarvest[unitId] / harvestUnitGoal[unitId]) * 100, 2)
            : 0;
    });
    return { harvestUnitGoal, harvestUnitGoalPercentage };
};
const calcUnitDayTotal = (frontsDayProductivity, workFronts, otherUnitDayProductivity) => {
    let unitTotalDay = {};
    Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalDay[unit.unitId]) {
                unitTotalDay[unit.unitId] += ton;
            }
            else {
                unitTotalDay[unit.unitId] = ton;
            }
        }
    });
    Object.entries(otherUnitDayProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalDay[unit.unitId]) {
                unitTotalDay[unit.unitId] += ton;
            }
            else {
                unitTotalDay[unit.unitId] = ton;
            }
        }
    });
    return unitTotalDay;
};
const calcUnitMonthTotal = (frontsMonthProductivity, workFronts, otherMonthProductivity) => {
    let unitTotalMonth = {};
    Object.entries(frontsMonthProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalMonth[unit.unitId]) {
                unitTotalMonth[unit.unitId] += ton;
            }
            else {
                unitTotalMonth[unit.unitId] = ton;
            }
        }
    });
    Object.entries(otherMonthProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalMonth[unit.unitId]) {
                unitTotalMonth[unit.unitId] += ton;
            }
            else {
                unitTotalMonth[unit.unitId] = ton;
            }
        }
    });
    return unitTotalMonth;
};
const getDayPeriodCaneDelivery = (unitTotalDay, workFronts) => {
    let goalUnit = 0;
    let unitTotal = 0;
    workFronts.forEach((workFront) => {
        goalUnit += workFront.goal;
        if (unitTotalDay[workFront.unitId]) {
            unitTotal = unitTotalDay[workFront.unitId];
        }
    });
    const unitTotalDayPercentage = (0, helper_1.normalizeCalc)((unitTotal / goalUnit) * 100, 2);
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
const getMonthPeriodCaneDelivery = (unitTotalMonth, workFronts, unitId) => {
    let unitTotal = 0;
    const deliveryGoal = MONTH_CANE_DELIVERY_GOAL_MAP[unitId] || MONTH_CANE_DELIVERY_GOAL_MAP[115];
    workFronts.forEach((workFront) => {
        if (unitTotalMonth[workFront.unitId]) {
            unitTotal = unitTotalMonth[workFront.unitId];
        }
    });
    const unitTotalMonthPercentage = (0, helper_1.normalizeCalc)((unitTotal / deliveryGoal) * 100, 2);
    const toDo = deliveryGoal - unitTotal;
    const toDoPercentage = (0, helper_1.normalizeCalc)((toDo / deliveryGoal) * 100, 2);
    const monthPeriod = [
        {
            key: "month",
            label: "Mês",
            goal: deliveryGoal,
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
const getHarvestPeriodCaneDelivery = (unitTotalHarvest, workFronts, unitId) => {
    let unitTotal = 0;
    const deliveryGoal = HARVEST_CANE_DELIVERY_GOAL_MAP[unitId] || HARVEST_CANE_DELIVERY_GOAL_MAP[115];
    workFronts.forEach((workFront) => {
        if (unitTotalHarvest[workFront.unitId]) {
            unitTotal = unitTotalHarvest[workFront.unitId];
        }
    });
    const unitTotalHarvestPercentage = (0, helper_1.normalizeCalc)((unitTotal / deliveryGoal) * 100, 2);
    const toDo = deliveryGoal - unitTotal;
    const toDoPercentage = (0, helper_1.normalizeCalc)((toDo / deliveryGoal) * 100, 2);
    const harvestPeriod = [
        {
            key: "harvest",
            label: "Safra",
            goal: deliveryGoal,
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
const formatCaneDeliveryReturn = (workFronts, frontsDayProductivity, dayGoalPercentage, frontsMonthProductivity, tonPerHour, frontsHarvestProductivity, harvestGoalPercentage, unitTotalHarvest, unitTotalDay, unitTotalMonth, workFrontsUnits, dayPeriodCaneDelivery, unitHarvestGoal) => {
    const seenUnitIds = new Set();
    const unitsReturn = workFrontsUnits.reduce((acc, unit) => {
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
    }, []);
    const caneDeliveryReturn = {
        workFronts: workFronts
            .map((workFront) => {
            const workFrontCode = workFront.code;
            return {
                workFrontCode: workFrontCode,
                day: frontsDayProductivity[workFrontCode.toString()] || 0,
                dayGoalPercentage: dayGoalPercentage[workFrontCode.toString()] || 0,
                month: frontsMonthProductivity[workFrontCode.toString()] || 0,
                tonPerHour: tonPerHour[workFrontCode.toString()] || 0,
                harvest: frontsHarvestProductivity[workFrontCode.toString()] || 0,
                harvestGoalPercentage: harvestGoalPercentage[workFrontCode.toString()] || 0,
                goal: workFront.goal,
            };
        })
            .sort((a, b) => a.workFrontCode - b.workFrontCode),
        units: unitsReturn,
        periods: dayPeriodCaneDelivery,
    };
    return caneDeliveryReturn;
};
exports.default = createCaneDelivery;
//# sourceMappingURL=caneDelivery.js.map