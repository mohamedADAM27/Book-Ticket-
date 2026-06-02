import React, { useState } from 'react';
import { Route, Ticket, BusPass } from '../types';
import { api } from '../lib/api';

interface AdminModuleProps {
  routes: Route[];
  tickets: Ticket[];
  passes: BusPass[];
  onRouteCreated: (newRoute: Route) => void;
  onRouteUpdated: (updatedRoute: Route) => void;
  onRouteDeleted: (routeId: string) => void;
}

export default function AdminModule({ routes, tickets, passes, onRouteCreated, onRouteUpdated, onRouteDeleted }: AdminModuleProps) {
  const [source, setSource] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [fare, setFare] = useState<number>(100);
  const [duration, setDuration] = useState<string>('');
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Suggested Tamilnadu cities/districts to avoid typing anomalies
  const tamilDistricts = [
    'Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli',
    'Vellore', 'Thanjavur', 'Erode', 'Tuticorin', 'Kanyakumari', 'Kancheepuram', 'Dharmapuri'
  ];

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!source || !destination || !fare || !duration) {
      setError('All parameters must be set.');
      setLoading(false);
      return;
    }

    if (source === destination) {
      setError('Departure city and destination city cannot be identical.');
      setLoading(false);
      return;
    }

    if (fare <= 0) {
      setError('Centralized fare must be positive.');
      setLoading(false);
      return;
    }

    try {
      const data = await api.createRoute(source, destination, fare);

      onRouteCreated(data);
      // Clean up fields
      setSource('');
      setDestination('');
      setFare(100);
      setDuration('');
    } catch (err: any) {
      setError(err.message || 'API connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoute) return;

    setLoading(true);
    setError(null);

    if (editingRoute.source === editingRoute.destination) {
      setError('Departure and destination cannot be identical.');
      setLoading(false);
      return;
    }

    if (editingRoute.fare <= 0) {
      setError('Fare cost must be positive.');
      setLoading(false);
      return;
    }

    try {
      const data = await api.updateRoute(editingRoute);

      onRouteUpdated(data);
      setEditingRoute(null);
    } catch (err: any) {
      setError(err.message || 'API connection failed during update.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to delete this route? Historically booked tickets for this connection might lose validation.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.deleteRoute(id);

      onRouteDeleted(id);
    } catch (err: any) {
      setError(err.message || 'Failed to complete transaction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Centralized Route & Fare Administration</h4>
        <p className="text-xs text-slate-500 font-mono mt-0.5">
          Define global fare metrics. All digital tickets dynamically consume pricing matrices stored securely within this register.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#fef2f2] border-l-4 border-[#991b1b] text-xs text-[#991b1b] font-mono leading-relaxed">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD / EDIT FORM */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm lg:col-span-1 self-start space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center">
            <h5 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-800">
              {editingRoute ? 'Edit Fare Configuration' : 'Register New Route'}
            </h5>
          </div>

          {editingRoute ? (
            <form onSubmit={handleUpdateRoute} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Source (From)</label>
                <select
                  value={editingRoute.source}
                  onChange={(e) => setEditingRoute({ ...editingRoute, source: e.target.value })}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 outline-none p-2 rounded"
                >
                  {tamilDistricts.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Destination (To)</label>
                <select
                  value={editingRoute.destination}
                  onChange={(e) => setEditingRoute({ ...editingRoute, destination: e.target.value })}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 outline-none p-2 rounded"
                >
                  {tamilDistricts.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Centralised Fare (Rupees ₹)</label>
                <input
                  type="number"
                  required
                  min="5"
                  value={editingRoute.fare}
                  onChange={(e) => setEditingRoute({ ...editingRoute, fare: Number(e.target.value) })}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2 rounded outline-none focus:border-[#991b1b]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Est. Duration (e.g. 5h 30m)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 4h 15m"
                  value={editingRoute.duration}
                  onChange={(e) => setEditingRoute({ ...editingRoute, duration: e.target.value })}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2 rounded outline-none focus:border-[#991b1b]"
                />
              </div>

              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-1.5 px-3 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-colors"
                >
                  Apply Change
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoute(null)}
                  className="py-1.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-mono text-[10px] uppercase rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Source (From)</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 outline-none p-2 rounded"
                  required
                >
                  <option value="">-- Choose Source --</option>
                  {tamilDistricts.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Destination (To)</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 outline-none p-2 rounded"
                  required
                >
                  <option value="">-- Choose Destination --</option>
                  {tamilDistricts.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Authorized Fare (₹)</label>
                <input
                  type="number"
                  required
                  min="5"
                  placeholder="e.g. 150"
                  value={fare}
                  onChange={(e) => setFare(Number(e.target.value))}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2 rounded outline-none focus:border-[#991b1b]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-600 uppercase mb-1">Est. Journey duration</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2h 45m"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2 rounded outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-slate-900 hover:bg-[#991b1b] text-white font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-colors"
              >
                + Register Route & Ledger
              </button>
            </form>
          )}

          <div className="p-3 bg-slate-50 rounded text-[10px] text-slate-400 font-mono leading-relaxed">
            <span className="font-bold text-slate-700 block uppercase mb-1">Fare Compliance Rule</span>
            All pricing matrices are centralized. This prevents ticket operators, conductors, or drivers from charging arbitrary ticket prices.
          </div>
        </div>

        {/* REGISTERED ROUTES LIST */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm lg:col-span-2 space-y-4">
          <div className="pb-3 border-b border-slate-100 flex justify-between items-center bg-transparent">
            <h5 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-800">
              Database Ledger Index ({routes.length} Active Routes)
            </h5>
            <span className="text-[10px] font-mono text-[#991b1b] font-bold">
              (Live Synchronized)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] bg-slate-50">
                  <th className="py-2.5 px-2">ID</th>
                  <th className="py-2.5 px-2">Connection Match</th>
                  <th className="py-2.5 px-2">Duration</th>
                  <th className="py-2.5 px-2">Fare Rate</th>
                  <th className="py-2.5 px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {routes.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-bold text-slate-950 truncate max-w-[70px]">{r.id}</td>
                    <td className="py-3 px-2 text-slate-900 font-medium">
                      {r.source} <span className="text-slate-400">→</span> {r.destination}
                    </td>
                    <td className="py-3 px-2">{r.duration}</td>
                    <td className="py-3 px-2 font-bold text-[#991b1b]">₹{r.fare}</td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => setEditingRoute(r)}
                          className="px-2 py-1 text-slate-600 hover:text-[#991b1b] border border-slate-200 hover:border-[#991b1b] rounded text-[10px] uppercase font-bold tracking-tight transition-colors"
                          title="Edit Route"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(r.id)}
                          className="px-2 py-1 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-600 rounded text-[10px] uppercase font-bold tracking-tight transition-colors"
                          title="Delete Route"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DYNAMIC PASSENGER DATA SECTION - REAL BOOKINGS & PASSES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Dynamic Ticket Bookings Database */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
            <h5 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-800">
              Live Passenger Bookings ({tickets.length} Checked Tickets)
            </h5>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">
              Decentralized Queue
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="py-8 text-center text-slate-450 font-mono text-xs border border-dashed border-slate-100 rounded">
              No live passenger tickets booked in active queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] bg-slate-50">
                    <th className="py-2.5 px-2">Ticket ID</th>
                    <th className="py-2.5 px-2">User ID</th>
                    <th className="py-2.5 px-2">Route</th>
                    <th className="py-2.5 px-2">Travel Date</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tickets.map(tkt => {
                    const rObj = routes.find(r => r.id === tkt.route_id);
                    const connection = rObj ? `${rObj.source} → ${rObj.destination}` : 'Unknown Connection';
                    return (
                      <tr key={tkt.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-2 font-bold text-slate-900 truncate max-w-[90px]">{tkt.id}</td>
                        <td className="py-3 px-2 text-slate-500 font-medium">{tkt.user_id}</td>
                        <td className="py-3 px-2 text-slate-800 font-medium">{connection}</td>
                        <td className="py-3 px-2 text-slate-600">{tkt.travel_date}</td>
                        <td className="py-3 px-2 text-right">
                          <span className={`text-[10px] uppercase font-bold ${
                            tkt.status === 'valid'
                              ? 'text-emerald-700'
                              : tkt.status === 'already used'
                              ? 'text-slate-600'
                              : 'text-amber-700'
                          }`}>
                            {tkt.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Issued Passes Database */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
            <h5 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-800">
              Live Issued Passenger Passes ({passes.length} Passes)
            </h5>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">
              Verified Ledgers
            </span>
          </div>

          {passes.length === 0 ? (
            <div className="py-8 text-center text-slate-450 font-mono text-xs border border-dashed border-slate-100 rounded">
              No live active passenger passes issued.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-widest text-[9px] bg-slate-50">
                    <th className="py-2.5 px-2">Pass ID</th>
                    <th className="py-2.5 px-2">Passenger Name</th>
                    <th className="py-2.5 px-2">Tier</th>
                    <th className="py-2.5 px-2">Expiry</th>
                    <th className="py-2.5 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {passes.map(pass => (
                    <tr key={pass.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-bold text-slate-900 truncate max-w-[90px]">{pass.id}</td>
                      <td className="py-3 px-2 text-slate-800 font-medium">{pass.user_name}</td>
                      <td className="py-3 px-2 text-slate-600">{pass.pass_type}</td>
                      <td className="py-3 px-2 text-[#991b1b] font-medium">{pass.expiry_date}</td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-800 uppercase">
                        {pass.status}
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
