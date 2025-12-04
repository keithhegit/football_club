-- Generate realistic PA values based on CA and age
-- Strategy: Young players have growth potential, older players at their peak
-- PA is FIXED and will never change

DELETE FROM player_ability;

INSERT INTO player_ability (player_id, current_ability, potential_ability)
SELECT 
  p.id as player_id,
  
  -- Calculate CA (1-200 scale) based on 10 key attributes
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
    ) * 10.0 / 10.0
  AS INTEGER) as current_ability,
  
  -- Calculate PA based on age and CA
  -- PA is the POTENTIAL ceiling, not current growth rate
  CAST(
    CASE
      -- Wonderkids (16-18): Very high potential
      -- Example: CA 80 → PA 130-160
      WHEN p.age <= 18 THEN 
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
        ) * 10.0 / 10.0 * 1.4  -- 40% growth potential
      
      -- Young stars (19-21): High potential
      -- Example: CA 100 → PA 125-140
      WHEN p.age BETWEEN 19 AND 21 THEN 
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
        ) * 10.0 / 10.0 * 1.25  -- 25% growth potential
      
      -- Developing (22-24): Moderate potential
      -- Example: CA 110 → PA 120-130
      WHEN p.age BETWEEN 22 AND 24 THEN 
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
        ) * 10.0 / 10.0 * 1.12  -- 12% growth potential
      
      -- Prime (25-27): Slight potential
      -- Example: CA 130 → PA 135-140
      WHEN p.age BETWEEN 25 AND 27 THEN 
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
        ) * 10.0 / 10.0 * 1.05  -- 5% growth potential
      
      -- Peak/Declining (28+): PA ≈ CA (already at potential)
      -- Example: CA 140 → PA 140-145
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
        ) * 10.0 / 10.0 * 1.02  -- 2% growth (rounding)
    END
  AS INTEGER) as potential_ability
  
FROM players p
WHERE p.age IS NOT NULL AND p.age > 0;
