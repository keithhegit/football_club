-- Generate PA data for player_ability table
-- Strategy: Estimate PA based on CA and age
-- Younger players: PA can be much higher than CA (growth potential)
-- Older players (27+): PA ≈ CA (peak/declining)

INSERT OR REPLACE INTO player_ability (player_id, current_ability, potential_ability)
SELECT 
  p.id as player_id,
  -- Calculate CA from attributes (same formula as client)
  CAST((
    COALESCE(p.pace, 0) + 
    COALESCE(p.acceleration, 0) + 
    COALESCE(p.stamina, 0) + 
    COALESCE(p.strength, 0) + 
    COALESCE(p.finishing, 0) + 
    COALESCE(p.passing, 0) + 
    COALESCE(p.tackling, 0) + 
    COALESCE(p.dribbling, 0) +
    COALESCE(p.vision, 0) +
    COALESCE(p.technique, 0)
  ) * 1.8 AS INTEGER) as current_ability,
  
  -- Calculate PA based on age and CA
  CAST(
    CASE
      -- Young players (16-20): High potential growth
      WHEN p.age <= 20 THEN (
        COALESCE(p.pace, 0) + 
        COALESCE(p.acceleration, 0) + 
        COALESCE(p.stamina, 0) + 
        COALESCE(p.strength, 0) + 
        COALESCE(p.finishing, 0) + 
        COALESCE(p.passing, 0) + 
        COALESCE(p.tackling, 0) + 
        COALESCE(p.dribbling, 0) +
        COALESCE(p.vision, 0) +
        COALESCE(p.technique, 0)
      ) * 2.2  -- 20% higher than CA
      
      -- Development phase (21-23): Moderate growth
      WHEN p.age BETWEEN 21 AND 23 THEN (
        COALESCE(p.pace, 0) + 
        COALESCE(p.acceleration, 0) + 
        COALESCE(p.stamina, 0) + 
        COALESCE(p.strength, 0) + 
        COALESCE(p.finishing, 0) + 
        COALESCE(p.passing, 0) + 
        COALESCE(p.tackling, 0) + 
        COALESCE(p.dribbling, 0) +
        COALESCE(p.vision, 0) +
        COALESCE(p.technique, 0)
      ) * 2.0  -- 10% higher than CA
      
      -- Prime (24-26): Slight growth
      WHEN p.age BETWEEN 24 AND 26 THEN (
        COALESCE(p.pace, 0) + 
        COALESCE(p.acceleration, 0) + 
        COALESCE(p.stamina, 0) + 
        COALESCE(p.strength, 0) + 
        COALESCE(p.finishing, 0) + 
        COALESCE(p.passing, 0) + 
        COALESCE(p.tackling, 0) + 
        COALESCE(p.dribbling, 0) +
        COALESCE(p.vision, 0) +
        COALESCE(p.technique, 0)
      ) * 1.9  -- 5% higher than CA
      
      -- Peak/Declining (27+): PA ≈ CA
      ELSE (
        COALESCE(p.pace, 0) + 
        COALESCE(p.acceleration, 0) + 
        COALESCE(p.stamina, 0) + 
        COALESCE(p.strength, 0) + 
        COALESCE(p.finishing, 0) + 
        COALESCE(p.passing, 0) + 
        COALESCE(p.tackling, 0) + 
        COALESCE(p.dribbling, 0) +
        COALESCE(p.vision, 0) +
        COALESCE(p.technique, 0)
      ) * 1.8  -- Same as CA
    END AS INTEGER
  ) as potential_ability
FROM players p
WHERE p.age IS NOT NULL
  AND p.age > 0;
