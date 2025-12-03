DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS clubs;
DROP TABLE IF EXISTS leagues;

CREATE TABLE leagues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  country TEXT
);

CREATE TABLE clubs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  league_id INTEGER,
  reputation INTEGER DEFAULT 0,
  FOREIGN KEY (league_id) REFERENCES leagues(id)
);

CREATE TABLE players (
  id INTEGER PRIMARY KEY, -- Maps to CSV UID
  name TEXT NOT NULL,
  club_id INTEGER,
  nationality TEXT,
  position TEXT,
  age INTEGER,
  dob TEXT,
  height INTEGER, -- cm
  weight INTEGER, -- kg
  preferred_foot TEXT,
  right_foot INTEGER DEFAULT 0,
  left_foot INTEGER DEFAULT 0,
  transfer_value TEXT,
  wage TEXT,
  
  -- Technical Attributes (1-20 scale)
  corners INTEGER DEFAULT 0,
  crossing INTEGER DEFAULT 0,
  dribbling INTEGER DEFAULT 0,
  finishing INTEGER DEFAULT 0,
  first_touch INTEGER DEFAULT 0,
  free_kicks INTEGER DEFAULT 0,
  heading INTEGER DEFAULT 0,
  long_shots INTEGER DEFAULT 0,
  long_throws INTEGER DEFAULT 0,
  marking INTEGER DEFAULT 0,
  passing INTEGER DEFAULT 0,
  penalty_taking INTEGER DEFAULT 0,
  tackling INTEGER DEFAULT 0,
  technique INTEGER DEFAULT 0,
  
  -- Mental Attributes (1-20 scale)
  aggression INTEGER DEFAULT 0,
  anticipation INTEGER DEFAULT 0,
  bravery INTEGER DEFAULT 0,
  composure INTEGER DEFAULT 0,
  concentration INTEGER DEFAULT 0,
  decisions INTEGER DEFAULT 0,
  determination INTEGER DEFAULT 0,
  flair INTEGER DEFAULT 0,
  leadership INTEGER DEFAULT 0,
  off_the_ball INTEGER DEFAULT 0,
  positioning INTEGER DEFAULT 0,
  teamwork INTEGER DEFAULT 0,
  vision INTEGER DEFAULT 0,
  work_rate INTEGER DEFAULT 0,
  
  -- Physical Attributes (1-20 scale)
  acceleration INTEGER DEFAULT 0,
  agility INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 0,
  jumping_reach INTEGER DEFAULT 0,
  natural_fitness INTEGER DEFAULT 0,
  pace INTEGER DEFAULT 0,
  stamina INTEGER DEFAULT 0,
  strength INTEGER DEFAULT 0,
  
  -- Goalkeeper Attributes (1-20 scale)
  aerial_reach INTEGER DEFAULT 0,
  command_of_area INTEGER DEFAULT 0,
  communication INTEGER DEFAULT 0,
  eccentricity INTEGER DEFAULT 0,
  handling INTEGER DEFAULT 0,
  kicking INTEGER DEFAULT 0,
  one_on_ones INTEGER DEFAULT 0,
  reflexes INTEGER DEFAULT 0,
  rushing_out INTEGER DEFAULT 0,
  tendency_to_punch INTEGER DEFAULT 0,
  throwing INTEGER DEFAULT 0,
  
  -- Hidden Attributes (1-20 scale) - Not visible in game UI
  consistency INTEGER DEFAULT 10,
  important_matches INTEGER DEFAULT 10,
  injury_proneness INTEGER DEFAULT 10,
  versatility INTEGER DEFAULT 10,
  
  FOREIGN KEY (club_id) REFERENCES clubs(id)
);

-- CA/PA Ability Tracking Table
CREATE TABLE IF NOT EXISTS player_ability (
  player_id INTEGER PRIMARY KEY,
  current_ability INTEGER NOT NULL DEFAULT 100, -- CA: 1-200
  potential_ability INTEGER NOT NULL DEFAULT 120, -- PA: 1-200
  recommended_ca INTEGER DEFAULT 100, -- RCA (minimum CA to maintain current attributes)
  position_primary TEXT DEFAULT 'MC', -- GK/DC/DL/DR/WBL/WBR/DM/MC/ML/MR/AMC/AML/AMR/ST
  position_weights TEXT DEFAULT '{}', -- JSON: position-specific attribute weights
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_players_club ON players(club_id);
CREATE INDEX idx_clubs_league ON clubs(league_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_player_ability_ca ON player_ability(current_ability);
CREATE INDEX idx_player_ability_pa ON player_ability(potential_ability);
