import dayjs from "dayjs";
import {
  calcMechanicalAvailability,
  dateFilter,
  getCurrentHour,
  getEventTime,
  normalizeCalc,
  translations,
} from "../../helper/helper";
import {
  CttAvailabilityAndAllocationResult,
  CttEquipment,
  CttEquipmentsGroupsType,
  CttEvent,
} from "../../interfaces/availabilityAllocation.interface";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { CttInterferences } from "../../interfaces/performanceIndicators.interface";
dayjs.extend(utc);
dayjs.extend(timezone);
// dayjs.tz.setDefault('America/Sao_Paulo');

export const localTimeZone = "America/Sao_Paulo";
/**
 * GET the available equipments based on the events registered by FRONT and GROUP
 * @param equipments the group of equipments allocated in the front
 * @param events the events of the equipment
 * @param date '2023-12-23 15:41:51' datetime filter
 * @param interferences interferences coming from the interference table
 */
const createAvailabilityAllocation = async (
  equipments: CttEquipment[],
  events: CttEvent[],
  date: string,
  interferences: CttInterferences[]
): Promise<CttAvailabilityAndAllocationResult> => {
  let startDate = dateFilter(date, "-");
  let currentHour = getCurrentHour(startDate);

  const groupedEvents = groupEventsByTypeAndFront(
    events,
    equipments,
    interferences
  );

  let equipmentsGroups = await sumEquipmentsByGroup(equipments, events);

  let mechanicalAvailability = getMechanicalAvailability(
    groupedEvents,
    currentHour
  );
  let averageAvailability = calcAverageAvailability(mechanicalAvailability);
  const formattedValues = formatAvailabilityReturn(
    equipmentsGroups,
    mechanicalAvailability,
    averageAvailability
  );

  return formattedValues;
};

const sumEquipmentsByGroup = async (
  equipments: CttEquipment[],
  events: CttEvent[]
): Promise<CttEquipmentsGroupsType> => {
  try {
    const eventEquipmentCodes = new Set(
      events.map((event) => +event.equipment.code)
    );

    let groupedEquipments: CttEquipmentsGroupsType = {};
    for (const equipment of equipments) {
      if (!eventEquipmentCodes.has(equipment.code)) {
        continue;
      } else {
        if (!groupedEquipments[equipment.description]) {
          groupedEquipments[equipment.description] = {};
        }

        if (
          !groupedEquipments[equipment.description][equipment.work_front_code]
        ) {
          groupedEquipments[equipment.description][
            equipment.work_front_code
          ] = 0;
        }
        groupedEquipments[equipment.description][
          equipment.work_front_code
        ] += 1;
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
const getMechanicalAvailability = (
  events: Record<string, CttEvent[]>,
  currentHour: number
): Map<string, Map<string, number>> => {
  try {
    let mechanicalAvailability = new Map<string, Map<string, number>>();
    let workFrontCode: number = 0;
    let totalMaintenanceTime: number = 0;
    let eventCode: string = "";
    let uniqMaintenanceEquip: number = 0;

    for (const [type, eventsOfType] of Object.entries(events)) {
      for (const [total, event] of Object.entries(eventsOfType)) {
        totalMaintenanceTime = 0;
        if (event.interference) {
          workFrontCode = event.workFront.code;
          totalMaintenanceTime += getEventTime(event);
          if (totalMaintenanceTime > 0) {
            eventCode = event.code;
            uniqMaintenanceEquip = new Set(
              eventsOfType.map((event) => event.equipment.code)
            ).size;

            if (!mechanicalAvailability.has(type)) {
              mechanicalAvailability.set(type, new Map<string, number>());
            }

            const availability = calcMechanicalAvailability(
              totalMaintenanceTime,
              uniqMaintenanceEquip,
              currentHour
            );

            mechanicalAvailability
              .get(type)
              ?.set(workFrontCode.toString(), availability);
          }
        }
      }
    }

    return mechanicalAvailability;
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

const calcAverageAvailability = (
  mechanicalAvailability: Map<string, Map<string, number>>
) => {
  const averageAvailabilityByType = new Map<string, number>();

  for (const [type, workFronts] of mechanicalAvailability.entries()) {
    let totalAvailability = 0;
    let workFrontCount = 0;

    for (const availability of workFronts.values()) {
      totalAvailability += availability;
      workFrontCount += 1;
    }

    const averageAvailability =
      workFrontCount > 0 ? totalAvailability / workFrontCount : 0;
    averageAvailabilityByType.set(type, normalizeCalc(averageAvailability, 2));
  }
  return averageAvailabilityByType;
};

const formatAvailabilityReturn = (
  groupedEquipments: CttEquipmentsGroupsType,
  mechanicalAvailability: Map<string, Map<string, number>>,
  averageAvailability: Map<string, number>
) => {
  let availabilityAllocation = {
    goal: 88,
    groups: Object.entries(groupedEquipments).map(([group, workFronts]) => ({
      group: translations[group],
      average: averageAvailability.get(group) || 0,
      workFronts: Object.entries(workFronts).map(
        ([workFrontCode, equipments]) => ({
          workFrontCode: +workFrontCode,
          equipments,
          availability:
            mechanicalAvailability.get(group)?.get(workFrontCode.toString()) ||
            0,
        })
      ),
    })),
  };

  return availabilityAllocation;
};

/**
 * Agrupa os eventos por tipo de equipamento
 */
const groupEventsByTypeAndFront = (
  events: CttEvent[],
  equipments: CttEquipment[],
  interference: CttInterferences[]
): Record<string, CttEvent[]> => {
  const equipmentTypeMap = new Map<number, string>();
  equipments.forEach((equipment) => {
    equipmentTypeMap.set(equipment.code, equipment.description);
  });

  const interferenceIds = interference
    .filter((e) => e.interferenceType?.name === "Manutenção")
    .map((e) => e.id);

  const eventsByType: Record<string, CttEvent[]> = {};

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
export default createAvailabilityAllocation;
