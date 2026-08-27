# 晶核荒原：游戏架构

当前阶段使用 Phaser 3 + TypeScript，浏览器是第一运行平台。架构目标不是提前实现全部内容，而是让角色、武器、道具和进化能够持续增加，而不把规则继续堆进 Phaser 场景。

## 分层

```text
src/
├─ content/       游戏内容表：角色、升级，之后包括武器、道具、敌人
├─ domain/        纯游戏规则与状态，不依赖 Phaser 或 DOM
├─ core/          一次游戏内共享的基础设施，例如类型化事件
├─ application/   一局游戏的编排，以及领域效果到 Phaser 对象的适配
├─ entities/      Phaser 实体适配：玩家与敌人
├─ combat/        战斗表现和当前武器实现
├─ director/      敌群生成与时间压力
├─ systems/       掉落等运行时系统
├─ ui/            Phaser UI 表现
├─ art/           原型资源与房间绘制
└─ scenes/        Phaser 场景入口，只负责装配和逐帧驱动
```

依赖方向：`content → domain ← application → Phaser adapters`。`domain` 不可以反向导入 Phaser、UI、实体或具体场景。

## 一局游戏的数据流

```text
敌人死亡
  → enemyDefeated 事件
  → 生成晶核
  → experienceCollected 事件
  → ExperienceModel 计算等级
  → levelGained 事件
  → UpgradeProgression 生成候选项
  → 玩家选择
  → UpgradeEffectApplicator 将声明式效果应用到运行时对象
```

UI 只读取 `RunSnapshot`。以后增加结算、暂停、调试面板或录像时，不应分别读取十几个系统的内部字段。

## 内容设计约束

- 角色、升级、武器和道具使用稳定的字符串 ID；存档只记录 ID、等级和版本。
- 内容定义只描述条件与效果，不执行 Phaser 操作。
- 普通成长、三级里程碑和最终进化分别使用 `incremental`、`major`、`evolution`。
- 大型升级使用前置等级、互斥项和标签表达，不在 UI 或场景里写角色专属判断。
- 新效果先扩展 `UpgradeEffect` 联合类型，再在适配器中实现；不能在内容表中塞入任意回调。
- 运行时对象可以更换，但领域数据和存档格式应保持稳定。

## 下一步扩展顺序

1. 建立武器实例容器，允许角色同时装备多把武器。
2. 实现 `major` 奖励池和每三级专属抽取规则。
3. 增加“大剑剑气”作为首个行为型效果，验证武器模块与进化链。
4. 建立道具栏及标签联动，支持武器、角色、道具之间的组合条件。
5. 将敌人接触伤害、掉落和生成参数也迁入内容定义。
6. 在内容扩张前加入固定随机种子和领域模型测试。

## 本轮新增的规则边界

- `domain/items/ItemInventory` 负责主动槽、无限被动栏、道具等级和替换判定；拾取系统与 UI 不复制这些规则。
- `domain/items/ActiveItemCooldown` 负责主动道具的纯时间状态；`ItemEffectScaling` 统一战斗数值与奖励卡预览，避免两处公式漂移。
- `domain/weapons/WeaponProgression` 负责第二武器、路线锁定、保护随机、两段顺序进化和高级升级补发，不依赖 Phaser。
- 该领域模型直接生成严格三项的高级候选；路线技能不足时才加入可重复精炼，等待进化材料时返回阻塞状态。
- `combat/WeaponRack` 同时驱动最多两把武器；四种武器通过统一接口接收技能 ID 和路线进化，不依赖升级 UI 的具体实现。
- `systems/ItemDropSystem` 只负责世界掉落实体与碰撞拾取；满槽替换由应用层暂停并打开专用界面。
- `director/SpawnDirector` 负责 12 分钟时间轴、精英节点和 Boss 出现；胜利由 Boss 死亡事件决定，计时结束本身不再结束游戏。
- `HostileProjectileSystem` 统一管理敌方晶刺的生成、寿命与玩家碰撞；远程敌人和 Boss 只发出攻击请求，不各自复制投射物生命周期。
- Boss 生命阶段由 `domain/combat/BossPhase` 计算，表现层依据阶段叠加环射、瞄准散射和冲锋行为。
- `domain/meta/MetaUnlockProgression` 负责胜利宝箱候选和永久解锁集合；`MetaUnlockStorage` 只负责版本化本地存档，局内掉落池在开局时读取一次快照。
- `domain/world/HoldInteraction` 独立计算按住开采进度与中断；`RareVeinSystem` 负责生成、距离判定和表现，成功后由应用层暂停并打开道具奖励界面。

## 引擎迁移边界

目前 Phaser 只存在于表现层和运行时适配层。若未来转向 Godot 或 Unity，优先保留内容定义、升级规则、数值曲线、ID 与存档结构，重写实体、输入、渲染、物理和 UI 适配层。
