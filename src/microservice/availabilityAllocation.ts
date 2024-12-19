import dayjs from "dayjs";
import { calcMechanicalAvailability, convertHourToDecimal, dateFilter, getCurrentHour, translations } from "../helper/helper"
import { AvailabilityAndAllocationResult, Equipment, EquipmentsGroupsType, Event } from "../interfaces/availabilityAllocation.interface";

/**
  * GET the available equipments based on the events registered by FRONT and GROUP
  * @param equipments the group of equipments allocated in the front
  * @param events the events of the equipment
 */
const createAvailabilityAllocation = async (equipments: Equipment[], events: Event[], date: string) => {
  // : Promise<AvailabilityAndAllocationResult>
  let teste: AvailabilityAndAllocationResult;
  let startDate = dateFilter(date, '-');
  let currentHour = getCurrentHour(startDate);

  let equipmentsGroups = await sumEquipmentsByGroup(equipments, events);
  let mechanicalAvailability = await getMechanicalAvailability(events, currentHour);
  const formattedValues = formatAvailabilityReturn(equipmentsGroups, mechanicalAvailability);
  return formattedValues;
}

const sumEquipmentsByGroup = async (
  equipments: Equipment[],
  events: Event[]
): Promise<EquipmentsGroupsType> => {
  try {
    const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));

    // soma equipamentos que possuem eventos e agrupa por frente e grupo
    const groupedEquipments = equipments.reduce<EquipmentsGroupsType>((accumulator, { description, work_front_code, code }) => {
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
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

/**
 * GET the mechanical availability by equipment
 * @param events
 */
const getMechanicalAvailability = async (events: Event[], currentHour: number): Promise<Map<string, number>> => {
  try {
    let totalMaintenanceTime = 0;
    const uniqMaintenanceEquip: Set<number> = new Set();
    let mechanicalAvailability = new Map<string, number>();

    for (const event of events) {
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
      mechanicalAvailability.set(event.workFront.code.toString(), calcMechanicalAvailability(totalMaintenanceTime, uniqMaintenanceEquip.size, currentHour));
    }

    return mechanicalAvailability;
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
}

const formatAvailabilityReturn = async (groupedEquipments: EquipmentsGroupsType, mechanicalAvailability: Map<string, number>) => {
  let availabilityAllocation = {
    goal: 88,
    groups: Object.entries(groupedEquipments).map(([group, workFronts]) => ({
      group: translations[group],
      workFronts: Object.entries(workFronts)
        .map(([workFrontCode, equipments]) => ({
          workFrontCode: +workFrontCode,
          equipments,
          availability: mechanicalAvailability.get(workFrontCode) || 0,
        })),
    })),
  };

  return availabilityAllocation;
}
export default createAvailabilityAllocation;