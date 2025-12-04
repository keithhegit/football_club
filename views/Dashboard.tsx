import React from 'react';
import { Team, Fixture } from '../types';
import { Calendar, ChevronRight, TrendingUp, Dumbbell, DollarSign } from 'lucide-react';
import { ClubLogo } from '../components/ClubLogo';
import { useTranslation } from 'react-i18next';

interface DashboardProps {
  team: Team;
  nextFixture: Fixture | undefined;
  opponent: Team | undefined;
  leaguePosition: number;
  onContinue: () => void;
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ team, nextFixture, opponent, leaguePosition, onContinue }) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 space-y-6">

      {/* Next Match Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Calendar size={100} />
        </div>
        <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">{t('dashboard.nextFixture')}</h2>

        <div className="flex justify-between items-center mb-6 z-10 relative">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-2 mx-auto border-2 border-slate-600 overflow-hidden">
              <ClubLogo clubId={team.id} clubName={team.name} size="xl" className="w-full h-full" />
            </div>
            <span className="text-sm font-bold block">{team.name}</span>
          </div>
          <div className="text-2xl font-black text-slate-600">VS</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-2 mx-auto border-2 border-slate-600 overflow-hidden">
              {opponent ? (
                <ClubLogo clubId={opponent.id} clubName={opponent.name} size="xl" className="w-full h-full" />
              ) : (
                <span className="text-xl font-bold">???</span>
              )}
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
            <span className="text-xs font-bold uppercase">{t('dashboard.leaguePos')}</span>
          </div>
          <div className="text-3xl font-bold text-white">{leaguePosition}<sup className="text-sm text-slate-500 font-normal">th</sup></div>
        </div>

        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <DollarSign size={16} />
            <span className="text-xs font-bold uppercase">{t('dashboard.budget')}</span>
          </div>
          <div className="text-lg font-bold text-emerald-400">£{((team.budget || 50000000) / 1000000).toFixed(1)}M</div>
        </div>

        <button
          onClick={() => onContinue && (onContinue as any)('TRAINING')} // Hacky cast for now, ideally DashboardProps should accept onNavigate
          className="bg-slate-900 p-4 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-left group"
        >
          <div className="flex items-center space-x-2 text-slate-400 mb-2 group-hover:text-emerald-400">
            <Dumbbell size={16} />
            <span className="text-xs font-bold uppercase">{t('dashboard.training')}</span>
          </div>
          <div className="text-sm text-slate-300">
            {t('dashboard.manageSchedule')}
          </div>
        </button>
      </div>
    </div>
  );
};
