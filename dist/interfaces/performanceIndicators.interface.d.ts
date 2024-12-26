export interface EquipmentProductivity {
    equipmentCode: number;
    totalWeight: number;
    averageWeight: number;
    averageTripWeight: number;
    trips: number;
    loads: number;
}
export interface EquipmentProductivityFront extends EquipmentProductivity {
    workFrontCode: number;
}
