"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.localTimeZone = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const helper_1 = require("../../helper/helper");
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
exports.localTimeZone = "America/Sao_Paulo";
/**
 * CREATE the equipments availability by TYPE, FRONT and HOUR based on the events sent
 * @param equipments the group of equipments allocated in the front
 * @param events the events of the equipment(s)
 * @param date '2023-12-23 15:41:51' datetime filter
 */
const createAvailabilityByHour = async (equipments, events, workFronts, date) => {
    let startDate = (0, helper_1.dateFilter)(date, "-");
    let currentHour = (0, helper_1.getCurrentHour)(startDate);
    const groupedEvents = groupEventsByType(events, equipments);
    let groupedEventsByFront = await groupEventsByFront(groupedEvents);
    // console.log("groupedEventsByFront: ", groupedEventsByFront);
    // console.log("equipments: ", equipments);
    // Get from all events
    let equipmentsGrouped = await sumEquipmentsByTypeAndFront(equipments, events);
    let groupedEventsByHour = await groupEventsByHour(groupedEventsByFront, currentHour);
    // console.log("groupedEventsByHour: ", groupedEventsByHour);
    let mechanicalAvailabilityCalculated = calcAverageMechanicalAvailabilityHours(groupedEventsByHour, currentHour);
    let averageMechanicalAvailability = calcAverageMechanicalAvailability(mechanicalAvailabilityCalculated);
    // console.log("averageMechanicalAvailability: ", averageMechanicalAvailability);
    const formattedValues = await formatAvailabilityReturn(mechanicalAvailabilityCalculated, currentHour, averageMechanicalAvailability, equipmentsGrouped, workFronts);
    return formattedValues;
};
/**
 * GROUP events by equipment TYPE
 * @param events
 * @param equipments
 */
const groupEventsByType = (events, equipments) => {
    const equipmentTypeMap = new Map();
    equipments.forEach((equipment) => {
        equipmentTypeMap.set(equipment.code, equipment.description);
    });
    const eventsByType = events.reduce((accumulator, event) => {
        if (event.interference && event.interference.name.toLowerCase().includes("manutenção".toLowerCase())) {
            const equipmentType = equipmentTypeMap.get(event.equipment.code);
            if (equipmentType) {
                if (!accumulator[equipmentType]) {
                    accumulator[equipmentType] = [];
                }
                accumulator[equipmentType].push(event);
            }
        }
        return accumulator;
    }, {});
    return eventsByType;
};
/**
 * GROUP events from TYPE by FRONT
 * @param events
 */
const groupEventsByFront = async (events) => {
    try {
        let eventsByTypeAndFront = new Map();
        let workFrontCode = 0;
        let diff = 0;
        for (const [type, eventsOfType] of Object.entries(events)) {
            for (const [_, event] of Object.entries(eventsOfType)) {
                diff += (0, helper_1.getEventTime)(event);
                if (diff > 0 && event.interference) {
                    workFrontCode = event.workFront.code;
                    if (!eventsByTypeAndFront.has(type)) {
                        eventsByTypeAndFront.set(type, new Map());
                    }
                    const workFrontMap = eventsByTypeAndFront.get(type);
                    if (!workFrontMap.has(workFrontCode)) {
                        workFrontMap.set(workFrontCode, []);
                    }
                    workFrontMap.get(workFrontCode).push(event);
                }
            }
        }
        return eventsByTypeAndFront;
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
/**
 * GROUP events from TYPE and FRONT by HOUR
 * @param events
 * @param currentHour
 */
const groupEventsByHour = async (events, currentHour) => {
    try {
        const eventsByHour = new Map();
        const eventsRecord = {};
        let totalMaintenanceTime = 0;
        let uniqMaintenanceEquip = 0;
        for (const [equipmentType, workFrontsMap] of events) {
            eventsRecord[equipmentType] = workFrontsMap;
        }
        for (const [equipmentType, workFrontsMap] of Object.entries(eventsRecord)) {
            for (const [workFrontCode, eventsArray] of workFrontsMap) {
                totalMaintenanceTime = 0;
                // console.log("----- ----- ----- -----");
                for (const event of eventsArray) {
                    // const hour = dayjs(event.time.start).format("HH");
                    const hour = (0, dayjs_1.default)(event.time.start).hour();
                    // console.log(equipmentType, " - " , workFrontCode, " - hour: ", hour);
                    totalMaintenanceTime += (0, helper_1.getEventTime)(event);
                    // console.log("eventTime: ", dayjs.utc(event.time.start).format(), " - ", dayjs.utc(event.time.end).format() , ' = ', totalMaintenanceTime);
                    if (!eventsByHour.has(equipmentType)) {
                        eventsByHour.set(equipmentType, new Map());
                    }
                    uniqMaintenanceEquip = new Set(eventsArray.map((event) => event.equipment.code)).size;
                    // console.log("uniqMaintenanceEquip: ", uniqMaintenanceEquip);
                    const workFrontMap = eventsByHour.get(equipmentType);
                    if (!workFrontMap.has(workFrontCode)) {
                        workFrontMap.set(workFrontCode, new Map());
                    }
                    const hourMap = workFrontMap.get(workFrontCode);
                    // console.log("hour - calc - currentHour: ", hour, calcMechanicalAvailabilitySeconds(
                    //   totalMaintenanceTime,
                    //   uniqMaintenanceEquip,
                    //   currentHour
                    // ), currentHour);
                    hourMap.set(hour, (0, helper_1.calcMechanicalAvailabilitySeconds)(totalMaintenanceTime, uniqMaintenanceEquip, currentHour));
                }
                // console.log("----- -----");
                // console.log("equipmentType - workFrontCode - events: ", equipmentType, " - ", workFrontCode, " - ", eventsArray);
            }
        }
        return eventsByHour;
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
/**
 * SUM unique equipments by TYPE and FRONT
 * @param equipments
 * @param events
 */
const sumEquipmentsByTypeAndFront = async (equipments, events) => {
    try {
        const equipmentTypeMap = new Map();
        equipments.forEach((equipment) => {
            equipmentTypeMap.set(equipment.code, equipment.description);
        });
        const equipmentsByTypeAndFrontTemp = {};
        for (const event of events) {
            const equipmentCode = event.equipment.code;
            const equipmentType = equipmentTypeMap.get(equipmentCode);
            const workFrontCode = event.workFront.code;
            if (equipmentType && !equipmentsByTypeAndFrontTemp[equipmentType]) {
                equipmentsByTypeAndFrontTemp[equipmentType] = {};
            }
            if (equipmentType && !equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode]) {
                equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode] = new Set();
            }
            if (equipmentType) {
                equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode].add(equipmentCode);
            }
        }
        const equipmentsByTypeAndFront = {};
        for (const equipmentType in equipmentsByTypeAndFrontTemp) {
            equipmentsByTypeAndFront[equipmentType] = {};
            for (const workFrontCode in equipmentsByTypeAndFrontTemp[equipmentType]) {
                equipmentsByTypeAndFront[equipmentType][workFrontCode] = equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode].size;
            }
        }
        return equipmentsByTypeAndFront;
    }
    catch (error) {
        console.error("Ocorreu um erro: ", error);
        throw error;
    }
};
/**
 * CALC average mechanical availability by TYPE, FRONT and HOUR
 * @param mechanicalAvailability
 */
const calcAverageMechanicalAvailabilityHours = (mechanicalAvailability, currentHour) => {
    for (const [type, workFronts] of mechanicalAvailability.entries()) {
        for (const [workFrontCode, hoursMap] of workFronts) {
            let totalAvailability = 0;
            const sortedHours = [];
            // console.log("----- ----- -----");
            for (let hour = 0; hour < currentHour; hour++) {
                totalAvailability += hoursMap.get(hour) ?? 100;
                const availability = (0, helper_1.normalizeCalc)(totalAvailability / (hour + 1), 2);
                // console.log("equipment: ", type, workFrontCode);
                // console.log("count: ", hour, totalAvailability, (hour+1), availability);
                sortedHours.push([hour, availability]);
            }
            sortedHours.sort((a, b) => a[0] - b[0]);
            hoursMap.clear();
            sortedHours.forEach(([hour, availability]) => hoursMap.set(hour, availability));
        }
    }
    return mechanicalAvailability;
};
/**
 * CALC average mechanical availability by TYPE and FRONT
 * @param mechanicalAvailability
 */
const calcAverageMechanicalAvailability = (mechanicalAvailability) => {
    const averageAvailabilityByType = new Map();
    for (const [type, workFronts] of mechanicalAvailability.entries()) {
        let totalAvailability = 0;
        let workFrontCount = 0;
        for (const [workFrontCode, hoursMap] of workFronts) {
            // console.log(type, workFrontCode, totalAvailability, hoursMap.get(23));
            totalAvailability += hoursMap.get(23) ?? 100; // last hour is already the avarage value
            workFrontCount++;
        }
        const averageAvailability = workFrontCount > 0 ? totalAvailability / workFrontCount : 0;
        averageAvailabilityByType.set(type, (0, helper_1.normalizeCalc)(averageAvailability, 2));
    }
    return averageAvailabilityByType;
};
/**
 * FORMAT mechanical availability by TYPE, FRONT and HOUR, added equipments and averages
 * @param equipmentsMap
 * @param currentHour
 * @param averageMechanicalAvailability
 * @param equipmentsGrouped
 */
const formatAvailabilityReturn = async (equipmentsMap, currentHour, averageMechanicalAvailability, equipmentsGrouped, workFronts) => {
    const availabilityResult = {
        goal: 88, // hardcoded
        groups: [],
    };
    const equipmentTypeOrder = ["Colhedoras", "Tratores", "Caminhões"];
    const groupsMap = new Map();
    const defaultFronts = {
        Colhedoras: workFronts,
        Tratores: workFronts,
        Caminhões: [900],
        Pulverizadores: [12],
    };
    const defaultHoursData = (0, helper_1.getDefaultHoursData)(currentHour);
    // fill return with all equipmentTypes and workFronts
    for (const equipmentType of equipmentTypeOrder) {
        const workFrontsToCreate = defaultFronts[equipmentType];
        const workFrontsMap = equipmentsMap.get(equipmentType) || new Map();
        const existingWorkFrontCodes = new Set(workFrontsMap.keys());
        const defaultWorkFrontsData = [];
        for (const workFrontToCreate of workFrontsToCreate) {
            if (!existingWorkFrontCodes.has(workFrontToCreate)) {
                defaultWorkFrontsData.push({
                    workFrontCode: workFrontToCreate,
                    equipments: equipmentsGrouped[equipmentType]?.[workFrontToCreate] || 0,
                    hours: defaultHoursData,
                    average: 100,
                });
                const defaultHoursMap = new Map(defaultHoursData.map(hourData => [parseInt(hourData.hour.split(":")[0]), hourData.value]));
                workFrontsMap.set(workFrontToCreate, defaultHoursMap);
            }
        }
        groupsMap.set(equipmentType, {
            group: helper_1.translations[equipmentType],
            average: averageMechanicalAvailability.get(equipmentType) || 100,
            workFronts: defaultWorkFrontsData,
        });
    }
    // format return with values
    for (const [equipmentType, workFrontsMap] of equipmentsMap) {
        const workFrontsData = [];
        for (const [workFrontCode, hoursMap] of workFrontsMap) {
            const hoursData = [];
            let sum = 0;
            let count = 0;
            for (let hour = 0; hour < currentHour; hour++) {
                const value = hoursMap.get(hour) ?? 100;
                hoursData.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value });
                sum += value;
                count++;
            }
            // fill rest of hours will null
            if (currentHour !== 24) {
                currentHour += 1;
                for (let hour = currentHour; hour < 24; hour++) {
                    hoursData.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value: null });
                }
            }
            let averageHourValue = count > 0 ? sum / count : 100;
            const equipmentsCount = equipmentsGrouped[equipmentType]?.[workFrontCode] || 0;
            workFrontsData.push({
                workFrontCode: +workFrontCode,
                equipments: equipmentsCount,
                hours: hoursData,
                average: averageHourValue,
            });
        }
        workFrontsData.sort((a, b) => a.workFrontCode - b.workFrontCode);
        const groupData = {
            group: helper_1.translations[equipmentType],
            average: averageMechanicalAvailability.get(equipmentType) || 100,
            workFronts: workFrontsData,
        };
        groupsMap.set(equipmentType, groupData);
        availabilityResult.groups = equipmentTypeOrder.map(equipmentType => groupsMap.get(equipmentType));
    }
    if (equipmentsMap.size == 0) {
        for (const [equipmentType, groupData] of groupsMap) {
            const workFrontsData = groupData.workFronts;
            for (const workFrontData of workFrontsData) {
                workFrontData.equipments = equipmentsGrouped[equipmentType]?.[workFrontData.workFrontCode] || 0;
            }
            workFrontsData.sort((a, b) => a.workFrontCode - b.workFrontCode);
            groupsMap.get(equipmentType).workFronts = workFrontsData;
        }
        availabilityResult.groups = Array.from(groupsMap.values());
    }
    return availabilityResult;
};
exports.default = createAvailabilityByHour;
//# sourceMappingURL=availabilityByHour.js.map