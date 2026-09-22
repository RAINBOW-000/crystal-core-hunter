import type {
  WeaponEvolutionDefinition,
  WeaponId,
  WeaponSkillDefinition,
} from "../../domain/weapons/WeaponProgression";

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  description: string;
  color: number;
}

export const WEAPON_DEFINITIONS: readonly WeaponDefinition[] = [
  { id: "greatsword", name: "荒铁大剑", description: "三段近战挥砍，第三击发动重击。", color: 0xffcf70 },
  { id: "crystal-crossbow", name: "晶核弩", description: "持续朝鼠标方向发射高速晶矢。", color: 0x70e8ff },
  { id: "fission-staff", name: "裂变法杖", description: "朝鼠标方向制造裂变爆破。", color: 0xd695ff },
  { id: "orbit-drill", name: "环轨钻头", description: "环绕角色近身切割敌人。", color: 0xe8d36f },
  { id: "seismic-resonator", name: "地脉震荡器", description: "自动部署震荡装置，击退并震慑敌群。", color: 0xff9d68 },
  { id: "refraction-satellite", name: "折光卫星", description: "自动标记远处强敌并降下折光束。", color: 0x9fdcff },
];

const skill = (
  id: string,
  weaponId: WeaponId,
  routeId: string,
  name: string,
  description: string,
): WeaponSkillDefinition => ({ id, weaponId, routeId, name, description });

export const WEAPON_SKILLS: readonly WeaponSkillDefinition[] = [
  skill("greatsword-wave", "greatsword", "wind", "剑气", "第三击释放短距离剑气。"),
  skill("greatsword-chase", "greatsword", "wind", "追风", "加快挥砍，降低攻击时的移动减速。"),
  skill("greatsword-echo", "greatsword", "wind", "回响", "剑气命中后产生延迟追击。"),
  skill("greatsword-heavy", "greatsword", "iron", "重锋", "提高近身伤害、范围和击退。"),
  skill("greatsword-fissure", "greatsword", "iron", "震裂", "第三击产生地面裂痕。"),
  skill("greatsword-stance", "greatsword", "iron", "铁势", "挥砍期间获得减伤与短暂霸体。"),

  skill("crossbow-pierce", "crystal-crossbow", "prism", "贯晶", "晶矢可以穿透一个敌人。"),
  skill("crossbow-split", "crystal-crossbow", "prism", "裂晶", "穿透后生成两枚侧向碎片。"),
  skill("crossbow-mark", "crystal-crossbow", "prism", "猎印", "连续命中同一目标会叠加猎印伤害。"),
  skill("crossbow-string", "crystal-crossbow", "rain", "复弦", "提高晶核弩射击速度。"),
  skill("crossbow-spread", "crystal-crossbow", "rain", "散射", "额外发射两枚低伤害侧箭。"),
  skill("crossbow-pressure", "crystal-crossbow", "rain", "蓄压", "每第五次攻击释放强化齐射。"),

  skill("drill-extra", "orbit-drill", "secondary", "双重钻组", "增加一枚环绕钻头。"),
  skill("drill-bearing", "orbit-drill", "secondary", "高速轴承", "提高转速与接触伤害频率。"),
  skill("drill-return", "orbit-drill", "secondary", "回收轨道", "周期性冲向强敌并沿轨道返回。"),

  skill("seismic-amplifier", "seismic-resonator", "secondary", "扩幅线圈", "扩大震荡范围。"),
  skill("seismic-deployment", "seismic-resonator", "secondary", "快速部署", "缩短部署与攻击间隔。"),
  skill("seismic-aftershock", "seismic-resonator", "secondary", "二次余震", "主震后追加一次较弱余震。"),

  skill("satellite-threat", "refraction-satellite", "secondary", "威胁测绘", "优先锁定精英、首领和高生命目标。"),
  skill("satellite-lens", "refraction-satellite", "secondary", "聚焦透镜", "提高折光束伤害与范围。"),
  skill("satellite-calibration", "refraction-satellite", "secondary", "快速校准", "缩短锁定与攻击间隔。"),

  skill("staff-split", "fission-staff", "critical", "裂变", "法弹命中后分裂成两枚碎片。"),
  skill("staff-conduct", "fission-staff", "critical", "传导", "裂变碎片会寻找附近的新目标。"),
  skill("staff-overload", "fission-staff", "critical", "过载", "每第三次施法发射爆炸核心。"),
  skill("staff-seed", "fission-staff", "domain", "晶种", "命中位置留下持续伤害晶种。"),
  skill("staff-resonance", "fission-staff", "domain", "共鸣", "晶种周期性扩大伤害范围。"),
  skill("staff-collapse", "fission-staff", "domain", "崩解", "晶种消失时产生范围爆炸。"),
];

export const WEAPON_EVOLUTIONS: readonly WeaponEvolutionDefinition[] = [
  { weaponId: "greatsword", routeId: "wind", requiredItemId: "wind-crystal-blank", name: "裂风刃", description: "宽幅穿透剑气与轨迹回响。" },
  { weaponId: "greatsword", routeId: "iron", requiredItemId: "leyline-forge-core", name: "镇岳锋", description: "第三击重砸并制造震裂。" },
  { weaponId: "crystal-crossbow", routeId: "prism", requiredItemId: "prism-guide-rail", name: "棱光长钉", description: "强化穿透、裂晶与追踪猎印。" },
  { weaponId: "crystal-crossbow", routeId: "rain", requiredItemId: "hive-string-box", name: "晶雨连弩", description: "强化齐射化为连续箭雨。" },
  { weaponId: "orbit-drill", routeId: "secondary", requiredItemId: "star-orbit-axis", name: "行星钻阵", description: "内外两层钻组反向旋转切割。" },
  { weaponId: "seismic-resonator", routeId: "secondary", requiredItemId: "resonance-core", name: "大陆共振", description: "三台装置连续引发大范围共振。" },
  { weaponId: "refraction-satellite", routeId: "secondary", requiredItemId: "solar-prism", name: "天穹折光阵", description: "三颗卫星构成三角锁定并降下巨型光束。" },
  { weaponId: "fission-staff", routeId: "critical", requiredItemId: "critical-crystal-orb", name: "临界裂变", description: "次级裂变并扩大核心爆炸。" },
  { weaponId: "fission-staff", routeId: "domain", requiredItemId: "leyline-staff-ring", name: "共鸣晶域", description: "晶种连接成持续伤害区域。" },
];

export const WEAPON_IDS = WEAPON_DEFINITIONS.map((weapon) => weapon.id);
export const PRIMARY_WEAPON_IDS: readonly WeaponId[] = ["greatsword", "crystal-crossbow", "fission-staff"];
export const SECONDARY_WEAPON_IDS: readonly WeaponId[] = ["orbit-drill", "seismic-resonator", "refraction-satellite"];

export function getWeaponDefinition(id: WeaponId): WeaponDefinition {
  const weapon = WEAPON_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!weapon) throw new Error(`Unknown weapon: ${id}`);
  return weapon;
}
