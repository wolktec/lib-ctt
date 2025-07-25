"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * GET the partial delivered tons by Front
 * @param workFrontProductionMap - Map of workFront productions received from the API production service.
 */
const createPartialDelivered = async (workFrontProductionMap) => {
    try {
        const formattedDelivered = Object.entries(workFrontProductionMap).map(([workFrontCode, production]) => ({
            workFrontCode: Number(workFrontCode),
            goal: production.delivered.goal,
            realTons: production.delivered.total,
            estimatedTons: production.dailyProjectedDelivered.total,
            estimatedPerGoal: production.dailyProjectedDelivered.totalOverGoal,
            tonPerHour: production.hourlyDelivered.total,
            tonPerHourmeter: production.tonPerHourmeter,
        }));
        const totalEstimated = formattedDelivered.reduce((acc, item) => acc + item.estimatedTons, 0);
        const totalGoal = formattedDelivered.reduce((acc, item) => acc + item.goal, 0);
        const estimated = {
            total: totalEstimated,
            goal: totalGoal,
            progress: (totalEstimated / totalGoal) * 100,
        };
        return {
            delivered: formattedDelivered,
            estimated,
        };
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
exports.default = createPartialDelivered;
//# sourceMappingURL=partialDelivered.js.map