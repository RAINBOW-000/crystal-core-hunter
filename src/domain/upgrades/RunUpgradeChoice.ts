import type { UpgradeDefinition } from "./UpgradeDefinition";
import type { WeaponId, WeaponRefinementStat, WeaponSkillDefinition } from "../weapons/WeaponProgression";

interface ChoiceBase {
  id: string;
  name: string;
  description: string;
}

export type RunUpgradeChoice =
  | (ChoiceBase & { kind: "stat"; definition: UpgradeDefinition })
  | (ChoiceBase & { kind: "weaponUnlock"; weaponId: WeaponId })
  | (ChoiceBase & { kind: "weaponSkill"; skill: WeaponSkillDefinition })
  | (ChoiceBase & { kind: "weaponRefinement"; weaponId: WeaponId; stat: WeaponRefinementStat });
