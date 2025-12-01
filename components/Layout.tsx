import React from 'react';
import { LayoutDashboard, Users, Trophy, Calendar, Shirt, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onChangeView: (view: any) => void;
  teamName: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, teamName }) => {
  const navItems = [
    { id: 'DASHBOARD', label: 'Home', icon: LayoutDashboard },
    { id: 'SQUAD', label: 'Squad', icon: Users },
    { id: 'LEAGUE', label: 'League', icon: Trophy },
    { id: 'TACTICS', label: 'Tactics', icon: Shirt },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Bar */}
      <header className="flex-none h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between z-20">
        <div className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-teal-500 text-transparent bg-clip-text">
          PM25
        </div>
        <div className="text-sm font-medium text-slate-300">
          {teamName}
        </div>
        <div className="p-2 rounded-full hover:bg-slate-800">
          <Settings size={20} className="text-slate-400" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 relative">
        <div className="max-w-md mx-auto min-h-full">
            {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="flex-none h-16 bg-slate-900 border-t border-slate-800 grid grid-cols-4 px-2 safe-area-pb">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`flex flex-col items-center justify-center space-y-1 ${
              currentView === item.id 
                ? 'text-emerald-400' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <item.icon size={20} strokeWidth={currentView === item.id ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
