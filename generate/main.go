package main

import (
	"bufio"
	"fmt"
	"math"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"
)

func checkArgs() (int, int64) {
	if len(os.Args) != 3 {
		printUsage()
	}

	numRows, err := strconv.Atoi(strings.ReplaceAll(os.Args[1], "_", ""))
	if err != nil || numRows <= 0 {
		printUsage()
	}

	seed, err := strconv.Atoi(os.Args[2])
	if err != nil || seed <= 0 {
		fmt.Println("Seed must be an integer value.")
		os.Exit(1)
	}

	return numRows, int64(seed)
}

func printUsage() {
	fmt.Println("Usage:  go run create_measurements.go <positive integer number of records to create> <seed>")
	fmt.Println("        You can use underscore notation for large number of records.")
	fmt.Println("        For example:  1_000_000_000 for one billion")
	fmt.Println("        Seed: Must be an integer value.")
	fmt.Println("        For example: 69420")
	os.Exit(1)
}

func buildWeatherStationNameList(stations_path string) ([]string, error) {
	file, err := os.Open(stations_path)
	if err != nil {
		return nil, fmt.Errorf("failed to open %s: %w", stations_path, err)
	}
	defer file.Close()

	stationMap := make(map[string]bool)
	scanner := bufio.NewScanner(file)

	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "#") {
			continue
		}
		if line != "" {
			parts := strings.Split(line, ";")
			if len(parts) > 0 {
				stationMap[parts[0]] = true
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	// Convert map to slice for deduplication
	stationNames := make([]string, 0, len(stationMap))
	for station := range stationMap {
		stationNames = append(stationNames, station)
	}

	return stationNames, nil
}

func convertBytes(bytes float64) string {
	units := []string{"bytes", "KiB", "MiB", "GiB"}

	for _, unit := range units {
		if bytes < 1024.0 {
			return fmt.Sprintf("%3.1f %s", bytes, unit)
		}
		bytes /= 1024.0
	}

	return fmt.Sprintf("%3.1f %s", bytes*1024.0, "GiB")
}

func formatElapsedTime(seconds float64) string {
	if seconds < 60 {
		return fmt.Sprintf("%.3f seconds", seconds)
	} else if seconds < 3600 {
		minutes := int(seconds / 60)
		remainingSeconds := int(seconds) % 60
		return fmt.Sprintf("%d minutes %d seconds", minutes, remainingSeconds)
	} else {
		hours := int(seconds / 3600)
		remainder := int(seconds) % 3600
		minutes := remainder / 60
		remainingSeconds := remainder % 60

		if minutes == 0 {
			return fmt.Sprintf("%d hours %d seconds", hours, remainingSeconds)
		} else {
			return fmt.Sprintf("%d hours %d minutes %d seconds", hours, minutes, remainingSeconds)
		}
	}
}

func estimateFileSize(weatherStationNames []string, numRowsToCreate int) (float64, string) {
	totalNameBytes := 0
	for _, station := range weatherStationNames {
		totalNameBytes += len(station)
	}

	avgNameBytes := float64(totalNameBytes) / float64(len(weatherStationNames))
	avgTempBytes := 4.400200100050025 // From original Python code

	// Add 2 for separator and newline
	avgLineLength := avgNameBytes + avgTempBytes + 2

	humanFileSize := convertBytes(float64(numRowsToCreate) * avgLineLength)

	return avgLineLength, fmt.Sprintf("Estimated max file size is:  %s.", humanFileSize)
}

func buildTestData(weatherStationNames []string, numRowsToCreate int, destFile string, avgLineLength int, batchSize int, bufferSize int, randomSeed int64) error {
	startTime := time.Now()
	coldestTemp := -99.9
	hottestTemp := 99.9

	// Use a pre-seeded random number generator for better performance
	// rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	rng := rand.New(rand.NewSource(randomSeed))
	tempRange := hottestTemp - coldestTemp

	// Create a sample of 10k stations (with replacement) like the original
	stationNames10kMax := make([]string, 10000)
	for i := range 10000 {
		stationNames10kMax[i] = weatherStationNames[rng.Intn(len(weatherStationNames))]
	}

	chunks := numRowsToCreate / batchSize
	fmt.Println("Building test data...")

	file, err := os.Create(destFile)
	if err != nil {
		return fmt.Errorf("failed to create %s: %w", destFile, err)
	}
	defer file.Close()

	// 64KB buffer instead of default 4KB
	writer := bufio.NewWriterSize(file, bufferSize)
	defer writer.Flush()

	progress := 0

	for chunk := range chunks {
		// Pre-allocate a buffer of the correct size
		var batch strings.Builder
		batch.Grow(batchSize * avgLineLength)

		for range batchSize {
			// Optimized version
			// Calculate temp for one station at a time
			station := stationNames10kMax[rng.Intn(10000)]
			temp := rng.Float64()*tempRange + coldestTemp
			batch.WriteString(fmt.Sprintf("%s;%.1f\n", station, temp))
		}

		_, err := writer.WriteString(batch.String())
		if err != nil {
			return fmt.Errorf("error writing to file: %w", err)
		}

		// Update progress bar every 1%
		newProgress := (chunk + 1) * 100 / chunks
		if newProgress != progress {
			progress = newProgress
			bars := strings.Repeat("=", progress/2)
			fmt.Printf("\r[%-50s] %d%%", bars, progress)
		}
	}

	// Handle remaining rows if any
	remaining := numRowsToCreate % batchSize
	if remaining > 0 {
		var batch strings.Builder
		batch.Grow(remaining * avgLineLength) // Actually add this line

		for range remaining {
			station := stationNames10kMax[rng.Intn(10000)] // Use rng and constant
			temp := rng.Float64()*tempRange + coldestTemp  // Use rng and pre-calculated range
			batch.WriteString(fmt.Sprintf("%s;%.1f\n", station, temp))
		}
		writer.WriteString(batch.String())
	}

	fmt.Println() // New line after progress bar

	endTime := time.Now()
	elapsedTime := endTime.Sub(startTime).Seconds()

	fileInfo, err := os.Stat(destFile)
	if err != nil {
		return fmt.Errorf("failed to get file info: %w", err)
	}

	humanFileSize := convertBytes(float64(fileInfo.Size()))

	fmt.Println("Test data successfully written to ", destFile)
	fmt.Printf("Actual file size:  %s\n", humanFileSize)
	fmt.Printf("Elapsed time: %s\n", formatElapsedTime(elapsedTime))

	return nil
}

func main() {
	numRowsToCreate, seed := checkArgs()

	fmt.Printf("Number of rows to create: %d\n", numRowsToCreate)
	const DEST_PATH = "./measurements.txt"
	const STATIONS_PATH = "./weather_stations.csv"

	batchSize := 50000       // Batch size in rows
	bufferSize := 128 * 1024 // Buffer size in KB, currently 128KB
	fmt.Println("Using batch size of: ", batchSize)
	fmt.Println("Using buffer size of: ", bufferSize)
	fmt.Println("Using seed: ", seed)

	weatherStationNames, err := buildWeatherStationNameList(STATIONS_PATH)
	if err != nil {
		fmt.Printf("Error building weather station list: %v\n", err)
		os.Exit(1)
	}

	estimatedFileSize, maxFileSizeString := estimateFileSize(weatherStationNames, numRowsToCreate)
	intEstimatedSize := int(math.Ceil(estimatedFileSize))

	fmt.Println(maxFileSizeString)

	err = buildTestData(weatherStationNames, numRowsToCreate, DEST_PATH, intEstimatedSize, batchSize, bufferSize, seed)
	if err != nil {
		fmt.Printf("Something went wrong. Printing error info and exiting...\n")
		fmt.Printf("Error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Test data build complete.")
}
