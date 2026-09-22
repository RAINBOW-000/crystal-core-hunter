import assert from "node:assert/strict";
import { test } from "node:test";
import { preserveBodyAxis } from "../src/domain/enemies/preserveBodyAxis.ts";

test("visual enlargement preserves the original arcade body through spitter squash", () => {
  for (const [frame, size, offset] of [[24, 20, 2], [28, 22, 3], [32, 25, 3], [32, 22, 4]]) {
    const source = preserveBodyAxis(frame, size, offset, 1.2);
    for (const squash of [1, 1.06, 1.16, 0.84]) {
      assert.ok(Math.abs(source.size * 1.2 * squash - size * squash) < 1e-9);
      assert.ok(Math.abs((source.offset - frame / 2) * 1.2 * squash - (offset - frame / 2) * squash) < 1e-9);
    }
  }
});
