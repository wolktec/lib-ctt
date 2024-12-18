
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

  const calc = normalizeCalc(((currentHour - totalMaintenance / countMaintenance) / currentHour) * 100, 2);
  return calc;
}
export function normalizeCalc(value: number, fixed = 1) {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return parseFloat(value.toFixed(fixed));
}