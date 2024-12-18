import dayjs from "dayjs";
import { calcMechanicalAvailability, convertHourToDecimal } from "../helper/helper"
import { AvailabilityAndAllocationResult, Equipment, EquipmentsGroupsType, Event } from "../interfaces/availabilityAllocation.interface";

const createAvailabilityAllocation = async (equipments: Equipment[], events: Event[]) => {
  // : Promise<AvailabilityAndAllocationResult>
  let teste: AvailabilityAndAllocationResult;
  let equipmentsGroups = await sumEquipmentsByGroup(equipments, events);

  return formatAvailabilityReturn(equipmentsGroups);
}

/**
  * GET the online equipments quantity based on the events registered by FRONT and GROUP
  * @param equipments the group of equipments allocated in the front
  * @param events the events of the equipment
 */
const sumEquipmentsByGroup = async (
  equipments: Equipment[],
  events: Event[]
): Promise<EquipmentsGroupsType> => {
  const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));

  // soma equipamentos que possuem eventos e agrupa por frente e grupo
  const groupedEquipments = equipments.reduce<EquipmentsGroupsType>((accumulator, { description, work_front_code, code }) => {
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
const getMechanicalAvailability = async (interferences: Event[], currentHour: string): Promise<number> => {
  let totalMaintenanceTime = 0;
  const currentHourDecimal = convertHourToDecimal(currentHour);

  const uniqMaintenanceEquip: Set<number> = new Set();

  for (const event of interferences) {
    const startTime = dayjs(event.time.start);
    const endTime = dayjs(event.time.end);
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

  const mechanicalAvailability = calcMechanicalAvailability(totalMaintenanceTime, uniqMaintenanceEquip.size, currentHourDecimal);
  return mechanicalAvailability;
}

const formatAvailabilityReturn = async (groupedEquipments: EquipmentsGroupsType) => {
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
}
export default createAvailabilityAllocation;