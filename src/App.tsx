import React, { useState, useEffect } from 'react';
import { User, Route, Ticket, BusPass } from './types';
import AuthModule from './components/AuthModule';
import Dashboard from './components/Dashboard';
import TicketBooking from './components/TicketBooking';
import BusPassModule from './components/BusPass';
import AdminModule from './components/AdminModule';
import QRVerification from './components/QRVerification';
import CloudMonitoring from './components/CloudMonitoring';
import { Bus, ShieldAlert, Monitor, Terminal, LayoutDashboard, Ticket as TicketIcon, CreditCard, LogOut } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Shared Data States loaded dynamically from database APIs
  const [routes, setRoutes] = useState<Route[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [passes, setPasses] = useState<BusPass[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // Automatically check on mount or login and fetch full listings from real backend
  const fetchAllSystemData = async (user_id?: string) => {
    const uid = user_id || currentUser?.id;
    try {
      const routesRes = await fetch('/api/routes');
      const isRoutesJson = routesRes.ok && routesRes.headers.get('content-type')?.includes('application/json');
      if (isRoutesJson) {
        const routesData = await routesRes.json();
        setRoutes(routesData);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }

      if (uid) {
        // Fetch tickets and passes for this specific user or ALL tickets if admin
        const isAdmin = currentUser?.role === 'admin' || uid === 'usr_admin';
        const ticketsUrl = isAdmin ? '/api/tickets' : `/api/tickets?userId=${uid}`;
        const passesUrl = isAdmin ? '/api/passes' : `/api/passes?userId=${uid}`;

        const [ticketsRes, passesRes] = await Promise.all([
          fetch(ticketsUrl),
          fetch(passesUrl)
        ]);

        const isTicketsJson = ticketsRes.ok && ticketsRes.headers.get('content-type')?.includes('application/json');
        const isPassesJson = passesRes.ok && passesRes.headers.get('content-type')?.includes('application/json');

        if (isTicketsJson) setTickets(await ticketsRes.json());
        if (isPassesJson) setPasses(await passesRes.json());
      }
    } catch (err) {
      // Gracefully catch and set connection state, avoiding destructive unhandled console logging
      setConnectionStatus('disconnected');
      console.warn("Central Ledger Node temporarily offline. Retrying automatically in background...", err);
    }
  };

  // Fetch data periodically in background to capture simulations
  useEffect(() => {
    setConnectionStatus('connecting');
    fetchAllSystemData();
    const interval = setInterval(() => {
      fetchAllSystemData();
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    fetchAllSystemData(user.id);
    setActiveTab('dashboard');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setTickets([]);
    setPasses([]);
  };

  // State update handlers to instantly update UI on user operations
  const handleBookingSuccess = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
  };

  const handlePassCreated = (newPass: BusPass) => {
    setPasses(prev => [newPass, ...prev]);
  };

  const handlePassRenewed = (renewedPass: BusPass) => {
    setPasses(prev => prev.map(p => p.id === renewedPass.id ? renewedPass : p));
  };

  const handleRouteCreated = (newRoute: Route) => {
    setRoutes(prev => [...prev, newRoute]);
  };

  const handleRouteUpdated = (updatedRoute: Route) => {
    setRoutes(prev => prev.map(r => r.id === updatedRoute.id ? updatedRoute : r));
  };

  const handleRouteDeleted = (routeId: string) => {
    setRoutes(prev => prev.filter(r => r.id !== routeId));
  };

  // If user is not authenticated, load clean, modern portal view
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4">
        <div className="flex items-center gap-3 mb-4 text-[#991b1b]">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 font-sans uppercase">
            Book Tickets
          </h1>
        </div>
        <p className="text-xs text-slate-500 font-mono text-center mb-8 max-w-sm">
          Dynamic cloud infrastructure for digital pass management and distributed fare auditing.
        </p>
        <AuthModule onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 1. Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Brand/Heading */}
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm font-bold tracking-tight text-slate-950 uppercase border-b-2 border-red-800 pb-0.5">
                  Book Tickets
                </h1>
                <span className={`text-[10px] font-bold font-mono tracking-wide uppercase transition-colors ${
                  connectionStatus === 'connected'
                    ? 'text-emerald-700'
                    : 'text-amber-750 animate-pulse'
                }`}>
                  ({connectionStatus === 'connected' ? 'Online' : 'Connecting'})
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500 leading-none mt-1">
                Centralized Ledger Node // Tamilnadu, IN
              </p>
            </div>
          </div>

          {/* User badge and Log Out */}
          <div className="flex items-center gap-3.5">
            <div className="text-right font-mono text-[10px] hidden sm:block">
              <span className="text-slate-500">ID: {currentUser.id}</span>
              <p className="font-bold text-[#991b1b]">{currentUser.name}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 py-1.5 px-3.5 border border-slate-200 hover:bg-[#fef2f2] hover:text-[#991b1b] rounded font-mono text-[10px] uppercase font-bold tracking-wider transition-all duration-150 cursor-pointer"
            >
              <LogOut size={11} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Dynamic Tab Navigation Row */}
        <div className="border-t border-slate-100 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <nav className="flex items-center overflow-x-auto space-x-1 py-2 scrollbar-none font-mono text-[11px] font-semibold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'dashboard' ? 'bg-[#991b1b] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard size={12} />
                Dashboard
              </button>

              {currentUser.role !== 'admin' ? (
                <>
                  <button
                    onClick={() => setActiveTab('booking')}
                    className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'booking' ? 'bg-[#991b1b] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <TicketIcon size={12} />
                    Book Ticket
                  </button>

                  <button
                    onClick={() => setActiveTab('passes')}
                    className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'passes' ? 'bg-[#991b1b] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard size={12} />
                    My Passes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'admin' ? 'bg-[#991b1b] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Terminal size={12} />
                    Admin Routes
                  </button>

                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'verification' ? 'bg-[#991b1b] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <ShieldAlert size={12} />
                    Boarding Scanner
                  </button>

                  <div className="h-4 w-[1px] bg-slate-200 mx-1.5" />

                  <button
                    onClick={() => setActiveTab('monitoring')}
                    className={`py-1.5 px-3 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeTab === 'monitoring' ? 'bg-slate-900 text-slate-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Monitor size={12} />
                    Cloud Monitoring
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* 2. Primary Layout Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div id="view-canvas" className="animate-fade-in">
          {activeTab === 'dashboard' && (
            <Dashboard
              user={currentUser}
              tickets={tickets}
              passes={passes}
              routes={routes}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'booking' && (
            <TicketBooking
              user={currentUser}
              routes={routes}
              onBookingSuccess={handleBookingSuccess}
            />
          )}

          {activeTab === 'passes' && (
            <BusPassModule
              user={currentUser}
              passes={passes}
              onPassCreated={handlePassCreated}
              onPassRenewed={handlePassRenewed}
            />
          )}

          {activeTab === 'admin' && (
            <AdminModule
              routes={routes}
              tickets={tickets}
              passes={passes}
              onRouteCreated={handleRouteCreated}
              onRouteUpdated={handleRouteUpdated}
              onRouteDeleted={handleRouteDeleted}
            />
          )}

          {activeTab === 'verification' && (
            <QRVerification
              tickets={tickets}
              onTriggerRefresh={fetchAllSystemData}
            />
          )}

          {activeTab === 'monitoring' && (
            <CloudMonitoring />
          )}
        </div>
      </main>

      {/* 3. Humble Academic Footer */}
      <footer className="bg-white border-t border-slate-200 py-5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] font-mono text-slate-400">
          <span>
            © 2026 Book Tickets // Academic Evaluation Release
          </span>
          <div className="flex items-center gap-3 uppercase font-bold text-slate-500">
            <span>Powered by Google Cloud Run & Cloud SQL</span>
            <span>•</span>
            <span>PostgreSQL Native Adapter</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
