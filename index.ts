interface Measurement {
    station: string;
    temp: number;
}

interface StationData {
    min: number;
    max: number;
    sum: number;
    entries: number; // count of measurements
}

type StationMap = Map<string, StationData>;

const measurements = await Bun.file("./generate/small.txt").text();

let Stations: StationMap = new Map();

function getMeasurement(line: string): Measurement | null {
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

function processChunk(chunk: string[]) {
    // Get measurements
    const measurements = chunk.map(getMeasurement).filter((m) => m !== null);

    for (const { station, temp } of measurements) {
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

processChunk(measurements.split("\n"));

// Sort, and then output, calculate average if needed
[...Stations.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([station, data]) => {
        // Check if we need to calculate average
        if (data.entries > 1) {
            const avg = Math.round((data.sum / data.entries) * 10) / 10;
            console.log(`${station}=${data.min}/${avg}/${data.max}`);
        } else {
            console.log(`${station}=${data.min}/${data.sum}/${data.max}`);
        }
    });
