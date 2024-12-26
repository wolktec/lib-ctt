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
    let equipmentsProductivityByFront = (0, helper_1.groupEquipmentsProductivityByFront)(equipmentProductivity, equipments);
    const tripQtd = getTripQtdByFront(equipmentsProductivityByFront);
};
const getTripQtdByFront = (equipmentProductivity) => {
    const tripQtd = equipmentProductivity.reduce((account, equipment) => {
        if (account[equipment.workFrontCode]) {
            account[equipment.workFrontCode] += equipment.trips;
        }
        else {
            account[equipment.workFrontCode] = equipment.trips;
        }
        return account;
    }, {});
    return tripQtd;
};
exports.default = createPerformanceIndicators;
//# sourceMappingURL=performanceIndicators.js.map