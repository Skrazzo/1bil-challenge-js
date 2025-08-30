import { expect, spyOn, test } from "bun:test";
import type { StationMap } from "../utils/types";
import { getMeasurement, printOut, processChunk, sortStations } from "../utils/process";

const Stations: StationMap = new Map();
Stations.set("test", { min: 0, max: 0, sum: 0, entries: 0 });
Stations.set("Riga", { min: 12, max: 22, sum: 36, entries: 2 });
Stations.set("Cesis", { min: 10, max: 30, sum: 52, entries: 3 });

test("Test printing out stations", () => {
    expect(printOut("Riga", Stations.get("Riga")!)).toBe("Riga=12/18/22");
    expect(printOut("test", Stations.get("test")!)).toBe("test=0/0/0");
    expect(printOut("Cesis", Stations.get("Cesis")!)).toBe("Cesis=10/17.3/30");
});

test("Test getting measurement", () => {
    expect(getMeasurement("Riga;12")).toEqual({ station: "Riga", temp: 12 });
    expect(getMeasurement("Cesis;30")).toEqual({ station: "Cesis", temp: 30 });
    expect(getMeasurement("Riga;")).toEqual(null);
    expect(getMeasurement(";12")).toEqual(null);
    expect(getMeasurement("Riga;12.5")).toEqual({ station: "Riga", temp: 12.5 });
    expect(getMeasurement("Cesis;30.5")).toEqual({ station: "Cesis", temp: 30.5 });
    expect(getMeasurement(";12.5")).toEqual(null);
    expect(getMeasurement("Riga;")).toEqual(null);
    expect(getMeasurement("Cesis  ;30.5")).toEqual({ station: "Cesis", temp: 30.5 });
    expect(getMeasurement("Cesis;  30.5")).toEqual({ station: "Cesis", temp: 30.5 });
});

test("Testing chunk process", () => {
    const tmp: StationMap = new Map();
    const lines = [
        "Riga;12",
        "Cesis;30",
        "Riga;12.5",
        "Cesis;30.5",
        "Cesis  ;30.5",
        "Cesis;  20.5",
        "Sigulda;24",
        "Riga;10",
        "Moon:-231",
    ];

    // Test entries
    processChunk(lines, tmp);
    expect(tmp.get("Riga")!.entries).toBe(3);
    expect(tmp.get("Cesis")!.entries).toBe(4);
    expect(tmp.get("Sigulda")!.entries).toBe(1);

    // @ts-ignore
    expect(tmp.get("Moon")).toBe(undefined);

    // Test sum
    expect(tmp.get("Riga")!.sum).toBe(34.5);
    expect(tmp.get("Cesis")!.sum).toBe(111.5);
    expect(tmp.get("Sigulda")!.sum).toBe(24);

    // Test min
    expect(tmp.get("Riga")!.min).toBe(10);
    expect(tmp.get("Cesis")!.min).toBe(20.5);
    expect(tmp.get("Sigulda")!.min).toBe(24);

    // Test max
    expect(tmp.get("Riga")!.max).toBe(12.5);
    expect(tmp.get("Cesis")!.max).toBe(30.5);
    expect(tmp.get("Sigulda")!.max).toBe(24);
});

test("Test Sorting", () => {
    const sorted = sortStations(Stations);
    expect(sorted[0]![0]).toBe("Cesis");
    expect(sorted[1]![0]).toBe("Riga");
    expect(sorted[2]![0]).toBe("test");
});
