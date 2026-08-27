import Phaser from "phaser";
import type { ItemDefinition, ItemStack } from "../domain/items/ItemDefinition";
import type { ItemInventory } from "../domain/items/ItemInventory";
import type { Player } from "../entities/Player";
import { pickEligibleItem } from "../domain/items/ItemDropPool";

type WorldItem = Phaser.Physics.Arcade.Sprite & { definition: ItemDefinition };

interface ItemDropCallbacks {
  onAcquired: (stack: ItemStack, upgraded: boolean) => void;
  onReplacementRequired: (item: ItemDefinition) => void;
}

export class ItemDropSystem {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    player: Player,
    private readonly inventory: ItemInventory,
    private readonly callbacks: ItemDropCallbacks,
  ) {
    this.group = scene.physics.add.group();
    scene.physics.add.overlap(player, this.group, this.collect, undefined, this);
  }

  dropRandom(x: number, y: number, pool: readonly ItemDefinition[]): boolean {
    const definition = pickEligibleItem(pool, (item) => this.inventory.canDrop(item));
    if (!definition) return false;
    const drop = this.group.create(x, y, "item-drop") as WorldItem;
    drop.definition = definition;
    drop.setTint(definition.color).setDepth(19).setBounce(0.5).setCollideWorldBounds(true);
    drop.setVelocity(Phaser.Math.Between(-75, 75), Phaser.Math.Between(-75, 75)).setDrag(170, 170);
    this.scene.tweens.add({ targets: drop, y: y - 5, duration: 520, yoyo: true, repeat: -1 });
    const label = this.scene.add.text(x, y - 25, definition.name, {
      fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#f4e8ff",
      backgroundColor: "#17121dcc", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(20);
    const follow = () => {
      if (!drop.active) {
        label.destroy();
        return;
      }
      label.setPosition(drop.x, drop.y - 25);
    };
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, follow);
    drop.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.scene.events.off(Phaser.Scenes.Events.UPDATE, follow);
      label.destroy();
    });
    return true;
  }

  countActive(): number {
    return this.group.countActive(true);
  }

  private collect(_player: unknown, itemObject: unknown): void {
    const drop = itemObject as WorldItem;
    if (!drop.active) return;
    const result = this.inventory.acquire(drop.definition);
    if (result.type === "ineligible") return;
    drop.destroy();
    if (result.type === "needsReplacement") {
      this.callbacks.onReplacementRequired(result.item);
      return;
    }
    this.callbacks.onAcquired(result.stack, result.type === "upgraded");
  }
}
