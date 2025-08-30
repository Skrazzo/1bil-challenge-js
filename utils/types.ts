export interface Measurement {
    station: string;
    temp: number;
}

export interface StationData {
    min: number;
    max: number;
    sum: number;
    entries: number; // count of measurements
}

export type StationMap = Map<string, StationData>;
