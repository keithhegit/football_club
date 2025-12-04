-- Fix PA calculation - use proper CA/PA ranges (1-200)
-- Delete old incorrect data and recalculate

DELETE FROM player_ability;

INSERT INTO player_ability (player_id, current_ability, potential_ability)
SELECT 
  p.id as player_id,
  
  -- Calculate CA (1-200 scale)
  -- Average of 10 key attributes * 10 = CA baseline
  CAST(
    (
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
    ) * 10.0 / 10.0  -- Average * 10 = CA in 1-200 range
  AS INTEGER) as current_ability,
  
  -- Calculate PA based on age
  CAST(
    CASE
      -- Young players (16-20): PA = CA * 1.25 (25% growth potential)
      WHEN p.age <= 20 THEN 
        (
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
        ) * 12.5 / 10.0
      
      -- Development (21-23): PA = CA * 1.15 (15% growth)
      WHEN p.age BETWEEN 21 AND 23 THEN 
        (
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
        ) * 11.5 / 10.0
      
      -- Prime (24-26): PA = CA * 1.08 (8% growth)
      WHEN p.age BETWEEN 24 AND 26 THEN 
        (
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
        ) * 10.8 / 10.0
      
      -- Peak/Declining (27+): PA = CA (no growth)
      ELSE 
        (
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
        ) * 10.0 / 10.0
    END
  AS INTEGER) as potential_ability
  
FROM players p
WHERE p.age IS NOT NULL AND p.age > 0;
