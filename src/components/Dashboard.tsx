import React from 'react';
import { User, Ticket, BusPass } from '../types';
import { Clock, ArrowRight, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  user: User;
  tickets: Ticket[];
  passes: BusPass[];
  routes: any[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ user, tickets, passes, routes, onNavigate }: DashboardProps) {
  // Compute user metrics
  const activeTickets = tickets.filter(t => t.status === 'valid');
  const activePasses = passes.filter(p => {
    const isExpired = new Date(p.expiry_date) < new Date();
    return p.status === 'Active' && !isExpired;
  });

  // Calculate upcoming tickets within 24 hours
  const upcomingTickets = tickets.filter(t => {
    if (t.status !== 'valid') return false;
    
    const travelDateObj = new Date(`${t.travel_date}T00:00:00`);
    const now = new Date();
    
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const diffTime = travelDateObj.getTime() - now.getTime();
    const diffHours = diffTime / (1000 * 60 * 60);

    return t.travel_date === todayStr || t.travel_date === tomorrowStr || (diffHours >= -24 && diffHours <= 24);
  });

  const getRouteDetails = (routeId: string) => {
    const r = routes.find(route => route.id === routeId);
    return r ? `${r.source} → ${r.destination}` : 'Unknown Route';
  };

  const getRouteFare = (routeId: string) => {
    const r = routes.find(route => route.id === routeId);
    return r ? `₹${r.fare}` : '₹0';
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200 shadow-sm text-slate-950 p-6 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#991b1b] uppercase font-bold">
            {user.role === 'admin' ? 'Active Admin Session' : 'Active Passenger Session'}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">Welcome back, {user.name}</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Database ID: {user.id} | Session Registered: {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {user.role === 'admin' ? (
            <>
              <button
                onClick={() => onNavigate('admin')}
                className="px-3.5 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors duration-150"
              >
                Configure Fares
              </button>
              <button
                onClick={() => onNavigate('verification')}
                className="px-3.5 py-1.5 bg-white hover:bg-[#fef2f2] text-[#991b1b] border border-[#991b1b] font-mono text-xs uppercase tracking-wider rounded transition-colors duration-150"
              >
                Verify Tickets
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('booking')}
                className="px-3.5 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors duration-150"
              >
                New ticket
              </button>
              <button
                onClick={() => onNavigate('passes')}
                className="px-3.5 py-1.5 bg-white hover:bg-[#fef2f2] text-[#991b1b] border border-[#991b1b] font-mono text-xs uppercase tracking-wider rounded transition-colors duration-150"
              >
                Manage Pass
              </button>
            </>
          )}
        </div>
      </div>

      {/* 24-Hour Imminent Travel Alert */}
      {upcomingTickets.length > 0 && (
        <div id="dashboard-imminent-alert" className="bg-[#fffbeb] border border-amber-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-[#991b1b] shrink-0 mt-0.5 sm:mt-0">
              <Clock className="w-5 h-5 text-[#991b1b]" />
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-widest text-[#991b1b] uppercase font-bold block">
                IMMINENT DEPARTURE EN-ROUTE
              </span>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                Upcoming Departure scheduled within the next 24 Hours!
              </h4>
              <p className="text-[11px] text-slate-650 font-mono mt-1 leading-normal">
                An active ticket matches route connection: <b className="text-slate-900">{getRouteDetails(upcomingTickets[0].route_id)}</b> scheduled on <b className="text-[#991b1b]">{upcomingTickets[0].travel_date}</b>. Please ensure your digital ticket signature is loaded and keep the QR code ready for quick scanner terminals check-in.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('wallet')}
            className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase text-white bg-slate-950 hover:bg-[#991b1b] hover:border-[#991b1b] px-4 py-2 border border-slate-950 rounded transition-all shrink-0 cursor-pointer self-end sm:self-center"
          >
            <span>Show QR Card</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Travel Tickets</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{activeTickets.length}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Unscanned & verification-ready</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Digital Passes</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{activePasses.length}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Continuous decentralized validation</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Bookings (History)</p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{tickets.length}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Stored inside database node</p>
          </div>
        </div>
      </div>

      {/* Activity Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bus Passes */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm lg:col-span-1">
          <h4 className="text-sm font-mono uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-3">
            Your Digital Pass
          </h4>
          {passes.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-mono text-xs">
              No active dynamic pass.
              <button
                onClick={() => onNavigate('passes')}
                className="block mx-auto mt-2 text-[#991b1b] hover:underline font-bold text-[11px]"
              >
                + Issue Pass
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {passes.slice(0, 2).map(pass => {
                const expired = new Date(pass.expiry_date) < new Date();
                return (
                  <div key={pass.id} className="border border-slate-100 rounded p-4 bg-slate-50 relative overflow-hidden">
                    <div className="absolute right-2 top-2">
                      <span className={`text-[10px] font-mono uppercase font-bold ${
                        expired ? 'text-slate-600' : 'text-emerald-700'
                      }`}>
                        ({expired ? 'Expired' : 'Active'})
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">{pass.pass_type} BUS PASS</p>
                    <h5 className="font-bold text-slate-900 class-pass-card mt-1">{pass.user_name}</h5>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 border-t border-slate-200/50 pt-2.5">
                      <div>
                        <p className="text-[9px] text-slate-400">PASS ID</p>
                        <p className="truncate text-slate-700">{pass.id}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400">EXPIRY DATE</p>
                        <p className="text-[#991b1b] font-medium">{pass.expiry_date}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Bus Bookings */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm lg:col-span-2">
          <h4 className="text-sm font-mono uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-3 flex justify-between items-center">
            <span>
              Recent Digital Tickets
            </span>
            <button
              onClick={() => onNavigate('wallet')}
              className="text-xs text-[#991b1b] hover:underline font-mono"
            >
              Go to Wallet →
            </button>
          </h4>

          {tickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              Database node returned empty. No booking records found.
              <button
                onClick={() => onNavigate('booking')}
                className="block mx-auto mt-2 text-[#991b1b] hover:underline font-bold"
              >
                Book your first Ticket
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider bg-slate-50 text-[10px]">
                    <th className="py-2.5 px-3">Ticket ID</th>
                    <th className="py-2.5 px-3">Route Connection</th>
                    <th className="py-2.5 px-3">Travel Date</th>
                    <th className="py-2.5 px-3 text-right">Fare Paid</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tickets.slice(0, 5).map(tkt => (
                    <tr key={tkt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-bold truncate max-w-[100px] text-slate-900">{tkt.id}</td>
                      <td className="py-3 px-3">{getRouteDetails(tkt.route_id)}</td>
                      <td className="py-3 px-3">{tkt.travel_date}</td>
                      <td className="py-3 px-3 text-right text-slate-900 font-bold">{getRouteFare(tkt.route_id)}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${
                          tkt.status === 'valid'
                            ? 'text-emerald-700'
                            : tkt.status === 'already used'
                            ? 'text-slate-600'
                            : tkt.status === 'expired'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}>
                          {tkt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
