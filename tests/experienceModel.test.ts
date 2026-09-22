import assert from "node:assert/strict";
import test from "node:test";
import { ExperienceModel } from "../src/domain/progression/ExperienceModel.ts";

test("player progression starts at level zero and reaches the first milestone at level three", () => {
  const experience = new ExperienceModel({ baseRequirement: 5, requirementGrowth: 2 });
  assert.equal(experience.level, 0);
  assert.deepEqual(experience.add(19), [1, 2, 3]);
  assert.equal(experience.level, 3);
});
