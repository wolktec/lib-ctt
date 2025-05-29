export interface CttEvent {
    code: string;
    equipment: {
        code: number;
    };
    workFront: {
        id: number;
        code: number;
        name: string;
    };
    name: string;
    interference?: {
        id: number;
        name: string;
    };
    time: {
        start: number;
        end: number;
    };
    shift: {
        id: number;
        name: string;
        order: number;
    };
    type: "AUTOMATIC" | "MANUAL";
}
export interface CttInterferences {
    id: number;
    interferenceType?: {
        name: string;
    };
}
type GoalValue = {
    value: number;
    goal: number;
};
export interface PerformanceIndicatorsWorkFront {
    workFrontCode: number;
    trips: number;
    averageWeight: number;
    trucksLack: string;
    awaitingTransshipment: string;
    engineIdle: string;
    autopilotUse: GoalValue;
    unproductiveTime: string;
    ctOffenders: number;
    tOffenders: number;
    agriculturalEfficiency: GoalValue;
    maneuvers: string;
    zone: string;
    averageRadius: number;
    averageShiftInefficiency: string;
}
export interface PerformanceIndicatorsSummary {
    label: string;
    lostTons: number;
    progress: number;
}
export interface CttPerformanceIndicators {
    workFronts: PerformanceIndicatorsWorkFront[];
    summary: PerformanceIndicatorsSummary[];
}
export interface Journey {
    totalOperationalTime: number;
    operationalEvents: CttEvent[];
    equipmentOperational: number[];
    totalMaintenanceTime: number;
    maintenanceEvents: CttEvent[];
    equipmentsMaintenance: number[];
    totalInterferenceTime: number;
    interferenceEvents: CttEvent[];
    equipmentInterference: number[];
    totalInterferenceOperationalTime: number;
    interferenceOperationalEvents: CttEvent[];
    equipmentsInterferenceOperational: number[];
}
export interface JourneyFront {
    totalOperationalTime: Record<string, number>;
    operationalEvents: CttEvent[];
    equipmentOperational: number[];
    totalMaintenanceTime: Record<string, number>;
    maintenanceEvents: CttEvent[];
    equipmentsMaintenance: number[];
    totalInterferenceTime: Record<string, number>;
    interferenceEvents: CttEvent[];
    equipmentInterference: number[];
    totalInterferenceOperationalTime: Record<string, number>;
    interferenceOperationalEvents: CttEvent[];
    equipmentsInterferenceOperational: number[];
}
export interface CttShiftInefficiencyByFront {
    workFrontCode: number;
    time: string;
}
export interface EventsDetailsInput {
    groupedType: "name" | "code";
}
export interface Indicators {
    time: number;
    progress: number;
    totalEquipments: number;
    average: number;
    equipments: number[];
    count: number;
}
export type JourneyConfig = {
    workFrontCode?: number;
    workFrontId?: number;
    equipmentCode?: number;
    equipmentId?: number;
    gmt?: string;
    startTime?: number;
    endTime?: number;
    currentHour?: number;
    searchWorkFrontField?: string;
};
export interface JourneyParams {
    date: string;
    unitCode: number;
    equipmentGroup: string;
    config: JourneyConfig;
}
export interface EquipmentAllocationData {
    total: number;
    equipments: number[];
}
export interface JourneyEventDetails {
    code: number;
    name: string;
    totalTime: number;
    totalTimeStr: string;
    averageTime: number;
    totalCount: number;
    type: "AUTOMATIC" | "MANUAL";
}
export interface JourneyResponse {
    totalTime: number;
    activeEquipments: EquipmentAllocationData;
    equipmentsInProduction: EquipmentAllocationData;
    equipmentsInInterference: EquipmentAllocationData;
    operational: Indicators;
    maintenance: Indicators;
    unproductive: Indicators;
    engineIdle: Indicators;
    mechanicalAvailability: number;
    harvestAreas: string[];
    eventsDetails?: JourneyEventDetails[];
}
export interface EfficiencyResponse {
    hourmeter: {
        totalHourMeter: number;
        averageHourMeter: number;
        control: number;
        utilization: number;
        goal: number;
    };
    elevator: {
        totalElevator: number;
        averageElevator: number;
        control: number;
        utilization: number;
        goal?: number;
    };
    automaticPilot: {
        totalAutomaticPilot: number;
        averageAutomaticPilot: number;
        control: number;
        goal: number;
        usePilotAutomatic: number;
    };
    operationalEffectiveness: {
        total: number;
        control: number;
        goal: number;
    };
}
export interface WorkFrontWeightReturn {
    workFrontCode: number;
    totalWeight: number;
    averageWeight: number;
    averageTripWeight: number;
    trips: number;
    loads: number;
    lastTrips: number;
    championWeight: number;
    trucksCycles: number | null;
    averageRadius: number | null;
}
export {};
