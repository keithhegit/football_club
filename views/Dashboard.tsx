import React from 'react';
import { Team, Fixture } from '../types';
import { Calendar, ChevronRight, TrendingUp } from 'lucide-react';

interface DashboardProps {
  team: Team;
  nextFixture: Fixture | undefined;
  opponent: Team | undefined;
  leaguePosition: number;
  onContinue: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ team, nextFixture, opponent, leaguePosition, onContinue }) => {
  return (
    <div className="p-4 space-y-6">
      
      {/* Next Match Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Calendar size={100} />
        </div>
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Next Fixture</h2>
        
        <div className="flex justify-between items-center mb-6 z-10 relative">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold mb-2 mx-auto border-2 border-slate-600">
              {team.shortName}
            </div>
            <span className="text-sm font-bold block">{team.name}</span>
          </div>
          <div className="text-2xl font-black text-slate-600">VS</div>
          <div className="text-center">
             <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold mb-2 mx-auto border-2 border-slate-600">
              {opponent ? opponent.shortName : '???'}
            </div>
            <span className="text-sm font-bold block">{opponent ? opponent.name : 'TBD'}</span>
          </div>
        </div>

        <button 
          onClick={onContinue}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg shadow-emerald-900/20"
        >
          <span>Play Match</span>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <TrendingUp size={16} />
                <span className="text-xs font-bold uppercase">League Pos</span>
            </div>
            <div className="text-3xl font-bold text-white">{leaguePosition}<sup className="text-sm text-slate-500 font-normal">th</sup></div>
        </div>
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 mb-2">
                <TrendingUp size={16} />
                <span className="text-xs font-bold uppercase">Form</span>
            </div>
            <div className="flex space-x-1">
                <div className="w-3 h-8 bg-emerald-500 rounded-sm"></div>
                <div className="w-3 h-8 bg-emerald-500 rounded-sm"></div>
                <div className="w-3 h-8 bg-gray-500 rounded-sm"></div>
                <div className="w-3 h-8 bg-rose-500 rounded-sm"></div>
                <div className="w-3 h-8 bg-emerald-500 rounded-sm"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
