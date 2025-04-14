import dayjs from "dayjs";
import {
  dateFilter,
  getCurrentHour,
  getEventTime,
  normalizeCalc,
  translations,
  getDefaultHoursData,
  calcMechanicalAvailabilitySeconds,
} from "../../helper/helper";
import {
  CttEquipment,
  CttEvent,
  CttEquipmentsGroupsType,
} from "../../interfaces/availabilityAllocation.interface";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  CttAvailability,
  CttAvailabilityWorkFrontData,
  CttAvailabilityGroupData,
} from "../../interfaces/availabilityByHour.interface";
dayjs.extend(utc);
dayjs.extend(timezone);

export const localTimeZone = "America/Sao_Paulo";
/**
 * CREATE the equipments availability by TYPE, FRONT and HOUR based on the events sent
 * @param equipments the group of equipments allocated in the front
 * @param events the events of the equipment(s)
 * @param date '2023-12-23 15:41:51' datetime filter
 */
const createAvailabilityByHour = async (
  equipments: CttEquipment[],
  events: CttEvent[],
  workFronts: number[],
  date: string
): Promise<CttAvailability> => {
  let startDate = dateFilter(date, "-");
  let currentHour = getCurrentHour(startDate);

  const groupedEvents = groupEventsByType(
    events,
    equipments
  );

  let groupedEventsByFront = await groupEventsByFront(
    groupedEvents
  );
  // console.log("groupedEventsByFront: ", groupedEventsByFront);
  // console.log("equipments: ", equipments);
  
  // Get from all events
  let equipmentsGrouped = await sumEquipmentsByTypeAndFront(equipments, events);

  let groupedEventsByHour = await groupEventsByHour(
    groupedEventsByFront,
    currentHour
  );

  // console.log("groupedEventsByHour: ", groupedEventsByHour);

  let mechanicalAvailabilityCalculated = calcAverageMechanicalAvailabilityHours(
    groupedEventsByHour,
    currentHour,
  );

  let averageMechanicalAvailability = calcAverageMechanicalAvailability(
    mechanicalAvailabilityCalculated
  );

  // console.log("averageMechanicalAvailability: ", averageMechanicalAvailability);

  const formattedValues = await formatAvailabilityReturn(
    mechanicalAvailabilityCalculated,
    currentHour,
    averageMechanicalAvailability,
    equipmentsGrouped,
    workFronts,
  );

  return formattedValues;
};

/**
 * GROUP events by equipment TYPE
 * @param events
 * @param equipments
 */
const groupEventsByType = (
  events: CttEvent[],
  equipments: CttEquipment[]
): Record<string, CttEvent[]> => {
  const equipmentTypeMap = new Map<number, string>();
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
  }, {} as Record<string, CttEvent[]>);
  return eventsByType;
};

/**
 * GROUP events from TYPE by FRONT
 * @param events
 */
const groupEventsByFront = async (
  events: Record<string, CttEvent[]>
): Promise<Map<string, Map<number, CttEvent[]>>> => {
  try {
    let eventsByTypeAndFront = new Map<string, Map<number, CttEvent[]>>();
    let workFrontCode: number = 0;
    let diff = 0;

    for (const [type, eventsOfType] of Object.entries(events)) {
      for (const [_, event] of Object.entries(eventsOfType)) {
        diff += getEventTime(event);
        if (diff > 0 && event.interference) {

          workFrontCode = event.workFront.code;

          if (!eventsByTypeAndFront.has(type)) {
            eventsByTypeAndFront.set(type, new Map<number, CttEvent[]>());
          }

          const workFrontMap = eventsByTypeAndFront.get(type)!;

          if (!workFrontMap.has(workFrontCode)) {
            workFrontMap.set(workFrontCode, []);
          }

          workFrontMap.get(workFrontCode)!.push(event);
        }
      }
    }

    return eventsByTypeAndFront;
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

/**
 * GROUP events from TYPE and FRONT by HOUR
 * @param events
 * @param currentHour
 */
const groupEventsByHour = async (
  events: Map<string, Map<number, CttEvent[]>>,
  currentHour: number
): Promise<Map<string, Map<number, Map<number, number>>>> => {
  try {
    const eventsByHour = new Map<string, Map<number, Map<number, number>>>();
    const eventsRecord: Record<string, Map<number, CttEvent[]>> = {};
    let totalMaintenanceTime: number = 0;
    let uniqMaintenanceEquip: number = 0;

    for (const [equipmentType, workFrontsMap] of events) {
      eventsRecord[equipmentType] = workFrontsMap;      
    }

    for (const [equipmentType, workFrontsMap] of Object.entries(eventsRecord)) {
      for (const [workFrontCode, eventsArray] of workFrontsMap) {
        totalMaintenanceTime = 0;
        // console.log("----- ----- ----- -----");
        for (const event of eventsArray) {
          // const hour = dayjs(event.time.start).format("HH");
          const hour = dayjs(event.time.start).hour();
          // console.log(equipmentType, " - " , workFrontCode, " - hour: ", hour);
          totalMaintenanceTime += getEventTime(event);
          // console.log("eventTime: ", dayjs.utc(event.time.start).format(), " - ", dayjs.utc(event.time.end).format() , ' = ', totalMaintenanceTime);

          if (!eventsByHour.has(equipmentType)) {
            eventsByHour.set(equipmentType, new Map());
          }

          uniqMaintenanceEquip = new Set(
            eventsArray.map((event) => event.equipment.code)
          ).size;
          // console.log("uniqMaintenanceEquip: ", uniqMaintenanceEquip);

          const workFrontMap = eventsByHour.get(equipmentType)!;

          if (!workFrontMap.has(workFrontCode)) {
            workFrontMap.set(workFrontCode, new Map());
          }

          const hourMap = workFrontMap.get(workFrontCode)!;
          // console.log("hour - calc - currentHour: ", hour, calcMechanicalAvailabilitySeconds(
          //   totalMaintenanceTime,
          //   uniqMaintenanceEquip,
          //   currentHour
          // ), currentHour);

          hourMap.set(
            hour,
            calcMechanicalAvailabilitySeconds(
              totalMaintenanceTime,
              uniqMaintenanceEquip,
              currentHour
            )
          );
        }
        // console.log("----- -----");
        // console.log("equipmentType - workFrontCode - events: ", equipmentType, " - ", workFrontCode, " - ", eventsArray);
      }
    }

    return eventsByHour;
  } catch (error) {
    console.error("Ocorreu um erro:", error);
    throw error;
  }
};

/**
 * SUM unique equipments by TYPE and FRONT
 * @param equipments
 * @param events
 */
const sumEquipmentsByTypeAndFront = async (
  equipments: CttEquipment[],
  events: CttEvent[]
): Promise<CttEquipmentsGroupsType> => {
  try {
    const equipmentTypeMap = new Map<number, string>();
    equipments.forEach((equipment) => {
      equipmentTypeMap.set(equipment.code, equipment.description);
    });

    const equipmentsByTypeAndFrontTemp: { [key: string]: { [key: number]: Set<number> } } = {};

    for (const event of events) {
      const equipmentCode = event.equipment.code;
      const equipmentType = equipmentTypeMap.get(equipmentCode);
      const workFrontCode = event.workFront.code;

      if (equipmentType && !equipmentsByTypeAndFrontTemp[equipmentType]) {
        equipmentsByTypeAndFrontTemp[equipmentType] = {};
      }

      if (equipmentType && !equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode]) {
        equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode] = new Set<number>();
      }

      if (equipmentType) {
        equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode].add(equipmentCode);
      }
    }

    const equipmentsByTypeAndFront: CttEquipmentsGroupsType = {};

    for (const equipmentType in equipmentsByTypeAndFrontTemp) {
      equipmentsByTypeAndFront[equipmentType] = {};
      for (const workFrontCode in equipmentsByTypeAndFrontTemp[equipmentType]) {
        equipmentsByTypeAndFront[equipmentType][workFrontCode] = equipmentsByTypeAndFrontTemp[equipmentType][workFrontCode].size;
      }
    }

    return equipmentsByTypeAndFront;
  } catch (error) {
    console.error("Ocorreu um erro: ", error);
    throw error;
  }
};

/**
 * CALC average mechanical availability by TYPE, FRONT and HOUR
 * @param mechanicalAvailability
 */
const calcAverageMechanicalAvailabilityHours = (
  mechanicalAvailability: Map<string, Map<number, Map<number, number>>>,
  currentHour: number,
) => {
  for (const [type, workFronts] of mechanicalAvailability.entries()) {
    for (const [workFrontCode, hoursMap] of workFronts) {
      let totalAvailability = 0;
      const sortedHours: [number, number][] = [];

      // console.log("----- ----- -----");
      for (let hour = 0; hour < currentHour; hour++) {
        totalAvailability += hoursMap.get(hour) ?? 100;
        const availability = normalizeCalc(totalAvailability / (hour+1), 2);
        // console.log("equipment: ", type, workFrontCode);
        // console.log("count: ", hour, totalAvailability, (hour+1), availability);
        sortedHours.push([hour, availability]);
      }

      sortedHours.sort((a, b) => a[0] - b[0]);
      hoursMap.clear();
      sortedHours.forEach(([hour, availability]) => hoursMap.set(hour, availability));
    }
  }
  return mechanicalAvailability;
};

/**
 * CALC average mechanical availability by TYPE and FRONT
 * @param mechanicalAvailability
 */
const calcAverageMechanicalAvailability = (
  mechanicalAvailability: Map<string, Map<number, Map<number, number>>>
) => {
  const averageAvailabilityByType = new Map<string, number>();

  for (const [type, workFronts] of mechanicalAvailability.entries()) {
    let totalAvailability = 0;
    let workFrontCount = 0;

    for (const [workFrontCode, hoursMap] of workFronts) {
      // console.log(type, workFrontCode, totalAvailability, hoursMap.get(23));
      totalAvailability += hoursMap.get(23) ?? 100; // last hour is already the avarage value
      workFrontCount++;
    }

    const averageAvailability =
      workFrontCount > 0 ? totalAvailability / workFrontCount : 0;
    averageAvailabilityByType.set(type, normalizeCalc(averageAvailability, 2));
  }
  return averageAvailabilityByType;
};

/**
 * FORMAT mechanical availability by TYPE, FRONT and HOUR, added equipments and averages
 * @param equipmentsMap
 * @param currentHour
 * @param averageMechanicalAvailability
 * @param equipmentsGrouped
 */
const formatAvailabilityReturn = async(
  equipmentsMap: Map<string, Map<number, Map<number, number>>>,
  currentHour: number,
  averageMechanicalAvailability: Map<string, number>,
  equipmentsGrouped: CttEquipmentsGroupsType,
  workFronts: number[],
) => {
  const availabilityResult: CttAvailability = {
    goal: 88, // hardcoded
    groups: [],
  };

  const equipmentTypeOrder = ["Colhedoras", "Tratores", "Caminhões"];
  const groupsMap = new Map<string, CttAvailabilityGroupData>();

  const defaultFronts: { [key: string]: Array<number> } = {
    Colhedoras: workFronts,
    Tratores: workFronts,
    Caminhões: [900],
    Pulverizadores: [12],
  };
  const defaultHoursData = getDefaultHoursData(currentHour);

  // fill return with all equipmentTypes and workFronts
  for (const equipmentType of equipmentTypeOrder) {

    const workFrontsToCreate = defaultFronts[equipmentType];
    const workFrontsMap = equipmentsMap.get(equipmentType) || new Map();
    const existingWorkFrontCodes = new Set(workFrontsMap.keys());

    const defaultWorkFrontsData: CttAvailabilityWorkFrontData[] = [];

    for (const workFrontToCreate of workFrontsToCreate) {
      if (!existingWorkFrontCodes.has(workFrontToCreate)) {
        defaultWorkFrontsData.push({
          workFrontCode: workFrontToCreate,
          equipments: equipmentsGrouped[equipmentType]?.[workFrontToCreate] || 0,
          hours: defaultHoursData,
          average: 100,
        });

        const defaultHoursMap = new Map(defaultHoursData.map(hourData => [parseInt(hourData.hour.split(":")[0]), hourData.value]));
        workFrontsMap.set(workFrontToCreate, defaultHoursMap);
      }
    }

    groupsMap.set(equipmentType, {
      group: translations[equipmentType],
      average: averageMechanicalAvailability.get(equipmentType) || 100,
      workFronts: defaultWorkFrontsData,
    });
  }

  for (const [equipmentType, workFrontsMap] of equipmentsMap) {
    const workFrontsData: CttAvailabilityWorkFrontData[] = [];
    
    for (const [workFrontCode, hoursMap] of workFrontsMap) {
      const hoursData = [];
  
      let sum = 0;
      let count = 0;
  
      for (let hour = 0; hour < currentHour; hour++) {
        const value = hoursMap.get(hour) ?? 100;
        hoursData.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value });
        sum += value;
        count++;
      }
  
      for (let hour = currentHour; hour < 24; hour++) {
        hoursData.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value: null });
      }
  
      let averageHourValue = count > 0 ? sum / count : 100;
      const equipmentsCount = equipmentsGrouped[equipmentType]?.[workFrontCode] || 0;
  
      workFrontsData.push({
        workFrontCode: +workFrontCode,
        equipments: equipmentsCount,
        hours: hoursData,
        average: averageHourValue,
      });
    }
  
    workFrontsData.sort((a, b) => a.workFrontCode - b.workFrontCode);
  
    const groupData = {
      group: translations[equipmentType],
      average: averageMechanicalAvailability.get(equipmentType) || 100,
      workFronts: workFrontsData,
    };
  
    groupsMap.set(equipmentType, groupData);
  
    availabilityResult.groups = equipmentTypeOrder.map(equipmentType =>
      groupsMap.get(equipmentType)!
    );
  }

  if (equipmentsMap.size == 0) {
    for (const [equipmentType, groupData] of groupsMap) {
      const workFrontsData: CttAvailabilityWorkFrontData[] = groupData.workFronts;
      for (const workFrontData of workFrontsData) {
        workFrontData.equipments = equipmentsGrouped[equipmentType]?.[workFrontData.workFrontCode] || 0;
      }

      workFrontsData.sort((a, b) => a.workFrontCode - b.workFrontCode);

      groupsMap.get(equipmentType)!.workFronts = workFrontsData;
    }
    availabilityResult.groups = Array.from(groupsMap.values());
  }

  return availabilityResult;
}

export default createAvailabilityByHour;
