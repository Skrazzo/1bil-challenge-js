import type { Measurement, StationData, StationMap } from "./types";

export function getMeasurement(line: string): Measurement | null {
    line = line.trim();
    if (!line) {
        return null;
    }

    let [station, temp] = line.split(";");
    if (!station || !temp) {
        return null;
    }

    return {
        station,
        temp: parseFloat(temp),
    };
}

export function processChunk(chunk: string[], Stations: StationMap) {
    // Go through each line
    for (const line of chunk) {
        const measurement = getMeasurement(line);
        if (!measurement) continue;

        const { station, temp } = measurement;

        // Get data if it exists
        const data = Stations.get(station);
        if (!data) {
            Stations.set(station, {
                min: temp,
                max: temp,
                sum: temp,
                entries: 1,
            });
        } else {
            // Update data
            data.min = Math.min(data.min, temp);
            data.max = Math.max(data.max, temp);
            data.sum += temp;
            data.entries++;
        }
    }
}

export function printOut(name: string, data: StationData): string {
    // Check if we need to calculate average
    if (data.entries > 1) {
        const avg = Math.round((data.sum / data.entries) * 10) / 10;
        return `${name}=${data.min}/${avg}/${data.max}`;
    } else {
        return `${name}=${data.min}/${data.sum}/${data.max}`;
    }
}

export function sortStations(stations: StationMap): [string, StationData][] {
    return [...stations.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
