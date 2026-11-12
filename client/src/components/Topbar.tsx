import React from 'react';
import { Search, Bell, Calendar, User } from 'lucide-react';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-18 px-8 bg-brand-card/60 backdrop-blur-md border-b border-brand-border flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs text-brand-muted bg-brand-surface/70 px-3 py-1.5 rounded-lg border border-brand-border">
          <Calendar size={14} className="text-brand-electric" />
          <span>{today}</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-full bg-brand-electric/20 border border-brand-electric/40 flex items-center justify-center text-brand-electric font-bold text-xs">
            HZ
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-white leading-tight">Admin HypeZone</div>
            <div className="text-[10px] text-brand-muted leading-tight">Billing & Finance</div>
          </div>
        </div>
      </div>
    </header>
  );
};
