import React, { useState } from 'react';
import { LayoutDashboard, Users, Trophy, Calendar, Shirt, Settings, Search, Save } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { SaveGameModal } from './SaveGameModal';
import { PlayerSearchView } from './PlayerSearchView';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: any) => void;
  teamName: string;
  onSaveGame?: (name: string) => Promise<void>;
  onTransferComplete?: (player: any, fee: number) => void;
  userTeam?: any;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, teamName, onSaveGame, onTransferComplete, userTeam }) => {
  const { t } = useI18n();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const isWide = currentView === 'TACTICS' || currentView === 'LEAGUE';

  const navItems = [
    { id: 'DASHBOARD', label: t('nav.home'), icon: LayoutDashboard },
    { id: 'SQUAD', label: t('nav.squad'), icon: Users },
    { id: 'LEAGUE', label: t('nav.league'), icon: Trophy },
    { id: 'TACTICS', label: t('nav.tactics'), icon: Shirt },
    { id: 'SEARCH', label: t('nav.search'), icon: Search },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <header className="flex-none h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between z-20">
        <div className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-teal-500 text-transparent bg-clip-text">
          {t('appName')}
        </div>
        <div className="text-sm font-medium text-slate-300">
          {teamName}
        </div>
        <div className="flex items-center gap-2">
          {onSaveGame && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="p-2 rounded-full hover:bg-slate-800 text-emerald-500 hover:text-emerald-400 transition-colors"
              title="Save Game"
            >
              <Save size={20} />
            </button>
          )}
          <div className="p-2 rounded-full hover:bg-slate-800">
            <Settings size={20} className="text-slate-400" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 relative">
        <div className={`${isWide ? 'max-w-6xl' : 'max-w-md'} mx-auto min-h-full w-full px-2`}>
          {currentView === 'SEARCH' ? (
            <PlayerSearchView onTransferComplete={onTransferComplete} userTeam={userTeam} />
          ) : (
            children
          )}
        </div>
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="flex-none h-16 bg-slate-900 border-t border-slate-800 grid grid-cols-5 px-2 safe-area-pb">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center justify-center space-y-1 ${currentView === item.id
              ? 'text-emerald-400'
              : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Save Game Modal */}
      {showSaveModal && onSaveGame && (
        <SaveGameModal
          onClose={() => setShowSaveModal(false)}
          onSave={onSaveGame}
        />
      )}
    </div>
  );
};
