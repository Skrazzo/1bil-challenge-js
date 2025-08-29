const file = Bun.file("./generate/medium.txt");
const decoder = new TextDecoder();

// last buffer, to fix incomplete lines
let lastBuffer = "";

for await (const chunk of file.stream()) {
    const newText = decoder.decode(chunk, { stream: true });

    // Combine last buffer with new text
    const text = lastBuffer + newText;
    const arr = text.split("\n");

    // Remove last line, potentially incomplete
    lastBuffer = arr.pop() || "";

    arr.forEach((line) => {
        // Check if line is empty, or broken from streaming
        const idx = line.indexOf(";");
        if (idx === -1) {
            console.log(`Broken line "${line}"`);
        }
    });
}

console.log(lastBuffer);
