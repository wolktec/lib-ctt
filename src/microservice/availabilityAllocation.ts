import dayjs from "dayjs";
import { calcMechanicalAvailability, dateFilter, getCurrentHour, getEventTime, normalizeCalc, translations } from "../helper/helper"
import { CttAvailabilityAndAllocationResult, CttEquipment, CttEquipmentsGroupsType, CttEvent } from "../interfaces/availabilityAllocation.interface";
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.extend(timezone);
// dayjs.tz.setDefault('America/Sao_Paulo');

export const localTimeZone = 'America/Sao_Paulo';
/**
  * GET the available equipments based on the events registered by FRONT and GROUP
  * @param equipments the group of equipments allocated in the front
  * @param events the events of the equipment
 */
const createAvailabilityAllocation = async (equipments: CttEquipment[], events: CttEvent[], date: string): Promise<CttAvailabilityAndAllocationResult> => {
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
  equipments: CttEquipment[],
  events: CttEvent[]
): Promise<CttEquipmentsGroupsType> => {
  try {
    const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));

    // soma equipamentos que possuem eventos e agrupa por frente e grupo
    let groupedEquipments: CttEquipmentsGroupsType = {};
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
 * GET the mechanical availability by front
 * @param events
 */
const getMechanicalAvailability = async (events: Record<string, CttEvent[]>, currentHour: number): Promise<Map<string, Map<string, number>>> => {
  try {
    let mechanicalAvailability = new Map<string, Map<string, number>>();
    let workFrontCode: number = 0;
    let totalMaintenanceTime: number = 0;
    let eventCode: string = '';
    let uniqMaintenanceEquip: number = 0;
    let diffS = 0;
    let diff = 0;

    for (const [type, eventsOfType] of Object.entries(events)) {
      for (const [total, event] of Object.entries(eventsOfType)) {
        diff += getEventTime(event);
        totalMaintenanceTime = 0;
        if (diff > 0) {
          if (event.interference) {
            workFrontCode = event.workFront.code;
            totalMaintenanceTime = diff;
            eventCode = event.code;
            uniqMaintenanceEquip = new Set(eventsOfType.map(event => event.equipment.code)).size;
          }
        }
      }

      if (!mechanicalAvailability.has(type)) {
        mechanicalAvailability.set(type, new Map<string, number>());
      }
      
      mechanicalAvailability.get(type)?.set(workFrontCode.toString(), calcMechanicalAvailability(totalMaintenanceTime, uniqMaintenanceEquip, currentHour));
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

const formatAvailabilityReturn = async (groupedEquipments: CttEquipmentsGroupsType, mechanicalAvailability: Map<string, Map<string, number>>, averageAvailability: Map<string, number>): Promise<CttAvailabilityAndAllocationResult> => {
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
 * //TODO: Passar apenas as interferencias de manutenção e abastecimento
 */
const groupEventsByTypeAndFront = (events: CttEvent[], equipments: CttEquipment[]): Record<string, CttEvent[]> => {
  const equipmentTypeMap = new Map<number, string>();
  equipments.forEach(equipment => {
    equipmentTypeMap.set(equipment.code, equipment.description);
  });

  const eventsByType = events.reduce((accumulator, event) => {
    if (event.interference) {
      const equipmentType = equipmentTypeMap.get(event.equipment.code);
      if (equipmentType) {
        if (!accumulator[equipmentType]) {
          accumulator[equipmentType] = [];
        }
        accumulator[equipmentType].push(event);
      }
    }
    return accumulator;
  }, {} as Record<string, CttEvent[]>);
  return eventsByType;
}
export default createAvailabilityAllocation;