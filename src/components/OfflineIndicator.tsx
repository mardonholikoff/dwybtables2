import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      id="offline-banner"
      aria-label="Tarmoq holati bildirishnomasi"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 bg-amber-300 border-2 border-amber-500 px-4 py-2.5 text-xs font-black text-black shadow-lg rounded-none"
    >
      <WifiOff className="w-4 h-4 text-black animate-pulse stroke-[2.5]" />
      <span>Offlayn rejim — Ma'lumotlar kesh xotirada saqlanmoqda</span>
    </aside>
  );
};
