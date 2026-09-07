import Phaser from "phaser";
import { drawPrototypeRoom } from "../art/RoomRenderer";
import { createPrototypeTextures } from "../art/TextureFactory";
import { MINER_GUARD } from "../content/characters/minerGuard";
import { CHARACTER_CATALOG } from "../content/characters/characterCatalog";
import { MINER_UPGRADES } from "../content/upgrades/minerUpgrades";
import {
  DEFAULT_UNLOCKED_ITEM_IDS,
  EVOLUTION_ITEM_CATALOG,
  ITEM_CATALOG,
  META_UNLOCKABLE_ITEMS,
} from "../content/items/itemCatalog";
import { WEAPON_DEFINITIONS, WEAPON_EVOLUTIONS, WEAPON_IDS, WEAPON_SKILLS } from "../content/weapons/weaponCatalog";
import { getEnemyDefinition } from "../content/enemies/enemyCatalog";
import { WeaponRack } from "../combat/WeaponRack";
import {
  EXPERIENCE_CONFIG,
  GAME_HEIGHT,
  GAME_WIDTH,
  ROOM_BOUNDS,
} from "../config/gameConfig";
import { RunEventBus } from "../core/events/RunEventBus";
import { SpawnDirector } from "../director/SpawnDirector";
import { ExperienceModel } from "../domain/progression/ExperienceModel";
import type { ItemDefinition, ItemStack } from "../domain/items/ItemDefinition";
import { ItemInventory } from "../domain/items/ItemInventory";
import type { RunPhase, RunSnapshot } from "../domain/run/RunSnapshot";
import { UpgradeProgression } from "../domain/upgrades/UpgradeProgression";
import { WeaponProgression, type WeaponId } from "../domain/weapons/WeaponProgression";
import { MetaUnlockProgression } from "../domain/meta/MetaUnlockProgression";
import { RunRandom, shuffleWithRandom } from "../domain/random/RunRandom";
import type { Enemy } from "../entities/Enemy";
import { Player } from "../entities/Player";
import { UpgradeSystem } from "../progression/UpgradeSystem";
import { DropSystem } from "../systems/DropSystem";
import { ItemDropSystem } from "../systems/ItemDropSystem";
import { ActiveItemSystem } from "../systems/ActiveItemSystem";
import { MetaUnlockStorage } from "../systems/MetaUnlockStorage";
import { RareVeinSystem } from "../systems/RareVeinSystem";
import { HostileProjectileSystem } from "../systems/HostileProjectileSystem";
import { CharacterTalentSystem } from "../systems/CharacterTalentSystem";
import { Telemetry } from "../testing/Telemetry";
import { ExperienceBar } from "../ui/ExperienceBar";
import { Hud } from "../ui/Hud";
import { showResultOverlay } from "../ui/ResultOverlay";
import { UpgradeEffectApplicator } from "./UpgradeEffectApplicator";
import { ActiveItemReplacement } from "../ui/ActiveItemReplacement";
import { InitialWeaponSelection } from "../ui/InitialWeaponSelection";
import { VictoryChestChoices } from "../ui/VictoryChestChoices";
import { ItemRewardChoices } from "../ui/ItemRewardChoices";
import { CharacterSelection } from "../ui/CharacterSelection";
import type { CharacterDefinition } from "../domain/characters/CharacterDefinition";
import { ItemPickupToast } from "../ui/ItemPickupToast";

/** Application layer for one run. GameScene only creates and ticks this session. */
export class RunSession {
  private readonly events = new RunEventBus();
  private player!: Player;
  private weapons!: WeaponRack;
  private drops!: DropSystem;
  private itemDrops!: ItemDropSystem;
  private activeItems!: ActiveItemSystem;
  private readonly inventory = new ItemInventory();
  private replacementView!: ActiveItemReplacement;
  private director!: SpawnDirector;
  private experience!: ExperienceModel;
  private upgrades!: UpgradeSystem;
  private weaponProgression!: WeaponProgression;
  private hud!: Hud;
  private experienceBar!: ExperienceBar;
  private telemetry!: Telemetry;
  private restartKey!: Phaser.Input.Keyboard.Key;
  private phase: RunPhase = "choosingCharacter";
  private bossActive = false;
  private metaProgression!: MetaUnlockProgression;
  private metaStorage!: MetaUnlockStorage;
  private runItemPool: readonly ItemDefinition[] = [];
  private rareVeins!: RareVeinSystem;
  private itemRewardView!: ItemRewardChoices;
  private hostileProjectiles!: HostileProjectileSystem;
  private character: CharacterDefinition = MINER_GUARD;
  private talentSystem!: CharacterTalentSystem;
  private pickupToast!: ItemPickupToast;
  private runRandom!: RunRandom;

  constructor(private readonly scene: Phaser.Scene) {}

  create(): void {
    this.phase = "choosingCharacter";
    const room = new Phaser.Geom.Rectangle(
      ROOM_BOUNDS.x,
      ROOM_BOUNDS.y,
      ROOM_BOUNDS.width,
      ROOM_BOUNDS.height,
    );
    createPrototypeTextures(this.scene);
    drawPrototypeRoom(this.scene, room);

    this.player = new Player(this.scene, GAME_WIDTH / 2, GAME_HEIGHT / 2, MINER_GUARD);
    this.weapons = new WeaponRack(this.scene, this.player);
    this.hud = new Hud(this.scene);
    this.experienceBar = new ExperienceBar(this.scene);
    this.telemetry = new Telemetry();
    this.replacementView = new ActiveItemReplacement(this.scene);
    this.itemRewardView = new ItemRewardChoices(this.scene);
    this.pickupToast = new ItemPickupToast(this.scene);
    const qaParameters = new URLSearchParams(window.location.search);
    this.runRandom = new RunRandom(qaParameters.get("seed")?.trim() || Date.now().toString(36));
    this.experience = new ExperienceModel(EXPERIENCE_CONFIG);
    const qaVictory = import.meta.env.DEV && qaParameters.has("qaVictory");
    const qaVeinReward = import.meta.env.DEV && qaParameters.has("qaVeinReward");
    const qaBoss = import.meta.env.DEV && qaParameters.has("qaBoss");
    const qaEnemies = import.meta.env.DEV && qaParameters.has("qaEnemies");
    const qaItems = import.meta.env.DEV && qaParameters.has("qaItems");
    const qaItemReplacement = import.meta.env.DEV && qaParameters.has("qaItemReplacement");
    const qaMining = import.meta.env.DEV && qaParameters.has("qaMining");
    const qaCoreTiers = import.meta.env.DEV && qaParameters.has("qaCoreTiers");
    this.metaStorage = new MetaUnlockStorage(qaVictory
      ? "crystal-core-hunter.meta-unlocks.qa"
      : undefined);
    this.metaProgression = new MetaUnlockProgression(
      META_UNLOCKABLE_ITEMS.map((item) => item.id),
      DEFAULT_UNLOCKED_ITEM_IDS,
      this.metaStorage.load(),
      this.runRandom.stream("meta-unlocks"),
    );
    this.runItemPool = META_UNLOCKABLE_ITEMS.filter((item) => this.metaProgression.isUnlocked(item.id));

    this.drops = new DropSystem(
      this.scene,
      this.player,
      (amount) => this.events.emit("experienceCollected", { amount, coreCount: 1 }),
    );
    this.itemDrops = new ItemDropSystem(this.scene, this.player, this.inventory, {
      onAcquired: (stack, upgraded) => this.onItemAcquired(stack, upgraded),
      onReplacementRequired: (item) => this.openItemReplacement(item),
    }, this.runRandom.stream("item-drops"));
    this.hostileProjectiles = new HostileProjectileSystem(
      this.scene,
      this.player,
      (damage, x, y) => this.applyEnemyDamage(damage, x, y),
    );
    this.director = new SpawnDirector(
      this.scene,
      this.player,
      this.hostileProjectiles,
      {
        selection: this.runRandom.stream("enemy-selection"),
        position: this.runRandom.stream("enemy-position"),
        behavior: this.runRandom.stream("enemy-behavior"),
      },
      () => {
        this.bossActive = true;
        this.hud.setHint("最终 Boss 晶巢领主出现！敌群仍在涌入", "#ffcf70");
      },
    );
    this.activeItems = new ActiveItemSystem(
      this.scene,
      this.player,
      this.inventory,
      this.director.enemies,
      {
        onEnemyKilled: (enemy) => this.emitEnemyDefeated(enemy),
        onUsed: (message) => this.hud.setHint(message, "#78f3da"),
      },
    );
    this.rareVeins = new RareVeinSystem(this.scene, this.player, {
      onMined: () => this.openRareVeinReward(),
      onHint: (message, color) => this.hud.setHint(message, color),
    }, this.runRandom.stream("rare-veins"));

    this.bindRunEvents();
    this.scene.physics.add.overlap(
      this.player,
      this.director.enemies,
      this.onPlayerContact,
      undefined,
      this,
    );
    this.restartKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.scene.cameras.main.setBackgroundColor("#121019");
    this.scene.physics.world.setBounds(room.x, room.y, room.width, room.height);
    this.hud.setHint("选择猎人和初始武器后开始狩猎");
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.events.clear());
    this.scene.physics.pause();
    this.player.freeze();
    new CharacterSelection(this.scene).open(CHARACTER_CATALOG, (character) => {
      this.character = character;
      this.player.configureCharacter(character);
      this.talentSystem = new CharacterTalentSystem(this.player, character);
      this.phase = "choosingInitialWeapon";
      new InitialWeaponSelection(this.scene).open(WEAPON_DEFINITIONS, (weaponId) => {
        this.initializeWeaponProgression(weaponId);
        this.phase = "playing";
        this.scene.physics.resume();
        this.hud.setHint(`${character.name} · ${character.talentName} · 收集晶核升级`);
        if (qaItems) {
          ["crystal-bomb", "rough-armor"].forEach((itemId) => {
            const item = ITEM_CATALOG.find((candidate) => candidate.id === itemId)!;
            const result = this.inventory.acquire(item);
            if (result.type === "acquired" || result.type === "upgraded") {
              this.onItemAcquired(result.stack, result.type === "upgraded");
            }
          });
          this.scene.time.delayedCall(250, () => {
            this.activeItems.useSlot(0, this.scene.time.now, this.scene.input.activePointer);
          });
        }
        if (qaItemReplacement) {
          ["crystal-bomb", "magnetic-pulse"].forEach((itemId) => {
            const item = ITEM_CATALOG.find((candidate) => candidate.id === itemId)!;
            const result = this.inventory.acquire(item);
            if (result.type === "acquired" || result.type === "upgraded") {
              this.onItemAcquired(result.stack, result.type === "upgraded");
            }
          });
          this.scene.time.delayedCall(350, () => {
            const incoming = ITEM_CATALOG.find((candidate) => candidate.id === "time-anchor")!;
            this.openItemReplacement(incoming);
          });
        }
        if (qaMining) this.scene.time.delayedCall(250, () => this.rareVeins.spawnForQa());
        if (qaCoreTiers) {
          ([1, 2, 3, 4] as const).forEach((coreTier, index) => {
            this.drops.drop(300 + index * 120, 390, {
              coreTier,
              experience: [1, 3, 6, 10][index],
            });
          });
        }
        this.renderSnapshot(this.scene.time.now);
        if (qaVictory) this.scene.time.delayedCall(350, () => this.finishRun(true));
        if (qaVeinReward) this.scene.time.delayedCall(350, () => this.openRareVeinReward());
        if (qaBoss) this.scene.time.delayedCall(350, () => this.director.spawnBossForQa());
        if (qaEnemies) this.scene.time.delayedCall(350, () => this.director.spawnArchetypesForQa());
      });
    });
    this.renderSnapshot(this.scene.time.now);
  }

  update(time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.scene.restart();
      return;
    }
    if (this.phase !== "playing") return;

    this.player.updateController(time, this.scene.input.activePointer, this.weapons.lastAttackAt);
    this.talentSystem.update(time);
    this.director.update(time, delta);
    if (this.phase !== "playing") return;
    this.rareVeins.update(this.director.elapsedMs, delta);
    if (this.phase !== "playing") return;
    this.hostileProjectiles.update(time);
    this.drops.update();
    this.activeItems.update(time, this.scene.input.activePointer);
    this.weapons.update(
      time,
      this.director.enemies,
      (enemy) => this.emitEnemyDefeated(enemy),
    );
    this.renderSnapshot(time);
  }

  getSnapshot(time: number): RunSnapshot {
    return {
      runSeed: this.runRandom.seed,
      phase: this.phase,
      hp: this.player.hp,
      maxHp: this.player.stats.maxHp,
      level: this.experience.level,
      xp: this.experience.xp,
      xpRequired: this.experience.required,
      elapsedMs: this.director.elapsedMs,
      remainingMs: this.director.remainingMs,
      enemyCount: this.director.countActive(),
      dropCount: this.drops.countActive() + this.itemDrops.countActive(),
      combo: this.weapons.combo,
      hitCount: this.weapons.hitCount,
      weaponLevel: this.weapons.all.reduce((sum, weapon) => sum + weapon.level, 0),
      pickupRadius: this.player.stats.pickupRadius,
      dodgeCooldownMs: this.player.getDodgeCooldown(time),
      playerPosition: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
      dodging: this.player.isDodging(time),
      activeItems: this.activeItems.getSlotStates(time),
      passiveItems: this.inventory.passiveStacks.map((stack) => ({
        name: stack.definition.name,
        level: stack.level,
      })),
      bossActive: this.bossActive,
      bossHp: this.director.bossHp,
      bossMaxHp: this.director.bossMaxHp,
      equippedWeapons: this.weapons.all.map((weapon) => ({
        name: WEAPON_DEFINITIONS.find((definition) => definition.id === weapon.id)!.name,
        level: weapon.level,
      })),
      characterName: this.character.name,
    };
  }

  private bindRunEvents(): void {
    this.events.on("enemyDefeated", ({ x, y, experience, coreTier, kind, enemyId }) => {
      if (kind === "boss") {
        this.events.emit("runEnded", { survived: true });
        return;
      }
      this.drops.drop(x, y, { experience, coreTier });
      const definition = getEnemyDefinition(enemyId);
      if (definition.itemDropChance > 0 && this.runRandom.stream("loot-rolls")() < definition.itemDropChance + this.player.stats.luck) {
        const evolutionIds = new Set(this.weaponProgression.getEligibleEvolutionItemIds());
        const evolutionPool = EVOLUTION_ITEM_CATALOG.filter((item) => evolutionIds.has(item.id));
        this.itemDrops.dropRandom(x + 12, y, [...this.runItemPool, ...evolutionPool]);
      }
    });
    this.events.on("experienceCollected", ({ amount, coreCount }) => {
      if (this.talentSystem.onCoresCollected(coreCount)) {
        this.hud.setHint(`${this.character.talentName}：晶核能量恢复生命`, "#78f3da");
      }
      this.experience.add(amount).forEach((level) => {
        this.events.emit("levelGained", { level, milestone: level % 3 === 0 });
      });
    });
    this.events.on("levelGained", ({ level }) => this.upgrades.offer(level));
    this.events.on("runEnded", ({ survived }) => this.finishRun(survived));
  }

  private initializeWeaponProgression(initialWeapon: WeaponId): void {
    this.weapons.equip(initialWeapon);
    this.weaponProgression = new WeaponProgression(
      initialWeapon, WEAPON_IDS, WEAPON_SKILLS, WEAPON_EVOLUTIONS,
      this.runRandom.stream("weapon-progression"),
    );
    const progression = new UpgradeProgression(MINER_UPGRADES, this.runRandom.stream("stat-upgrades"));
    const applicator = new UpgradeEffectApplicator(this.player, this.weapons);
    this.upgrades = new UpgradeSystem(this.scene, progression, this.weaponProgression, WEAPON_EVOLUTIONS, applicator, {
      onOpened: (_choices, milestone) => {
        this.phase = "choosingUpgrade";
        this.scene.physics.pause();
        this.player.freeze();
        this.hud.setHint(
          milestone ? "高级升级：从两把武器当前升级池中选择" : "普通升级：选择一项角色属性",
          "#78f3da",
        );
        this.renderSnapshot(this.scene.time.now);
      },
      onClosed: (selected, rank, level) => {
        this.phase = "playing";
        this.scene.physics.resume();
        this.hud.setHint(`获得奖励：${selected.name} · 等阶 ${rank}`, "#ffcf70");
        this.events.emit("upgradeSelected", { level, upgrade: selected, rank });
        this.renderSnapshot(this.scene.time.now);
      },
      onBlocked: () => this.hud.setHint("高级升级已暂存：获得对应进化材料后补发", "#ffcf70"),
      onEvolved: (_weaponId, evolution, stage) => {
        this.hud.setHint(`武器进化：${evolution.name} · 第 ${stage} 阶`, "#ff9cff");
      },
    });
  }

  private emitEnemyDefeated(enemy: Enemy): void {
    const reward = enemy.coreReward;
    this.events.emit("enemyDefeated", {
      x: enemy.x,
      y: enemy.y,
      experience: reward.experience,
      coreTier: reward.coreTier,
      kind: enemy.kind,
      enemyId: enemy.definition.id,
    });
  }

  private readonly onPlayerContact = (_player: unknown, enemyObject: unknown): void => {
    const enemy = enemyObject as Enemy;
    if (this.phase !== "playing" || !enemy.active) return;
    this.applyEnemyDamage(enemy.contactDamage, enemy.x, enemy.y);
  };

  private applyEnemyDamage(amount: number, sourceX: number, sourceY: number): void {
    if (this.phase !== "playing") return;
    const outcome = this.player.takeContactDamage(
      this.talentSystem.modifyIncomingDamage(amount),
      sourceX,
      sourceY,
      this.scene.time.now,
    );
    if (outcome === "dead") this.events.emit("runEnded", { survived: false });
  }

  private finishRun(survived: boolean): void {
    if (this.phase === "won" || this.phase === "lost" || this.phase === "choosingVictoryReward") return;
    this.scene.physics.resume();
    this.player.freeze();
    this.director.stop();
    this.weapons.freeze();
    this.hostileProjectiles.freeze();
    const seconds = Math.floor(this.director.elapsedMs / 1000);
    const summary = `等级 ${this.experience.level} · 命中 ${this.weapons.hitCount} 次 · 生存 ${seconds} 秒`;
    if (!survived) {
      this.phase = "lost";
      showResultOverlay(this.scene, `${this.character.name}倒下了`, summary);
      this.renderSnapshot(this.scene.time.now);
      return;
    }

    const offerIds = this.metaProgression.createVictoryOffer();
    const offer = offerIds
      .map((id) => META_UNLOCKABLE_ITEMS.find((item) => item.id === id))
      .filter((item): item is ItemDefinition => item !== undefined);
    if (offer.length === 0) {
      this.phase = "won";
      showResultOverlay(this.scene, "狩猎成功 · 内容已全部解锁", summary);
      this.renderSnapshot(this.scene.time.now);
      return;
    }

    this.phase = "choosingVictoryReward";
    new VictoryChestChoices(this.scene).open(offer, (item) => {
      this.metaProgression.unlock(item.id);
      this.metaStorage.save(this.metaProgression.unlockedIds);
      this.phase = "won";
      showResultOverlay(this.scene, `永久解锁：${item.name}`, `${summary} · 下一局进入掉落池`);
      this.renderSnapshot(this.scene.time.now);
    });
    this.renderSnapshot(this.scene.time.now);
  }

  private onItemAcquired(stack: ItemStack, upgraded: boolean): void {
    if (stack.definition.kind === "passive") this.applyPassiveItem(stack.definition);
    this.pickupToast.show(stack, upgraded);
    const action = upgraded ? "升级" : "获得";
    this.hud.setHint(`${action}道具：${stack.definition.name} · LV${stack.level}`, "#ffcf70");
    if (stack.definition.kind === "evolution") this.upgrades.receiveEvolutionItem(stack.definition.id);
    this.renderSnapshot(this.scene.time.now);
  }

  private applyPassiveItem(item: ItemDefinition): void {
    if (item.passiveEffect === "armor") this.player.increaseArmor(1);
    if (item.passiveEffect === "pickupRadius") this.player.multiplyPickupRadius(1.2);
    if (item.passiveEffect === "cooldown") this.player.multiplyCooldown(0.92);
    if (item.passiveEffect === "maxHp") this.player.increaseMaxHp(15, 15);
    if (item.passiveEffect === "moveSpeed") this.player.multiplyMoveSpeed(1.06);
    if (item.passiveEffect === "damage") this.player.multiplyDamage(1.1);
  }

  private openItemReplacement(item: ItemDefinition, alreadyPaused = false): void {
    if (this.phase !== "playing" && this.phase !== "choosingItemReward") return;
    this.phase = "choosingItemReplacement";
    if (!alreadyPaused) this.scene.physics.pause();
    this.player.freeze();
    this.replacementView.open(
      item,
      this.inventory.activeSlots,
      (slotIndex) => {
        const stack = this.inventory.replaceActive(slotIndex, item);
        this.pickupToast.show(stack, false);
        this.closeItemReplacement(`已装备：${stack.definition.name} · LV1`);
      },
      () => this.closeItemReplacement(`已放弃：${item.name}`),
    );
    this.hud.setHint("战斗已暂停：替换一个主动道具，或放弃新道具", "#78f3da");
    this.renderSnapshot(this.scene.time.now);
  }

  private closeItemReplacement(message: string): void {
    this.replacementView.close();
    this.phase = "playing";
    this.scene.physics.resume();
    this.hud.setHint(message, "#ffcf70");
    this.renderSnapshot(this.scene.time.now);
  }

  private openRareVeinReward(): void {
    const evolutionIds = new Set(this.weaponProgression.getEligibleEvolutionItemIds());
    const evolutionPool = EVOLUTION_ITEM_CATALOG.filter((item) => evolutionIds.has(item.id));
    const eligible = [...this.runItemPool, ...evolutionPool].filter((item) => this.inventory.canDrop(item));
    const offer = shuffleWithRandom(eligible, this.runRandom.stream("rare-vein-rewards")).slice(0, 3);
    if (offer.length === 0) {
      this.hud.setHint("晶脉中没有可获得的新道具", "#a99cb4");
      return;
    }
    this.phase = "choosingItemReward";
    this.scene.physics.pause();
    this.player.freeze();
    this.itemRewardView.open(offer, (item) => {
      const result = this.inventory.acquire(item);
      if (result.type === "needsReplacement") {
        this.openItemReplacement(item, true);
        return;
      }
      if (result.type === "ineligible") {
        this.closeItemReward("该道具已满级");
        return;
      }
      this.onItemAcquired(result.stack, result.type === "upgraded");
      this.closeItemReward(`晶脉奖励：${result.stack.definition.name} · LV${result.stack.level}`);
    }, (item) => this.inventory.find(item.id)?.level ?? 0);
    this.hud.setHint("战斗已暂停：选择一件晶脉道具", "#9d7cff");
    this.renderSnapshot(this.scene.time.now);
  }

  private closeItemReward(message: string): void {
    this.phase = "playing";
    this.scene.physics.resume();
    this.hud.setHint(message, "#ffcf70");
    this.renderSnapshot(this.scene.time.now);
  }

  private renderSnapshot(time: number): void {
    const state = this.getSnapshot(time);
    this.hud.update({
      hp: state.hp,
      maxHp: state.maxHp,
      combo: state.combo,
      dodgeCooldown: state.dodgeCooldownMs,
      remainingMs: state.remainingMs,
      enemyCount: state.enemyCount,
      activeItems: state.activeItems,
      passiveItems: state.passiveItems,
      bossActive: state.bossActive,
      bossHp: state.bossHp,
      bossMaxHp: state.bossMaxHp,
      equippedWeapons: state.equippedWeapons,
      characterName: state.characterName,
    });
    this.experienceBar.update(state.level, state.xp, state.xpRequired);
    this.telemetry.update({
      seed: state.runSeed,
      character: state.characterName,
      hp: state.hp,
      maxHp: state.maxHp,
      enemies: state.enemyCount,
      combo: state.combo,
      hits: state.hitCount,
      playerX: state.playerPosition.x,
      playerY: state.playerPosition.y,
      dodging: state.dodging,
      level: state.level,
      xp: state.xp,
      xpRequired: state.xpRequired,
      upgradeOpen: state.phase === "choosingUpgrade",
      phase: state.phase,
      bossActive: state.bossActive,
      bossHp: Math.ceil(state.bossHp),
      activeSlotCount: state.activeItems.filter(Boolean).length,
      weaponLevelTotal: state.weaponLevel,
      pickupRadius: Math.round(state.pickupRadius),
      damageMultiplier: Number(this.player.stats.damageMultiplier.toFixed(2)),
      elapsedSeconds: Math.floor(state.elapsedMs / 1000),
      runEnded: state.phase === "won" || state.phase === "lost" || state.phase === "choosingVictoryReward",
      drops: state.dropCount,
    });
  }
}
