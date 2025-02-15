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
// dayjs.tz.setDefault('America/Sao_Paulo');
exports.localTimeZone = "America/Sao_Paulo";
/**
 * GET the available equipments based on the events registered by FRONT and GROUP
 * @param equipments the group of equipments allocated in the front
 * @param events the events of the equipment
 * @param date '2023-12-23 15:41:51' datetime filter
 * @param interferences interferences coming from the interference table
 * @param workFronts workFronts coming from the workFront table
 */
const createAvailabilityAllocation = async (equipments, events, date, interferences, workFronts) => {
    let startDate = (0, helper_1.dateFilter)(date, "-");
    let currentHour = (0, helper_1.getCurrentHour)(startDate);
    const groupedEvents = groupEventsByTypeAndFront(events, equipments, interferences);
    let equipmentsGroups = await sumEquipmentsByGroup(equipments, events, workFronts);
    let mechanicalAvailability = getMechanicalAvailability(groupedEvents, currentHour);
    let averageAvailability = calcAverageAvailability(mechanicalAvailability);
    const formattedValues = formatAvailabilityReturn(equipmentsGroups, mechanicalAvailability, averageAvailability);
    return formattedValues;
};
const sumEquipmentsByGroup = async (equipments, events, workFronts) => {
    try {
        const eventEquipmentCodes = new Set(events.map((event) => +event.equipment.code));
        let groupedEquipments = {};
        for (const equipment of equipments) {
            if (!eventEquipmentCodes.has(equipment.code)) {
                continue;
            }
            if ((equipment.work_front_code !== 900 &&
                equipment.description === "Caminhões") ||
                (equipment.work_front_code === 900 &&
                    equipment.description !== "Caminhões")) {
                continue;
            }
            if (!groupedEquipments[equipment.description]) {
                groupedEquipments[equipment.description] = {};
            }
            if (!groupedEquipments[equipment.description][equipment.work_front_code]) {
                groupedEquipments[equipment.description][equipment.work_front_code] = 0;
            }
            groupedEquipments[equipment.description][equipment.work_front_code] += 1;
        }
        const equipmentsTypes = ["Colhedoras", "Tratores", "Caminhões"];
        equipmentsTypes.forEach((type) => {
            if (!groupedEquipments[type]) {
                groupedEquipments[type] = {};
            }
        });
        for (const workFront of workFronts) {
            for (const description in groupedEquipments) {
                if (equipmentsTypes.includes(description)) {
                    if ((workFront.code !== 900 && description === "Caminhões") ||
                        (workFront.code === 900 && description !== "Caminhões")) {
                        continue;
                    }
                    if (!groupedEquipments[description][workFront.code]) {
                        groupedEquipments[description][workFront.code] = 0;
                    }
                }
            }
        }
        return groupedEquipments;
    }
    catch (error) {
        console.error(error);
        return {};
    }
};
/**
 * GET the mechanical availability by front
 * @param events
 */
const getMechanicalAvailability = (events, currentHour) => {
    try {
        let mechanicalAvailability = new Map();
        let eventCode = "";
        for (const [type, eventsOfType] of Object.entries(events)) {
            const eventByWorkFront = eventsOfType.reduce((acc, event) => {
                const workFrontId = event.workFront.id;
                if (!acc[workFrontId]) {
                    acc[workFrontId] = [];
                }
                acc[workFrontId].push(event);
                return acc;
            }, {});
            for (const [workFront, events] of Object.entries(eventByWorkFront)) {
                let totalMaintenanceTime = 0;
                let totalMaintenanceTeste = 0;
                let workFrontCode = "";
                const uniqMaintenanceEquip = new Set();
                for (const event of events) {
                    if (workFrontCode.length === 0) {
                        workFrontCode = event.workFront.code.toString();
                    }
                    if (event.interference) {
                        totalMaintenanceTime += (0, helper_1.getEventTime)(event);
                        const equipmentCode = event.equipment.code;
                        if (totalMaintenanceTime > 0) {
                            eventCode = event.code;
                            uniqMaintenanceEquip.add(equipmentCode);
                            if (!mechanicalAvailability.has(type)) {
                                mechanicalAvailability.set(type, new Map());
                            }
                        }
                    }
                }
                const availability = (0, helper_1.calcMechanicalAvailability)(totalMaintenanceTime / 3600, uniqMaintenanceEquip.size, currentHour);
                mechanicalAvailability.get(type)?.set(workFrontCode, availability);
            }
        }
        return mechanicalAvailability;
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
const calcAverageAvailability = (mechanicalAvailability) => {
    const averageAvailabilityByType = new Map();
    for (const [type, workFronts] of mechanicalAvailability.entries()) {
        let totalAvailability = 0;
        let workFrontCount = 0;
        for (const availability of workFronts.values()) {
            totalAvailability += availability;
            workFrontCount += 1;
        }
        const averageAvailability = workFrontCount > 0 ? totalAvailability / workFrontCount : 0;
        averageAvailabilityByType.set(type, (0, helper_1.normalizeCalc)(averageAvailability, 2));
    }
    return averageAvailabilityByType;
};
const formatAvailabilityReturn = (groupedEquipments, mechanicalAvailability, averageAvailability) => {
    let availabilityAllocation = {
        goal: 88,
        groups: Object.entries(groupedEquipments).map(([group, workFronts]) => ({
            group: helper_1.translations[group],
            average: averageAvailability.get(group) || 0,
            workFronts: Object.entries(workFronts).map(([workFrontCode, equipments]) => ({
                workFrontCode: +workFrontCode,
                equipments,
                availability: equipments
                    ? mechanicalAvailability
                        .get(group)
                        ?.get(workFrontCode.toString()) ?? 100
                    : null,
            })),
        })),
    };
    return availabilityAllocation;
};
/**
 * Agrupa os eventos por tipo de equipamento
 */
const groupEventsByTypeAndFront = (events, equipments, interference) => {
    const equipmentTypeMap = new Map();
    equipments.forEach((equipment) => {
        equipmentTypeMap.set(equipment.code, equipment.description);
    });
    const interferenceIds = interference
        .filter((e) => e.interferenceType?.name?.toLocaleLowerCase() === "manutenção")
        .map((e) => e.id);
    const eventsByType = {};
    events.forEach((event) => {
        if (event.interference && interferenceIds.includes(event.interference.id)) {
            const equipmentType = equipmentTypeMap.get(event.equipment.code);
            if (equipmentType) {
                if (!eventsByType[equipmentType]) {
                    eventsByType[equipmentType] = [];
                }
                eventsByType[equipmentType].push(event);
            }
        }
    });
    return eventsByType;
};
exports.default = createAvailabilityAllocation;
//# sourceMappingURL=availabilityAllocation.js.map