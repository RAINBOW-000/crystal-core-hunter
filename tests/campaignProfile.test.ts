import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CAMPAIGN_PROFILE, recordRun, unlockWeaponEvolution } from "../src/domain/campaign/CampaignProfile.ts";

test("victory advances the checkpoint and aggregates records", () => {
  const next = recordRun(DEFAULT_CAMPAIGN_PROFILE, { survived: true, elapsedMs: 420000, level: 22, hits: 90, stage: 1 });
  assert.equal(next.checkpointStage, 2);
  assert.equal(next.stats.victories, 1);
  assert.equal(next.stats.highestStage, 2);
});

test("death returns the checkpoint to stage one without erasing records", () => {
  const next = recordRun({ ...DEFAULT_CAMPAIGN_PROFILE, checkpointStage: 2 }, { survived: false, elapsedMs: 80000, level: 8, hits: 20, stage: 2 });
  assert.equal(next.checkpointStage, 1);
  assert.equal(next.stats.deaths, 1);
  assert.equal(next.stats.highestStage, 2);
});

test("weapon evolution appearances are permanently recorded without duplicates", () => {
  const unlocked = unlockWeaponEvolution(DEFAULT_CAMPAIGN_PROFILE, "greatsword", "wind");
  assert.deepEqual(unlocked.unlockedWeaponEvolutions, ["greatsword:wind"]);
  assert.equal(unlockWeaponEvolution(unlocked, "greatsword", "wind"), unlocked);
});
