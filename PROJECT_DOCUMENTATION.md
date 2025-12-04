# FM2023 Project Comprehensive Documentation
> **Version**: 2.0 (Integrated Architecture)
> **Date**: 2025-12-04
> **Status**: Active Development

## 1. Project Overview
This project aims to build a high-fidelity football management simulation game inspired by Football Manager 2023. The core philosophy is **"Data-Driven Realism"**, where every on-pitch event and off-pitch development is driven by a complex interplay of player attributes, hidden mechanics, and stochastic simulation.

### Core Pillars
1.  **Deep Data Simulation**: 36+ attributes per player, hidden personality stats, and realistic growth curves.
2.  **Dynamic World**: Every save file is a unique universe. Young players develop differently in each playthrough based on randomized potential.
3.  **Real-Time Match Engine**: A simulation engine that calculates event probabilities based on attribute combinations, tactical instructions, and environmental factors.

---

## 2. System Architecture (Hybrid Model)

We utilize a **Hybrid Architecture** to balance performance, data integrity, and gameplay realism (specifically the "Wonderkid" mechanic).

### 2.1 Data Layer (Cloudflare D1 - Immutable Source)
The remote database serves as the "Game Disc" - it contains the static, canonical data that does not change between saves.
*   **`players` Table**: Contains raw attributes (Pace, Finishing, etc.) imported from the original dataset.
*   **`player_potential_codes` Table**: Stores the *potential range* for players, not fixed values.
    *   *Example*: A 16-year-old Man City prospect might have code `-10` (PA Range 170-200).
    *   *Why*: This allows different saves to have different outcomes for the same player.

### 2.2 Client Layer (Local State - Dynamic Simulation)
The user's browser handles the dynamic evolution of the game world.
*   **Save File**: A JSON object stored locally (and synced to cloud) containing the unique state of that specific playthrough.
*   **PA Randomization**: Upon creating a new save, the client reads the `potential_code` from D1 and rolls a random PA value within the defined range.
*   **Growth Engine**: Calculates CA (Current Ability) changes season-by-season based on age, training, and match experience.

---

## 3. Core Algorithms & Mechanics

### 3.1 CA (Current Ability) Calculation
CA is not a simple average. It is a **Position-Weighted Sum** representing a player's overall effectiveness.

**Formula Logic**:
`CA = Σ (Attribute_Value × Position_Weight) - Two_Footed_Tax`

**Key Weights (Examples)**:
*   **Striker (ST)**: Finishing (4.0), Pace (3.5), Acceleration (3.5). *Defensive stats are near-zero cost.*
*   **Center Back (DC)**: Tackling (4.0), Marking (4.0), Positioning (3.5). *Shooting is near-zero cost.*
*   **Winger (AML/R)**: Pace (4.0), Dribbling (3.5), Crossing (3.0).

**The "Two-Footed Tax"**:
Players who are "Either-footed" pay a heavy CA penalty (e.g., -15 CA). This explains why a player like Son Heung-min might have slightly lower raw physicals than a one-footed specialist of the same CA - his "budget" is spent on versatility.

### 3.2 PA (Potential Ability) & The "Wonderkid" System
PA is the hard ceiling for a player's CA. It is determined at the start of a save.

**Negative Potential Codes (The "Lottery")**:
Instead of fixed PA, young players are assigned codes based on Age, Club Tier, and Starting CA.

| Code | PA Range | Description | Criteria Example |
|------|----------|-------------|------------------|
| **-10** | 170-200 | Generational Talent | 16yo @ Elite Club (e.g., Man City) w/ High CA |
| **-9** | 150-180 | World Class Prospect | 17yo @ Elite Club w/ Good CA |
| **-8** | 130-160 | Top Division Regular | Average Academy Graduate |

**Randomization Process**:
1.  **New Game**: Client fetches player data + codes.
2.  **Roll**: For a `-10` player, system rolls `RANDOM(170, 200)`.
3.  **Lock**: This value (e.g., 184) is locked into the `SaveData` and never changes for this save.

### 3.3 Dynamic Growth System
Players evolve over time. This is calculated at **Season End**.

**Growth Factors**:
1.  **Age Curve**:
    *   16-21: Rapid Growth (+5 to +12 CA/yr)
    *   22-26: Steady Growth (+2 to +5 CA/yr)
    *   27-29: Peak (Plateau)
    *   30+: Decline (-2 to -5 CA/yr)
2.  **PA Gap**: Growth slows down as CA approaches PA.
3.  **Performance**: Match experience and high ratings boost growth.
4.  **Facilities**: Better training facilities = higher growth cap.

---

## 4. User Interaction Flow

### 4.1 Game Initialization
1.  **Login**: User authenticates.
2.  **Main Menu**: "New Game" or "Load Game".
3.  **Club Selection**: User picks a team (e.g., Arsenal).
4.  **Universe Generation**:
    *   System fetches static data from D1.
    *   **CRITICAL**: System iterates through all players. If a player has a `potential_code`, a concrete PA is rolled.
    *   Save file is created with this unique dataset.

### 4.2 The Core Loop (Weekly)
1.  **Inbox/News**: Injury reports, transfer offers.
2.  **Tactics/Training**: Adjusting formation (4-3-3, etc.) and training focus.
3.  **Match Day**:
    *   **Pre-Match**: Team selection, opposition instructions.
    *   **Match Simulation**: The Match Engine runs (60FPS logic), generating events based on attributes.
    *   **Post-Match**: Analysis, xG reports, morale updates.

### 4.3 Scouting & Transfers
1.  **Search**: User searches for players.
2.  **Fog of War**: Attributes are masked (ranges) for unknown players.
3.  **Scouting**: Sending a scout reveals attributes and *estimated* PA (e.g., "Could be a star").
4.  **Transfer**: Negotiation involves Transfer Fee + Wage Budget.

---

## 5. Technical Implementation Status

### 5.1 Database (D1)
*   [x] `players` table populated (CSV import).
*   [x] `player_potential_codes` table schema defined.
*   [x] `elite_clubs` logic defined for youth bonuses.
*   [x] Full population of `potential_codes` using the new SQL script.

### 5.2 Backend (Workers)
*   [x] Basic CRUD for players.
*   [x] Auth system (JWT).
*   [x] API endpoint to return potential codes alongside player data.

### 5.3 Frontend (React/Vite)
*   [x] `capaCalculator.ts`: Implements the position-weighted CA formula.
*   [x] `playerGrowth.ts`: Implements the season-end growth logic.
*   [x] `useSeasonEnd` hook: Bridges the logic to the UI.
*   [x] "New Game" wizard that handles the client-side PA randomization.

---

## 6. Development Roadmap

### Phase 1: Foundation ✅ COMPLETE
**Status**: Merged to `main` branch (2025-12-04)

**Completed Features:**
- ✅ CA/PA Calculation System with position-weighted formulas
- ✅ Negative Potential Codes (-10, -9, -85, etc.) for wonderkid randomization
- ✅ Client-side PA randomization per save file
- ✅ Mandatory login + auto-save on new game creation
- ✅ Transfer system with budget management
- ✅ Squad view with CA sorting and PA emoji displays
- ✅ Scout view with comprehensive player information
- ✅ D1 database with `player_potential_codes` table
- ✅ API integration for potential codes

**Technical Achievements:**
- Hybrid data architecture (D1 for static data, client for dynamic PA)
- Position-weighted CA calculation (max 200)
- Comprehensive attribute weighting system
- Elite club tier classification
- Save/load persistence with randomized data

---

### Phase 2: The Match Engine 🔄 IN PLANNING
**Branch**: `new_match`

**Goals:**
- Implement probability-based event engine
- Connect tactical instructions to match simulation
- Create attribute combination system for actions
- Build real-time match visualization

**Planned Components:**
1. **Event Engine Core**
   - Pass/Shoot/Tackle/Dribble probability calculations
   - Attribute combination formulas (e.g., Passing = Passing × Vision × Technique)
   - Random number generation with weighted probabilities

2. **Tactical Integration**
   - Team Instructions → Probability modifiers
   - Player Roles/Duties → Position responsibilities
   - Formation → Spatial positioning

3. **Match Simulation Loop**
   - 60 FPS event generation
   - State machine (Attack/Defend/Transition)
   - Event commentary and logging

4. **UI Components**
   - Match view with real-time updates
   - Statistics tracking (possession, shots, xG)
   - Post-match analysis

---

### Phase 3: The Living World 📋 FUTURE
*   Transfer Market AI (CPU clubs buying/selling).
*   Regen System (New youth players generated as old ones retire).
*   Advanced scouting with fog of war.

---
*Document updated: 2025-12-04. Reflects completion of Phase 1 and planning for Phase 2.*
