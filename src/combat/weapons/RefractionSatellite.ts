import Phaser from "phaser";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";
import type { Weapon } from "../Weapon";

export class RefractionSatellite implements Weapon {
  readonly id = "refraction-satellite" as const;
  combo = 0;
  hitCount = 0;
  level = 0;
  lastAttackAt = -1000;
  private enabled = true;
  private attackSerial = 90000;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();
  private readonly satellites: Phaser.GameObjects.Sprite[] = [];
  private refinementPower = 1;
  private refinementFrequency = 1;
  private refinementScale = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly vfx: CombatVfxSystem,
  ) { this.syncSatellites(); }

  update(time: number): void {
    this.syncSatellites();
    this.satellites.forEach((satellite, index) => {
      const angle = time * 0.0015 + index * Phaser.Math.PI2 / this.satellites.length;
      satellite.setPosition(this.player.x + Math.cos(angle) * 74, this.player.y + Math.sin(angle) * 34).setDepth(Math.sin(angle) > 0 ? 23 : 18);
    });
  }

  tryAttack(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const interval = (this.skills.has("satellite-calibration") ? 1500 : 2100) * this.player.stats.cooldownMultiplier * this.refinementFrequency;
    if (!this.enabled || time - this.lastAttackAt < interval) return;
    const target = enemies.getChildren().map((child) => child as Enemy).filter((enemy) => enemy.active)
      .sort((a, b) => this.score(b) - this.score(a))[0];
    if (!target) return;
    this.lastAttackAt = time;
    const x = target.x;
    const y = target.y;
    const evolved = this.evolutions.has("secondary");
    const radius = (this.skills.has("satellite-lens") ? 58 : 42) * this.refinementScale * (evolved ? 1.3 : 1);
    const warning = this.skills.has("satellite-calibration") ? 240 : 360;
    this.vfx.showSatelliteLock(x, y, radius, warning, evolved);
    this.scene.time.delayedCall(warning, () => {
      if (!this.enabled) return;
      this.attackSerial += 1;
      enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        if (!enemy.active || Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > radius) return;
        const base = this.skills.has("satellite-lens") ? 3.5 : 2.7;
        const killed = enemy.receiveHit({ amount: base * (evolved ? 1.8 : 1) * this.player.stats.damageMultiplier * this.refinementPower, knockback: 160, attackId: this.attackSerial }, x, y - 120, this.scene.time.now);
        this.hitCount += 1;
        if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
      });
      this.vfx.showSatelliteBeam(x, y, radius, evolved);
    });
  }

  freeze(): void { this.enabled = false; this.satellites.forEach((satellite) => satellite.setVisible(false)); }
  applySkill(skillId: string): void { if (!this.skills.has(skillId)) { this.skills.add(skillId); this.level += 1; } }
  applyEvolution(routeId: string): void { this.evolutions.add(routeId); this.level += 1; this.syncSatellites(); }
  applyRefinement(stat: WeaponRefinementStat): void {
    if (stat === "power") this.refinementPower *= 1.12;
    if (stat === "frequency") this.refinementFrequency *= 0.93;
    if (stat === "scale") this.refinementScale *= 1.08;
    this.level += 1;
  }

  private score(enemy: Enemy): number {
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
    if (!this.skills.has("satellite-threat")) return distance;
    return ({ normal: 0, elite: 5000, boss: 10000 } as const)[enemy.kind] + enemy.hp * 10 + distance;
  }

  private syncSatellites(): void {
    const desired = this.evolutions.has("secondary") ? 3 : 1;
    while (this.satellites.length < desired) {
      this.satellites.push(this.scene.add.sprite(0, 0, "secondary-weapons", 4).setDepth(18));
    }
    this.satellites.forEach((satellite) => satellite.setFrame(this.evolutions.has("secondary") ? 5 : 4).setScale(this.evolutions.has("secondary") ? 0.46 : 0.52));
  }
}
