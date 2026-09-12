import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser) {
      setError('Iltimos, loginni kiriting');
      return;
    }
    if (!cleanPass) {
      setError('Iltimos, parolni kiriting');
      return;
    }

    // Login: daewooyb, Parol: ybdaewoo
    if (cleanUser !== 'daewooyb' || cleanPass !== 'ybdaewoo') {
      setError('Login yoki parol noto\'g\'ri!');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      onLogin(cleanUser);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-amber-50 text-black px-4 py-8 relative overflow-hidden">
      {/* Background warm soft ambient styling */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-yellow-200/50 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-200/50 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Card Container (To'rtburchak ramkalar) */}
        <div className="bg-yellow-100/90 backdrop-blur-sm border-2 border-amber-400 shadow-xl p-8 sm:p-10 text-black rounded-none">
          
          {/* Daewoo Header / Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 text-black shadow-md border-2 border-amber-500 mb-4 rounded-none">
              <span className="text-3xl font-black tracking-wider font-heading">D</span>
            </div>
            <h1
              id="daewoo-brand-title"
              className="text-3xl font-black tracking-widest text-black uppercase font-heading"
              style={{ letterSpacing: '0.22em' }}
            >
              DAEWOO
            </h1>
          </div>

          {/* Form */}
          <form id="daewoo-login-form" onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-rose-100 border-2 border-rose-500 text-rose-950 text-xs font-bold px-3.5 py-2.5 flex items-center gap-2 rounded-none">
                <span className="w-2 h-2 bg-rose-600 animate-ping" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Input */}
            <div className="space-y-1.5">
              <label htmlFor="login-username" className="block text-xs font-black text-black uppercase tracking-wider">
                Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <User className="w-4 h-4 stroke-[2.5]" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="daewooyb"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-amber-400 text-sm text-black font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition rounded-none"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-black text-black uppercase tracking-wider">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                  <Lock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 bg-white border-2 border-amber-400 text-sm text-black font-semibold placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition rounded-none"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-black hover:text-stone-700 transition cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-amber-400 hover:bg-amber-500 active:scale-[0.99] text-black font-black text-sm border-2 border-amber-500 shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed rounded-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin" />
              ) : (
                <>
                  <span>Kirish</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>

            {/* Quick Helper Button */}
            <div className="pt-3 border-t-2 border-amber-300 text-center">
              <button
                type="button"
                onClick={() => {
                  setUsername('daewooyb');
                  setPassword('ybdaewoo');
                }}
                className="text-xs text-black font-bold hover:underline cursor-pointer"
              >
                Login va parolni avtomatik kiritish
              </button>
            </div>
          </form>
        </div>

        {/* Security / System Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-black font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
          <span>Xavfsiz PWA tizimi • Daewoo</span>
        </div>
      </div>
    </div>
  );
};
