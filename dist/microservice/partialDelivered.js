"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../helper/helper");
const createPartialDelivered = async (workFronts, realTons, date) => {
    let startDate = (0, helper_1.dateFilter)(date, '-');
    let currentHour = (0, helper_1.getCurrentHour)(startDate);
    const estimatedTons = calcEstimatedTons(realTons, currentHour);
    const tonPerHour = calcTonPerHour(realTons, currentHour);
    let estimatedPerGoal = calcEstimatedPerGoal(workFronts, estimatedTons);
};
const calcEstimatedTons = (realTons, currentHour) => {
    let estimatedTons = {};
    Object.entries(realTons).forEach(([workFront, ton]) => {
        estimatedTons[+workFront] = (0, helper_1.normalizeCalc)((ton / currentHour) * 24, 2);
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
    workFronts.forEach(workFrontGoal => {
        Object.entries(estimatedTons).forEach(([workFront, ton]) => {
            if (workFrontGoal.code == +workFront) {
                console.log(workFrontGoal);
                estimatedPerGoal[+workFront] = (0, helper_1.normalizeCalc)((ton / workFrontGoal.goal) * 100);
            }
        });
    });
    return estimatedPerGoal;
};
const formatDeliveredPartialReturn = async () => {
};
exports.default = createPartialDelivered;
//# sourceMappingURL=partialDelivered.js.map