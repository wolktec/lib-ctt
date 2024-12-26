export interface CttEquipmentProductivity {
    equipmentCode: number;
    totalWeight: number;
    averageWeight: number;
    averageTripWeight: number;
    trips: number;
    loads: number;
}
export interface CttEquipmentProductivityFront extends CttEquipmentProductivity {
    workFrontCode: number;
}
