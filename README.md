# 1 Billion Rows Challenge

The "1 Billion Rows Challenge" (1BRC) is a specific benchmark focused on parsing a 1 billion-row text file, calculating min/mean/max values for weather stations, and outputting the results as fast as possible.

Here are the essential rules and constraints, along with strategies and "unwritten rules" for competing effectively.

---

### 1. The Official Rules & Constraints

These are the core, non-negotiable rules that define the challenge.

1.  **The Task:** You must process a text file (`measurements.txt`) containing **1,000,000,000 rows** of temperature measurements.
2.  **Input Format:** Each row is a text string with the format: `<station_name>;<measurement;>`
    *   Example: `Hamburg;12.0\n` or `Bulawayo;8.9\n`
    *   Station names are UTF-8 strings of varying lengths.
    *   Measurements are decimals with one fractional digit, ranging from `-99.9` to `99.9`.
3.  **The Calculation:** For each station, you must compute:
    *   The **minimum** temperature
    *   The **mean** temperature
    *   The **maximum** temperature
4.  **The Output:** The results must be printed to standard output (`stdout`) in a specific format:
    *   **Sorted** alphabetically by station name.
    *   Format: `{station}=<min>/<mean>/<max>`
    *   The mean value should be rounded to the nearest tenth (one fractional digit), using half-up rounding.
    *   Example: `{Düsseldorf=-1.3/5.6/10.1\n Hamburg=2.0/5.6/9.0\n}`
5.  **No External Dependencies:** Your solution must be self-contained. It cannot connect to a database, call a web service, or rely on any external system. The benchmark is about the code's processing power.
6.  **It Must Work Correctly:** The results must be accurate. A solution that produces the wrong output, even if it's incredibly fast, is invalid.

---

### 2. The "Unwritten" Rules & The Spirit of the Challenge

Beyond the official rules, the challenge has a culture and a set of optimizations that winners exploit.

1.  **Everything is on the table (within the constraints):** You can use any language (Java, C++, Rust, Go, etc.), any library within that language, and any hardware you have access to. The goal is to see how fast you can make it go.
2.  **Parallelism is Mandatory:** Processing 1 billion rows sequentially is too slow. The top solutions use heavy parallelization, dividing the file into chunks for multiple CPU cores (threads) to process simultaneously.
3.  **I/O is the First Bottleneck:** Reading from a disk is slow. Winners use techniques like:
    *   **Memory-Mapped Files (`mmap`):** To let the OS handle loading data from disk into memory efficiently.
    *   **Bypassing the OS Cache:** Using `O_DIRECT` (on Linux) to read directly from disk into user-space buffers, avoiding kernel overhead.
4.  **Parsing is the Second Bottleneck:** Converting text bytes to numbers and strings is computationally expensive. Winning solutions use:
    *   **Custom Parsing:** Avoiding high-level functions like `strtod` or `Double.parseDouble`. They manually parse the number as bytes/integers (e.g., `"12.3"` -> `123`).
    *   **Branchless Code:** Avoiding `if` statements for things like negative numbers, using clever bitwise math instead.
    *   **Hash Maps are Slow:** The standard `HashMap` or `unordered_map` has overhead. Winners often use:
        *   **Custom Hash Maps:** Optimized for this specific key (string) and value (min, mean, max) types.
        *   **No Hashing:** Using the station name's bytes to create a perfect hash or using a trie structure.
5.  **Statistics without Objects:** Avoid allocating millions of small objects for each station or measurement. Store state in primitive arrays (e.g., `int[]` for min, mean, max counts).
6.  **The Output is a Bottleneck Too:** Efficiently building the final sorted string output matters. This often involves writing directly to a byte buffer instead of using high-level string concatenation.

---

### 3. Suggested "Rules" for Your Own Attempt

If you are undertaking the challenge yourself, here is a good progression of rules to follow.

**Phase 1: The Baseline (Just Make It Work)**
*   **Rule:** Write a simple, single-threaded solution.
*   **Goal:** Get the correct output. Use a standard dictionary/hash map and built-in parsing functions. This establishes your baseline time (it will be very slow).

**Phase 2: The Optimizer**
*   **Rule:** Now make it fast. You are allowed to break your initial code.
*   **Allowed Techniques:**
    *   Multi-threading (chunk the file).
    *   Memory-mapped files.
    *   Custom number parsing.
    *   Optimizing the hash map.

**Phase 3: The Extreme**
*   **Rule:** No optimization is too obscure.
*   **Allowed Techniques:**
    *   Using `O_DIRECT` for I/O.
    *   Writing assembly or using SIMD instructions (e.g., AVX2) to parse multiple bytes at once.
    *   Creating a perfect hash function for the known station names (if you pre-analyze the file).
    *   Using sun.misc.Unsafe or other "unsafe" methods to avoid bounds checking (in Java).
    *   Pre-allocating all memory upfront to avoid garbage collection pauses.

**Phase 4: The Final Boss (Verification)**
*   **Rule:** Your final output **must** match the output of your Phase 1 (correct) solution.
*   **Goal:** Ensure your hyper-optimized, branchless, SIMD-powered code hasn't introduced a subtle bug.

By following these phases, you can systematically transform a simple, correct program into a monster of performance engineering, which is the entire point of the 1BRC. Good luck