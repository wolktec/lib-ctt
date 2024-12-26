import { groupEquipmentsProductivityByFront } from "../helper/helper";
import { CttEquipment, CttEvent } from "../interfaces/availabilityAllocation.interface";
import { CttEquipmentProductivity, CttEquipmentProductivityFront } from "../interfaces/performanceIndicators.interface";

/**
  * GET the performance indicators by Front
  * @param equipmentProductivity equipment coming from the productivity API
  * @param events events from the day
  * @param date '2023-12-23 15:41:51' datetime filter
 */
const createPerformanceIndicators = async (equipmentProductivity: CttEquipmentProductivity[], events: CttEvent[], equipments: CttEquipment[], date: string) => {
  let equipmentsProductivityByFront = groupEquipmentsProductivityByFront(equipmentProductivity, equipments);
  const tripQtd = getTripQtdByFront(equipmentsProductivityByFront);
}

const getTripQtdByFront = (equipmentProductivity: CttEquipmentProductivityFront[]): Record<string, number> => {
  const tripQtd = equipmentProductivity.reduce((account, equipment) => {
    if (account[equipment.workFrontCode]) {
      account[equipment.workFrontCode] += equipment.trips;
    } else {
      account[equipment.workFrontCode] = equipment.trips;
    }
    return account;
  }, {} as Record<string, number>);

  return tripQtd;
}

export default createPerformanceIndicators