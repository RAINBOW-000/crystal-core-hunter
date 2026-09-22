import Phaser from "phaser";
import { ICE_ARMOR_COLOSSUS } from "../../content/enemies/enemyCatalog";
import type { DamageSpec } from "../../combat/Damage";
import { getBossPhase } from "../../domain/combat/BossPhase";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import type { StageDefinition } from "../../content/stages/stageCatalog";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

export class IceArmorColossus extends Enemy {
  private stagger = 0;
  private staggeredUntil = 0;
  private nextSlamAt = 1000;
  private nextChargeAt = 2400;
  private chargeUntil = 0;
  private chargeTelegraphUntil = 0;
  private chargeDirection = new Phaser.Math.Vector2(1, 0);
  constructor(scene: Phaser.Scene, x: number, y: number, private readonly callIce: (x: number, y: number, delay?: number) => void, private readonly vfx: CombatVfxSystem, modifiers?: StageDefinition["returningEnemyModifiers"]) {
    super(scene, x, y, ICE_ARMOR_COLOSSUS, ICE_ARMOR_COLOSSUS.hp, modifiers);
    this.body!.setSize(50, 48).setOffset(7, 8);
  }
  override receiveHit(spec: DamageSpec, x: number, y: number, time: number): boolean {
    const vulnerable = time < this.staggeredUntil;
    const killed = super.receiveHit({ ...spec, amount: spec.amount * (vulnerable ? 1.5 : 1) }, x, y, time);
    if (!vulnerable) {
      this.stagger += spec.amount;
      if (this.stagger >= ICE_ARMOR_COLOSSUS.staggerThreshold) {
        this.stagger = 0; this.staggeredUntil = time + 3000; this.hurtUntil = this.staggeredUntil;
        this.setTint(0xbfeeff);
      }
    }
    return killed;
  }
  updateBehavior(time: number, player: Player): void {
    if (!this.active) return;
    if (time < this.staggeredUntil) { this.setVelocity(0, 0); return; }
    if (time < this.hurtUntil) return;
    const phase = getBossPhase(this.hp, this.maxHp);
    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    if (time < this.chargeTelegraphUntil) { this.setVelocity(0, 0).setTint(0xffcf70); return; }
    if (this.chargeTelegraphUntil > 0) {
      this.chargeTelegraphUntil = 0;
      this.clearTint();
      this.chargeUntil = time + 700;
    }
    if (time < this.chargeUntil) { this.setVelocity(this.chargeDirection.x * 300, this.chargeDirection.y * 300); return; }
    if (phase >= 2 && time >= this.nextChargeAt) {
      this.chargeDirection = direction.clone(); this.chargeTelegraphUntil = time + 520; this.nextChargeAt = time + 3220;
      this.vfx.showBossChargeLane(this.x, this.y, this.chargeDirection.angle(), 520);
      return;
    }
    this.setVelocity(direction.x * (this.moveSpeed + phase * 8), direction.y * (this.moveSpeed + phase * 8));
    if (time >= this.nextSlamAt) {
      this.nextSlamAt = time + (phase === 3 ? 1200 : 1900);
      const count = phase === 1 ? 5 : phase === 2 ? 7 : 9;
      for (let index = 0; index < count; index += 1) {
        const angle = index * Phaser.Math.PI2 / count;
        this.callIce(this.x + Math.cos(angle) * 105, this.y + Math.sin(angle) * 105, 650);
      }
      if (phase === 3) this.callIce(player.x, player.y, 520);
    }
  }
}
