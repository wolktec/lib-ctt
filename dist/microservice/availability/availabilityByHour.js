"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MECHANICAL_AVAILABILITY_GOAL = 88;
/**
 * Create the availability by hour
 * @param availabilityByHour - the availability by hour generated by the operational service.
 */
const createAvailabilityByHour = async (availabilityByHour) => {
    const formattedGroups = [];
    for (const group in availabilityByHour) {
        const workFronts = availabilityByHour[group];
        const totalWorkFrontsAverage = workFronts.reduce((acc, workFront) => {
            return acc + workFront.average;
        }, 0);
        formattedGroups.push({
            group,
            workFronts,
            average: Number(totalWorkFrontsAverage / workFronts.length),
        });
    }
    const availabilityByHourData = {
        goal: MECHANICAL_AVAILABILITY_GOAL,
        groups: formattedGroups,
    };
    return availabilityByHourData;
};
exports.default = createAvailabilityByHour;
//# sourceMappingURL=availabilityByHour.js.map