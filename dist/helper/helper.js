"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultHoursData = exports.getHarvesterEvents = exports.getHarvestDateRange = exports.getDaysBetweenDates = exports.getDaysInMonth = exports.calcJourneyByFront = exports.convertSecondstoTimeString = exports.createValueWithGoal = exports.getTotalHourmeter = exports.calcTotalInterferenceByFront = exports.calcJourney = exports.calcTelemetryByFront = exports.groupEquipmentTelemetryByFront = exports.secToTime = exports.msToTime = exports.getEventTime = exports.defaultFronts = exports.translations = exports.dateParts = exports.dateFilter = exports.isSameDay = exports.getCurrentHour = void 0;
exports.convertHourToDecimal = convertHourToDecimal;
exports.calcMechanicalAvailability = calcMechanicalAvailability;
exports.normalizeCalc = normalizeCalc;
exports.removeOutliers = removeOutliers;
const dayjs_1 = __importDefault(require("dayjs"));
function convertHourToDecimal(hour) {
    const [hours, minutes] = hour.split(":").map(Number);
    const decimalMinutes = minutes / 60;
    return hours + decimalMinutes;
}
function calcMechanicalAvailability(totalMaintenance, countMaintenance, currentHour // 24 dia anterior ou hora atual
) {
    if (totalMaintenance === 0) {
        return 100.0;
    }
    const calc = normalizeCalc(((currentHour * 3600 - totalMaintenance / countMaintenance) /
        (currentHour * 3600)) *
        100, 2);
    if (calc > 100) {
        return 100.0;
    }
    if (calc < 0) {
        return 0;
    }
    return calc;
}
function normalizeCalc(value, fixed = 1) {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
        return 0;
    }
    value = value * 1;
    return parseFloat(value.toFixed(fixed));
}
const getCurrentHour = (date) => {
    // const currentDate = dayjs().subtract(3, "hours");
    const currentDate = (0, dayjs_1.default)();
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
exports.defaultFronts = {
    Caminhões: 900,
    Colhedoras: 0,
    Tratores: 0,
    Empilhadeiras: 0,
    Pulverizadores: 12,
};
const getEventTime = (event) => {
    if (!event.time.end) {
        return 0;
    }
    const startTime = (0, dayjs_1.default)(event.time.start);
    const endTime = (0, dayjs_1.default)(event.time.end);
    return endTime.diff(startTime, "seconds");
};
exports.getEventTime = getEventTime;
const msToTime = (ms) => {
    return (0, exports.secToTime)(ms / 1000);
};
exports.msToTime = msToTime;
const secToTime = (sec) => {
    let hours = Math.floor(sec / 3600);
    let minutes = Math.floor((sec % 3600) / 60);
    let seconds = Math.round(sec % 60);
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
    return num < 10 ? `0${num}` : num.toString().padStart(2, "0");
};
const groupEquipmentTelemetryByFront = (equipments, telemetry) => {
    const telemetryByFront = [];
    const equipmentMap = new Map(equipments.map((equip) => [equip.code, equip]));
    const telemetryGrouped = new Map([]);
    for (const record of telemetry) {
        const equipmentCode = +record.equipment_code;
        if (!telemetryGrouped.has(equipmentCode)) {
            telemetryGrouped.set(equipmentCode, []);
        }
        telemetryGrouped.get(equipmentCode).push(record);
    }
    for (const [equipmentCode, records] of telemetryGrouped.entries()) {
        const equipment = equipmentMap.get(equipmentCode);
        if (!equipment || equipment.description !== "Colhedoras") {
            continue;
        }
        records.sort((a, b) => a.occurrence - b.occurrence);
        const firstRecord = records[0];
        const lastRecord = records[records.length - 1];
        telemetryByFront.push({
            equipmentCode: equipment.code,
            workFrontCode: equipment.work_front_code,
            firstRecord: firstRecord,
            lastRecord: lastRecord,
        });
    }
    return telemetryByFront;
};
exports.groupEquipmentTelemetryByFront = groupEquipmentTelemetryByFront;
const calcTelemetryByFront = (telemetryByFront) => {
    let telemetryResult = {};
    for (const telemetry of telemetryByFront) {
        const telemetryCalc = (+telemetry.lastRecord.current_value - +telemetry.firstRecord.current_value).toFixed(2);
        if (telemetryResult[telemetry.workFrontCode]) {
            telemetryResult[telemetry.workFrontCode] +=
                +telemetryCalc > 0 ? +telemetryCalc : 0;
        }
        else {
            telemetryResult[telemetry.workFrontCode] =
                +telemetryCalc > 0 ? +telemetryCalc : 0;
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
    //Interferências de manutenção
    const interferenceMaintenceIds = interferences
        .filter((e) => e.interferenceType?.name === "Manutenção")
        .map((e) => e.id);
    //Interferências operacionais
    const interferenceOperationalStops = interferences
        .filter((e) => e.interferenceType?.name === "Operação")
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
                interferenceMaintenceIds.includes(event.interference.id)) {
                totalMaintenanceTime += diff;
                const code = event.equipment.code;
                uniqMaintenanceEquip.add(code);
                maintenanceEvents.push(event);
            }
            // Eventos de interferência operacional
            if (event.interference &&
                interferenceOperationalStops.includes(event.interference.id) &&
                !interferenceWeatherStops.includes(event.interference.id)) {
                totalInterferenceOperationalTime += diff;
                const code = event.equipment.code;
                uniqInterferenceOperationalEquip.add(code);
                interferenceOperationalEvents.push(event);
            }
            // Eventos de interferência
            if (event.interference &&
                !interferenceMaintenceIds.includes(event.interference.id) &&
                !interferenceOperationalStops.includes(event.interference.id) &&
                !interferenceWeatherStops.includes(event.interference.id)) {
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
    };
};
exports.calcJourney = calcJourney;
const calcTotalInterferenceByFront = (totalInterferenceTimeFront, totalInterferenceOprtlTimeFront) => {
    const totalInterferenceByFront = {};
    for (const workFrontCode in totalInterferenceTimeFront) {
        if (totalInterferenceTimeFront || totalInterferenceOprtlTimeFront) {
            const timeFrontValue = totalInterferenceTimeFront[workFrontCode] || 0;
            const oprtlTimeFrontValue = totalInterferenceOprtlTimeFront[workFrontCode] || 0;
            if (totalInterferenceByFront[workFrontCode]) {
                totalInterferenceByFront[workFrontCode] +=
                    timeFrontValue + oprtlTimeFrontValue;
            }
            else {
                totalInterferenceByFront[workFrontCode] =
                    timeFrontValue + oprtlTimeFrontValue;
            }
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
const createValueWithGoal = (value, hasTotalField = false, hasAverageField = false) => {
    return {
        value: Number(value.toFixed(2)),
        goal: null,
        hasTotalField,
        hasAverageField,
    };
};
exports.createValueWithGoal = createValueWithGoal;
/**
 * Convert seconds to HH:MM:SS
 */
const convertSecondstoTimeString = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};
exports.convertSecondstoTimeString = convertSecondstoTimeString;
const calcJourneyByFront = async (events, interferences) => {
    if (events.length == 0) {
        return {
            totalOperationalTime: {},
            operationalEvents: [],
            equipmentOperational: [],
            totalMaintenanceTime: {},
            maintenanceEvents: [],
            equipmentsMaintenance: [],
            totalInterferenceTime: {},
            interferenceEvents: [],
            equipmentInterference: [],
            totalInterferenceOperationalTime: {},
            interferenceOperationalEvents: [],
            equipmentsInterferenceOperational: [],
        };
    }
    let totalOperationalTime = {};
    const uniqEquip = new Set();
    const operationalEvents = [];
    let totalInterferenceTime = {};
    const uniqInterferenceEquip = new Set();
    const maintenanceEvents = [];
    let totalMaintenanceTime = {};
    const uniqMaintenanceEquip = new Set();
    const interferenceEvents = [];
    let totalInterferenceOperationalTime = {};
    const uniqInterferenceOperationalEquip = new Set();
    const interferenceOperationalEvents = [];
    //Interferências de manutenção
    const interferenceMaintenceIds = interferences
        .filter((e) => e.interferenceType?.name === "Manutenção")
        .map((e) => e.id);
    //Interferências operacionais
    const interferenceOperationalStops = interferences
        .filter((e) => e.interferenceType?.name === "Operação")
        .map((e) => e.id);
    //Interferências de clima
    const interferenceWeatherStops = [600, 601];
    for (const event of events) {
        const startTime = (0, dayjs_1.default)(event.time.start);
        const endTime = (0, dayjs_1.default)(event.time.end);
        const diffS = endTime.diff(startTime, "seconds");
        const diff = diffS / 3600;
        if (diff > 0) {
            const workFrontCode = event.workFront.code;
            // Eventos produtivos
            if (!event.interference && event.name !== "Motor Desligado") {
                if (totalOperationalTime[workFrontCode]) {
                    totalOperationalTime[workFrontCode] += diff;
                }
                else {
                    totalOperationalTime[workFrontCode] = diff;
                }
                const code = event.equipment.code;
                uniqEquip.add(code);
                operationalEvents.push(event);
            }
            // Eventos de manutenção
            if (event.interference &&
                interferenceMaintenceIds.includes(event.interference.id)) {
                if (totalMaintenanceTime[workFrontCode]) {
                    totalMaintenanceTime[workFrontCode] += diff;
                }
                else {
                    totalMaintenanceTime[workFrontCode] = diff;
                }
                const code = event.equipment.code;
                uniqMaintenanceEquip.add(code);
                maintenanceEvents.push(event);
            }
            // Eventos de interferência operacional
            if (event.interference &&
                interferenceOperationalStops.includes(event.interference.id) &&
                !interferenceWeatherStops.includes(event.interference.id)) {
                if (totalInterferenceOperationalTime[workFrontCode]) {
                    totalInterferenceOperationalTime[workFrontCode] += diff;
                }
                else {
                    totalInterferenceOperationalTime[workFrontCode] = diff;
                }
                const code = event.equipment.code;
                uniqInterferenceOperationalEquip.add(code);
                interferenceOperationalEvents.push(event);
            }
            // Eventos de interferência
            if (event.interference &&
                !interferenceMaintenceIds.includes(event.interference.id) &&
                !interferenceOperationalStops.includes(event.interference.id) &&
                !interferenceWeatherStops.includes(event.interference.id)) {
                if (totalInterferenceTime[workFrontCode]) {
                    totalInterferenceTime[workFrontCode] += diff;
                }
                else {
                    totalInterferenceTime[workFrontCode] = diff;
                }
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
    let totalInterference = {};
    const baseObject = Object.keys(totalInterferenceTime).length > 0
        ? totalInterferenceTime
        : Object.keys(totalInterferenceOperationalTime).length > 0
            ? totalInterferenceOperationalTime
            : totalMaintenanceTime;
    for (const [workFrontCode, value] of Object.entries(baseObject)) {
        totalInterference[workFrontCode] =
            (totalInterferenceTime[workFrontCode] ?? 0) +
                (totalInterferenceOperationalTime[workFrontCode] ?? 0) +
                (totalMaintenanceTime[workFrontCode] ?? 0);
    }
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
    };
};
exports.calcJourneyByFront = calcJourneyByFront;
const getDaysInMonth = (dateString) => {
    const [year, month] = dateString.split("-").map(Number);
    const lastDay = new Date(year, month, 0);
    return lastDay.getDate();
};
exports.getDaysInMonth = getDaysInMonth;
const getDaysBetweenDates = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = end.getTime() - start.getTime();
    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};
exports.getDaysBetweenDates = getDaysBetweenDates;
const getHarvestDateRange = (date) => {
    const [year] = date.split("-");
    const startDate = `${year}-04-01`;
    const endDate = `${year}-12-31`;
    return { startDate, endDate };
};
exports.getHarvestDateRange = getHarvestDateRange;
const getHarvesterEvents = (equipments, events) => {
    const harvestEvents = events.filter((e) => equipments.some((equipment) => e.equipment.code === equipment.code &&
        equipment.description === "Colhedoras"));
    return harvestEvents;
};
exports.getHarvesterEvents = getHarvesterEvents;
const getDefaultHoursData = (currentHour) => {
    const hoursData = [];
    for (let hour = 0; hour <= currentHour; hour++) {
        hoursData.push({
            hour: `${hour.toString().padStart(2, '0')}:00`,
            value: 100
        });
    }
    return hoursData;
};
exports.getDefaultHoursData = getDefaultHoursData;
//# sourceMappingURL=helper.js.map