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
    let mechanicalAvailability = getMechanicalAvailability(events, currentHour);
    const formattedValues = formatAvailabilityReturn(equipmentsGroups);
    return mechanicalAvailability;
};
const sumEquipmentsByGroup = async (equipments, events) => {
    const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));
    // soma equipamentos que possuem eventos e agrupa por frente e grupo
    const groupedEquipments = equipments.reduce((accumulator, { description, work_front_code, code }) => {
        if (!accumulator[description]) {
            accumulator[description] = {};
        }
        if (!accumulator[description][work_front_code]) {
            accumulator[description][work_front_code] = 0;
        }
        if (eventEquipmentCodes.has(code)) {
            accumulator[description][work_front_code] += 1;
        }
        return accumulator;
    }, {});
    return groupedEquipments;
};
/**
 * GET the mechanical availability by equipment
 * @param events
 */
const getMechanicalAvailability = async (events, currentHour) => {
    let totalMaintenanceTime = 0;
    //  const currentHourDecimal = convertHourToDecimal(currentHour);
    const uniqMaintenanceEquip = new Set();
    let mechanicalAvailability = new Map();
    for (const event of events) {
        const startTime = (0, dayjs_1.default)(event.time.start);
        const endTime = (0, dayjs_1.default)(event.time.end);
        const diffS = endTime.diff(startTime, "seconds");
        const diff = diffS / 3600;
        if (diff > 0) {
            // Eventos de manutenção
            if (event.interference) {
                totalMaintenanceTime += diff;
                const code = event.equipment.code;
                uniqMaintenanceEquip.add(code);
            }
        }
        console.log('aa', uniqMaintenanceEquip);
        mechanicalAvailability.set(event.workFront.code.toString(), (0, helper_1.calcMechanicalAvailability)(totalMaintenanceTime, uniqMaintenanceEquip.size, currentHour));
    }
    return mechanicalAvailability;
};
const formatAvailabilityReturn = async (groupedEquipments) => {
    let availabilityAllocation = {
        goal: 88,
        groups: Object.entries(groupedEquipments).map(([group, workFronts]) => ({
            group,
            workFronts: Object.entries(workFronts)
                .map(([workFrontCode, equipments]) => ({
                workFrontCode: +workFrontCode,
                equipments,
            })),
        })),
    };
    return availabilityAllocation;
};
exports.default = createAvailabilityAllocation;
//# sourceMappingURL=availabilityAllocation.js.map