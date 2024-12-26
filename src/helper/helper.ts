import dayjs from "dayjs";
import { CttEquipmentProductivity, CttEquipmentProductivityFront } from "../interfaces/performanceIndicators.interface";
import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";

export function convertHourToDecimal(hour: string): number {
  const [hours, minutes] = hour.split(':').map(Number);
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
  const calc = normalizeCalc(((currentHour - (totalMaintenance / countMaintenance)) / currentHour) * 100, 2);
  return calc;
}
export function normalizeCalc(value: number, fixed = 1) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return parseFloat(value.toFixed(fixed));
}

export const getCurrentHour = (date: number) => {
  const currentDate = dayjs().subtract(3, "hours");

  const isSame = isSameDay(date, currentDate.valueOf());

  let hour = 24;
  if (isSame) {
    hour = currentDate.get('hour');
  }

  return hour;
};

export const isSameDay = (date1: number, date2: number) => {
  const dt1 = dayjs(date1).subtract(3, "hours");
  const dt2 = dayjs(date2).subtract(3, "hours");

  const isSame = dt1.isSame(dt2, 'day');

  return isSame
};

export const dateFilter = (
  start_date?: string,
  splitSeparator = '/'
) => {

  const dt1 = dateParts(start_date ?? dayjs().subtract(3, "hours").format("DD/MM/YYYY"), splitSeparator);
  const startDate = dayjs()
    .set('M', dt1.month)
    .set('y', dt1.year)
    .set('D', dt1.day)
    .set('hour', 0)
    .set('minute', 0)
    .set('second', 0)
    .set('millisecond', 0)
    .add(3, "hours");

  if (!startDate.isValid()) {
    console.error("Data inválida")
  }

  const startDateTime = startDate.valueOf()

  return startDateTime
};

export const dateParts = (date: string, splitSeparator = "/") => {
  const dt = date.split(splitSeparator);

  if (dt.length !== 3) {
    console.error('date', 'invalid format date, expect format: dd/MM/YYYY');
  }

  if (splitSeparator == '-') {
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
}

export const translations: { [key: string]: string } = {
  "Caminhões": "truck",
  "Colhedoras": "harvester",
  "Tratores": "tractor",
  "Empilhadeiras": "forklift",
  "Pulverizadores": "pulverizer"
};

export const groupEquipmentsProductivityByFront = (equipmentsProductivity: CttEquipmentProductivity[], equipments: CttEquipment[]): CttEquipmentProductivityFront[] => {
  const equipmentsProductivityByFront: CttEquipmentProductivityFront[] = equipmentsProductivity.map(equipmentProductivity => {
    const matchingItem = equipments.find(equipment => equipment.code === equipmentProductivity.equipmentCode);
    return {
      ...equipmentProductivity,
      workFrontCode: matchingItem ? matchingItem.work_front_code : 0,
    };
  });

  return equipmentsProductivityByFront;
}

export const getEventTime = (event: CttEvent) => {
  let diffS: number = 0;
  const startTime = dayjs(event.time.start);
  const endTime = dayjs(event.time.end);
  diffS = endTime.diff(startTime, "seconds");
  return diffS / 3600;
}

export const msToTime = (ms: number): string => {
  return secToTime(ms / 1000);
}

export const secToTime = (sec: number): string => {
  let hours = Math.floor(sec / 3600);
  let minutes = Math.floor((sec - hours * 3600) / 60);
  let seconds = Math.round(sec - hours * 3600 - minutes * 60);

  if(seconds >= 60) {
      minutes += 1;
      seconds = 0;
  }

  if (minutes >= 60) {
      hours += 1;
      minutes = 0;
  }

  return `${twoCaracters(hours)}:${twoCaracters(minutes)}:${twoCaracters(seconds)}`;
}

const twoCaracters = (num: number): string => {
  return num < 10 ? `0${num}` : num.toString();
}