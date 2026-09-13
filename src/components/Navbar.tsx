import React, { useState, useEffect } from 'react';
import { LogOut, Database, Calendar, Wifi, WifiOff, Users, Droplet, TrendingUp } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { ActiveTab } from '../types';

interface NavbarProps {
  onLogout: () => void;
  currentUser?: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  suppliersCount: number;
  autoPartsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLogout,
  activeTab,
  onTabChange,
  suppliersCount,
  autoPartsCount,
}) => {
  const isOnline = useOnlineStatus();
  const [currentDateStr, setCurrentDateStr] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const monthsUz = [
        'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
        'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
      ];
      const day = now.getDate();
      const month = monthsUz[now.getMonth()];
      const year = now.getFullYear();
      setCurrentDateStr(`${day}-${month}, ${year}-yil`);
    };

    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      id="main-navbar"
      className="sticky top-0 z-40 w-full bg-yellow-100/95 border-b-2 border-amber-400 shadow-sm text-black px-2.5 sm:px-6 py-2 sm:py-2.5 backdrop-blur-xs rounded-none"
    >
      <div className="max-w-[1700px] mx-auto flex flex-col gap-2.5">
        {/* Yuqori qator: Brand, Sana, Status, PWA va Chiqish */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand: Daewoo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-amber-400 border-2 border-amber-500 shadow-sm text-black font-black text-base rounded-none">
              D
            </div>
            <div>
              <span
                id="navbar-brand-name"
                className="text-lg sm:text-xl font-black tracking-widest text-black uppercase font-heading"
                style={{ letterSpacing: '0.2em' }}
              >
                DAEWOO
              </span>
            </div>
          </div>

          {/* Center / Stats: Bugungi sana & Baza statusi */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Bugungi sana */}
            <div
              id="today-date-badge"
              className="flex items-center gap-1.5 bg-yellow-200 border-2 border-amber-400 px-2.5 py-1 text-black font-bold shadow-2xs rounded-none"
              title="Bugungi sana"
            >
              <Calendar className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span className="text-stone-700 hidden sm:inline font-semibold">Sana:</span>
              <span className="text-black font-black">{currentDateStr || 'Yuklanmoqda...'}</span>
            </div>

            {/* Baza statusi (Firebase Firestore) */}
            <div
              id="database-status-badge"
              className={`flex items-center gap-1.5 px-2.5 py-1 border-2 text-xs font-black shadow-2xs transition-colors rounded-none ${
                isOnline
                  ? 'bg-yellow-200 border-amber-400 text-black'
                  : 'bg-amber-200 border-amber-500 text-black'
              }`}
              title={isOnline ? 'Baza faol va ulangan' : 'Internet uzilgan: faqat o\'qish rejimida'}
            >
              <div className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full opacity-75 ${
                    isOnline ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
                <span
                  className={`relative inline-flex h-2 w-2 ${
                    isOnline ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                />
              </div>
              <Database className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <div className="flex items-center gap-1">
                <span className="text-stone-700 hidden md:inline font-semibold">Baza:</span>
                <span className="text-black font-black">{isOnline ? 'Ulangan' : 'Oflayn (O\'qish)'}</span>
              </div>
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-black hidden sm:inline stroke-[2.5]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-700 hidden sm:inline stroke-[2.5]" />
              )}
            </div>
          </div>

          {/* Right side: PWA install button & Chiqish */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />

            <button
              id="logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-200 hover:bg-amber-300 border-2 border-amber-400 text-black text-xs font-black transition cursor-pointer active:scale-95 shadow-2xs rounded-none"
              title="Tizimdan chiqish"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Chiqish</span>
            </button>
          </div>
        </div>

        {/* 2-qator: 1, 2 jadvallar va Tahlil (Mobil ekranga to'liq mos, sig'adigan, surilmaydigan) */}
        <nav aria-label="Bo'limlar" className="w-full border-t border-amber-300/80 pt-1.5">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 w-full max-w-full">
            {/* 1-Jadval: Yetkazib beruvchilar */}
            <button
              type="button"
              onClick={() => onTabChange('suppliers')}
              className={`min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black transition cursor-pointer rounded-none border-2 truncate ${
                activeTab === 'suppliers'
                  ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-1 ring-amber-500'
                  : 'bg-yellow-200/80 hover:bg-yellow-300 border-amber-400 text-stone-800'
              }`}
              title="1-Jadval: Yetkazib beruvchilar"
            >
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
              <span className="truncate">1-Jadval</span>
              <span
                className={`hidden sm:inline-block px-1 py-0.2 bg-white border border-amber-500 text-[9px] font-mono font-black shrink-0 ${
                  activeTab === 'suppliers' ? 'text-black' : 'text-stone-700'
                }`}
              >
                {suppliersCount}
              </span>
            </button>

            {/* 2-Jadval: Avto ehtiyot qismlar */}
            <button
              type="button"
              onClick={() => onTabChange('autoparts')}
              className={`min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black transition cursor-pointer rounded-none border-2 truncate ${
                activeTab === 'autoparts'
                  ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-1 ring-amber-500'
                  : 'bg-yellow-200/80 hover:bg-yellow-300 border-amber-400 text-stone-800'
              }`}
              title="2-Jadval: Avto ehtiyot qismlar"
            >
              <Droplet className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
              <span className="truncate">2-Jadval (Avto ehtiyot qismlar)</span>
              <span
                className={`hidden sm:inline-block px-1 py-0.2 bg-white border border-amber-500 text-[9px] font-mono font-black shrink-0 ${
                  activeTab === 'autoparts' ? 'text-black' : 'text-stone-700'
                }`}
              >
                {autoPartsCount}
              </span>
            </button>

            {/* Tahlil */}
            <button
              type="button"
              onClick={() => onTabChange('analytics')}
              className={`min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black transition cursor-pointer rounded-none border-2 truncate ${
                activeTab === 'analytics'
                  ? 'bg-amber-400 border-amber-600 text-black shadow-xs ring-1 ring-amber-500'
                  : 'bg-yellow-200/80 hover:bg-yellow-300 border-amber-400 text-stone-800'
              }`}
              title="Tahlil bo'limi"
            >
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5] shrink-0" />
              <span className="truncate">Tahlil</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
