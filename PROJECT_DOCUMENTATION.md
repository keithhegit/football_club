# FM2023 项目开发技术文档 (Project Bible)

**版本**: 2.0 (中文重制版)
**日期**: 2025-12-06
**状态**: 持续更新中

---

## 1. 核心参考资料与设计哲学

本项目的核心目的是重现 *Football Manager 2023* (FM23) 的核心体验，所有算法和逻辑都严格基于以下社区权威分析。我们不“发明”逻辑，而是“实现”已被逆向工程的逻辑。

### 1.1 核心参考 (The Holy Trinity)

*   **Guide to FM (`guidetofm.com`)** - **逻辑核心**
    *   **作用**: 一切“属性如何影响比赛”的最高指导准则。如果代码中的公式与此网站及本文档冲突，以本文档描述的 Guide to FM 逻辑为准。
    *   **核心提取**: 战术指令（Tactical Instructions）与球员属性（Attributes）之间的详尽映射关系。例如：传球不是一个单一属性的判定，而是 `Passing` (技术) + `Vision` (能看到路线) + `Decisions` (选择正确路线)。

*   **FM Scout (`fmscout.com`)** - **数据结构与隐藏机制**
    *   **作用**: 揭示官方不显示的隐藏机制，特别是 CA/PA（Current/Potential Ability）算法和隐藏属性的作用。
    *   **核心提取**: 
        *   **CA (当前能力)** 计算公式: 基于位置权重的属性加权和。
        *   **PA (潜力上限)**: 决定球员成长的硬上限。

*   **SortItOutSI (`sortitoutsi.net`)** - **真实数据库**
    *   **作用**: 真实世界数据的标准来源（头像、Logo、数据更新包）。
    *   **核心提取**: 数据库的 Schema 设计，特别是球员、俱乐部、赛事的 Data Update 结构。

---

## 2. 系统整体架构

系统采用 **模块化数据库 + 实时模拟引擎** 的分层架构：

```mermaid
graph TD
    UI[前端 UI 层 (React/TS)] <--> Logic[核心逻辑层]
    Logic <--> DB[数据库层 (SQLite/JSON)]
    Logic <--> Engine[比赛引擎 (Match Engine)]

    subgraph DataFlow[数据流]
        DB -- 加载存档 --> Logic
        Logic -- 日程推进/训练 --> Logic
        Logic -- 比赛输入 (State) --> Engine
        Engine -- 实时事件流 (60FPS) --> UI
        Engine -- 赛后统计 --> Logic
    end
```

### 2.2 与策划案对齐（指南来源）

1) **Guide to FM (逻辑核心，guidetofm.com)**  
   - 用途：动作成功率的属性组合与战术指令映射。  
   - 要求：所有公式、权重、状态修正必须以策划案中提炼的逻辑为准，不得主观杜撰。  

2) **FM Scout (数据结构，fmscout.com)**  
   - 用途：CA/PA 计算、隐藏属性、位置权重。  
   - 要求：CA/PA 计算与属性分配需保持与策划案一致；隐藏属性在引擎中需留接口。  

3) **SortItOutSI (数据库，sortitoutsi.net)**  
   - 用途：真实数据 Schema；头像/Logo/Data Update 结构。  
   - 要求：本地/远程数据的字段、索引与此结构兼容，便于后续热更新。  

### 2.3 现状对齐与差距

- **已对齐**  
  - Tick-Based 模拟、事件日志 + 统计输出。  
  - 属性组合/概率引擎基础公式（Passing/Dribble/Shoot/Intercept 等）已实现。  
  - CA/PA 位置权重、隐藏属性 Schema 已落地（D1 + 本地缓存）。  

- **待补足（按优先级）**  
  1. 团队 CA 差异全局修正（强弱队光环）。  
  2. 情境修正：主客场、比分压力、德比战、时间段（补时/终盘心态漂移）。  
  3. 运气层：非受迫性失误、门框/折射/滑倒，随机浮动 0.92-1.08。  
  4. 战术克制与角色互补：阵型克制表、角色配合（DLP→AF 等）。  
  5. 体能衰减曲线与状态系统：Condition/Stamina/Morale/Form 全链路生效。  
  6. 统计与事件可视：xG/PPDA/角球任意球/牌类/Key Players 需实时更新。  

### 2.4 行动纲领（近期迭代计划）

1. **引擎数值补全（Guide to FM 对齐）**  
   - 落地团队 CA 光环、主客场/比分时间/德比修正、运气层（非受迫失误/门框/折射/滑倒，0.92-1.08 随机）。  
   - 校准传球/射门/抢断/犯规分布到数值目标区间，避免极端比分（>10球）与异常低传控。  
2. **战术克制与角色互补（Guide to FM）**  
   - 阵型克制矩阵、角色配合加成（如 DLP→AF）、冲突扣分；全部以可配置表暴露。  
3. **状态管线（FM Scout 隐藏/状态）**  
   - 体能衰减曲线、Morale/Form/Consistency/Important Matches 等隐藏属性对概率的全链路影响；训练/赛后反馈回写状态。  
4. **事件与统计 UI（策划案展示要求）**  
   - `MatchView`/`UnifiedMatchTest` 实时刷新：控球率、xG、射门(射正)、传球(成功率)、犯规(黄/红)、抢断、任意球/角球。  
   - 事件分类：进球/射门/扑救/威胁传球/定位球(任意球+角球)/犯规牌/受伤；Key Players（进球者+最高评分）。  
5. **数据一致性（SortItOutSI 兼容）**  
   - 本地 IndexedDB / D1 schema 与 SortItOutSI 对齐；snake_case/PascalCase 双向映射；隐藏属性/CA-PA 接口保留；热更新不破坏存档。  
6. **验证与基准**  
   - 跑 ≥1000 场回归模拟，校验进球/传球成功/射正/犯规牌/xG 分布；偏差超阈立即回滚或调参。  

### 2.5 当前冲刺（执行序）
1) 先调数值：团队 CA 光环 + 主客场/比分时间修正 + 运气层 → 校准极端比分与传控成功率。  
2) 再补 UI：事件分类与统计项（含任意球/角球、Key Players），确保实时刷新。  
3) 强化状态管线：体能衰减 + Morale/Form/隐藏属性入引擎，并回写训练/赛后。  
4) 战术克制/角色互补：落地矩阵与配合表，提供配置入口。  
5) 数据一致性与验证：Schema 双向映射检查 + 1000 场模拟验收。  

### 2.6 当前进度（更新）
- 已实装：团队强弱光环（基于队伍平均属性）、主客场与比分时间修正、运气层（0.92-1.08）、tick 节奏放缓（降低极端事件密度）。  
- 已实装：定位球/任意球统计与事件、比赛统计 UI（控球/xG/射门/传球/犯规牌/抢断/任意球角球、事件过滤、Key Players）。  
- 已实装：状态管线（第一步）——Morale/Form 曲线强化；Consistency/Important Matches 隐藏属性入概率；Condition/Stamina 衰减曲线更陡，低体能显著下滑。  
- 待继续：数值再校准（进球/传控/犯规分布回归目标区间）、状态管线深度（Sharpness/Fatigue/Injury 影响）、战术克制矩阵与角色互补、1000 场回归验证与 PPDA/xG 走势图。  

### 2.1 模块职责
1.  **数据库层**: 存储 `.fmf` 格式的静态数据（球员、俱乐部、联赛规则）和动态存档数据。
2.  **核心逻辑层**: 
    *   处理时间推进（日/周）。
    *   **成长系统**: 基于训练设施和比赛时间计算 CA 增长。
    *   **状态系统**: 管理体能 (Condition/Stamina)、士气 (Morale) 和 状态 (Form)。
3.  **比赛引擎 (Match Engine)**: 
    *   核心是一个离散事件模拟器。
    *   输入：主客队阵容、战术设置、环境参数。
    *   输出：带有时间戳的事件日志（Event Log）和统计数据。
4.  **UI 层**: 
    *   负责展示数据和接收用户指令（战术调整、换人）。

---

## 3. 核心机制详解 (Technical Deep Dive)

### 3.1 比赛引擎算法 (Match Engine Logic)

比赛引擎不预设结果，而是基于概率的 **Tick-Based 模拟**。每一帧（Tick）都可能产生一个事件。

#### A. 成功率核心公式 (Probability Formula)

任何动作（传球、射门、抢断等）的成功率计算公式统一如下（参考 `probabilityEngine.ts`）：

```typescript
Probability = BaseScore 
              * TacticalMod    // 战术指令修正 (e.g. 节奏加快 -> 成功率降低)
              * ConditionMod   // 体能修正 (体力<50% -> 物理属性骤降)
              * MoraleMod      // 士气修正 (±10%)
              * FormMod        // 状态修正 (±5%)
              * ContextMod     // 主客场/比分压力修正
              * (1 - DefenseScore) // 对手防守抵消
```

#### B. 属性组合 (Attribute Combinations)

动作不是由单一属性决定的，而是由四类属性组合而成（参考 `attributeCombinations.ts`）：

1.  **Technical (技术)**: 执行动作的基础能力。
2.  **Mental (心理)**: 决定动作的选择、时机和抗压能力。
3.  **Physical (身体)**: 决定动作的速度、力量和对抗。
4.  **Primary (主属性)**: 该动作最核心的属性。

**关键公式示例**:

*   **短传 (Pass Short)**:
    *   `Passing` (0.4) + `Technique` (0.2) + `Vision` (0.2) + `Decisions` (0.2)
*   **射门 (Shoot)**:
    *   `Finishing` (0.15) + `Composure` (0.10) + `Decisions` (0.05) + `Technique` (0.05)
    *   *注*: 射门基础分较低，因为即使顶级球员进球率也不高。
*   **盘带 (Dribble)**:
    *   `Dribbling` (0.4) + `Technique` (0.2) + `Flair` (0.1) + `Acceleration` (0.1) + `Pace` (0.05)
*   **拦截 (Intercept)**:
    *   `Anticipation` (0.3) + `Positioning` (0.3) + `Decisions` (0.2) + `Tackling` (0.2)

#### C. xG (预期进球) 计算
基于几何位置计算基础 xG，并根据防守压力调整：
*   **距离因素**: 距离球门越远，xG 指数级下降。
*   **角度因素**: 偏离中心轴角度越大，xG 越低。
*   **防守修正**: 最近防守球员距离越近，xG 越低。

---

### 3.2 游戏循环 (The Game Loop)

游戏以“周”为单位进行管理循环：

**1. 训练与准备 (Mon-Fri)**
*   **训练系统**: 影响 CA 增长速度和战术熟练度 (Tactical Familiarity)。
*   **球探系统**: 产生对手报告 (Opposition Report)。用户据此调整 `Opposition Instructions` (针对性指令)。

**2. 比赛日 (Match Day)**
*   **赛前**: 选人 (Lineup) -> 战术板调整 -> 针对性指令 -> 更衣室训话 (Team Talk)。
*   **赛中**: 实时观看 -> 临场指挥 (Shouts, Subs, Tactic Changes)。
*   **赛后**: 赛后训话 -> 媒体访问。

**3. 分析与恢复 (Post-Match)**
*   **Data Hub**: 查看 xG 图表、传球网络、热图。
*   **恢复**: 根据比赛负荷调整下周训练强度。

---

## 4. 未来规划与路线图 (Roadmap)

我们目前处于 Phase 1 完成阶段，正在进入 Phase 2。

### ✅ Phase 1: 基础建设 (已完成)
*   [x] 核心比赛引擎 (Simulation Tick, Event Generation)。
*   [x] 基础属性组合算法 (`attributeCombinations.ts`)。
*   [x] 概率计算引擎 (`probabilityEngine.ts`)。
*   [x] 基本 UI (比赛实时流、统计面板)。
*   [x] 犯规与卡牌系统基础。

### 🚀 Phase 2: 环境与真实感 (已完成)
*目标：让死板的公式变成鲜活的比赛。*
*   [x] **团队 CA 光环**: 基于队伍平均属性的全队加成/压制，限制在 0.85-1.15。
*   [x] **情境修正 (Context Modifiers)**:
    *   主客场：主队约 +8%，客队 ~0.97；终盘时间段按比分压力微调。
    *   比赛时间：最后 15 分钟落后方加成、领先方保守。
    *   德比占位：通过战术修饰符 `derby` 触发。
*   [x] **运气层 (Luck Factor)**: 0.92-1.08 随机浮动，局级运气偏差。
*   [x] **节奏与事件量控制**: Tick 4-7 秒/事件，抑制极端比分与事件洪流。
*   [x] **定位球/任意球事件与统计**: FOUL 触发 FREE_KICK，统计 corners/freeKicks。
*   [x] **UI 深化（比赛统计）**: `MatchView`/`UnifiedMatchTest` 实时展示控球、xG、射门(射正)、传球(成功率)、犯规(黄/红)、抢断、任意球/角球，事件过滤 SET PIECE/INJURY，Key Players/进球者列表。
*   [x] **状态管线接入**: 体能衰减随压迫/节奏放大，Morale/Form 曲线强化，隐藏属性 Consistency/Important Matches 入概率计算。
*   [x] **临场战术面板**: 比赛内调节心态/节奏/直接性/宽度/压迫/防线/拖时间/反抢反击/传中射门倾向/防守强度，立即作用于事件权重与成功率。
*   [~] **运气细化**: 门框/折射/滑倒将于 Phase 3 扩展。
*   [~] **高级 UI**: Data Hub (PPDA/xG 走势图) 归入 Phase 3。

### 🔮 Phase 3: 高级战术系统 (待定)
*   [ ] **战术克制逻辑**: 比如 4-3-3 宽度克制 4-4-2 窄中场。
*   [ ] **角色互补**: 比如 `DLP` (拖后组织核心) 自动给 `AF` (突前前锋) 增加传球权重。
*   [ ] **动态 AI**: 对手教练根据比分变化自动调整心态 (Mentality)。

---

## 5. 数值目标 (Tuning Targets)

为了确保模拟的真实性，我们设定了以下基准目标（基于真实英超数据）：

1.  **进球分布**: 场均 2.6 - 2.8 球。
    *   0球: ~7%
    *   3球以上: ~40%
2.  **传球成功率**:
    *   顶级中场: 85% - 92%
    *   一般球员: 75% - 82%
    *   高压迫下: -15%
3.  **射正率 (Shots on Target)**: 30% - 40% (不要过高，射门很难)。
4.  **犯规**: 场均 20-24 次 (双方合计)。
5.  **控球率**: 极端情况下可达 75%-25%，通常在 40%-60% 波动。

---

本文档作为项目的“圣经”，所有开发与数值调整均应以此为准。
