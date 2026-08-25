import assert from "node:assert/strict";
import test from "node:test";
import { CRYSTAL_HUNTER, LEYLINE_PROSPECTOR } from "../src/content/characters/characterCatalog.ts";
import { MINER_GUARD } from "../src/content/characters/minerGuard.ts";
import { CharacterTalentSystem } from "../src/systems/CharacterTalentSystem.ts";
import type { Player } from "../src/entities/Player.ts";

function fakePlayer(hp = 100): Player {
  return {
    hp,
    dodgeSerial: 0,
    stats: { maxHp: 100, damageMultiplier: 1 },
    heal(amount: number) { this.hp = Math.min(this.stats.maxHp, this.hp + amount); },
  } as unknown as Player;
}

test("miner guard reduces incoming damage below half health", () => {
  const player = fakePlayer(40);
  const talent = new CharacterTalentSystem(player, MINER_GUARD);
  assert.equal(talent.modifyIncomingDamage(10), 7);
  player.hp = 80;
  assert.equal(talent.modifyIncomingDamage(10), 10);
});

test("crystal hunter gains and cleanly loses dodge damage bonus", () => {
  const player = fakePlayer();
  const talent = new CharacterTalentSystem(player, CRYSTAL_HUNTER);
  player.dodgeSerial = 1;
  talent.update(100);
  assert.equal(player.stats.damageMultiplier, 1.3);
  talent.update(1800);
  assert.equal(player.stats.damageMultiplier, 1);
});

test("prospector heals after collecting eight cores", () => {
  const player = fakePlayer(80);
  const talent = new CharacterTalentSystem(player, LEYLINE_PROSPECTOR);
  assert.equal(talent.onCoresCollected(7), false);
  assert.equal(talent.onCoresCollected(1), true);
  assert.equal(player.hp, 85);
});
