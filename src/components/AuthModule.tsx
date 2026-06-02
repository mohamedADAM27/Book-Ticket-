import React, { useState } from 'react';
import { User } from '../types';

interface AuthModuleProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthModule({ onLoginSuccess }: AuthModuleProps) {
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    if (!email || !password || (isRegistering && !name)) {
      setErrorMessage('Please fill in all fields with valid information.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? '/api/register' : '/api/login';
      const payload = isRegistering ? { name, email, password } : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Identity verification failed');
      }

      if (isRegistering) {
        setSuccessMessage('Passenger account created successfully! Please sign in.');
        setIsRegistering(false);
        // Clean fields
        setPassword('');
      } else {
        onLoginSuccess(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server did not respond. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  // Quick evaluation logins
  const handleQuickLogin = async (role: 'passenger' | 'admin') => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'passenger@edu.in',
          password: 'password'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed quick access');
      }
      onLoginSuccess(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate passenger account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-slate-200 shadow-sm rounded-lg p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 uppercase">
          cloud based bus pass sytem
        </h2>
      </div>

      {isRegistering ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Alex Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border-slate-200 outline-none focus:border-[#991b1b] pb-2 pt-1 border-b transition-colors bg-transparent placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase mb-1">Passenger Email</label>
            <input
              type="email"
              required
              placeholder="passenger@edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm border-slate-200 outline-none focus:border-[#991b1b] pb-2 pt-1 border-b transition-colors bg-transparent placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase mb-1">Secret Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm border-slate-200 outline-none focus:border-[#991b1b] pb-2 pt-1 border-b transition-colors bg-transparent placeholder-slate-400"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#fef2f2] border-l-4 border-[#991b1b] text-xs text-[#991b1b] font-mono leading-relaxed">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-xs text-emerald-800 font-mono leading-relaxed">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#991b1b] hover:bg-[#7f1d1d] active:bg-black text-white font-mono text-xs uppercase tracking-wider rounded transition-colors duration-150 disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing Authentication...' : 'Register Dynamic User'}
          </button>

          <p className="text-center text-xs text-slate-600 font-mono mt-4">
            Existing credential?{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-[#991b1b] hover:underline font-bold"
            >
              Sign In
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="passenger@edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-sm border-slate-200 outline-none focus:border-[#991b1b] pb-2 pt-1 border-b transition-colors bg-transparent placeholder-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-slate-700 uppercase mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-sm border-slate-200 outline-none focus:border-[#991b1b] pb-2 pt-1 border-b transition-colors bg-transparent placeholder-slate-400"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#fef2f2] border-l-4 border-[#991b1b] text-xs text-[#991b1b] font-mono leading-relaxed">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-xs text-emerald-800 font-mono leading-relaxed">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-[#991b1b] active:bg-black text-white font-mono text-xs uppercase tracking-wider rounded transition-colors duration-150 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-slate-600 font-mono mt-4">
            New evaluation node?{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-[#991b1b] hover:underline font-bold"
            >
              Register here
            </button>
          </p>
        </form>
      )}

      {/* Credentials Help Text */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center text-slate-500 font-mono text-[10.5px]">
        <p>Passenger Sign In: passenger@edu.in / password</p>
        <p className="mt-1">Admin Sign In: admin@edu.in / password</p>
      </div>
    </div>
  );
}
