import assert from "node:assert/strict";
import test from "node:test";
import { resolveAimFacing } from "../src/entities/resolveAimFacing.ts";

const vectorAt = (degrees: number) => {
  const angle = degrees * Math.PI / 180;
  return [Math.cos(angle) * 100, Math.sin(angle) * 100] as const;
};

test("aim facing preserves the center deadzone and four cardinal directions", () => {
  assert.equal(resolveAimFacing("up", 10, 0), "up");
  assert.equal(resolveAimFacing("down", 100, 0), "right");
  assert.equal(resolveAimFacing("right", -100, 0), "left");
  assert.equal(resolveAimFacing("left", 0, -100), "up");
  assert.equal(resolveAimFacing("up", 0, 100), "down");
});

test("aim facing uses six degrees of hysteresis around diagonal boundaries", () => {
  assert.equal(resolveAimFacing("right", ...vectorAt(50)), "right");
  assert.equal(resolveAimFacing("right", ...vectorAt(52)), "down");
  assert.equal(resolveAimFacing("down", ...vectorAt(40)), "down");
  assert.equal(resolveAimFacing("down", ...vectorAt(38)), "right");
});
