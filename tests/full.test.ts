import { expect, test, spyOn } from "bun:test";
import { $ } from "bun";

const expected = await Bun.file("./tests/1000_rows_expected.txt").text();

test("Full functionality test", async () => {
    const result = await $`bun run index.ts ./tests/1000_rows.txt`.text();
    expect(result).toBe(expected);
});
