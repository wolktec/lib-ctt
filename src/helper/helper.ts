import dayjs from "dayjs";
import {
  CttEquipmentProductivity,
  CttEquipmentProductivityFront,
  CttInterferences,
  CttTelemetry,
  CttTelemetryByFront,
  Journey,
  JourneyFront,
} from "../interfaces/performanceIndicators.interface";
import {
  CttEquipment,
  CttEvent,
} from "../interfaces/availabilityAllocation.interface";

export function convertHourToDecimal(hour: string): number {
  const [hours, minutes] = hour.split(":").map(Number);
  const decimalMinutes = minutes / 60;
  return hours + decimalMinutes;
}

export function calcMechanicalAvailability(
  totalMaintenance: number,
  countMaintenance: number,
  currentHour: number // 24 dia anterior ou hora atual
) {
  if (totalMaintenance === 0) {
    return 100.0;
  }
  const calc = normalizeCalc(
    ((currentHour - totalMaintenance / countMaintenance) / currentHour) * 100,
    2
  );
  return calc;
}
export function normalizeCalc(value: number, fixed = 1) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  value = value * 1;
  return parseFloat(value.toFixed(fixed));
}

export const getCurrentHour = (date: number) => {
  const currentDate = dayjs().subtract(3, "hours");

  const isSame = isSameDay(date, currentDate.valueOf());

  let hour = 24;
  if (isSame) {
    hour = currentDate.get("hour");
  }

  return hour;
};

export const isSameDay = (date1: number, date2: number) => {
  const dt1 = dayjs(date1).subtract(3, "hours");
  const dt2 = dayjs(date2).subtract(3, "hours");

  const isSame = dt1.isSame(dt2, "day");

  return isSame;
};

export const dateFilter = (start_date?: string, splitSeparator = "/") => {
  const dt1 = dateParts(
    start_date ?? dayjs().subtract(3, "hours").format("DD/MM/YYYY"),
    splitSeparator
  );
  const startDate = dayjs()
    .set("M", dt1.month)
    .set("y", dt1.year)
    .set("D", dt1.day)
    .set("hour", 0)
    .set("minute", 0)
    .set("second", 0)
    .set("millisecond", 0)
    .add(3, "hours");

  if (!startDate.isValid()) {
    console.error("Data inválida");
  }

  const startDateTime = startDate.valueOf();

  return startDateTime;
};

export const dateParts = (date: string, splitSeparator = "/") => {
  const dt = date.split(splitSeparator);

  if (dt.length !== 3) {
    console.error("date", "invalid format date, expect format: dd/MM/YYYY");
  }

  if (splitSeparator == "-") {
    return {
      day: parseInt(dt[2]),
      month: parseInt(dt[1]) - 1,
      year: parseInt(dt[0]),
    };
  }

  return {
    day: parseInt(dt[0]),
    month: parseInt(dt[1]) - 1,
    year: parseInt(dt[2]),
  };
};

export const translations: { [key: string]: string } = {
  Caminhões: "truck",
  Colhedoras: "harvester",
  Tratores: "tractor",
  Empilhadeiras: "forklift",
  Pulverizadores: "pulverizer",
};

export const groupEquipmentsProductivityByFront = (
  equipmentsProductivity: CttEquipmentProductivity[],
  equipments: CttEquipment[]
): CttEquipmentProductivityFront[] => {
  const equipmentsProductivityByFront: CttEquipmentProductivityFront[] =
    equipmentsProductivity.map((equipmentProductivity) => {
      const matchingItem = equipments.find(
        (equipment) => equipment.code === equipmentProductivity.equipmentCode
      );
      return {
        ...equipmentProductivity,
        workFrontCode: matchingItem ? matchingItem.work_front_code : 0,
      };
    });

  return equipmentsProductivityByFront;
};

export const getEventTime = (event: CttEvent) => {
  const startTime = dayjs(event.time.start / 1000);
  const endTime = dayjs(event.time.end / 1000);
  return endTime.diff(startTime, "seconds");
};

export const msToTime = (ms: number): string => {
  return secToTime(ms / 1000);
};

export const secToTime = (sec: number): string => {
  let hours = Math.floor(sec / 3600);
  let minutes = Math.floor((sec % 3600) / 60);
  let seconds = Math.round(sec % 60);

  if (seconds >= 60) {
    minutes += 1;
    seconds = 0;
  }

  if (minutes >= 60) {
    hours += 1;
    minutes = 0;
  }

  return `${twoCaracters(hours)}:${twoCaracters(minutes)}:${twoCaracters(
    seconds
  )}`;
};

const twoCaracters = (num: number): string => {
  return num < 10 ? `0${num}` : num.toString().padStart(2, "0");
};

export const groupEquipmentTelemetryByFront = (
  equipments: CttEquipment[],
  telemetry: CttTelemetry[]
): CttTelemetryByFront[] => {
  const telemetryByFront: CttTelemetryByFront[] = [];
  for (const hourMeter of telemetry) {
    const equipment = equipments.find(
      (equip) => +hourMeter.equipment_code === equip.code
    );

    if (!equipment || equipment.description !== "Colhedoras") {
      continue;
    }

    const relatedRecords = telemetry.filter(
      (t) => +t.equipment_code === equipment.code
    );
    const sortedRecords = relatedRecords.sort(
      (a, b) => a.occurrence - b.occurrence
    );
    const firstRecord = sortedRecords[0];
    const lastRecord = sortedRecords[sortedRecords.length - 1];

    if (!telemetryByFront.some((t) => t.equipmentCode === equipment.code)) {
      telemetryByFront.push({
        equipmentCode: equipment.code,
        workFrontCode: equipment.work_front_code,
        firstRecord: firstRecord,
        lastRecord: lastRecord,
      });
    }
  }

  return telemetryByFront;
};

export const calcTelemetryByFront = (
  telemetryByFront: CttTelemetryByFront[]
): Record<string, number> => {
  let telemetryResult: Record<string, number> = {};
  for (const telemetry of telemetryByFront) {
    if (telemetryResult[telemetry.workFrontCode]) {
      telemetryResult[telemetry.workFrontCode] += normalizeCalc(
        +telemetry.lastRecord.current_value -
          +telemetry.firstRecord.current_value,
        2
      );
    } else {
      telemetryResult[telemetry.workFrontCode] = normalizeCalc(
        +telemetry.lastRecord.current_value -
          +telemetry.firstRecord.current_value,
        2
      );
    }
  }
  return telemetryResult;
};

export const calcJourney = async (
  events: CttEvent[],
  interferences: CttInterferences[]
): Promise<Journey> => {
  if (events.length == 0) {
    return {
      totalOperationalTime: 0,
      operationalEvents: [],
      equipmentOperational: [],
      totalMaintenanceTime: 0,
      maintenanceEvents: [],
      equipmentsMaintenance: [],
      totalInterferenceTime: 0,
      interferenceEvents: [],
      equipmentInterference: [],
      totalInterferenceOperationalTime: 0,
      interferenceOperationalEvents: [],
      equipmentsInterferenceOperational: [],
    };
  }

  let totalOperationalTime = 0;
  const uniqEquip: Set<number> = new Set();
  const operationalEvents: CttEvent[] = [];

  let totalInterferenceTime = 0;
  const uniqInterferenceEquip: Set<number> = new Set();
  const maintenanceEvents: CttEvent[] = [];

  let totalMaintenanceTime = 0;
  const uniqMaintenanceEquip: Set<number> = new Set();
  const interferenceEvents: CttEvent[] = [];

  let totalInterferenceOperationalTime = 0;
  const uniqInterferenceOperationalEquip: Set<number> = new Set();
  const interferenceOperationalEvents: CttEvent[] = [];

  //Interferências de manutenção
  const interferenceMaintenceIds = interferences
    .filter((e) => e.interference_type?.name === "Manutenção")
    .map((e) => e.id);
  //Interferências operacionais
  const interferenceOperationalStops = interferences
    .filter((e) => e.interference_type?.name === "Operação")
    .map((e) => e.id);

  //Interferências de clima
  const interferenceWeatherStops = [600, 601];

  for (const event of events) {
    const startTime = dayjs(event.time.start);
    const endTime = dayjs(event.time.end);
    const diffS = endTime.diff(startTime, "seconds");
    const diff = diffS / 3600;
    if (diff > 0) {
      // Eventos produtivos
      if (!event.interference && event.name !== "Motor Desligado") {
        totalOperationalTime += diff;
        const code = event.equipment.code;
        uniqEquip.add(code);
        operationalEvents.push(event);
      }

      // Eventos de manutenção
      if (
        event.interference &&
        interferenceMaintenceIds.includes(event.interference.id)
      ) {
        totalMaintenanceTime += diff;
        const code = event.equipment.code;
        uniqMaintenanceEquip.add(code);
        maintenanceEvents.push(event);
      }

      // Eventos de interferência operacional
      if (
        event.interference &&
        interferenceOperationalStops.includes(event.interference.id) &&
        !interferenceWeatherStops.includes(event.interference.id)
      ) {
        totalInterferenceOperationalTime += diff;
        const code = event.equipment.code;
        uniqInterferenceOperationalEquip.add(code);
        interferenceOperationalEvents.push(event);
      }

      // Eventos de interferência
      if (
        event.interference &&
        !interferenceMaintenceIds.includes(event.interference.id) &&
        !interferenceOperationalStops.includes(event.interference.id) &&
        !interferenceWeatherStops.includes(event.interference.id)
      ) {
        totalInterferenceTime += diff;
        const code = event.equipment.code;
        uniqInterferenceEquip.add(code);
        interferenceEvents.push(event);
      }
    }
  }

  const uniqOperationalEquip: Set<number> = new Set([
    ...uniqEquip,
    ...uniqMaintenanceEquip,
    ...uniqInterferenceEquip,
  ]);

  const totalInterference =
    totalInterferenceTime + totalInterferenceOperationalTime;

  return {
    totalOperationalTime,
    operationalEvents,
    equipmentOperational: Array.from(uniqOperationalEquip),
    totalMaintenanceTime,
    maintenanceEvents,
    equipmentsMaintenance: Array.from(uniqMaintenanceEquip),
    totalInterferenceTime: totalInterference,
    interferenceEvents,
    equipmentInterference: Array.from(uniqInterferenceEquip),
    totalInterferenceOperationalTime: totalInterference,
    interferenceOperationalEvents,
    equipmentsInterferenceOperational: Array.from(
      uniqInterferenceOperationalEquip
    ),
  };
};

export const calcTotalInterferenceByFront = (
  totalInterferenceTimeFront: Record<string, number>,
  totalInterferenceOprtlTimeFront: Record<string, number>
): Record<string, number> => {
  const totalInterferenceByFront: Record<string, number> = {};

  for (const workFrontCode in totalInterferenceTimeFront) {
    if (totalInterferenceTimeFront || totalInterferenceOprtlTimeFront) {
      const timeFrontValue = totalInterferenceTimeFront[workFrontCode] || 0;
      const oprtlTimeFrontValue =
        totalInterferenceOprtlTimeFront[workFrontCode] || 0;

      if (totalInterferenceByFront[workFrontCode]) {
        totalInterferenceByFront[workFrontCode] +=
          timeFrontValue + oprtlTimeFrontValue;
      } else {
        totalInterferenceByFront[workFrontCode] =
          timeFrontValue + oprtlTimeFrontValue;
      }
    }
  }

  return totalInterferenceByFront;
};

export const getTotalHourmeter = (
  hourmeters: CttTelemetry[],
  firstHourmeterValue?: number
): number => {
  if (!hourmeters || hourmeters.length === 0) {
    return 0;
  }
  const hourmeterWithoutAnomalies = removeOutliers(
    hourmeters.map((e) => Number(e.current_value))
  );
  if (hourmeterWithoutAnomalies.length > 0) {
    let firstHourmeter =
      firstHourmeterValue ?? Number(hourmeterWithoutAnomalies[0]);
    let lastHourmeter = Number(
      hourmeterWithoutAnomalies[hourmeterWithoutAnomalies.length - 1]
    );
    const total = lastHourmeter - firstHourmeter;
    return total;
  }
  return 0;
};

export function removeOutliers(values: number[], totalDays = 1): number[] {
  let filteredData: number[] = [];

  // Verificar se o array tem menos de dois elementos
  if (values.length < 2) {
    return values;
  }

  if (values[values.length - 1] - values[0] < totalDays * 24) {
    return [values[0], values[values.length - 1]];
  }

  // Filtrar o primeiro item se não for anômalo
  let firstIsAnomaly = false;
  if (Math.abs(values[1] - values[0]) <= 5000 && values[1] - values[0] > 0) {
    filteredData.push(values[0]);
  } else {
    firstIsAnomaly = true;
  }

  let countSequence = 0;
  let lastValid = 0;
  // Verificar e filtrar os itens intermediários
  for (let i = 1; i < values.length - 1; i++) {
    lastValid = filteredData[filteredData.length - 1] ?? lastValid;

    const diffPrev = Math.abs(values[i] - lastValid);
    const diffNext = Math.abs(values[i] - values[i + 1]);
    if ((diffPrev <= 5000 || firstIsAnomaly) && diffNext <= 5000) {
      countSequence = 0;
      filteredData.push(values[i]);
    }

    if (diffPrev > 5000 || diffNext >= 5000) {
      countSequence++;
    }

    if (countSequence === 30) {
      countSequence = 0;
      filteredData = [];
      lastValid = values[i];
    }
  }

  // Filtrar o último item se não for anômalo
  const lastIndex = values.length - 1;
  if (Math.abs(values[lastIndex] - values[lastIndex - 1]) <= 5000) {
    filteredData.push(values[lastIndex]);
  }

  return filteredData;
}

export const createValueWithGoal = (
  value: number,
  hasTotalField: boolean = false,
  hasAverageField: boolean = false
): any => {
  return {
    value: Number(value.toFixed(2)),
    goal: null,
    hasTotalField,
    hasAverageField,
  };
};

/**
 * Convert seconds to HH:MM:SS
 */
export const convertSecondstoTimeString = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

export const calcJourneyByFront = async (
  events: CttEvent[],
  interferences: CttInterferences[]
): Promise<JourneyFront> => {
  if (events.length == 0) {
    return {
      totalOperationalTime: {},
      operationalEvents: [],
      equipmentOperational: [],
      totalMaintenanceTime: {},
      maintenanceEvents: [],
      equipmentsMaintenance: [],
      totalInterferenceTime: {},
      interferenceEvents: [],
      equipmentInterference: [],
      totalInterferenceOperationalTime: {},
      interferenceOperationalEvents: [],
      equipmentsInterferenceOperational: [],
    };
  }

  let totalOperationalTime: Record<string, number> = {};
  const uniqEquip: Set<number> = new Set();
  const operationalEvents: CttEvent[] = [];

  let totalInterferenceTime: Record<string, number> = {};
  const uniqInterferenceEquip: Set<number> = new Set();
  const maintenanceEvents: CttEvent[] = [];

  let totalMaintenanceTime: Record<string, number> = {};
  const uniqMaintenanceEquip: Set<number> = new Set();
  const interferenceEvents: CttEvent[] = [];

  let totalInterferenceOperationalTime: Record<string, number> = {};
  const uniqInterferenceOperationalEquip: Set<number> = new Set();
  const interferenceOperationalEvents: CttEvent[] = [];

  //Interferências de manutenção
  const interferenceMaintenceIds = interferences
    .filter((e) => e.interference_type?.name === "Manutenção")
    .map((e) => e.id);
  //Interferências operacionais
  const interferenceOperationalStops = interferences
    .filter((e) => e.interference_type?.name === "Operação")
    .map((e) => e.id);

  //Interferências de clima
  const interferenceWeatherStops = [600, 601];

  for (const event of events) {
    const startTime = dayjs(event.time.start);
    const endTime = dayjs(event.time.end);
    const diffS = endTime.diff(startTime, "seconds");
    const diff = diffS / 3600;
    if (diff > 0) {
      const workFrontCode = event.workFront.code;

      // Eventos produtivos
      if (!event.interference && event.name !== "Motor Desligado") {
        if (totalOperationalTime[workFrontCode]) {
          totalOperationalTime[workFrontCode] += diff;
        } else {
          totalOperationalTime[workFrontCode] = diff;
        }

        const code = event.equipment.code;
        uniqEquip.add(code);
        operationalEvents.push(event);
      }

      // Eventos de manutenção
      if (
        event.interference &&
        interferenceMaintenceIds.includes(event.interference.id)
      ) {
        if (totalMaintenanceTime[workFrontCode]) {
          totalMaintenanceTime[workFrontCode] += diff;
        } else {
          totalMaintenanceTime[workFrontCode] = diff;
        }

        const code = event.equipment.code;
        uniqMaintenanceEquip.add(code);
        maintenanceEvents.push(event);
      }

      // Eventos de interferência operacional
      if (
        event.interference &&
        interferenceOperationalStops.includes(event.interference.id) &&
        !interferenceWeatherStops.includes(event.interference.id)
      ) {
        if (totalInterferenceOperationalTime[workFrontCode]) {
          totalInterferenceOperationalTime[workFrontCode] += diff;
        } else {
          totalInterferenceOperationalTime[workFrontCode] = diff;
        }

        const code = event.equipment.code;
        uniqInterferenceOperationalEquip.add(code);
        interferenceOperationalEvents.push(event);
      }

      // Eventos de interferência
      if (
        event.interference &&
        !interferenceMaintenceIds.includes(event.interference.id) &&
        !interferenceOperationalStops.includes(event.interference.id) &&
        !interferenceWeatherStops.includes(event.interference.id)
      ) {
        if (totalInterferenceTime[workFrontCode]) {
          totalInterferenceTime[workFrontCode] += diff;
        } else {
          totalInterferenceTime[workFrontCode] = diff;
        }

        const code = event.equipment.code;
        uniqInterferenceEquip.add(code);
        interferenceEvents.push(event);
      }
    }
  }

  const uniqOperationalEquip: Set<number> = new Set([
    ...uniqEquip,
    ...uniqMaintenanceEquip,
    ...uniqInterferenceEquip,
  ]);

  let totalInterference: Record<string, number> = {};

  for (const [workFrontCode, value] of Object.entries(totalInterferenceTime)) {
    totalInterference[workFrontCode] =
      (value ?? 0) +
      (totalInterferenceOperationalTime[workFrontCode] ?? 0) +
      (totalMaintenanceTime[workFrontCode] ?? 0);
  }

  return {
    totalOperationalTime,
    operationalEvents,
    equipmentOperational: Array.from(uniqOperationalEquip),
    totalMaintenanceTime,
    maintenanceEvents,
    equipmentsMaintenance: Array.from(uniqMaintenanceEquip),
    totalInterferenceTime: totalInterference,
    interferenceEvents,
    equipmentInterference: Array.from(uniqInterferenceEquip),
    totalInterferenceOperationalTime: totalInterference,
    interferenceOperationalEvents,
    equipmentsInterferenceOperational: Array.from(
      uniqInterferenceOperationalEquip
    ),
  };
};
