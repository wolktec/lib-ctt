"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper/helper");
/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param frontsDayProductivity Productivity grouped by front and day
 * @param frontsMonthProductivity Productivity grouped by front and month
 * @param frontsHarvestProductivity Productivity grouped by front and harvest
 * @param workFronts Workfronts with units
 */
const createCaneDelivery = async (frontsDayProductivity, frontsMonthProductivity, frontsHarvestProductivity, workFronts) => {
    const dayGoalPercentage = calcDailyGoalDelivery(frontsDayProductivity, workFronts);
    const tonPerHour = calcTonPerHour(frontsDayProductivity);
    const harvestGoalPercentage = calcHarvestGoal(frontsHarvestProductivity, workFronts);
    const unitTotalHarvest = calcUnitHarvest(frontsHarvestProductivity, workFronts);
    const unitTotalDay = calcUnitDayTotal(frontsHarvestProductivity, workFronts);
    const unitTotalMonth = calcUnitMonthTotal(frontsHarvestProductivity, workFronts);
    return formatCaneDeliveryReturn(workFronts, frontsDayProductivity, dayGoalPercentage, frontsMonthProductivity, tonPerHour, frontsHarvestProductivity, harvestGoalPercentage, unitTotalHarvest, unitTotalDay, unitTotalMonth);
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
        tonPerHour[workFront] = (0, helper_1.normalizeCalc)(ton / 24.0, 2);
    });
    return tonPerHour;
};
const calcHarvestGoal = (frontsHarvestProductivity, workFronts) => {
    let harvestGoal = {};
    Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
        const workFrontGoal = workFronts.find((wkf) => wkf.code === +workFront);
        if (workFrontGoal) {
            harvestGoal[workFront] = (0, helper_1.normalizeCalc)(ton / workFrontGoal.goal, 2);
        }
        else {
            harvestGoal[workFront] = 0;
        }
    });
    return harvestGoal;
};
const calcUnitHarvest = (frontsHarvestProductivity, workFronts) => {
    let unitTotalHarvest = {};
    Object.entries(frontsHarvestProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalHarvest[workFront]) {
                unitTotalHarvest[unit.unitId] += ton;
            }
            else {
                unitTotalHarvest[unit.unitId] = ton;
            }
        }
    });
    return unitTotalHarvest;
};
const calcUnitDayTotal = (frontsDayProductivity, workFronts) => {
    let unitTotalDay = {};
    Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalDay[workFront]) {
                unitTotalDay[unit.unitId] += (0, helper_1.normalizeCalc)(ton, 2);
            }
            else {
                unitTotalDay[unit.unitId] = (0, helper_1.normalizeCalc)(ton, 2);
            }
        }
    });
    return unitTotalDay;
};
const calcUnitMonthTotal = (frontsMonthProductivity, workFronts) => {
    let unitTotalMonth = {};
    Object.entries(frontsMonthProductivity).forEach(([workFront, ton]) => {
        const unit = workFronts.find((wkf) => wkf.code === +workFront);
        if (unit) {
            if (unitTotalMonth[workFront]) {
                unitTotalMonth[unit.unitId] += (0, helper_1.normalizeCalc)(ton, 2);
            }
            else {
                unitTotalMonth[unit.unitId] = (0, helper_1.normalizeCalc)(ton, 2);
            }
        }
    });
    return unitTotalMonth;
};
const formatCaneDeliveryReturn = (workFronts, frontsDayProductivity, dayGoalPercentage, frontsMonthProductivity, tonPerHour, frontsHarvestProductivity, harvestGoalPercentage, unitTotalHarvest, unitTotalDay, unitTotalMonth) => {
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
                harvestGoalPercentage: harvestGoalPercentage[workFrontCode.toString()] || 0,
            };
        }),
        units: Object.entries(workFronts).map(([unitId, unitName]) => {
            return {
                name: unitName || "",
                total: unitTotalHarvest[unitId] || 0,
                day: unitTotalDay[unitId] || 0,
                month: unitTotalMonth[unitId] || 0,
                percentage: 0,
                goal: 0,
            };
        }),
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
exports.default = createCaneDelivery;
//# sourceMappingURL=caneDelivery.js.map