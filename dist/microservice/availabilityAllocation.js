"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dayjs_1 = __importDefault(require("dayjs"));
const helper_1 = require("../helper/helper");
const createAvailabilityAllocation = async (equipments, events) => {
    // : Promise<AvailabilityAndAllocationResult>
    let teste;
    let equipmentsGroups = await sumEquipmentsByGroup(equipments, events);
    return formatAvailabilityReturn(equipmentsGroups);
};
/**
  * GET the online equipments quantity based on the events registered by FRONT and GROUP
  * @param equipments the group of equipments allocated in the front
  * @param events the events of the equipment
 */
const sumEquipmentsByGroup = async (equipments, events) => {
    const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));
    // soma equipamentos que possuem eventos e agrupa por frente e grupo
    const groupedEquipments = equipments.reduce((accumulator, { description, work_front_code, code }) => {
        if (!accumulator[description]) {
            accumulator[description] = {
                total: 0,
            };
        }
        if (!accumulator[description][work_front_code]) {
            accumulator[description][work_front_code] = 0;
        }
        if (eventEquipmentCodes.has(code)) {
            accumulator[description][work_front_code] += 1;
            accumulator[description].total += 1;
        }
        return accumulator;
    }, {});
    return groupedEquipments;
};
/**
 * GET the mechanical availability by equipment
 * @param interferences
 */
const getMechanicalAvailability = async (interferences, currentHour) => {
    let totalMaintenanceTime = 0;
    const currentHourDecimal = (0, helper_1.convertHourToDecimal)(currentHour);
    const uniqMaintenanceEquip = new Set();
    for (const event of interferences) {
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
    }
    const mechanicalAvailability = (0, helper_1.calcMechanicalAvailability)(totalMaintenanceTime, uniqMaintenanceEquip.size, currentHourDecimal);
    return mechanicalAvailability;
};
const formatAvailabilityReturn = async (groupedEquipments) => {
    let availabilityAllocation = {
        goal: 88,
        groups: Object.entries(groupedEquipments).map(([group, workFronts]) => ({
            group,
            total: workFronts.total,
            workFronts: Object.entries(workFronts).filter(([key]) => key !== 'total')
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