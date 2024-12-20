"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translations = exports.dateParts = exports.dateFilter = exports.isSameDay = exports.getCurrentHour = void 0;
exports.convertHourToDecimal = convertHourToDecimal;
exports.calcMechanicalAvailability = calcMechanicalAvailability;
exports.normalizeCalc = normalizeCalc;
const dayjs_1 = __importDefault(require("dayjs"));
function convertHourToDecimal(hour) {
    const [hours, minutes] = hour.split(':').map(Number);
    const decimalMinutes = minutes / 60;
    return hours + decimalMinutes;
}
function calcMechanicalAvailability(totalMaintenance, countMaintenance, currentHour // 24 dia anterior ou hora atual
) {
    if (totalMaintenance === 0) {
        return 100.0;
    }
    const calc = normalizeCalc(((currentHour - (totalMaintenance / countMaintenance)) / currentHour) * 100, 2);
    return calc;
}
function normalizeCalc(value, fixed = 1) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
        return 0;
    }
    return parseFloat(value.toFixed(fixed));
}
const getCurrentHour = (date) => {
    const currentDate = (0, dayjs_1.default)().subtract(3, "hours");
    const isSame = (0, exports.isSameDay)(date, currentDate.valueOf());
    let hour = 24;
    if (isSame) {
        hour = currentDate.get('hour');
    }
    return hour;
};
exports.getCurrentHour = getCurrentHour;
const isSameDay = (date1, date2) => {
    const dt1 = (0, dayjs_1.default)(date1).subtract(3, "hours");
    const dt2 = (0, dayjs_1.default)(date2).subtract(3, "hours");
    const isSame = dt1.isSame(dt2, 'day');
    return isSame;
};
exports.isSameDay = isSameDay;
const dateFilter = (start_date, splitSeparator = '/') => {
    const dt1 = (0, exports.dateParts)(start_date ?? (0, dayjs_1.default)().subtract(3, "hours").format("DD/MM/YYYY"), splitSeparator);
    const startDate = (0, dayjs_1.default)()
        .set('M', dt1.month)
        .set('y', dt1.year)
        .set('D', dt1.day)
        .set('hour', 0)
        .set('minute', 0)
        .set('second', 0)
        .set('millisecond', 0)
        .add(3, "hours");
    if (!startDate.isValid()) {
        console.error("Data inválida");
    }
    const startDateTime = startDate.valueOf();
    return startDateTime;
};
exports.dateFilter = dateFilter;
const dateParts = (date, splitSeparator = "/") => {
    const dt = date.split(splitSeparator);
    if (dt.length !== 3) {
        console.error('date', 'invalid format date, expect format: dd/MM/YYYY');
    }
    if (splitSeparator == '-') {
        return {
            day: parseInt(dt[2]),
            month: parseInt(dt[1]) - 1,
            year: parseInt(dt[0]),
        };
    }
    return {
        day: parseInt(dt[0]),
        month: parseInt(dt[1]) - 1,
        year: parseInt(dt[2]),
    };
};
exports.dateParts = dateParts;
exports.translations = {
    "Caminhões": "truck",
    "Colhedoras": "harvester",
    "Tratores": "tractor",
    "Empilhadeiras": "forklift",
    "Pulverizadores": "pulverizer"
};
//# sourceMappingURL=helper.js.map