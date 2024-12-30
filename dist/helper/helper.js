"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcTelemetryByFront = exports.groupEquipmentTelemetryByFront = exports.secToTime = exports.msToTime = exports.getEventTime = exports.groupEquipmentsProductivityByFront = exports.translations = exports.dateParts = exports.dateFilter = exports.isSameDay = exports.getCurrentHour = exports.normalizeCalc = exports.calcMechanicalAvailability = exports.convertHourToDecimal = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
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
    const calc = normalizeCalc(((currentHour - (totalMaintenance / countMaintenance)) / currentHour) * 100, 2);
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
const groupEquipmentsProductivityByFront = (equipmentsProductivity, equipments) => {
    const equipmentsProductivityByFront = equipmentsProductivity.map(equipmentProductivity => {
        const matchingItem = equipments.find(equipment => equipment.code === equipmentProductivity.equipmentCode);
        return {
            ...equipmentProductivity,
            workFrontCode: matchingItem ? matchingItem.work_front_code : 0,
        };
    });
    return equipmentsProductivityByFront;
};
exports.groupEquipmentsProductivityByFront = groupEquipmentsProductivityByFront;
const getEventTime = (event) => {
    let diffS = 0;
    const startTime = (0, dayjs_1.default)(event.time.start);
    const endTime = (0, dayjs_1.default)(event.time.end);
    diffS = endTime.diff(startTime, "seconds");
    return diffS / 3600;
};
exports.getEventTime = getEventTime;
const msToTime = (ms) => {
    return (0, exports.secToTime)(ms / 1000);
};
exports.msToTime = msToTime;
const secToTime = (sec) => {
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor((sec - hours * 3600) / 60);
    let seconds = Math.round(sec - hours * 3600 - minutes * 60);
    if (seconds >= 60) {
        minutes += 1;
        seconds = 0;
    }
    if (minutes >= 60) {
        hours += 1;
        minutes = 0;
    }
    return `${twoCaracters(hours)}:${twoCaracters(minutes)}:${twoCaracters(seconds)}`;
};
exports.secToTime = secToTime;
const twoCaracters = (num) => {
    return num < 10 ? `0${num}` : num.toString();
};
const groupEquipmentTelemetryByFront = (equipments, telemetry) => {
    const telemetryByFront = [];
    for (const hourMeter of telemetry) {
        const equipment = equipments.find(equip => +hourMeter.equipment_code === equip.code);
        if (!equipment || equipment.description !== "Colhedoras") {
            continue;
        }
        const relatedRecords = telemetry.filter(t => +t.equipment_code === equipment.code);
        const sortedRecords = relatedRecords.sort((a, b) => a.occurrence - b.occurrence);
        const firstRecord = sortedRecords[0];
        const lastRecord = sortedRecords[sortedRecords.length - 1];
        if (!telemetryByFront.some(t => t.equipmentCode === equipment.code)) {
            telemetryByFront.push({
                equipmentCode: equipment.code,
                workFrontCode: equipment.work_front_code,
                firstRecord: firstRecord,
                lastRecord: lastRecord,
            });
        }
    }
    return telemetryByFront;
};
exports.groupEquipmentTelemetryByFront = groupEquipmentTelemetryByFront;
const calcTelemetryByFront = (telemetryByFront) => {
    let telemetryResult = {};
    for (const telemetry of telemetryByFront) {
        if (telemetryResult[telemetry.workFrontCode]) {
            telemetryResult[telemetry.workFrontCode] += normalizeCalc(+telemetry.lastRecord.current_value - +telemetry.firstRecord.current_value, 2);
        }
        else {
            telemetryResult[telemetry.workFrontCode] = normalizeCalc(+telemetry.lastRecord.current_value - +telemetry.firstRecord.current_value, 2);
        }
    }
    return telemetryResult;
};
exports.calcTelemetryByFront = calcTelemetryByFront;
//# sourceMappingURL=helper.js.map