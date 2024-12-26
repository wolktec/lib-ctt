"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../helper/helper");
/**
  * GET the performance indicators by Front
  * @param equipmentProductivity equipment coming from the productivity API
  * @param events events from the day
  * @param date '2023-12-23 15:41:51' datetime filter
 */
const createPerformanceIndicators = async (equipmentProductivity, events, equipments, date) => {
    try {
        let equipmentsProductivityByFront = (0, helper_1.groupEquipmentsProductivityByFront)(equipmentProductivity, equipments);
        const tripQtd = getTripQtdByFront(equipmentsProductivityByFront);
        const averageWeight = getAverageWeight(equipmentsProductivityByFront);
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
/**
  * GET the trips quantity by Front
  * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getTripQtdByFront = (equipmentProductivity) => {
    const tripQtd = equipmentProductivity.reduce((account, equipment) => {
        const { workFrontCode, trips } = equipment;
        if (account[workFrontCode]) {
            account[workFrontCode] += trips;
        }
        else {
            account[workFrontCode] = trips;
        }
        return account;
    }, {});
    return tripQtd;
};
/**
  * GET the average weight by Front
  * @param equipmentsProductivity equipment coming from the productivity API with the workFrontCode
 */
const getAverageWeight = (equipmentsProductivity) => {
    const groupedAverageData = equipmentsProductivity.reduce((account, equipment) => {
        const { workFrontCode, averageWeight } = equipment;
        account[workFrontCode] = account[workFrontCode] || { sum: 0, count: 0 };
        account[workFrontCode].sum += averageWeight;
        account[workFrontCode].count++;
        return account;
    }, {});
    const averages = Object.entries(groupedAverageData).reduce((averages, [workFront, averageData]) => {
        averages[workFront] = (0, helper_1.normalizeCalc)(averageData.sum / averageData.count, 2);
        return averages;
    }, {});
    return averages;
};
exports.default = createPerformanceIndicators;
//# sourceMappingURL=performanceIndicators.js.map