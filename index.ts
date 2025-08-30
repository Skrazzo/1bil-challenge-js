import { printOut, processChunk, sortStations } from "./utils/process";
import type { StationMap } from "./utils/types";

// Initiate hash map
let Stations: StationMap = new Map();

export async function processFile(path: string) {
    // Open file, and prepare decoder
    const measurements = Bun.file(path);
    if (!(await measurements.exists())) {
        console.log("File does not exist!");
        process.exit(1);
    }

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

        processChunk(arr, Stations);
    }

    // Handle last buffer
    processChunk([lastBuffer], Stations);

    // Sort, and then output
    sortStations(Stations).forEach(([station, data]) => {
        console.log(printOut(station, data));
    });
}

if (import.meta.main) {
    // If being called via console
    await processFile(process.argv[2] || "./generate/medium.txt");
}
