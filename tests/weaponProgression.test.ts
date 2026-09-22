import assert from "node:assert/strict";
import test from "node:test";
import {
  WeaponProgression,
  type WeaponEvolutionDefinition,
  type WeaponSkillDefinition,
} from "../src/domain/weapons/WeaponProgression.ts";

const skills: WeaponSkillDefinition[] = [
  "wave", "chase", "echo",
].map((id) => ({ id, name: id, description: id, weaponId: "greatsword", routeId: "wind" })).concat([
  "heavy", "fissure", "stance",
].map((id) => ({ id, name: id, description: id, weaponId: "greatsword", routeId: "iron" }))).concat([
  "pierce", "split", "mark",
].map((id) => ({ id: `bow-${id}`, name: id, description: id, weaponId: "crystal-crossbow", routeId: "prism" }))).concat([
  "string", "spread", "pressure",
].map((id) => ({ id: `bow-${id}`, name: id, description: id, weaponId: "crystal-crossbow", routeId: "rain" }))).concat([
  "drill-extra", "drill-bearing", "drill-return",
].map((id) => ({ id, name: id, description: id, weaponId: "orbit-drill", routeId: "secondary" })));

const evolutions: WeaponEvolutionDefinition[] = [
  { weaponId: "greatsword", routeId: "wind", requiredItemId: "wind-core", name: "wind", description: "wind" },
  { weaponId: "greatsword", routeId: "iron", requiredItemId: "iron-core", name: "iron", description: "iron" },
  { weaponId: "orbit-drill", routeId: "secondary", requiredItemId: "star-axis", name: "planet", description: "planet" },
];

const createModel = () => new WeaponProgression(
  "greatsword",
  ["orbit-drill", "seismic-resonator", "refraction-satellite"],
  skills,
  evolutions,
  () => 0.42,
);

test("combined offer has three choices covering both equipped weapons", () => {
  const model = createModel();
  model.equipSecondWeapon("orbit-drill");
  const offer = model.createCombinedSkillOffer();
  assert.equal(offer.length, 3);
  assert.equal(new Set(offer.map((skill) => skill.weaponId)).size, 2);
});

test("choosing a route hides the other route until first evolution", () => {
  const model = createModel();
  model.selectSkill("wave");
  assert.ok(model.createSkillOffer("greatsword").every((skill) => skill.routeId === "wind"));
  assert.throws(() => model.selectSkill("heavy"));
});

test("three route skills and material evolve, then unlock the other route", () => {
  const model = createModel();
  model.addEvolutionItem("wind-core");
  model.selectSkill("wave");
  model.selectSkill("chase");
  model.selectSkill("echo");
  assert.equal(model.createCombinedSkillOffer().length, 0);

  const result = model.tryEvolve("greatsword");
  assert.deepEqual(result, { evolved: true, stage: 1, reissueAdvancedUpgrade: true, routeId: "wind" });
  assert.ok(model.createSkillOffer("greatsword").every((skill) => skill.routeId === "iron"));
});

test("second evolution stacks only after the second route and its material", () => {
  const model = createModel();
  model.addEvolutionItem("wind-core");
  ["wave", "chase", "echo"].forEach((id) => model.selectSkill(id));
  model.tryEvolve("greatsword");
  model.addEvolutionItem("iron-core");
  ["heavy", "fissure", "stance"].forEach((id) => model.selectSkill(id));
  assert.equal(model.tryEvolve("greatsword").stage, 2);
});

test("either route may become the first evolution route", () => {
  const model = createModel();
  model.addEvolutionItem("iron-core");
  ["heavy", "fissure", "stance"].forEach((id) => model.selectSkill(id));
  const first = model.tryEvolve("greatsword");
  assert.equal(first.routeId, "iron");
  assert.equal(first.stage, 1);
  assert.ok(model.createSkillOffer("greatsword").every((entry) => entry.routeId === "wind"));
});

test("only the current route evolution item enters the eligible drop pool", () => {
  const model = createModel();
  model.selectSkill("wave");
  assert.deepEqual(model.getEligibleEvolutionItemIds(), ["wind-core"]);
  model.addEvolutionItem("wind-core");
  ["chase", "echo"].forEach((id) => model.selectSkill(id));
  model.tryEvolve("greatsword");
  assert.deepEqual(model.getEligibleEvolutionItemIds(), ["iron-core"]);
});

test("an exhausted route waits for its evolution instead of offering filler", () => {
  const model = createModel();
  model.selectSkill("wave");
  model.selectSkill("chase");
  const offer = model.createAdvancedOffer();
  assert.equal(offer.length, 1);
  assert.equal(offer[0]?.kind, "skill");
});

test("refinements do not bypass a weapon waiting for its evolution item", () => {
  const model = createModel();
  ["wave", "chase", "echo"].forEach((id) => model.selectSkill(id));
  assert.deepEqual(model.createAdvancedOffer(), []);
  assert.equal(model.pendingAdvancedCount, 1);
});

test("fully evolved weapons have no post-completion route yet", () => {
  const model = createModel();
  model.addEvolutionItem("wind-core");
  ["wave", "chase", "echo"].forEach((id) => model.selectSkill(id));
  model.tryEvolve("greatsword");
  model.addEvolutionItem("iron-core");
  ["heavy", "fissure", "stance"].forEach((id) => model.selectSkill(id));
  model.tryEvolve("greatsword");
  const offer = model.createAdvancedOffer();
  assert.deepEqual(offer, []);
});

test("a secondary weapon has one three-upgrade route and one evolution", () => {
  const model = createModel();
  model.equipSecondWeapon("orbit-drill");
  model.selectSkill("drill-extra");
  assert.deepEqual(model.getEligibleEvolutionItemIds(), ["star-axis"]);
  model.addEvolutionItem("star-axis");
  model.selectSkill("drill-bearing");
  model.selectSkill("drill-return");
  assert.equal(model.tryEvolve("orbit-drill").stage, 1);
  assert.equal(model.allEquippedFullyEvolved, false);
  assert.deepEqual(model.createSkillOffer("orbit-drill"), []);
});
