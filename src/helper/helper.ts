import dayjs from "dayjs";

import { HoursValue } from "../interfaces/availabilityByHour.interface";

export function normalizeCalc(value: number, fixed = 1) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  value = value * 1;
  return parseFloat(value.toFixed(fixed));
}

export const isSameDay = (date1: number, date2: number) => {
  const dt1 = dayjs(date1).subtract(3, "hours");
  const dt2 = dayjs(date2).subtract(3, "hours");

  const isSame = dt1.isSame(dt2, "day");

  return isSame;
};

export const getCurrentHour = (date: number) => {
  const currentDate = dayjs().subtract(3, "hours");

  const isSame = isSameDay(date, currentDate.valueOf());

  let hour = 24;

  if (isSame) {
    hour = currentDate.get("hour");
  }

  return hour;
};

const twoCharacters = (num: number): string => {
  return num < 10 ? `0${num}` : num.toString().padStart(2, "0");
};

export const hourToTime = (hoursValue: number): string => {
  const totalSeconds = Math.round(hoursValue * 3600);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  return `${twoCharacters(hours)}:${twoCharacters(minutes)}:${twoCharacters(
    seconds
  )}`;
};

export const getDefaultHoursData = (currentHour: number): HoursValue[] => {
  const hoursData: HoursValue[] = [];

  for (let hour = 0; hour < currentHour; hour++) {
    hoursData.push({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      value: 100,
    });
  }

  for (let hour = currentHour; hour < 24; hour++) {
    hoursData.push({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      value: null,
    });
  }

  return hoursData;
};
