import React, { useState } from 'react';
import { Ticket } from '../types';
import { api } from '../lib/api';

interface QRVerificationProps {
  tickets: Ticket[];
  onTriggerRefresh: () => void;
}

export default function QRVerification({ tickets, onTriggerRefresh }: QRVerificationProps) {
  const [qrInput, setQrInput] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<{
    status: 'valid' | 'expired' | 'already used' | 'invalid';
    message: string;
    ticket?: Ticket;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [scanFlash, setScanFlash] = useState<boolean>(false);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput) return;

    setLoading(true);
    setVerificationResult(null);
    setScanFlash(true);

    // Trigger visual scanner flash feedback
    setTimeout(() => {
      setScanFlash(false);
    }, 450);

    try {
      const data = await api.verifyQR(qrInput);
      setVerificationResult(data as any);
      onTriggerRefresh(); // refresh main wallet tickets to see dynamic updates
    } catch (err) {
      setVerificationResult({
        status: 'invalid',
        message: 'Could not communicate with the authentication server. SQL Connection offline.'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectTicketForSimulating = (code: string) => {
    setQrInput(code);
    setVerificationResult(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Scanner Console Panel */}
      <div className="bg-white text-slate-950 rounded-lg p-6 border border-slate-200 shadow-sm lg:col-span-3 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-slate-900 border-b-2 border-red-800 pb-0.5">Conductor QR Security Terminal</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase bg-transparent p-0">
            Device Active
          </span>
        </div>

        <p className="text-xs text-slate-500 font-mono">
          Simulate a physical bus boarding scanner. Submitting a QR signature audits its active flag in the Cloud PostgreSQL backend.
        </p>

        {/* Diagnostic QR Reader form */}
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
              Input Card QR Signature or Ticket Code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Paste signature, e.g. VERIFY_TKT_..."
                className="flex-1 bg-slate-50 text-slate-900 font-mono text-xs border border-slate-200 outline-none p-3 rounded focus:border-[#991b1b] font-bold"
              />
              <button
                type="submit"
                disabled={loading || !qrInput}
                className="px-5 bg-[#991b1b] hover:bg-red-700 disabled:opacity-50 text-white rounded font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                {loading ? 'Verifying...' : 'SCAN'}
              </button>
            </div>
          </div>
        </form>

        {/* Verification Render Blocks */}
        {verificationResult && (
          <div className={`mt-5 p-5 border rounded-lg font-mono text-xs space-y-4 relative overflow-hidden transition-all duration-300 ${
            scanFlash ? 'scale-102 bg-slate-100' : ''
          } ${
            verificationResult.status === 'valid'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-850'
              : verificationResult.status === 'already used'
              ? 'bg-amber-50 border-amber-200 text-amber-850'
              : verificationResult.status === 'expired'
              ? 'bg-orange-50 border-orange-200 text-orange-850'
              : 'bg-red-50 border-red-200 text-red-850'
          }`}>
            <div className="flex items-start">
              <div className="space-y-1">
                <h5 className="font-bold text-sm tracking-tight uppercase">
                  Scanner Status: {verificationResult.status}
                </h5>
                <p className="opacity-95 leading-relaxed font-semibold">{verificationResult.message}</p>
              </div>
            </div>

            {verificationResult.ticket && (
              <div className="mt-4 pt-3.5 border-t border-slate-200 grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-slate-600">
                <div>
                  <span className="block opacity-65 text-[9px] uppercase font-mono">TICKET UUID</span>
                  <span className="font-bold font-mono text-slate-900">{verificationResult.ticket.id}</span>
                </div>
                <div>
                  <span className="block opacity-65 text-[9px] uppercase font-mono">TRAVEL DATE</span>
                  <span className="font-bold font-mono text-[#991b1b]">{verificationResult.ticket.travel_date}</span>
                </div>
                <div>
                  <span className="block opacity-65 text-[9px] uppercase font-mono">STORED STATUS</span>
                  <span className="font-bold uppercase font-mono text-slate-900">{verificationResult.ticket.status}</span>
                </div>
                <div>
                  <span className="block opacity-65 text-[9px] uppercase font-mono">LEDGER TIMESTAMP</span>
                  <span className="font-mono text-slate-800 text-[10px] font-bold">{new Date(verificationResult.ticket.booking_date).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simulator Quick picker list */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm lg:col-span-2 space-y-4">
        <div>
          <h5 className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-800">
            Simulate Scan Targets
          </h5>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Click on any available user tickets inside the active session queue to load its QR code for rapid validation checks.
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs font-mono border border-dashed border-slate-100 rounded">
            No active booked tickets to test scan.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {tickets.map(tkt => (
              <button
                key={tkt.id}
                onClick={() => selectTicketForSimulating(tkt.qr_code)}
                className={`w-full text-left p-2.5 rounded border transition-colors flex justify-between items-center ${
                  qrInput === tkt.qr_code
                    ? 'border-[#991b1b] bg-[#fef2f2] text-slate-900'
                    : 'border-slate-150 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-mono text-[11px]">
                  <p className="font-bold truncate max-w-[150px]">{tkt.id}</p>
                  <p className="text-[9px] text-slate-400">Date: {tkt.travel_date}</p>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <span className={`text-[10px] uppercase font-bold ${
                    tkt.status === 'valid'
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  }`}>
                    ({tkt.status})
                  </span>
                  <p className="text-[9.5px] text-[#991b1b] font-semibold mt-0.5">₹ Fare Rate</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="bg-[#fef2f2] border border-[#fca5a5]/30 p-3 rounded font-mono text-[10px] text-slate-700 leading-relaxed space-y-1">
          <p className="font-bold text-[#991b1b]">ANTI-THEFT POLICY EXPLAINED:</p>
          <p>
            When a ticket is scanned, the status instantly flips to <b>Already Used</b> in Postgres. Subsequent scan checks trigger a double-check alert, preventing unauthorized screen-sharing or print sharing!
          </p>
        </div>
      </div>
    </div>
  );
}
