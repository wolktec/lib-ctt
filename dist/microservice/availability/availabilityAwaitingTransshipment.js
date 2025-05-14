"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const processAwaitingTransshipmentData = (awaitingTransshipmentMap) => {
    const formattedValues = [];
    const totalWorkFrontsTime = Object.values(awaitingTransshipmentMap).reduce((acc, data) => {
        return acc + data.totalTime;
    }, 0);
    for (const [workFrontCode, workFrontData] of Object.entries(awaitingTransshipmentMap)) {
        const { time, totalTime } = workFrontData;
        const progress = (totalTime / totalWorkFrontsTime) * 100;
        formattedValues.push({
            workFrontCode: Number(workFrontCode),
            progress: Number(progress.toFixed(2)),
            time,
        });
    }
    return formattedValues;
};
/**
 * CALCULATE percentage and time awaiting transshipment by TYPE
 * @param partialEvents the equipment's events
 * @param closureEvents the equipment's events
 * @param workFronts logistic work fronts
 */
const createAvailabilityAwaitingTransshipment = async (partialAwaitingTransshipmentMap, closureAwaitingTransshipmentMap) => {
    return {
        partial: processAwaitingTransshipmentData(partialAwaitingTransshipmentMap),
        closure: processAwaitingTransshipmentData(closureAwaitingTransshipmentMap),
    };
};
exports.default = createAvailabilityAwaitingTransshipment;
//# sourceMappingURL=availabilityAwaitingTransshipment.js.map