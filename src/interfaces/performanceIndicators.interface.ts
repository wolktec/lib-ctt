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