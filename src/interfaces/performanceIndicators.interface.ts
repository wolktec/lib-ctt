import { CttEvent } from "./availabilityAllocation.interface";

export interface CttEquipmentProductivity {
    equipmentCode: number,
    totalWeight: number,
    averageWeight: number,
    averageTripWeight: number,
    trips: number,
    loads: number
}

export interface CttEquipmentProductivityFront extends CttEquipmentProductivity {
    workFrontCode: number
}

export interface CttIdleEvents {
    name: string,
    has_engine_idle: boolean,
    engine_idle_sec: number
}

export interface CttTelemetry {
    "occurrence": number,
    "sensor_name": string,
    "current_value": string,
    "max_value": string,
    "min_value": string,
    "mean_value": string,
    "equipment_code": string,
}

export interface CttTelemetryByFront {
    equipmentCode: number,
    workFrontCode: number,
    firstRecord: CttTelemetry,
    lastRecord: CttTelemetry
}

export interface CttTrucksLack {
    formattedTrucksLack: Record<string, string>;
    trucksLack: Record<string, number>;
}

export type CttAutoPilotUse = Record<string, {
    value: number;
    goal: number;
}>

export type CttAgriculturalEfficiency = Record<string, {
    value: number;
    goal: number;
}>

export interface CttInterferences {
    id: number,
    interference_type?: {
        name: string
    }
}

export interface CttPerformanceIndicators {
    workFronts: Array<{
        workFrontCode: number,
        trips: number,
        averageWeight: number,
        trucksLack: string,
        awaitingTransshipment: string,
        engineIdle: string,
        autopilotUse: {
            value: number,
            goal: number,
        },
        elevatorUse: number,
        unproductiveTime: string,
        ctOffenders: number,
        tOffenders: number,
        agriculturalEfficiency: {
            value: number,
            goal: number,
        },
        maneuvers: string,
        zone: number,
        averageRadius: number,

    }>;
    summary: CttSummaryReturn[]
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
    totalInterferenceByFront: Record<string, number>;
}

export interface CttSummaryReturn {
    label: string,
    lostTons: number,
    progress: number
}