"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const helper_1 = require("../helper/helper");
/**
  * GET the available equipments based on the events registered by FRONT and GROUP
  * @param equipments the group of equipments allocated in the front
  * @param events the events of the equipment
 */
const createAvailabilityAllocation = async (equipments, events, date) => {
    // : Promise<AvailabilityAndAllocationResult>
    let teste;
    let startDate = (0, helper_1.dateFilter)(date, '-');
    let currentHour = (0, helper_1.getCurrentHour)(startDate);
    let equipmentsGroups = await sumEquipmentsByGroup(equipments, events);
    const groupedEvents = groupEventsByTypeAndFront(events, equipments);
    let mechanicalAvailability = await getMechanicalAvailability(groupedEvents, currentHour);
    let averageAvailability = calcAverageAvailability(mechanicalAvailability);
    const formattedValues = await formatAvailabilityReturn(equipmentsGroups, mechanicalAvailability, averageAvailability);
    return formattedValues;
};
const sumEquipmentsByGroup = async (equipments, events) => {
    try {
        const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));
        // soma equipamentos que possuem eventos e agrupa por frente e grupo
        let groupedEquipments = {};
        for (const equipment of equipments) {
            if (eventEquipmentCodes.has(equipment.code)) {
                if (!groupedEquipments[equipment.description]) {
                    groupedEquipments[equipment.description] = {};
                }
                if (!groupedEquipments[equipment.description][equipment.work_front_code]) {
                    groupedEquipments[equipment.description][equipment.work_front_code] = 0;
                }
                groupedEquipments[equipment.description][equipment.work_front_code] += 1;
            }
        }
        return groupedEquipments;
    }
    catch (error) {
        console.error("Ocorreu um erro:", error);
        throw error;
    }
};
/**
 * GET the mechanical availability by equipment
 * @param events
 */
const getMechanicalAvailability = async (events, currentHour) => {
    try {
        let mechanicalAvailability = new Map();
        let workFrontCode = 0;
        let totalMaintenanceTime = '';
        let eventCode = '';
        for (const [type, eventsOfType] of Object.entries(events)) {
            for (const [total, event] of Object.entries(eventsOfType)) {
                const startTime = (0, dayjs_1.default)(event.time.start);
                const endTime = (0, dayjs_1.default)(event.time.end);
                const diff = endTime.diff(startTime, 'seconds') / 3600;
                workFrontCode = event.workFront.code;
                totalMaintenanceTime = diff > 0 ? total + diff : total;
                eventCode = event.code;
                const uniqMaintenanceEquip = new Set(eventsOfType.map(event => event.equipment.code)).size;
                if (!mechanicalAvailability.has(type)) {
                    mechanicalAvailability.set(type, new Map());
                }
                mechanicalAvailability.get(type)?.set(workFrontCode.toString(), (0, helper_1.calcMechanicalAvailability)(+totalMaintenanceTime, uniqMaintenanceEquip, currentHour));
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
const formatAvailabilityReturn = async (groupedEquipments, mechanicalAvailability, averageAvailability) => {
    let availabilityAllocation = {
        goal: 88,
        groups: Object.entries(groupedEquipments).map(([group, workFronts]) => ({
            group: helper_1.translations[group],
            average: averageAvailability.get(group) || 0,
            workFronts: Object.entries(workFronts)
                .map(([workFrontCode, equipments]) => ({
                workFrontCode: +workFrontCode,
                equipments,
                availability: mechanicalAvailability.get(group)?.get(workFrontCode.toString()) || 0,
            })),
        })),
    };
    return availabilityAllocation;
};
/**
 * Agrupa os eventos por tipo de equipamento
 */
const groupEventsByTypeAndFront = (events, equipments) => {
    const equipmentTypeMap = new Map();
    equipments.forEach(equipment => {
        equipmentTypeMap.set(equipment.code, equipment.description);
    });
    const eventsByType = events.reduce((accumulator, event) => {
        if (event.interference) {
            const equipmentType = equipmentTypeMap.get(event.equipment.code);
            if (equipmentType) {
                if (!accumulator[equipmentType])
                    accumulator[equipmentType] = [];
                accumulator[equipmentType].push(event);
            }
        }
        return accumulator;
    }, {});
    return eventsByType;
};
exports.default = createAvailabilityAllocation;
//# sourceMappingURL=availabilityAllocation.js.map