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
    UI[前端 UI 层 (React/TS)] <--> Logic[核心逻辑层];
    Logic <--> DB[数据库层 (SQLite/JSON)];
    Logic <--> Engine[比赛引擎 (Match Engine)];
    
    subgraph Data Flow
    DB -- 加载存档 --> Logic
    Logic -- 日程推进/训练 --> Logic
    Logic -- 比赛输入 (State) --> Engine
    Engine -- 实时事件流 (60FPS) --> UI
    Engine -- 赛后统计 --> Logic
    end
```

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

### 🚀 Phase 2: 环境与真实感 (进行中)
*目标：让死板的公式变成鲜活的比赛。*
*   [ ] **团队 CA 修正 (Global CA Scaler)**: 
    *   强队打弱队时，不仅靠单个球员属性压制，还需要一个全队光环加成 (e.g., CA差 30点 -> 全队成功率 +15%)。
*   [ ] **情境修正 (Context Modifiers)**:
    *   **主客场**: 主场 +8% 全属性，客场 -5% 心理属性。
    *   **比赛时间**: 补时阶段落后方 -> 急躁度↑ (Aggression/WorkRate↑, Composure/Decisions↓)。
    *   **德比战**: 双方 Aggression +15%。
*   [ ] **运气系统 (Luck Factor)**:
    *   增加非受迫性失误 (Unforced Errors)。
    *   门框、折射、滑倒。
*   [ ] **UI 深化**: 
    *   Data Hub 引入 PPDA (平均防守动作传球数) 和 xG 走势图。

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
