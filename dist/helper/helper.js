"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultHoursData = exports.hourToTime = exports.getCurrentHour = exports.isSameDay = void 0;
exports.normalizeCalc = normalizeCalc;
const dayjs_1 = __importDefault(require("dayjs"));
function normalizeCalc(value, fixed = 1) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
        return 0;
    }
    value = value * 1;
    return parseFloat(value.toFixed(fixed));
}
const isSameDay = (date1, date2) => {
    const dt1 = (0, dayjs_1.default)(date1).subtract(3, "hours");
    const dt2 = (0, dayjs_1.default)(date2).subtract(3, "hours");
    const isSame = dt1.isSame(dt2, "day");
    return isSame;
};
exports.isSameDay = isSameDay;
const getCurrentHour = (date) => {
    const currentDate = (0, dayjs_1.default)().subtract(3, "hours");
    const isSame = (0, exports.isSameDay)(date, currentDate.valueOf());
    let hour = 24;
    if (isSame) {
        hour = currentDate.get("hour");
    }
    return hour;
};
exports.getCurrentHour = getCurrentHour;
const twoCharacters = (num) => {
    return num < 10 ? `0${num}` : num.toString().padStart(2, "0");
};
const hourToTime = (hoursValue) => {
    const totalSeconds = Math.round(hoursValue * 3600);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${twoCharacters(hours)}:${twoCharacters(minutes)}:${twoCharacters(seconds)}`;
};
exports.hourToTime = hourToTime;
const getDefaultHoursData = (currentHour) => {
    const hoursData = [];
    for (let hour = 0; hour < currentHour; hour++) {
        hoursData.push({
            hour: `${hour.toString().padStart(2, "0")}:00`,
            value: 100,
        });
    }
    for (let hour = currentHour; hour < 24; hour++) {
        hoursData.push({
            hour: `${hour.toString().padStart(2, "0")}:00`,
            value: null,
        });
    }
    return hoursData;
};
exports.getDefaultHoursData = getDefaultHoursData;
//# sourceMappingURL=helper.js.map