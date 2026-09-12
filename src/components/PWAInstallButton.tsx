import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-2 bg-amber-300 hover:bg-amber-400 text-black border-2 border-amber-500 px-3.5 py-1.5 text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer rounded-none"
        title="Ilovani o'rnatish (PWA)"
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Ilovani o'rnatish (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 border-2 border-amber-400 bg-yellow-200 hover:bg-yellow-300 px-3 py-1.5 text-xs font-bold text-black transition cursor-pointer shadow-2xs rounded-none"
        >
          <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>iOS-ga o'rnatish</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 rounded-none">
            <div className="w-full max-w-sm bg-amber-50 p-6 shadow-2xl border-4 border-amber-400 text-black rounded-none">
              <div className="flex items-center justify-between pb-3 border-b-2 border-amber-300">
                <h3 className="text-base font-black text-black flex items-center gap-2 font-heading">
                  <Smartphone className="w-5 h-5 text-amber-800 stroke-[2.5]" />
                  iPhone / iPad-ga o'rnatish
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-black hover:bg-amber-200 p-1 rounded-none"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-black font-medium">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-amber-300 border border-amber-500 text-xs font-black text-black rounded-none">1</span>
                  <p>Safari brauzerining pastki qismidagi <strong>Ulashish (Share)</strong> tugmasini bosing.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-amber-300 border border-amber-500 text-xs font-black text-black rounded-none">2</span>
                  <p>Menyudan pastga tushib, <strong>«Bosh ekranga qo'shish» (Add to Home Screen)</strong> bandini tanlang.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full bg-amber-400 border-2 border-amber-500 py-2.5 text-sm font-black text-black hover:bg-amber-500 transition shadow-xs rounded-none"
              >
                Tushundim
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
