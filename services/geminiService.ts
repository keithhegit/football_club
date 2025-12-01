import { GoogleGenAI } from "@google/genai";
import { Team, Player } from "../types";

// Initialize Gemini
// Note: In a real environment, this key comes from process.env.API_KEY automatically
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAssistantReport = async (opponent: Team, myTeam: Team): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Assistant Manager Unavailable: No API Key detected.";
  }

  const prompt = `
    You are the Assistant Manager of a football team.
    
    My Team: ${myTeam.name}
    Key Player: ${[...myTeam.players].sort((a, b) => b.ca - a.ca)[0].name} (${myTeam.players[0].position})
    
    Opponent: ${opponent.name}
    Opponent Top Rated Player: ${[...opponent.players].sort((a, b) => b.ca - a.ca)[0].name}
    Opponent Formation: ${opponent.tactics.formation}

    Provide a concise, 3-bullet point tactical report on how to beat them. 
    Focus on their formation and key player. Keep it under 50 words total.
    Style: Professional, concise, data-driven.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No report generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Assistant Manager is currently analyzing other data. Report unavailable.";
  }
};

export const generatePostMatchComment = async (homeTeam: Team, awayTeam: Team, scoreHome: number, scoreAway: number): Promise<string> => {
  if (!process.env.API_KEY) return "Match concluded.";
  
  const prompt = `
    Write a 1-sentence headline for a newspaper about this match result:
    ${homeTeam.name} ${scoreHome} - ${scoreAway} ${awayTeam.name}.
    Make it dramatic.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Match ended.";
  } catch (error) {
    return "Match ended.";
  }
};