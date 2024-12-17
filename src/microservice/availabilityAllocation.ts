import dayjs from "dayjs";
import { calcMechanicalAvailability, convertHourToDecimal } from "../helper/helper"
import { AvailabilityAndAllocationResult, Equipment, Event, GroupEquipmentsCount } from "../interfaces/availabilityAllocation.interface";

export default class availabilityAllocation {


  public createAvailabilityAllocation = async (equipments: Equipment[], events: Event[]) => {
    // : Promise<AvailabilityAndAllocationResult>
    let teste: AvailabilityAndAllocationResult;
    let equipmentsGroups = this.sumEquipmentsByGroup(equipments, events);
    return equipmentsGroups;
  }

  /**
    * GET the online equipments quantity based on the events registered by FRONT and GROUP
    * @param equipments the group of equipments allocated in the front
    * @param events the events of the equipment
   */

  // TODO: refatorar e deixar para montar o objeto final com o valor de availability
  public sumEquipmentsByGroup = async (
    equipments: Equipment[],
    events: Event[]
  ): Promise<GroupEquipmentsCount> => {
    const eventEquipmentCodes = new Set(events.map(event => event.equipment.code));
    
    // soma equipamentos que possuem eventos e agrupa por frente e grupo
    const groupedEquipments = equipments.reduce<Record<string, Record<number, number>>>((accumulator, { description, work_front_code, code }) => {
      if (!accumulator[description]) {
        accumulator[description] = {};
      }

      if (!accumulator[description][work_front_code]) {
        accumulator[description][work_front_code] = 0;
      }

      if (eventEquipmentCodes.has(code)) {
        accumulator[description][work_front_code] += 1;
      }

      return accumulator;
    }, {});
    
    return Object.entries(groupedEquipments).map(([group, workFronts]) => ({
      group,
      workFronts: Object.entries(workFronts).map(([workFrontCode, equipments]) => ({
        workFrontCode: +workFrontCode,
        equipments,
      })),
    }));
  };

  /**
   * GET the mechanical availability by equipment
   * @param events
   */
  public getMechanicalAvailability = async (events: Event[], currentHour: string): Promise<number> => {
    let totalMaintenanceTime = 0;
    const currentHourDecimal = convertHourToDecimal(currentHour);

    const uniqMaintenanceEquip: Set<number> = new Set();

    for (const event of events) {
      const startTime = dayjs(event.time.start);
      const endTime = dayjs(event.time.end);
      const diffS = endTime.diff(startTime, "seconds");
      const diff = diffS / 3600;
      if (diff > 0) {
        // Eventos de manutenção
        if (event.interference) {
          totalMaintenanceTime += diff;
          const code = event.equipment.code;
          uniqMaintenanceEquip.add(code);
        }
      }
    }

    const mechanicalAvailability = calcMechanicalAvailability(totalMaintenanceTime, uniqMaintenanceEquip.size, currentHourDecimal);
    return mechanicalAvailability;
  }
  public getMediaTotal = async (media: any) => {
    let totalMedia = media;
    return totalMedia;
  }
}