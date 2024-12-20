import dayjs from "dayjs";
import { calcMechanicalAvailability, convertHourToDecimal, dateFilter, getCurrentHour, normalizeCalc, translations } from "../helper/helper"
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
  const groupedEvents = groupEventsByTypeAndFront(events, equipments);

  let mechanicalAvailability = await getMechanicalAvailability(groupedEvents, currentHour);
  let averageAvailability = calcAverageAvailability(mechanicalAvailability);
  const formattedValues = await formatAvailabilityReturn(equipmentsGroups, mechanicalAvailability, averageAvailability);
  return formattedValues;
}

const sumEquipmentsByGroup = async (
  equipments: Equipment[],
  events: Event[]
): Promise<EquipmentsGroupsType> => {
  try {
    const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));

    // soma equipamentos que possuem eventos e agrupa por frente e grupo
    let groupedEquipments: EquipmentsGroupsType = {};
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
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

/**
 * GET the mechanical availability by equipment
 * @param events
 */
const getMechanicalAvailability = async (events: Record<string, Event[]>, currentHour: number): Promise<Map<string, Map<string, number>>> => {
  try {
    let mechanicalAvailability = new Map<string, Map<string, number>>();
    let workFrontCode: number = 0;
    let totalMaintenanceTime: string = '';
    let eventCode: string = '';

    for (const [type, eventsOfType] of Object.entries(events)) {
      for (const [total, event] of Object.entries(eventsOfType)) {
        const startTime = dayjs(event.time.start);
        const endTime = dayjs(event.time.end);
        const diff = endTime.diff(startTime, 'seconds') / 3600;
        workFrontCode = event.workFront.code;
        totalMaintenanceTime = diff > 0 ? total + diff : total;
        eventCode = event.code;
        const uniqMaintenanceEquip = new Set(eventsOfType.map(event => event.equipment.code)).size;

        if (!mechanicalAvailability.has(type)) {
          mechanicalAvailability.set(type, new Map<string, number>());
        }

        mechanicalAvailability.get(type)?.set(workFrontCode.toString(), calcMechanicalAvailability(+totalMaintenanceTime, uniqMaintenanceEquip, currentHour));
      }
    }
    return mechanicalAvailability;
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
}

const calcAverageAvailability = (mechanicalAvailability: Map<string, Map<string, number>>) => {
  const averageAvailabilityByType = new Map<string, number>();

  for (const [type, workFronts] of mechanicalAvailability.entries()) {
    let totalAvailability = 0;
    let workFrontCount = 0;

    for (const availability of workFronts.values()) {
      totalAvailability += availability;
      workFrontCount += 1;
    }

    const averageAvailability = workFrontCount > 0 ? totalAvailability / workFrontCount : 0;
    averageAvailabilityByType.set(type, normalizeCalc(averageAvailability, 2));
  }
  return averageAvailabilityByType;
}

const formatAvailabilityReturn = async (groupedEquipments: EquipmentsGroupsType, mechanicalAvailability: Map<string, Map<string, number>>, averageAvailability: Map<string, number>): Promise<AvailabilityAndAllocationResult> => {
  let availabilityAllocation = {
    goal: 88,
    groups: Object.entries(groupedEquipments).map(([group, workFronts]) => ({
      group: translations[group],
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
}

/**
 * Agrupa os eventos por tipo de equipamento
 */
const groupEventsByTypeAndFront = (events: Event[], equipments: Equipment[]): Record<string, Event[]> => {
  const equipmentTypeMap = new Map<number, string>();
  equipments.forEach(equipment => {
    equipmentTypeMap.set(equipment.code, equipment.description);
  });

  const eventsByType = events.reduce((accumulator, event) => {
    if (event.interference) {
      const equipmentType = equipmentTypeMap.get(event.equipment.code);
      if (equipmentType) {
        if (!accumulator[equipmentType]) accumulator[equipmentType] = [];
        accumulator[equipmentType].push(event);
      }
    }
    return accumulator;
  }, {} as Record<string, Event[]>);
  return eventsByType;
}
export default createAvailabilityAllocation;