import dayjs from "dayjs";
import {
  calcMechanicalAvailability,
  dateFilter,
  getCurrentHour,
  getEventTime,
  normalizeCalc,
  translations,
  defaultFronts,
  getDefaultHoursData,
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
  date: string
): Promise<CttAvailability> => {
  let startDate = dateFilter(date, "-");
  let currentHour = getCurrentHour(startDate);
  // console.log("date: ", currentHour);
  // console.log("startDate: ", startDate);

  const groupedEvents = groupEventsByType(
    events,
    equipments
  );

  let groupedEventsByFront = await groupEventsByFront(
    groupedEvents
  );
  // console.log("groupedEventsByFront: ", groupedEventsByFront);
  // console.log("equipments: ", equipments);
  let equipmentsGrouped = await sumEquipmentsByTypeAndFront(equipments, groupedEventsByFront);
  // console.log("equipmentsGrouped: ", equipmentsGrouped);

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
  );

  // console.log("formattedValues: ", formattedValues);

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
          // console.log("eventTime: ", dayjs.utc(event.time.start).format(), " - ", dayjs.utc(event.time.end).format());
          totalMaintenanceTime += getEventTime(event);
          // console.log("totalMaintenanceTime: ", totalMaintenanceTime);

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
          // console.log("hour - calc: ", hour, calcMechanicalAvailability(
          //   totalMaintenanceTime,
          //   uniqMaintenanceEquip,
          //   currentHour
          // ));

          hourMap.set(
            hour,
            calcMechanicalAvailability(
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
  events: Map<string, Map<number, CttEvent[]>>
): Promise<CttEquipmentsGroupsType> => {
  try {
    const equipmentsByTypeAndFront: CttEquipmentsGroupsType = {};

    for (const [equipmentType, workFrontsMap] of events) {
      for (const [workFrontCode, eventsArray] of workFrontsMap) {        
        const filteredEquipments = equipments.filter(equipment => 
          equipment.description === equipmentType && 
          equipment.work_front_code === workFrontCode
        );
        // console.log("filteredEquipments: ", filteredEquipments);

        if (!equipmentsByTypeAndFront[equipmentType]) {
          equipmentsByTypeAndFront[equipmentType] = {};
        }
        equipmentsByTypeAndFront[equipmentType][workFrontCode] = filteredEquipments.length;

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
      console.log(type, workFrontCode, totalAvailability, hoursMap.get(23));
      totalAvailability += hoursMap.get(23) ?? 100; // last hour is already the avarage value
      workFrontCount++;
    }

    const averageAvailability =
      workFrontCount > 0 ? totalAvailability / workFrontCount : 0;
    console.log("averageAvailability: ", averageAvailability);
    averageAvailabilityByType.set(type, normalizeCalc(averageAvailability, 2));
  }
  return averageAvailabilityByType;
};

/**
 * FORMAT mechanical availability by TYPE, FRONT and HOUR, added equipments and averages
 * @param events
 * @param currentHour
 * @param averageMechanicalAvailability
 * @param equipmentsGrouped
 */
const formatAvailabilityReturn = async(
  events: Map<string, Map<number, Map<number, number>>>,
  currentHour: number,
  averageMechanicalAvailability: Map<string, number>,
  equipmentsGrouped: CttEquipmentsGroupsType
) => {
  const availabilityResult: CttAvailability = {
    goal: 88, // hardcoded
    groups: [],
  };

  const equipmentTypeOrder = ["Colhedoras", "Tratores", "Caminhões"];
  const groupsMap = new Map<string, CttAvailabilityGroupData>();

  for (const [equipmentType, workFrontsMap] of events) {
    const workFrontsData: CttAvailabilityWorkFrontData[] = [];
    for (const [workFrontCode, hoursMap] of workFrontsMap) {
      const hoursData = [];
      for (let hour = 0; hour < currentHour; hour++) {
        const value = hoursMap.get(hour) ?? 100;
        hoursData.push({ hour: `${hour.toString().padStart(2, '0')}:00`, value });
      }

      let averageHourValue = hoursData[hoursData.length - 1].value;
      const equipmentsCount = equipmentsGrouped[equipmentType]?.[+workFrontCode] || 0;

      workFrontsData.push({
        workFrontCode: +workFrontCode,
        equipments: equipmentsCount,
        shift: "A", // hardcoded
        hours: hoursData,
        average: averageHourValue,
      });

    }

    workFrontsData.sort((a, b) => a.workFrontCode - b.workFrontCode);

    const groupData = {
      group: translations[equipmentType],
      average: averageMechanicalAvailability.get(equipmentType) || 0,
      workFronts: workFrontsData,
    };

    groupsMap.set(equipmentType, groupData);

    availabilityResult.groups = equipmentTypeOrder.map(equipmentType =>
      groupsMap.get(equipmentType)!
    );
  }

  for (const equipmentType of equipmentTypeOrder) {
    if (!groupsMap.has(equipmentType)) {
      groupsMap.set(equipmentType, {
        group: translations[equipmentType],
        average: 100,
        workFronts: [{
          workFrontCode: defaultFronts[equipmentType],
          equipments: 0,
          shift: "A", // hardcoded
          hours: getDefaultHoursData(currentHour),
          average: 100,
        }],
      });

      availabilityResult.groups = equipmentTypeOrder.map(equipmentType =>
        groupsMap.get(equipmentType)!
      );
    }
  }

  return availabilityResult;
}

export default createAvailabilityByHour;
