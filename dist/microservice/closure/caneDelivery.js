"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const helper_1 = require("../../helper/helper");
const decimal_js_1 = __importDefault(require("decimal.js"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
// Registre os plugins
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
/**
 * GET the cane delivered based on the productivity API registered by FRONT
 * @param frontsDayProductivity Productivity grouped by front and day
 * @param frontsMonthProductivity Productivity grouped by front and month
 * @param frontsHarvestProductivity Productivity grouped by front and harvest
 * @param workFronts Workfronts with units
 * @param otherUnitDayProductivity Productivity from the other UNIT available grouped by front and day
 * @param otherMonthProductivity Productivity from the other UNIT available by front and month
 */
const createCaneDelivery = async (frontsDayProductivity, frontsMonthProductivity, frontsHarvestProductivity, workFronts, otherUnitDayProductivity, otherMonthProductivity) => {
    const workFrontsUnits = workFronts;
    workFronts = workFronts.filter((workFront) => workFront.code in frontsDayProductivity);
    const dayGoalPercentage = calcDailyGoalDelivery(frontsDayProductivity, workFronts);
    Object.entries(frontsDayProductivity).forEach(([workFront, ton]) => {
        frontsDayProductivity[workFront] = new decimal_js_1.default(ton)
            .toDecimalPlaces(2)
            .toNumber();
    });
    Object.entries(frontsMonthProductivity).forEach(([workFront, ton]) => {
        frontsMonthProductivity[workFront] = new decimal_js_1.default(ton)
            .toDecimalPlaces(2)
            .toNumber();
    });
    Object.entries(otherUnitDayProductivity).forEach(([workFront, ton]) => {
        otherUnitDayProductivity[workFront] = new decimal_js_1.default(ton)
            .toDecimalPlaces(2)
            .toNumber();
    });
    Object.entries(otherMonthProductivity).forEach(([workFront, ton]) => {
        otherMonthProductivity[workFront] = new decimal_js_1.default(ton)
            .toDecimalPlaces(2)
            .toNumber();
    });
    const tonPerHour = calcTonPerHour(frontsDayProductivity);
    const harvestGoalPercentage = calcHarvestGoal(frontsHarvestProductivity, workFronts);
    const unitTotalHarvest = calcUnitHarvest(frontsHarvestProductivity, workFronts);
    const unitTotalDay = calcUnitDayTotal(frontsDayProductivity, workFrontsUnits, otherUnitDayProductivity);
    const unitTotalMonth = calcUnitMonthTotal(frontsMonthProductivity, workFrontsUnits, otherMonthProductivity);
    const dayPeriodCaneDelivery = getDayPeriodCaneDelivery(unitTotalDay, workFrontsUnits);
    return formatCaneDeliveryReturn(workFronts, frontsDayProductivity, dayGoalPercentage, frontsMonthProductivity, tonPerHour, frontsHarvestProductivity, harvestGoalPercentage, unitTotalHarvest, unitTotalDay, unitTotalMonth, workFrontsUnits);
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
        tonPerHour[workFront] = (0, helper_1.normalizeCalc)(ton / new decimal_js_1.default(24).toDecimalPlaces(2).toNumber(), 2);
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
    const unitTotalDayPercentage = (0, helper_1.normalizeCalc)((unitTotal / goalUnit) * 100);
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
const formatCaneDeliveryReturn = (workFronts, frontsDayProductivity, dayGoalPercentage, frontsMonthProductivity, tonPerHour, frontsHarvestProductivity, harvestGoalPercentage, unitTotalHarvest, unitTotalDay, unitTotalMonth, workFrontsUnits) => {
    const seenUnitIds = new Set();
    const unitsReturn = workFrontsUnits.reduce((acc, unit) => {
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
                harvestGoalPercentage: harvestGoalPercentage[workFrontCode.toString()] || 0,
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
exports.default = createCaneDelivery;
//# sourceMappingURL=caneDelivery.js.map