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

      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        const snippet = text.trim().substring(0, 120);
        throw new Error(`Server returned system response (${response.status}): ${snippet}... Please try quick-login or check server stats.`);
      }

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
          email: role === 'admin' ? 'admin@edu.in' : 'passenger@edu.in',
          password: 'password'
        })
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        const snippet = text.trim().substring(0, 120);
        throw new Error(`Server returned system response (${response.status}): ${snippet}...`);
      }

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
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 uppercase border-b-2 border-red-800 pb-1.5 inline-block">
          Book Tickets
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

      {/* Quick Login & Credentials Help Text */}
      <div className="mt-8 pt-6 border-t border-slate-100/85">
        <span className="block text-center text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
          ⚡ Quick Authentication Links
        </span>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => handleQuickLogin('passenger')}
            disabled={loading}
            className="py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-700 font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-all duration-150 disabled:opacity-50 text-center"
          >
            Passenger Login
          </button>
          <button
            type="button"
            onClick={() => handleQuickLogin('admin')}
            disabled={loading}
            className="py-1.5 px-2 bg-slate-50 hover:bg-[#991b1b] hover:text-white border border-slate-200 hover:border-[#991b1b] text-slate-700 font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-all duration-150 disabled:opacity-50 text-center"
          >
            Admin Dashboard
          </button>
        </div>
        <div className="text-center text-slate-400 font-mono text-[9px] uppercase tracking-wide">
          <p>Or Manual login: guest / credentials shown below</p>
          <p className="mt-1 text-slate-500 font-bold normal-case text-[10px] hover:text-slate-700">
            passenger@edu.in // admin@edu.in (pass: password)
          </p>
        </div>
      </div>
    </div>
  );
}
