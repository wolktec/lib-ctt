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
const createAvailabilityByHour = async (equipments, events, date) => {
    let startDate = (0, helper_1.dateFilter)(date, "-");
    let currentHour = (0, helper_1.getCurrentHour)(startDate);
    const groupedEvents = groupEventsByType(events, equipments);
    let groupedEventsByFront = await groupEventsByFront(groupedEvents);
    // console.log("groupedEventsByFront: ", groupedEventsByFront);
    // console.log("equipments: ", equipments);
    let equipmentsGrouped = await sumEquipmentsByTypeAndFront(equipments, groupedEventsByFront);
    // console.log("equipmentsGrouped: ", equipmentsGrouped);
    let groupedEventsByHour = await groupEventsByHour(groupedEventsByFront, currentHour);
    // console.log("groupedEventsByHour: ", groupedEventsByHour);
    let averageMechanicalAvailability = calcAverageMechanicalAvailability(groupedEventsByHour);
    // console.log("averageMechanicalAvailability: ", averageMechanicalAvailability);
    const formattedValues = await formatAvailabilityReturn(groupedEventsByHour, currentHour, averageMechanicalAvailability, equipmentsGrouped);
    // console.log("formattedValues: ", formattedValues);
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
                    // console.log("eventTime: ", dayjs.utc(event.time.start).format(), " - ", dayjs.utc(event.time.end).format());
                    totalMaintenanceTime += (0, helper_1.getEventTime)(event);
                    // console.log("totalMaintenanceTime: ", totalMaintenanceTime);
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
                    // console.log("hour - calc: ", hour, calcMechanicalAvailability(
                    //   totalMaintenanceTime,
                    //   uniqMaintenanceEquip,
                    //   currentHour
                    // ));
                    if (!hourMap.has(hour)) {
                        hourMap.set(hour, (0, helper_1.calcMechanicalAvailability)(totalMaintenanceTime, uniqMaintenanceEquip, currentHour));
                    }
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
        const equipmentsByTypeAndFront = {};
        for (const [equipmentType, workFrontsMap] of events) {
            for (const [workFrontCode, eventsArray] of workFrontsMap) {
                const filteredEquipments = equipments.filter(equipment => equipment.description === equipmentType &&
                    equipment.work_front_code === workFrontCode);
                // console.log("filteredEquipments: ", filteredEquipments);
                if (!equipmentsByTypeAndFront[equipmentType]) {
                    equipmentsByTypeAndFront[equipmentType] = {};
                }
                equipmentsByTypeAndFront[equipmentType][workFrontCode] = filteredEquipments.length;
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
const calcAverageMechanicalAvailability = (mechanicalAvailability) => {
    const averageAvailabilityByType = new Map();
    for (const [type, workFronts] of mechanicalAvailability.entries()) {
        let totalAvailability = 0;
        let workFrontCount = 0;
        for (const hourMap of workFronts.values()) {
            for (const availability of hourMap.values()) {
                totalAvailability += availability;
                workFrontCount++;
            }
        }
        const averageAvailability = workFrontCount > 0 ? totalAvailability / workFrontCount : 0;
        averageAvailabilityByType.set(type, (0, helper_1.normalizeCalc)(averageAvailability, 2));
    }
    return averageAvailabilityByType;
};
/**
 * FORMAT mechanical availability by TYPE, FRONT and HOUR, added equipments and averages
 * @param events
 * @param currentHour
 * @param averageMechanicalAvailability
 * @param equipmentsGrouped
 */
const formatAvailabilityReturn = async (events, currentHour, averageMechanicalAvailability, equipmentsGrouped) => {
    const availabilityResult = {
        goal: 88, // hardcoded
        groups: [],
    };

    for (const [equipmentType, workFrontsMap] of events) {
        const workFrontsData = [];
        for (const [workFrontCode, hoursMap] of workFrontsMap) {
            const hoursData = [];
            for (let hour = 0; hour <= currentHour; hour++) {
                const value = hoursMap.get(hour) ?? 100;
                hoursData.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value });
            }
            if (currentHour < 23) {
                for (let hour = currentHour + 1; hour <= 23; hour++) {
                    hoursData.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value: 100 });
                }
            }
            let totalHourValue = 0;
            for (const hourValue of hoursData) {
                totalHourValue += hourValue.value;
            }
            const equipmentsCount = equipmentsGrouped[equipmentType]?.[+workFrontCode] || 0;
            workFrontsData.push({
                workFrontCode: +workFrontCode,
                equipments: equipmentsCount,
                shift: "A", // hardcoded
                hours: hoursData,
                average: (0, helper_1.normalizeCalc)(totalHourValue / hoursData.length, 2),
            });
        }
        workFrontsData.sort((a, b) => a.workFrontCode - b.workFrontCode);
        availabilityResult.groups.push({
            group: helper_1.translations[equipmentType],
            average: averageMechanicalAvailability.get(equipmentType) || 100,
            workFronts: workFrontsData,

        };
        groupsMap.set(equipmentType, groupData);
        availabilityResult.groups = equipmentTypeOrder.map(equipmentType => groupsMap.get(equipmentType));
    }
    return availabilityResult;
};
exports.default = createAvailabilityByHour;
//# sourceMappingURL=availabilityByHour.js.map