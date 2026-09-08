import assert from "node:assert/strict";
import test from "node:test";
import { RunRandom, SeededRandom, randomBetween, shuffleWithRandom } from "../src/domain/random/RunRandom.ts";

test("the same seed produces the same gameplay sequence", () => {
  const first = new SeededRandom("replay-42");
  const second = new SeededRandom("replay-42");
  assert.deepEqual(
    Array.from({ length: 12 }, () => first.next()),
    Array.from({ length: 12 }, () => second.next()),
  );
});

test("named streams are stable and isolated from unrelated gameplay systems", () => {
  const firstRun = new RunRandom("shared-seed");
  const expectedSpawns = Array.from({ length: 5 }, () => firstRun.stream("spawns")());

  const replay = new RunRandom("shared-seed");
  Array.from({ length: 20 }, () => replay.stream("loot")());
  const replayedSpawns = Array.from({ length: 5 }, () => replay.stream("spawns")());
  assert.deepEqual(replayedSpawns, expectedSpawns);
});

test("integer selection and shuffling honor an injected source", () => {
  assert.equal(randomBetween(() => 0.999, 3, 7), 7);
  assert.deepEqual(shuffleWithRandom([1, 2, 3], () => 0), [2, 3, 1]);
});
