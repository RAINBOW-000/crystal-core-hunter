import type { CharacterDefinition } from "../domain/characters/CharacterDefinition";
import type { Player } from "../entities/Player";

export class CharacterTalentSystem {
  private lastDodgeSerial = 0;
  private damageBuffUntil = 0;
  private damageBuffActive = false;
  private collectedCores = 0;
  private readonly player: Player;
  private readonly character: CharacterDefinition;

  constructor(player: Player, character: CharacterDefinition) {
    this.player = player;
    this.character = character;
  }

  update(time: number): void {
    const talent = this.character.talent;
    if (talent.type !== "dodgeFury") return;
    if (this.player.dodgeSerial !== this.lastDodgeSerial) {
      this.lastDodgeSerial = this.player.dodgeSerial;
      this.damageBuffUntil = time + talent.durationMs;
      if (!this.damageBuffActive) {
        this.player.stats.damageMultiplier *= talent.damageMultiplier;
        this.damageBuffActive = true;
      }
    }
    if (this.damageBuffActive && time >= this.damageBuffUntil) {
      this.player.stats.damageMultiplier /= talent.damageMultiplier;
      this.damageBuffActive = false;
    }
  }

  modifyIncomingDamage(amount: number): number {
    const talent = this.character.talent;
    if (talent.type === "lowHealthGuard" && this.player.hp / this.player.stats.maxHp <= talent.threshold) {
      return amount * talent.damageMultiplier;
    }
    return amount;
  }

  onCoresCollected(amount: number): boolean {
    const talent = this.character.talent;
    if (talent.type !== "coreRegeneration") return false;
    this.collectedCores += amount;
    let healed = false;
    while (this.collectedCores >= talent.coresRequired) {
      this.collectedCores -= talent.coresRequired;
      this.player.heal(talent.healing);
      healed = true;
    }
    return healed;
  }
}
