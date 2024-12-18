"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeCalc = exports.calcMechanicalAvailability = exports.convertHourToDecimal = void 0;
function convertHourToDecimal(hour) {
    const [hours, minutes] = hour.split(':').map(Number);
    const decimalMinutes = minutes / 60;
    return hours + decimalMinutes;
}
exports.convertHourToDecimal = convertHourToDecimal;
function calcMechanicalAvailability(totalMaintenance, countMaintenance, currentHour // 24 dia anterior ou hora atual
) {
    if (totalMaintenance === 0) {
        return 100.0;
    }
    const calc = normalizeCalc(((currentHour - totalMaintenance / countMaintenance) / currentHour) * 100, 2);
    return calc;
}
exports.calcMechanicalAvailability = calcMechanicalAvailability;
function normalizeCalc(value, fixed = 1) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
        return 0;
    }
    return parseFloat(value.toFixed(fixed));
}
exports.normalizeCalc = normalizeCalc;
//# sourceMappingURL=helper.js.map