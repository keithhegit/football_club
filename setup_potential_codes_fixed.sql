-- Setup Player Potential Codes Table for Client-Side Randomization
-- Simplified version without complex subqueries

DROP TABLE IF EXISTS player_potential_codes;

CREATE TABLE player_potential_codes (
  player_id INTEGER PRIMARY KEY,
  potential_code TEXT,
  min_pa INTEGER NOT NULL,
  max_pa INTEGER NOT NULL,
  club_tier TEXT,
  calculated_ca INTEGER NOT NULL,
  speed_bonus INTEGER DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Populate using CTE for better readability
WITH player_data AS (
  SELECT 
    p.id,
    p.age,
    p.position,
    
    -- Club Tier
    CASE
      WHEN c.name IN (
        'Real Madrid', 'Barcelona', 'Bayern Munich', 'Liverpool', 
        'Man City', 'Manchester City', 'Manchester United', 'Chelsea', 
        'Arsenal', 'Juventus', 'AC Milan', 'Inter Milan', 'Ajax',
        'Porto', 'Benfica', 'Paris Saint-Germain', 'Atlético Madrid',
        'Borussia Dortmund', 'Tottenham Hotspur', 'RB Leipzig',
        'Sevilla', 'AS Roma', 'Napoli', 'Valencia'
      ) THEN 'elite'
      WHEN c.name IN (
        'Leicester City', 'West Ham United', 'Everton', 'Newcastle United',
        'Real Sociedad', 'Real Betis', 'Lazio', 'Fiorentina', 'Atalanta',
        'Eintracht Frankfurt', 'Wolfsburg', 'Lyon', 'Monaco', 
        'Sporting CP', 'Braga'
      ) THEN 'top'
      ELSE 'normal'
    END as club_tier,
    
    -- Speed Bonus
    CASE 
      WHEN (COALESCE(p.pace, 0) + COALESCE(p.acceleration, 0)) > 28 THEN 10
      ELSE 0
    END as speed_bonus,
    
    -- Simplified CA Calculation
    CAST(
      CASE 
        WHEN p.position LIKE '%ST%' OR p.position LIKE '%CF%' THEN
          (COALESCE(p.pace, 0) * 3.5) + (COALESCE(p.acceleration, 0) * 3.5) + 
          (COALESCE(p.finishing, 0) * 4.0) + (COALESCE(p.strength, 0) * 2.5)
        WHEN p.position LIKE '%M (C)%' OR p.position LIKE '%MC%' THEN
          (COALESCE(p.passing, 0) * 4.0) + (COALESCE(p.vision, 0) * 4.0) + 
          (COALESCE(p.technique, 0) * 3.0) + (COALESCE(p.decisions, 0) * 3.5)
        WHEN p.position LIKE '%D (C)%' OR p.position LIKE '%DC%' THEN
          (COALESCE(p.marking, 0) * 4.0) + (COALESCE(p.tackling, 0) * 4.0) + 
          (COALESCE(p.positioning, 0) * 3.5) + (COALESCE(p.jumping_reach, 0) * 3.5)
        WHEN p.position LIKE '%M (R)%' OR p.position LIKE '%M (L)%' OR 
             p.position LIKE '%AM (R)%' OR p.position LIKE '%AM (L)%' THEN
          (COALESCE(p.pace, 0) * 4.0) + (COALESCE(p.acceleration, 0) * 4.0) + 
          (COALESCE(p.dribbling, 0) * 3.5) + (COALESCE(p.crossing, 0) * 3.0)
        WHEN p.position LIKE '%GK%' THEN
          (COALESCE(p.reflexes, 0) * 4.5) + (COALESCE(p.handling, 0) * 4.0) + 
          (COALESCE(p.one_on_ones, 0) * 3.5)
        ELSE
          (COALESCE(p.pace, 0) + COALESCE(p.acceleration, 0)) * 2.0 + 
          (COALESCE(p.stamina, 0) + COALESCE(p.strength, 0)) * 1.5
      END
    AS INTEGER) as calculated_ca
    
  FROM players p
  LEFT JOIN clubs c ON p.club_id = c.id
  WHERE p.age IS NOT NULL AND p.age > 0
)
INSERT INTO player_potential_codes (
  player_id,
  potential_code,
  min_pa,
  max_pa,
  club_tier,
  calculated_ca,
  speed_bonus
)
SELECT 
  id,
  
  -- Determine Potential Code
  CASE
    WHEN age <= 18 AND club_tier = 'elite' AND calculated_ca >= 100 THEN '-10'
    WHEN age <= 18 AND club_tier = 'elite' AND calculated_ca >= 80 THEN '-9'
    WHEN age <= 18 AND club_tier = 'top' AND calculated_ca >= 90 THEN '-85'
    WHEN age <= 18 THEN '-8'
    WHEN age BETWEEN 19 AND 21 AND calculated_ca >= 130 THEN '-85'
    WHEN age BETWEEN 19 AND 21 THEN '-75'
    WHEN age BETWEEN 22 AND 24 THEN '-7'
    ELSE NULL
  END as potential_code,
  
  -- Min PA
  CASE
    WHEN (age <= 18 AND club_tier = 'elite' AND calculated_ca >= 100) THEN 170
    WHEN (age <= 18 AND club_tier = 'elite' AND calculated_ca >= 80) THEN 150
    WHEN (age <= 18 AND club_tier = 'top' AND calculated_ca >= 90) THEN 140
    WHEN (age <= 18) THEN calculated_ca + 30
    WHEN (age BETWEEN 19 AND 21 AND calculated_ca >= 130) THEN 140
    WHEN (age BETWEEN 19 AND 21) THEN 120
    WHEN (age BETWEEN 22 AND 24) THEN 110
    ELSE calculated_ca
  END as min_pa,
  
  -- Max PA
  CASE
    WHEN (age <= 18 AND club_tier = 'elite' AND calculated_ca >= 100) THEN 200
    WHEN (age <= 18 AND club_tier = 'elite' AND calculated_ca >= 80) THEN 180
    WHEN (age <= 18 AND club_tier = 'top' AND calculated_ca >= 90) THEN 170
    WHEN (age <= 18) THEN calculated_ca + 70
    WHEN (age BETWEEN 19 AND 21 AND calculated_ca >= 130) THEN 170
    WHEN (age BETWEEN 19 AND 21) THEN 150
    WHEN (age BETWEEN 22 AND 24) THEN 140
    ELSE calculated_ca + 5
  END as max_pa,
  
  club_tier,
  calculated_ca,
  speed_bonus
  
FROM player_data;
