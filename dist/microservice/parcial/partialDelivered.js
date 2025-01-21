"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper/helper");
/**
 * GET the partial develired tons by Front
 * @param workFronts the fronts code with the goals
 * @param realTons object with the tons by Front, it comes from the productivity API
 * @param date '2023-12-23 15:41:51' datetime filter
 */
const createPartialDelivered = async (workFronts, realTons, date) => {
    try {
        let startDate = (0, helper_1.dateFilter)(date, "-");
        let currentHour = (0, helper_1.getCurrentHour)(startDate);
        let estimatedTons = calcEstimatedTons(realTons, currentHour);
        const tonPerHour = calcTonPerHour(realTons, currentHour);
        let estimatedPerGoal = calcEstimatedPerGoal(workFronts, estimatedTons);
        estimatedTons = calcEstimatedPercentage(workFronts, estimatedTons);
        return formatDeliveredPartialReturn(estimatedTons, tonPerHour, estimatedPerGoal, realTons, workFronts);
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
const calcEstimatedTons = (realTons, currentHour) => {
    let estimatedTons = {
        estimated: {
            total: 0,
            goal: 0,
            progress: 0,
        },
    };
    Object.entries(realTons).forEach(([workFront, ton]) => {
        estimatedTons[+workFront] = (0, helper_1.normalizeCalc)((ton / currentHour) * 24, 2);
        estimatedTons.estimated.total += (0, helper_1.normalizeCalc)((ton / currentHour) * 24, 2);
    });
    return estimatedTons;
};
const calcTonPerHour = (realTons, currentHour) => {
    let tonPerHour = {};
    Object.entries(realTons).forEach(([workFront, ton]) => {
        tonPerHour[+workFront] = (0, helper_1.normalizeCalc)(ton / currentHour, 2);
    });
    return tonPerHour;
};
const calcEstimatedPerGoal = (workFronts, estimatedTons) => {
    let estimatedPerGoal = {};
    workFronts.forEach((workFrontGoal) => {
        Object.entries(estimatedTons).forEach(([workFront, ton]) => {
            if (workFront !== "estimated" && typeof ton === "number") {
                if (workFrontGoal.code == +workFront) {
                    estimatedPerGoal[+workFront] = (0, helper_1.normalizeCalc)((ton / workFrontGoal.goal) * 100, 2);
                }
            }
        });
    });
    return estimatedPerGoal;
};
const formatDeliveredPartialReturn = async (estimatedTons, tonPerHour, estimatedPerGoal, realTons, workFronts) => {
    const delivered = [];
    const goalMap = new Map(workFronts.map((workFront) => [workFront.code, workFront.goal]));
    goalMap.forEach((goal) => {
        estimatedTons.estimated.goal += goal;
    });
    for (const key of Object.keys(estimatedTons)) {
        if (key === "estimated") {
            continue;
        }
        const workFrontCode = Number(key);
        delivered.push({
            workFrontCode,
            goal: goalMap.get(workFrontCode) || 0,
            realTons: (0, helper_1.normalizeCalc)(realTons[key], 2) || 0,
            estimatedTons: estimatedTons[key],
            tonPerHour: tonPerHour[key] || 0,
            estimatedPerGoal: estimatedPerGoal[key] || 0,
        });
    }
    return {
        delivered,
        estimated: estimatedTons.estimated,
    };
};
const calcEstimatedPercentage = (workFronts, estimatedTons) => {
    let frontGoal = 0;
    workFronts.forEach((workFront) => {
        frontGoal += workFront.goal;
    });
    estimatedTons.estimated.progress = (0, helper_1.normalizeCalc)((estimatedTons.estimated.total / frontGoal) * 100, 2);
    return estimatedTons;
};
exports.default = createPartialDelivered;
//# sourceMappingURL=partialDelivered.js.map