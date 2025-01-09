"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createValueWithGoal = exports.removeOutliers = exports.getTotalHourmeter = exports.calcTotalInterferenceByFront = exports.calcJourney = exports.calcTelemetryByFront = exports.groupEquipmentTelemetryByFront = exports.secToTime = exports.msToTime = exports.getEventTime = exports.groupEquipmentsProductivityByFront = exports.translations = exports.dateParts = exports.dateFilter = exports.isSameDay = exports.getCurrentHour = exports.normalizeCalc = exports.calcMechanicalAvailability = exports.convertHourToDecimal = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
function convertHourToDecimal(hour) {
    const [hours, minutes] = hour.split(":").map(Number);
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
    if (value < 0) {
        value = value * 1;
    }
    return parseFloat(value.toFixed(fixed));
}
exports.normalizeCalc = normalizeCalc;
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
const isSameDay = (date1, date2) => {
    const dt1 = (0, dayjs_1.default)(date1).subtract(3, "hours");
    const dt2 = (0, dayjs_1.default)(date2).subtract(3, "hours");
    const isSame = dt1.isSame(dt2, "day");
    return isSame;
};
exports.isSameDay = isSameDay;
const dateFilter = (start_date, splitSeparator = "/") => {
    const dt1 = (0, exports.dateParts)(start_date ?? (0, dayjs_1.default)().subtract(3, "hours").format("DD/MM/YYYY"), splitSeparator);
    const startDate = (0, dayjs_1.default)()
        .set("M", dt1.month)
        .set("y", dt1.year)
        .set("D", dt1.day)
        .set("hour", 0)
        .set("minute", 0)
        .set("second", 0)
        .set("millisecond", 0)
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
        console.error("date", "invalid format date, expect format: dd/MM/YYYY");
    }
    if (splitSeparator == "-") {
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
    Caminhões: "truck",
    Colhedoras: "harvester",
    Tratores: "tractor",
    Empilhadeiras: "forklift",
    Pulverizadores: "pulverizer",
};
const groupEquipmentsProductivityByFront = (equipmentsProductivity, equipments) => {
    const equipmentsProductivityByFront = equipmentsProductivity.map((equipmentProductivity) => {
        const matchingItem = equipments.find((equipment) => equipment.code === equipmentProductivity.equipmentCode);
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
        const equipment = equipments.find((equip) => +hourMeter.equipment_code === equip.code);
        if (!equipment || equipment.description !== "Colhedoras") {
            continue;
        }
        const relatedRecords = telemetry.filter((t) => +t.equipment_code === equipment.code);
        const sortedRecords = relatedRecords.sort((a, b) => a.occurrence - b.occurrence);
        const firstRecord = sortedRecords[0];
        const lastRecord = sortedRecords[sortedRecords.length - 1];
        if (!telemetryByFront.some((t) => t.equipmentCode === equipment.code)) {
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
            telemetryResult[telemetry.workFrontCode] += normalizeCalc(+telemetry.lastRecord.current_value -
                +telemetry.firstRecord.current_value, 2);
        }
        else {
            telemetryResult[telemetry.workFrontCode] = normalizeCalc(+telemetry.lastRecord.current_value -
                +telemetry.firstRecord.current_value, 2);
        }
    }
    return telemetryResult;
};
exports.calcTelemetryByFront = calcTelemetryByFront;
const calcJourney = async (events, interferences) => {
    if (events.length == 0) {
        return {
            totalOperationalTime: 0,
            operationalEvents: [],
            equipmentOperational: [],
            totalMaintenanceTime: 0,
            maintenanceEvents: [],
            equipmentsMaintenance: [],
            totalInterferenceTime: 0,
            interferenceEvents: [],
            equipmentInterference: [],
            totalInterferenceOperationalTime: 0,
            interferenceOperationalEvents: [],
            equipmentsInterferenceOperational: [],
            totalInterferenceByFront: {},
        };
    }
    let totalOperationalTime = 0;
    const uniqEquip = new Set();
    const operationalEvents = [];
    let totalInterferenceTime = 0;
    const uniqInterferenceEquip = new Set();
    const maintenanceEvents = [];
    let totalMaintenanceTime = 0;
    const uniqMaintenanceEquip = new Set();
    const interferenceEvents = [];
    let totalInterferenceOperationalTime = 0;
    const uniqInterferenceOperationalEquip = new Set();
    const interferenceOperationalEvents = [];
    let totalInterferenceTimeFront = {};
    let totalInterferenceOprtlTimeFront = {};
    //Interferências de manutenção
    const interferenceIds = interferences
        .filter((e) => e.interference_type?.name === "Manutenção")
        .map((e) => e.id);
    //Interferências operacionais
    const interferenceOperationalStops = interferences
        .filter((e) => e.interference_type?.name === "Operação")
        .map((e) => e.id);
    //Interferências de clima
    const interferenceWeatherStops = [600, 601];
    for (const event of events) {
        const startTime = (0, dayjs_1.default)(event.time.start);
        const endTime = (0, dayjs_1.default)(event.time.end);
        const diffS = endTime.diff(startTime, "seconds");
        const diff = diffS / 3600;
        if (diff > 0) {
            // Eventos produtivos
            if (!event.interference && event.name !== "Motor Desligado") {
                totalOperationalTime += diff;
                const code = event.equipment.code;
                uniqEquip.add(code);
                operationalEvents.push(event);
            }
            // Eventos de manutenção
            if (event.interference &&
                interferenceIds.includes(event.interference.id)) {
                totalMaintenanceTime += diff;
                const code = event.equipment.code;
                uniqMaintenanceEquip.add(code);
                maintenanceEvents.push(event);
            }
            // Eventos de interferência operacional
            if (event.interference &&
                interferenceOperationalStops.includes(event.interference.id) &&
                !interferenceWeatherStops.includes(event.interference.id)) {
                if (totalInterferenceOprtlTimeFront[event.workFront.code]) {
                    totalInterferenceOprtlTimeFront[event.workFront.code] += diff;
                }
                else {
                    totalInterferenceOprtlTimeFront[event.workFront.code] = diff;
                }
                totalInterferenceOperationalTime += diff;
                const code = event.equipment.code;
                uniqInterferenceOperationalEquip.add(code);
                interferenceOperationalEvents.push(event);
            }
            // Eventos de interferência
            if (event.interference &&
                !interferenceIds.includes(event.interference.id) &&
                !interferenceOperationalStops.includes(event.interference.id) &&
                !interferenceWeatherStops.includes(event.interference.id)) {
                if (totalInterferenceTimeFront[event.workFront.code]) {
                    totalInterferenceTimeFront[event.workFront.code] += diff;
                }
                else {
                    totalInterferenceTimeFront[event.workFront.code] = diff;
                }
                totalInterferenceTime += diff;
                const code = event.equipment.code;
                uniqInterferenceEquip.add(code);
                interferenceEvents.push(event);
            }
        }
    }
    const uniqOperationalEquip = new Set([
        ...uniqEquip,
        ...uniqMaintenanceEquip,
        ...uniqInterferenceEquip,
    ]);
    const totalInterference = totalInterferenceTime + totalInterferenceOperationalTime;
    let totalInterferenceByFront = {};
    totalInterferenceByFront = (0, exports.calcTotalInterferenceByFront)(totalInterferenceTimeFront, totalInterferenceOprtlTimeFront);
    return {
        totalOperationalTime,
        operationalEvents,
        equipmentOperational: Array.from(uniqOperationalEquip),
        totalMaintenanceTime,
        maintenanceEvents,
        equipmentsMaintenance: Array.from(uniqMaintenanceEquip),
        totalInterferenceTime: totalInterference,
        interferenceEvents,
        equipmentInterference: Array.from(uniqInterferenceEquip),
        totalInterferenceOperationalTime: totalInterference,
        interferenceOperationalEvents,
        equipmentsInterferenceOperational: Array.from(uniqInterferenceOperationalEquip),
        totalInterferenceByFront,
    };
};
exports.calcJourney = calcJourney;
const calcTotalInterferenceByFront = (totalInterferenceTimeFront, totalInterferenceOprtlTimeFront) => {
    const totalInterferenceByFront = {};
    for (const workFrontCode in totalInterferenceTimeFront) {
        if (totalInterferenceOprtlTimeFront[workFrontCode]) {
            totalInterferenceByFront[workFrontCode] += normalizeCalc(totalInterferenceTimeFront[workFrontCode] +
                totalInterferenceOprtlTimeFront[workFrontCode], 2);
        }
        else {
            totalInterferenceByFront[workFrontCode] = normalizeCalc(totalInterferenceTimeFront[workFrontCode] +
                totalInterferenceOprtlTimeFront[workFrontCode], 2);
        }
    }
    return totalInterferenceByFront;
};
exports.calcTotalInterferenceByFront = calcTotalInterferenceByFront;
const getTotalHourmeter = (hourmeters, firstHourmeterValue) => {
    if (!hourmeters || hourmeters.length === 0) {
        return 0;
    }
    const hourmeterWithoutAnomalies = removeOutliers(hourmeters.map((e) => Number(e.current_value)));
    if (hourmeterWithoutAnomalies.length > 0) {
        let firstHourmeter = firstHourmeterValue ?? Number(hourmeterWithoutAnomalies[0]);
        let lastHourmeter = Number(hourmeterWithoutAnomalies[hourmeterWithoutAnomalies.length - 1]);
        const total = lastHourmeter - firstHourmeter;
        return total;
    }
    return 0;
};
exports.getTotalHourmeter = getTotalHourmeter;
function removeOutliers(values, totalDays = 1) {
    let filteredData = [];
    // Verificar se o array tem menos de dois elementos
    if (values.length < 2) {
        return values;
    }
    if (values[values.length - 1] - values[0] < totalDays * 24) {
        return [values[0], values[values.length - 1]];
    }
    // Filtrar o primeiro item se não for anômalo
    let firstIsAnomaly = false;
    if (Math.abs(values[1] - values[0]) <= 5000 && values[1] - values[0] > 0) {
        filteredData.push(values[0]);
    }
    else {
        firstIsAnomaly = true;
    }
    let countSequence = 0;
    let lastValid = 0;
    // Verificar e filtrar os itens intermediários
    for (let i = 1; i < values.length - 1; i++) {
        lastValid = filteredData[filteredData.length - 1] ?? lastValid;
        const diffPrev = Math.abs(values[i] - lastValid);
        const diffNext = Math.abs(values[i] - values[i + 1]);
        if ((diffPrev <= 5000 || firstIsAnomaly) && diffNext <= 5000) {
            countSequence = 0;
            filteredData.push(values[i]);
        }
        if (diffPrev > 5000 || diffNext >= 5000) {
            countSequence++;
        }
        if (countSequence === 30) {
            countSequence = 0;
            filteredData = [];
            lastValid = values[i];
        }
    }
    // Filtrar o último item se não for anômalo
    const lastIndex = values.length - 1;
    if (Math.abs(values[lastIndex] - values[lastIndex - 1]) <= 5000) {
        filteredData.push(values[lastIndex]);
    }
    return filteredData;
}
exports.removeOutliers = removeOutliers;
const createValueWithGoal = (value, hasTotalField = false, hasAverageField = false) => {
    return {
        value: Number(value.toFixed(2)),
        goal: null,
        hasTotalField,
        hasAverageField,
    };
};
exports.createValueWithGoal = createValueWithGoal;
//# sourceMappingURL=helper.js.map