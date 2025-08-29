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

// Open file, and prepare decoder
const measurements = Bun.file("./generate/medium.txt");
const decoder = new TextDecoder();

// last buffer, to fix incomplete lines
let lastBuffer = "";

// Start streaming file
for await (const chunk of measurements.stream()) {
    const newText = decoder.decode(chunk, { stream: true });

    // Combine last buffer with new text
    const text = lastBuffer + newText;
    const arr = text.split("\n");

    // Remove last line, potentially incomplete
    lastBuffer = arr.pop() || "";

    processChunk(arr);
}

// Handle last buffer
processChunk([lastBuffer]);

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
