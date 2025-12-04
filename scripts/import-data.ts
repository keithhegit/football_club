import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../AIStudio/spanish_english.csv');

interface PlayerRow {
  UID: string;
  Name: string;
  Club: string;
  Division: string; // League
  Nat: string; // Nationality
  Position: string;
  Age: string;
  DoB: string;
  Height: string;
  Weight: string;
  'Preferred Foot': string;
  'Right Foot': string;
  'Left Foot': string;
  'Transfer Value': string;
  Wage: string;
  // Technical
  Cor: string; // Corners
  Cro: string; // Crossing
  Dri: string; // Dribbling
  Fin: string; // Finishing
  Fir: string; // First Touch
  Fre: string; // Free Kicks
  Hea: string; // Heading
  Lon: string; // Long Shots
  'L Th': string; // Long Throws
  Mar: string; // Marking
  Pas: string; // Passing
  Pen: string; // Penalty Taking
  Tck: string; // Tackling
  Tec: string; // Technique
  // Mental
  Agg: string; // Aggression
  Ant: string; // Anticipation
  Bra: string; // Bravery
  Cmp: string; // Composure
  Cnt: string; // Concentration
  Dec: string; // Decisions
  Det: string; // Determination
  Fla: string; // Flair
  Ldr: string; // Leadership
  OtB: string; // Off the Ball
  Pos: string; // Positioning
  Tea: string; // Teamwork
  Vis: string; // Vision
  Wor: string; // Work Rate
  // Physical
  Acc: string; // Acceleration
  Agi: string; // Agility
  Bal: string; // Balance
  Jum: string; // Jumping Reach
  'Nat .1': string; // Natural Fitness
  Pac: string; // Pace
  Sta: string; // Stamina
  Str: string; // Strength
  // Goalkeeper
  Aer: string; // Aerial Reach
  Cmd: string; // Command of Area
  Com: string; // Communication
  Ecc: string; // Eccentricity
  Han: string; // Handling
  Kic: string; // Kicking
  '1v1': string; // One on Ones
  Ref: string; // Reflexes
  TRO: string; // Rushing Out (Tendency to Rush Out)
  Pun: string; // Tendency to Punch
  Thr: string; // Throwing
}

function escapeSql(str: string): string {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function parseHeight(str: string): number {
  return parseInt(str.replace(/\D/g, '')) || 0;
}

function parseWeight(str: string): number {
  return parseInt(str.replace(/\D/g, '')) || 0;
}

function parseStat(str: string): number {
  return parseInt(str) || 0;
}

console.log('Reading CSV from:', CSV_PATH);
if (!fs.existsSync(CSV_PATH)) {
  console.error('CSV file not found!');
  process.exit(1);
}
const csvFile = fs.readFileSync(CSV_PATH, 'utf8');
console.log('File read, length:', csvFile.length);

Papa.parse(csvFile, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.trim(),
  complete: (results) => {
    const rows = results.data.map((row: any) => {
      const newRow: any = {};
      for (const key in row) {
        newRow[key] = row[key].trim();
      }
      return newRow as PlayerRow;
    });
    console.log(`Parsed ${rows.length} rows.`);
    if (results.errors.length > 0) {
      console.error('Parse errors:', results.errors);
    }

    const leagues = new Set<string>();
    const clubs = new Map<string, string>(); // Club -> League

    // 1. Extract Entities
    rows.forEach(row => {
      if (row.Division) leagues.add(row.Division);
      if (row.Club && row.Division) clubs.set(row.Club, row.Division);
    });

    // 2. Generate SQL (single file for smaller dataset)
    let sql = '';

    // Insert Leagues
    sql += '-- Leagues\n';
    const leagueMap = new Map<string, number>();
    let leagueId = 1;
    leagues.forEach(league => {
      sql += `INSERT INTO leagues (id, name) VALUES (${leagueId}, ${escapeSql(league)});\n`;
      leagueMap.set(league, leagueId++);
    });

    // Insert Clubs
    sql += '\n-- Clubs\n';
    const clubMap = new Map<string, number>();
    let clubId = 1;
    clubs.forEach((leagueName, clubName) => {
      const lId = leagueMap.get(leagueName);
      sql += `INSERT INTO clubs (id, name, league_id) VALUES (${clubId}, ${escapeSql(clubName)}, ${lId});\n`;
      clubMap.set(clubName, clubId++);
    });

    // Insert Players
    sql += '\n-- Players\n';
    const insertedUIDs = new Set<number>();

    rows.forEach(row => {
      const uid = parseInt(row.UID);
      if (insertedUIDs.has(uid)) {
        console.log(`Skipping duplicate UID: ${uid}`);
        return;
      }
      insertedUIDs.add(uid);

      const cId = clubMap.get(row.Club) || 'NULL';

      sql += `INSERT INTO players (
        id, name, club_id, nationality, position, age, dob, height, weight, 
        preferred_foot, right_foot, left_foot, transfer_value, wage,
        corners, crossing, dribbling, finishing, first_touch, free_kicks, heading, long_shots, long_throws, marking, passing, penalty_taking, tackling, technique,
        aggression, anticipation, bravery, composure, concentration, decisions, determination, flair, leadership, off_the_ball, positioning, teamwork, vision, work_rate,
        acceleration, agility, balance, jumping_reach, natural_fitness, pace, stamina, strength,
        aerial_reach, command_of_area, communication, eccentricity, handling, kicking, one_on_ones, reflexes, rushing_out, tendency_to_punch, throwing
      ) VALUES (
        ${uid}, ${escapeSql(row.Name)}, ${cId}, ${escapeSql(row.Nat)}, ${escapeSql(row.Position)}, ${parseStat(row.Age)}, ${escapeSql(row.DoB)}, ${parseHeight(row.Height)}, ${parseWeight(row.Weight)},
        ${escapeSql(row['Preferred Foot'])}, ${parseStat(row['Right Foot'])}, ${parseStat(row['Left Foot'])}, ${escapeSql(row['Transfer Value'])}, ${escapeSql(row.Wage)},
        ${parseStat(row.Cor)}, ${parseStat(row.Cro)}, ${parseStat(row.Dri)}, ${parseStat(row.Fin)}, ${parseStat(row.Fir)}, ${parseStat(row.Fre)}, ${parseStat(row.Hea)}, ${parseStat(row.Lon)}, ${parseStat(row['L Th'])}, ${parseStat(row.Mar)}, ${parseStat(row.Pas)}, ${parseStat(row.Pen)}, ${parseStat(row.Tck)}, ${parseStat(row.Tec)},
        ${parseStat(row.Agg)}, ${parseStat(row.Ant)}, ${parseStat(row.Bra)}, ${parseStat(row.Cmp)}, ${parseStat(row.Cnt)}, ${parseStat(row.Dec)}, ${parseStat(row.Det)}, ${parseStat(row.Fla)}, ${parseStat(row.Ldr)}, ${parseStat(row.OtB)}, ${parseStat(row.Pos)}, ${parseStat(row.Tea)}, ${parseStat(row.Vis)}, ${parseStat(row.Wor)},
        ${parseStat(row.Acc)}, ${parseStat(row.Agi)}, ${parseStat(row.Bal)}, ${parseStat(row.Jum)}, ${parseStat(row['Nat .1'])}, ${parseStat(row.Pac)}, ${parseStat(row.Sta)}, ${parseStat(row.Str)},
        ${parseStat(row.Aer)}, ${parseStat(row.Cmd)}, ${parseStat(row.Com)}, ${parseStat(row.Ecc)}, ${parseStat(row.Han)}, ${parseStat(row.Kic)}, ${parseStat(row['1v1'])}, ${parseStat(row.Ref)}, ${parseStat(row.TRO)}, ${parseStat(row.Pun)}, ${parseStat(row.Thr)}
      );\n`;
    });

    // Write SQL file
    const outputPath = path.join(__dirname, '../seed_epl_laliga.sql');
    fs.writeFileSync(outputPath, sql);
    console.log(`Generated ${outputPath}`);
    console.log(`Total players: ${insertedUIDs.size}`);
    console.log(`Total clubs: ${clubMap.size}`);
    console.log(`Total leagues: ${leagueMap.size}`);
  },
  error: (error) => {
    console.error('Parse error:', error);
  }
});
