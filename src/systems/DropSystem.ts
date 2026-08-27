import Phaser from "phaser";
import type { EnemyCoreReward } from "../domain/combat/EnemyCoreReward";
import type { Player } from "../entities/Player";

type ExperienceCore = Phaser.Physics.Arcade.Sprite & EnemyCoreReward;

const CORE_STYLES = {
  1: { tint: 0x78f3da, scale: 1, name: "碎晶核 I" },
  2: { tint: 0x78b8ff, scale: 1.14, name: "凝晶核 II" },
  3: { tint: 0xc58aff, scale: 1.28, name: "辉晶核 III" },
  4: { tint: 0xffcf70, scale: 1.45, name: "耀晶核 IV" },
} as const;

export class DropSystem {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly onCollected: (amount: number) => void,
  ) {
    this.group = scene.physics.add.group();
    scene.physics.add.overlap(player, this.group, this.collect, undefined, this);
  }

  update(): void {
    this.group.getChildren().forEach((child) => {
      const core = child as Phaser.Physics.Arcade.Sprite;
      if (!core.active) return;
      const distance = Phaser.Math.Distance.Between(core.x, core.y, this.player.x, this.player.y);
      if (distance >= this.player.stats.pickupRadius) return;
      const pull = new Phaser.Math.Vector2(this.player.x - core.x, this.player.y - core.y).normalize();
      core.setVelocity(pull.x * 185, pull.y * 185);
    });
  }

  drop(x: number, y: number, reward: EnemyCoreReward): void {
    const core = this.group.create(x, y, "crystal-core") as ExperienceCore;
    core.experience = reward.experience;
    core.coreTier = reward.coreTier;
    const style = CORE_STYLES[reward.coreTier];
    core.setTint(style.tint).setScale(style.scale);
    core.setDepth(17).setBounce(0.72).setCollideWorldBounds(true).setDrag(190, 190);
    core.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(-90, 90));
    this.scene.tweens.add({ targets: core, angle: 360, duration: 900, repeat: -1 });
  }

  countActive(): number {
    return this.group.countActive(true);
  }

  private collect(_player: unknown, coreObject: unknown): void {
    const core = coreObject as ExperienceCore;
    if (!core.active) return;
    core.disableBody(true, true);
    this.scene.cameras.main.flash(80, 90, 240, 215, false);

    const style = CORE_STYLES[core.coreTier];
    const pickupText = this.scene.add.text(
      this.player.x,
      this.player.y - 28,
      `${style.name} · +${core.experience} 经验`,
      {
        fontFamily: "Microsoft YaHei",
        fontSize: "13px",
        color: `#${style.tint.toString(16).padStart(6, "0")}`,
      },
    ).setOrigin(0.5).setDepth(45);
    this.scene.tweens.add({
      targets: pickupText,
      y: pickupText.y - 24,
      alpha: 0,
      duration: 560,
      onComplete: () => pickupText.destroy(),
    });
    this.onCollected(core.experience);
  }
}
