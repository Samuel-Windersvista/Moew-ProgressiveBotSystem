# APBS 代码优化与Bug修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复已知Bug（黑名单失效、弹药Tier滑动逻辑缺陷），移除死代码，提升Bot生成时的运行时性能

**Architecture:** 5个独立任务，互不依赖，可并行执行。每个任务聚焦单一文件的单一关注点。前3个修复性任务为高优先级，后2个清理性任务为低优先级

**Tech Stack:** TypeScript, SPT 3.11.x modding framework (tsyringe DI)

**涉及文件（按修改顺序）:**

| 文件 | 修改类型 | 任务 |
|------|----------|------|
| `src/Alterations/BotConfigs.ts` | 修复 / 优化 | Task 1, Task 3 |
| `src/Utils/APBSEquipmentGetter.ts` | 修复 | Task 2 |
| `src/Helpers/BotEnablementHelper.ts` | 优化 | Task 3 |
| `src/ClassExtensions/APBSBotWeaponGenerator.ts` | 优化 | Task 3 |
| `src/Globals/TierInformation.ts` | 修复 | Task 4 |
| `src/InstanceManager.ts` | 清理 | Task 5 |

---

### Task 1: [严重] 修复战利品黑名单移除Bug

**问题根因:** `Object.keys(obj).splice(index, 1)` 只操作了键名的临时数组副本，从未调用 `delete obj[key]` 从原始对象中移除属性。影响 `setScavLoot()`、`setBossLoot()`、`setFollowerLoot()`、`setSpecialLoot()` 四个方法中 TacticalVest / Pockets / Backpack 三个槽位的黑名单逻辑。

**Files:**
- Modify: `src/Alterations/BotConfigs.ts` (4处重复模式，每处9行)

- [ ] **Step 1: 修复 setScavLoot() 中的黑名单移除**

定位到 `setScavLoot()` 方法 (大约第811-839行)。将三个 `if( Object.keys(...).includes(item) )` 块的代码替换：

旧代码:
```typescript
if (Object.keys(botTable[botType].inventory.items.TacticalVest).includes(item))
{
    const tacticalVestLootTable = Object.keys(botTable[botType].inventory.items.TacticalVest);
    const index = tacticalVestLootTable.indexOf(item);
    if (index > -1)
    {
        tacticalVestLootTable.splice(index, 1)
    }
}
if (Object.keys(botTable[botType].inventory.items.Pockets).includes(item))
{
    const pocketsLootTable = Object.keys(botTable[botType].inventory.items.Pockets);
    const index = pocketsLootTable.indexOf(item);
    if (index > -1)
    {
        pocketsLootTable.splice(index, 1)
    }
}
if (Object.keys(botTable[botType].inventory.items.Backpack).includes(item))
{
    const backpackLootTable = Object.keys(botTable[botType].inventory.items.Backpack);
    const index = backpackLootTable.indexOf(item);
    if (index > -1)
    {
        backpackLootTable.splice(index, 1)
    }
}
```

新代码:
```typescript
const vestItems = botTable[botType].inventory.items.TacticalVest;
const pocketItems = botTable[botType].inventory.items.Pockets;
const backpackItems = botTable[botType].inventory.items.Backpack;
if (vestItems && item in vestItems) delete vestItems[item];
if (pocketItems && item in pocketItems) delete pocketItems[item];
if (backpackItems && item in backpackItems) delete backpackItems[item];
```

- [ ] **Step 2: 修复 setBossLoot() 中的黑名单移除**

定位到 `setBossLoot()` 方法 (第866-894行)。应用与 Step 1 完全相同的替换模式。

- [ ] **Step 3: 修复 setFollowerLoot() 中的黑名单移除**

定位到 `setFollowerLoot()` 方法 (第921-949行)。应用与 Step 1 完全相同的替换模式。

- [ ] **Step 4: 修复 setSpecialLoot() 中的黑名单移除**

定位到 `setSpecialLoot()` 方法 (大约第976-1003行)。应用与 Step 1 完全相同的替换模式。

- [ ] **Step 5: 编译验证**

Run:
```powershell
Set-Location -LiteralPath "E:\云文件\GitHub\Moew-ProgressiveBotSystem"; npx tsc --noEmit
```
预期: 编译通过，无错误

- [ ] **Step 6: Commit**

```bash
git add src/Alterations/BotConfigs.ts
git commit -m "fix: loot blacklist removal now actually deletes items from bot inventory objects

Object.keys() returns a new array; splice() on that temporary array
never modified the original botTable inventory objects. Replaced with
direct delete from all 4 methods (setScavLoot/setBossLoot/
setFollowerLoot/setSpecialLoot) for all 3 slots (TacticalVest/Pockets/
Backpack)."
```

---

### Task 2: [中等] 修复弹药Tier滑动算法中的 `>=` 偏差

**问题根因:** `newTierCalc()` 使用 `>=` 做比较。当随机的 Tier 数字 **等于** 当前 Tier 时，也会触发 `tierInfo - 1` 降级。这意味着降级概率高于预期（在已通过 `slideChance` 过滤后仍偏向降级）。应改为 `>` 使算法在随机值等于当前Tier时不降级。

**Files:**
- Modify: `src/Utils/APBSEquipmentGetter.ts:464`

- [ ] **Step 1: 修改 newTierCalc() 的比较操作符**

定位到第464行。将 `>=` 改为 `>`：

旧:
```typescript
const newTier = (Math.floor(Math.random() * (maxTier - minTier + 1) + minTier)) >= tierInfo  ? (tierInfo - 1) : (Math.floor(Math.random() * (maxTier - minTier + 1) + minTier))
```

新:
```typescript
const newTier = (Math.floor(Math.random() * (maxTier - minTier + 1) + minTier)) > tierInfo  ? (tierInfo - 1) : (Math.floor(Math.random() * (maxTier - minTier + 1) + minTier))
```

- [ ] **Step 2: 编译验证**

Run:
```powershell
Set-Location -LiteralPath "E:\云文件\GitHub\Moew-ProgressiveBotSystem"; npx tsc --noEmit
```
预期: 编译通过

- [ ] **Step 3: Commit**

```bash
git add src/Utils/APBSEquipmentGetter.ts
git commit -m "fix: correct ammo tier slide bias by changing >= to >

In newTierCalc(), the >= comparison caused tier downgrade when the
random tier equaled the current tier, skewing results below the
configured slideChance. Changed to > so only values strictly above
current tier trigger a downgrade."
```

---

### Task 3: [性能优化] 将 Bot 类别判断从 O(n) 数组扫描优化为 O(1) Set 查找

**问题根因:** `Object.values(SomeEnum).includes(botType)` 模式在 BotConfigs.ts 和 APBSBotWeaponGenerator.ts 中被频繁调用（每次Bot生成都触发多次），每次都创建新数组并线性扫描。

**优化方案:** 在 `BotEnablementHelper` 中新增静态 `ReadonlySet<string>` 属性，替换所有外部调用点的 `Object.values(Enum).includes()` 为 `BotCategory.X.has(botType)`。

**Files:**
- Modify: `src/Helpers/BotEnablementHelper.ts` (添加静态Set)
- Modify: `src/Alterations/BotConfigs.ts` (替换约15处调用点)
- Modify: `src/ClassExtensions/APBSBotWeaponGenerator.ts` (替换约13处调用点)

- [ ] **Step 1: 在 BotEnablementHelper 中添加静态类别 Set**

在 `BotEnablementHelper` 类中（`src/Helpers/BotEnablementHelper.ts`），在构造函数之前添加以下静态成员：

```typescript
@injectable()
export class BotEnablementHelper
{
    // 静态预计算 Set，将 O(n) 数组扫描变为 O(1) 哈希查找
    public static readonly PMC_SET: ReadonlySet<string> = new Set(Object.values(PMCBots));
    public static readonly SCAV_SET: ReadonlySet<string> = new Set(Object.values(ScavBots));
    public static readonly BOSS_SET: ReadonlySet<string> = new Set(Object.values(BossBots));
    public static readonly FOLLOWER_SET: ReadonlySet<string> = new Set(Object.values(FollowerBots));
    public static readonly SPECIAL_SET: ReadonlySet<string> = new Set(Object.values(SpecialBots));
    public static readonly EVENT_SET: ReadonlySet<string> = new Set(Object.values(EventBots));

    constructor()
    {}
```

同时将内部的 `isBoss()`, `isFollower()`, `isPMC()`, `isScav()`, `isEvent()`, `isSpecial()` 方法改为使用静态 Set（第43-71行）：

`isBoss` 旧:
```typescript
private isBoss(botType: string): boolean
{
    return Object.values(BossBots).includes(botType as BossBots);
}
```
新:
```typescript
private isBoss(botType: string): boolean
{
    return BotEnablementHelper.BOSS_SET.has(botType);
}
```

对 `isFollower()`, `isPMC()`, `isScav()`, `isEvent()`, `isSpecial()` 应用相同变换。

- [ ] **Step 2: 替换 BotConfigs.ts 中的所有调用点**

在 `src/Alterations/BotConfigs.ts` 中，将下面所有出现 `Object.values(XxxBots).includes(...)` 的地方替换为 `BotEnablementHelper.XXX_SET.has(...)`。

需要在文件顶部添加导入：
```typescript
import { BotEnablementHelper } from "../Helpers/BotEnablementHelper";
```

具体替换位置（按行号）：

| 原代码 | 替换为 |
|--------|--------|
| 第191行: `Object.values(EventBots).includes(botType)` | `BotEnablementHelper.EVENT_SET.has(botType)` |
| 第192行: `Object.values(ScavBots).includes(botType)` | `BotEnablementHelper.SCAV_SET.has(botType)` |
| 第247行: `Object.values(PMCBots).includes(botType)` | `BotEnablementHelper.PMC_SET.has(botType)` |
| 第380行: `Object.values(PMCBots).includes(botType)` | `BotEnablementHelper.PMC_SET.has(botType)` |
| 第388行: `Object.values(ScavBots).includes(botType)` | `BotEnablementHelper.SCAV_SET.has(botType)` |
| 第396行: `Object.values(BossBots).includes(botType)` | `BotEnablementHelper.BOSS_SET.has(botType)` |
| 第404行: `Object.values(FollowerBots).includes(botType)` | `BotEnablementHelper.FOLLOWER_SET.has(botType)` |
| 第412行: `Object.values(SpecialBots).includes(botType)` | `BotEnablementHelper.SPECIAL_SET.has(botType)` |
| 第581行: `Object.values(PMCBots).includes(botType)` | `BotEnablementHelper.PMC_SET.has(botType)` |
| 第589行: `Object.values(ScavBots).includes(botType)` | `BotEnablementHelper.SCAV_SET.has(botType)` |
| 第597行: `Object.values(BossBots).includes(botType)` | `BotEnablementHelper.BOSS_SET.has(botType)` |
| 第605行: `Object.values(FollowerBots).includes(botType)` | `BotEnablementHelper.FOLLOWER_SET.has(botType)` |
| 第613行: `Object.values(SpecialBots).includes(botType)` | `BotEnablementHelper.SPECIAL_SET.has(botType)` |
| 第809行: `Object.values(ScavBots).includes(botType)` | `BotEnablementHelper.SCAV_SET.has(botType)` |
| 第864行: `Object.values(BossBots).includes(botType)` | `BotEnablementHelper.BOSS_SET.has(botType)` |
| 第919行: `Object.values(FollowerBots).includes(botType)` | `BotEnablementHelper.FOLLOWER_SET.has(botType)` |
| 第974行: `Object.values(SpecialBots).includes(botType)` | `BotEnablementHelper.SPECIAL_SET.has(botType)` |

- [ ] **Step 3: 替换 APBSBotWeaponGenerator.ts 中的所有调用点**

在 `src/ClassExtensions/APBSBotWeaponGenerator.ts` 中，将以下位置的全部 `Object.values(XxxBots).includes(...)` 替换为 `BotEnablementHelper.XXX_SET.has(...)`。

需要在文件顶部添加导入：
```typescript
import { BotEnablementHelper } from "../Helpers/BotEnablementHelper";
```

具体替换位置：

| 原代码 | 替换为 |
|--------|--------|
| 第279行: `Object.values(PMCBots).includes(botRole)` | `BotEnablementHelper.PMC_SET.has(botRole)` |
| 第283行: `Object.values(ScavBots).includes(botRole)` | `BotEnablementHelper.SCAV_SET.has(botRole)` |
| 第287行: `Object.values(BossBots).includes(botRole)` | `BotEnablementHelper.BOSS_SET.has(botRole)` |
| 第291行: `Object.values(FollowerBots).includes(botRole)` | `BotEnablementHelper.FOLLOWER_SET.has(botRole)` |
| 第295行: `Object.values(SpecialBots).includes(botRole)` | `BotEnablementHelper.SPECIAL_SET.has(botRole)` |
| 第600行: `Object.values(PMCBots).includes(botRole)` | `BotEnablementHelper.PMC_SET.has(botRole)` |
| 第601行: `Object.values(ScavBots).includes(botRole)` | `BotEnablementHelper.SCAV_SET.has(botRole)` |
| 第602行: `Object.values(BossBots).includes(botRole)` | `BotEnablementHelper.BOSS_SET.has(botRole)` |
| 第603行: `Object.values(FollowerBots).includes(botRole)` | `BotEnablementHelper.FOLLOWER_SET.has(botRole)` |
| 第604行: `Object.values(SpecialBots).includes(botRole)` | `BotEnablementHelper.SPECIAL_SET.has(botRole)` |
| 第614行: `Object.values(PMCBots).includes(botRole)` | `BotEnablementHelper.PMC_SET.has(botRole)` |
| 第615行: `Object.values(ScavBots).includes(botRole)` | `BotEnablementHelper.SCAV_SET.has(botRole)` |
| 第616行: `Object.values(BossBots).includes(botRole)` | `BotEnablementHelper.BOSS_SET.has(botRole)` |
| 第617行: `Object.values(FollowerBots).includes(botRole)` | `BotEnablementHelper.FOLLOWER_SET.has(botRole)` |
| 第618行: `Object.values(SpecialBots).includes(botRole)` | `BotEnablementHelper.SPECIAL_SET.has(botRole)` |

- [ ] **Step 4: 检查 BotConfigs.ts 中剩余 `Object.values(ScavBots)` / `Object.values(BossBots)` 调用**

`setScavLoot` 中 (第796行) / `setBossLoot` 中 (第851行) / `setFollowerLoot` 中 (第906行) / `setSpecialLoot` 中 (第961行) 的 `Object.values(ScavBots).forEach()` 模式也一并替换：

原:
```typescript
Object.values(ScavBots).forEach((bot) => 
```
新:
```typescript
BotEnablementHelper.SCAV_SET.forEach((bot) => 
```

对 BossBots / FollowerBots / SpecialBots 同理替换。

- [ ] **Step 5: 编译验证**

Run:
```powershell
Set-Location -LiteralPath "E:\云文件\GitHub\Moew-ProgressiveBotSystem"; npx tsc --noEmit
```
预期: 编译通过，无新增错误

- [ ] **Step 6: Commit**

```bash
git add src/Helpers/BotEnablementHelper.ts src/Alterations/BotConfigs.ts src/ClassExtensions/APBSBotWeaponGenerator.ts
git commit -m "perf: replace O(n) array scans with O(1) Set lookups for bot category checks

Added static ReadonlySet<string> members to BotEnablementHelper for all
6 bot categories (PMC/SCAV/BOSS/FOLLOWER/SPECIAL/EVENT). Replaced all
Object.values(Enum).includes() calls in BotConfigs.ts (~17 sites) and
APBSBotWeaponGenerator.ts (~15 sites) with direct Set.has() calls.
Also refactored internal BotEnablementHelper category methods to use
the static Sets."
```

---

### Task 4: [低] 修正 TierInformation 中 Tier 7 的最大等级

**问题根因:** `TierInformation.ts` 中 Tier 7 配置 `playerMaximumLevel: 100`，但 SPT 3.11 最高等级为 79 且 `ABPSBotLevelGenerator` 将 Bot 等级硬限制为 79。100 这个值具有误导性。

**修改:** 将 100 改为 79，使其与实际代码限制和 SPT 版本上限一致。

**Files:**
- Modify: `src/Globals/TierInformation.ts:107`

- [ ] **Step 1: 修改 Tier 7 的 playerMaximumLevel**

将第107行的 `100` 改为 `79`：

旧:
```typescript
{
    tier: 7,
    playerMinimumLevel: 61,
    playerMaximumLevel: 100,
```
新:
```typescript
{
    tier: 7,
    playerMinimumLevel: 61,
    playerMaximumLevel: 79,
```

- [ ] **Step 2: 编译验证**

Run:
```powershell
Set-Location -LiteralPath "E:\云文件\GitHub\Moew-ProgressiveBotSystem"; npx tsc --noEmit
```
预期: 编译通过

- [ ] **Step 3: Commit**

```bash
git add src/Globals/TierInformation.ts
git commit -m "fix: correct Tier 7 max player level from 100 to 79

SPT 3.11 caps bot levels at 79 in the BotLevelGenerator patch. The
config value of 100 was misleading and inconsistent with the code."
```

---

### Task 5: [清理] 移除无用的 getPath() 反篡改代码

**问题根因:** `InstanceManager.getPath()` 方法解码 base64 字符串 "V2F5ZmFyZXI=" ("Wayfarer")，检查 MOD 目录中是否存在该名称的文件。返回值从未被使用。该方法是死代码，且每次服务器启动都会同步读取目录。

**Files:**
- Modify: `src/InstanceManager.ts` (删除方法 + 删除调用)

- [ ] **Step 1: 移除 preSptLoad() 中对 getPath() 的调用**

第239行，删除 `this.getPath();` 调用。

定位到:
```typescript
        this.modConfig = container.resolve<ModConfig>("ModConfig");

        this.getPath();
    }
```
改为:
```typescript
        this.modConfig = container.resolve<ModConfig>("ModConfig");
    }
```

- [ ] **Step 2: 移除 getPath() 方法**

删除第264-279行的整个 `getPath()` 方法：

```typescript
    public getPath(): boolean
    {
        const dirPath: string = path.dirname(__filename);
        const modDir: string = path.join(dirPath, "..", "..");
        
        const key = "V2F5ZmFyZXI=";
        const keyDE = Buffer.from(key, "base64")

        const contents = fs.readdirSync(modDir).includes(keyDE.toString());

        if (contents)
        {
            return true;
        }
        return false;   
    }
```

- [ ] **Step 3: 移除不再使用的 fs 导入**

检查 `import * as fs from "fs";` 和 `import * as path from "path";` 是否还有其他使用。

`path` 在 `getPath()` 外部没有被使用。删除 `import * as path from "path";` 和 `import * as fs from "fs";`。

- [ ] **Step 4: 编译验证**

Run:
```powershell
Set-Location -LiteralPath "E:\云文件\GitHub\Moew-ProgressiveBotSystem"; npx tsc --noEmit
```
预期: 编译通过，无关于 `fs` 或 `path` 的未使用导入警告

- [ ] **Step 5: Commit**

```bash
git add src/InstanceManager.ts
git commit -m "chore: remove dead getPath() anti-tamper check in InstanceManager

The method decoded 'V2F5ZmFyZXI=' and checked for a 'Wayfarer' directory
but its return value was never consumed. Removed the method, its call
site, and the now-unused fs/path imports."
```

---

## 执行顺序建议

```
任务依赖: 全部独立，无依赖关系

并行执行（推荐）:
  执行线程A: Task 1 → Task 2 → Task 4  (3个小修复，同一文件领域)
  执行线程B: Task 3                     (跨3个文件的全局替换)
  执行线程C: Task 5                     (单文件清理)

或线性执行:
  Task 1 → Task 3 → Task 2 → Task 4 → Task 5
```

## 验证清单

全部任务完成后，执行以下验证：

```powershell
# 编译检查
Set-Location -LiteralPath "E:\云文件\GitHub\Moew-ProgressiveBotSystem"; npx tsc --noEmit

# 确认改动文件数
git diff --stat HEAD~5

# 确认所有 commit 都在
git log --oneline -6
```
