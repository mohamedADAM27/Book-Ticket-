import React, { useState } from 'react';
import { BusPass, User } from '../types';
import QRCodeSVG from './QRCodeSVG';

interface BusPassProps {
  user: User;
  passes: BusPass[];
  onPassCreated: (newPass: BusPass) => void;
  onPassRenewed: (renewedPass: BusPass) => void;
}

export default function BusPassModule({ user, passes, onPassCreated, onPassRenewed }: BusPassProps) {
  const [passType, setPassType] = useState<'Monthly' | 'Quarterly' | 'Annual'>('Monthly');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'create'>('view');

  // Multi-step form state
  const [step, setStep] = useState<number>(1);
  const [passengerId, setPassengerId] = useState<string>('PAS-9921-A');
  const [institution, setInstitution] = useState<string>('Madras Institute of Technology');
  const [deptAndYear, setDeptAndYear] = useState<string>('Computer Science & Engineering, III Yr');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'grant'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4321 5678 9876 5432');
  const [cardExpiry, setCardExpiry] = useState<string>('12/29');
  const [cardCvv, setCardCvv] = useState<string>('456');
  const [cardHolder, setCardHolder] = useState<string>(user.name || 'Alex Kumar');
  const [upiId, setUpiId] = useState<string>('alexkumar@oksbi');
  const [grantCode, setGrantCode] = useState<string>('EDU-GRANT-99A');
  const [billingAddress, setBillingAddress] = useState<string>('Clostre Road, MIT Campus, Chennai, TN, 600044');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // PG simulated payment state
  const [paymentVerifying, setPaymentVerifying] = useState<boolean>(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>('');

  const handleTabChange = (tab: 'view' | 'create') => {
    setActiveTab(tab);
    setStep(1);
    setTermsAccepted(false);
  };

  const handleIssuePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate fields based on type
    if (paymentMethod === 'card') {
      if (!cardHolder || !cardNumber || !cardExpiry || !cardCvv) {
        setError('Complete Card details (Holder, Number, Expiry, CVV) are required to complete secure check-out.');
        setLoading(false);
        return;
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        setError('Invalid credit card format: Card Number must contain exactly 16 digits.');
        setLoading(false);
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setError('Invalid UPI settlement VPA: A valid state address containing @ handles is required.');
        setLoading(false);
        return;
      }
    } else if (paymentMethod === 'grant') {
      if (!grantCode) {
        setError('Welfare voucher grant allocation code is empty or illegal.');
        setLoading(false);
        return;
      }
    }

    setPaymentVerifying(true);
    const steps = [
      "Contacting National Welfare Transit Board gateway...",
      "Decompressing transactional routing hashes...",
      "Verifying digital sandbox wallet transaction tokens...",
      "Verified! Authorization secure. Booking cryptographically-hashed pass ledger entry..."
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setPaymentStatusMessage(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 350));
      }

      const response = await fetch('/api/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          passType
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to issue new passenger bus pass');
      }

      onPassCreated(data);
      handleTabChange('view');
    } catch (err: any) {
      setError(err.message || 'Server rejected pass creation. Try again later.');
    } finally {
      setLoading(false);
      setPaymentVerifying(false);
    }
  };

  const handleRenewPass = async (passId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/passes/${passId}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Renewal failed on cloud database endpoints.');
      }

      onPassRenewed(data);
    } catch (err: any) {
      setError(err.message || 'Pass renewal system error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab control headers */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => handleTabChange('view')}
          className={`pb-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
            activeTab === 'view'
              ? 'border-[#991b1b] text-[#991b1b]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          View Registered Passes
        </button>
        <button
          onClick={() => handleTabChange('create')}
          className={`pb-2.5 px-4 font-mono text-xs uppercase tracking-wider font-semibold border-b-2 transition-colors ${
            activeTab === 'create'
              ? 'border-[#991b1b] text-[#991b1b]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          + Issue New Digital Pass
        </button>
      </div>

      {error && (
        <div className="p-3 bg-[#fef2f2] border-l-4 border-[#991b1b] text-xs text-[#991b1b] font-mono leading-relaxed">
          {error}
        </div>
      )}

      {/* VIEW PASSES */}
      {activeTab === 'view' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Your Passenger Bus Passes</h4>
            <p className="text-xs text-slate-500 font-mono">
              Displaying active and archived passenger passes managed under cloud PostgreSQL.
            </p>
          </div>

          {passes.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-lg bg-slate-50 text-center py-12 text-slate-400 font-mono text-xs">
              <span>You have no registered digital passes. Click "+ Issue New Digital Pass" to secure one instantly.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {passes.map(pass => {
                const expired = new Date(pass.expiry_date) < new Date();
                return (
                  <div
                    key={pass.id}
                    className={`relative border rounded-lg bg-white overflow-hidden p-5 flex flex-col justify-between min-h-[220px] transition-shadow duration-150 ${
                      expired ? 'border-slate-200 bg-slate-50/50' : 'border-red-200 hover:shadow-md'
                    }`}
                  >
                    {/* Header accents */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#991b1b]" />

                    <div className="space-y-4">
                      {/* Top status & ID info */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wide text-[#991b1b] font-bold">
                            ({pass.pass_type})
                          </span>
                          <p className="text-[9px] text-slate-400 font-mono uppercase mt-1">Pass ID: {pass.id}</p>
                        </div>
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                          expired ? 'text-slate-600' : 'text-emerald-750'
                        }`}>
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </div>

                      {/* Main card representation */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-mono text-slate-400 uppercase">PASS HOLDER</p>
                        <h4 className="font-bold text-base text-slate-900 class-pass-card">{pass.user_name}</h4>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-[9px] text-slate-400">ISSUE DATE</p>
                          <p>{pass.issue_date}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400">EXPIRY DATE</p>
                          <p className="font-medium text-[#991b1b]">{pass.expiry_date}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions panel */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-400 font-mono italic">
                        Secured digitally
                      </span>
                      <button
                        onClick={() => handleRenewPass(pass.id)}
                        disabled={loading}
                        className="flex items-center gap-1 py-1 px-3.5 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-50 text-white font-mono text-[10px] uppercase font-semibold tracking-wider rounded transition-colors"
                      >
                        Renew pass
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE DIGITAL PASS */}
      {activeTab === 'create' && (
        <div className="max-w-xl bg-white border border-slate-200 rounded-lg p-6 shadow-sm relative overflow-hidden">
          {paymentVerifying && (
            <div id="pass-payment-gate-overlay" className="absolute inset-0 bg-white/95 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#991b1b] animate-spin mb-4" />
              <span className="text-[10px] font-mono tracking-widest text-[#991b1b] uppercase font-bold block mb-1">
                SECURE CENTRALIZED PASS LEDGER HANDSHAKE
              </span>
              <p className="text-xs font-bold text-slate-800 mb-2">
                Simulating secure pass checkout & token check...
              </p>
              <div className="bg-[#fef2f2] border border-red-150 rounded px-4 py-2.5 text-[10.5px] font-mono text-slate-700 max-w-sm">
                {paymentStatusMessage}
              </div>
              <span className="text-[10px] text-slate-400 font-mono italic mt-4 block">
                Sandboxed SEC_PG Checkpoint Tunnel Active
              </span>
            </div>
          )}
          {/* Progress Indicator */}
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h4 className="text-sm font-bold text-slate-900">Issue Digital Passenger Pass</h4>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Multi-Stage Passenger Verification & Secure Transit Settlement
            </p>
            
            {/* Horizontal steps design */}
            <div className="grid grid-cols-4 gap-2 mt-4 text-center">
              {[
                { s: 1, label: 'Plan' },
                { s: 2, label: 'Identity' },
                { s: 3, label: 'Payment' },
                { s: 4, label: 'Agreement' }
              ].map(item => (
                <div key={item.s} className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                    step === item.s 
                      ? 'bg-[#991b1b] text-white' 
                      : step > item.s 
                      ? 'bg-[#991b1b]/10 text-[#991b1b]' 
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {item.s}
                  </div>
                  <span className={`text-[9px] font-mono uppercase mt-1 ${
                    step === item.s ? 'text-[#991b1b] font-bold' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-5">
            
            {/* STEP 1: SELECT PLAN & DURATION */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 font-bold">
                    SELECT PASS TERM DURATION
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Monthly', 'Quarterly', 'Annual'] as const).map(type => {
                      const cost = type === 'Monthly' ? '₹250' : type === 'Quarterly' ? '₹650' : '₹2100';
                      const desc = type === 'Monthly' ? '30 Days Commuter' : type === 'Quarterly' ? '90 Days Seasonal' : '365 Days Premium Annual';
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPassType(type)}
                          className={`p-3 text-left border rounded-lg cursor-pointer transition-all flex flex-col justify-between h-[90px] ${
                            passType === type
                              ? 'border-[#991b1b] bg-[#fef2f2] text-[#991b1b]'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="font-mono text-xs uppercase font-bold">{type}</span>
                          <div>
                            <span className="text-[9px] font-mono block text-slate-400 uppercase">{desc}</span>
                            <span className="text-sm font-extrabold mt-1 block">{cost}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Benefits / Fare Sheet summary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded font-mono text-xs text-slate-600 space-y-2">
                  <div className="flex justify-between pb-1.5 border-b border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Passenger Benefit Parameters</span>
                    <span className="text-[10px] text-emerald-700 font-bold">STATE REBATE APPLIED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation Authority:</span>
                    <span className="font-medium text-slate-800">State Transit Board (TN)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage Allowance:</span>
                    <span className="font-medium text-slate-800">Unlimited Campus Route Boardings</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount Rate:</span>
                    <span className="font-bold text-emerald-700">60% Passenger Subsidy Included</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-2 px-5 bg-slate-950 hover:bg-[#991b1b] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    Next: Passenger Identity
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PASSENGER INFORMATION */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-mono uppercase font-bold text-[#991b1b] mb-3">
                    Verify Passenger Credentials
                  </h5>
                  <p className="text-[11px] text-slate-500 font-mono leading-relaxed mb-4">
                    The bus pass is locked to the official database profile of the passenger. Please provide your current verification parameters.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Passenger ID Card Number
                    </label>
                    <input
                      type="text"
                      value={passengerId}
                      onChange={(e) => setPassengerId(e.target.value.toUpperCase())}
                      className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2.5 rounded outline-none focus:border-[#991b1b]"
                      placeholder="e.g. PAS-9921-A"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Department & Division Year
                    </label>
                    <input
                      type="text"
                      value={deptAndYear}
                      onChange={(e) => setDeptAndYear(e.target.value)}
                      className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2.5 rounded outline-none focus:border-[#991b1b]"
                      placeholder="e.g. CS & Eng, III Year"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                    Affiliated Educational Institution
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2.5 rounded outline-none focus:border-[#991b1b]"
                    placeholder="e.g. Madras Institute of Technology"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                    Registered Passenger Name (Locked)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.name}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 p-2.5 rounded text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-1.5 px-4 font-mono text-xs uppercase tracking-wider border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={!passengerId || !deptAndYear || !institution}
                    className="py-2 px-5 bg-slate-950 hover:bg-[#991b1b] disabled:opacity-50 text-white font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    Next: Secure Payment
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT GATEWAY SIMULATOR */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-mono uppercase font-bold text-[#991b1b] mb-1">
                    Payment Fee Settlement
                  </h5>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Outstanding Cost: <span className="font-bold text-[#991b1b]">{passType === 'Monthly' ? '₹250' : passType === 'Quarterly' ? '₹650' : '₹2100'}</span> (Subsidy rate included).
                  </p>
                </div>

                {/* Payment Option Tabs */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card' },
                    { id: 'upi', label: 'UPI Wallet' },
                    { id: 'grant', label: 'Govt Grant' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentMethod(opt.id as any)}
                      className={`py-2 px-1 text-center font-mono text-[10px] uppercase border font-semibold rounded cursor-pointer transition-colors ${
                        paymentMethod === opt.id
                          ? 'border-[#991b1b] bg-[#fef2f2] text-[#991b1b]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Option 1: Credit Card */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded outline-none focus:border-[#991b1b]"
                        placeholder="ALEX KUMAR"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                          16-Digit Card Number
                        </label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded outline-none focus:border-[#991b1b]"
                          placeholder="4321 5678 9876 5432"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                          Expiry MM/YY
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded text-center outline-none focus:border-[#991b1b]"
                          placeholder="12/29"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Option 2: UPI */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                        Government Verified UPI Address (VPA)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded outline-none focus:border-[#991b1b]"
                        placeholder="alexkumar@oksbi"
                      />
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">
                        Unified Payments Interface settlement is managed in real-time under transit servers.
                      </span>
                    </div>
                  </div>
                )}

                {/* Option 3: Govt Grant */}
                {paymentMethod === 'grant' && (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                        Passenger Welfare Grant Allocation Code
                      </label>
                      <input
                        type="text"
                        value={grantCode}
                        onChange={(e) => setGrantCode(e.target.value.toUpperCase())}
                        className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded outline-none"
                        placeholder="EDU-GRANT-99A"
                      />
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">
                        Must match active registration voucher issued by the TN Directorate of collegiate welfare.
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                    Billing / Postal Address
                  </label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2.5 rounded outline-none focus:border-[#991b1b]"
                    placeholder="Full permanent residential billing address"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-1.5 px-4 font-mono text-xs uppercase tracking-wider border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="py-2 px-5 bg-slate-950 hover:bg-[#991b1b] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer"
                  >
                    Next: Final Summary
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: LEDGER REGISTRATION AGREEMENT */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <h5 className="text-xs font-mono uppercase font-bold text-[#991b1b] mb-1">
                    Verify Registration & Core Ledgers
                  </h5>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Please review your transit ledger configurations for the <b className="font-mono text-slate-800">cloud based bus pass sytem</b> before issuance sync.
                  </p>
                </div>

                {/* Pass Bill Details Card */}
                <div className="border border-slate-200 rounded p-4 bg-slate-50 text-xs font-mono leading-relaxed space-y-2">
                  <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 font-bold uppercase tracking-wider text-slate-800 text-[10px]">
                    <span>Item Specifications</span>
                    <span>Database Status</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passenger Name:</span>
                    <span className="font-semibold text-slate-900">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passenger Unique ID:</span>
                    <span className="font-semibold text-slate-900">{passengerId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Institution:</span>
                    <span className="font-semibold text-slate-900 truncate max-w-[220px]" title={institution}>{institution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dept & Year:</span>
                    <span className="font-semibold text-slate-900">{deptAndYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transit Plan Model:</span>
                    <span className="font-semibold text-[#991b1b]">{passType} BUS PASS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Settlement Method:</span>
                    <span className="font-semibold text-slate-900 uppercase">{paymentMethod} SIMULATION</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-dashed border-slate-200 pt-1.5 text-[#991b1b]">
                    <span>Total Cost Charged:</span>
                    <span>{passType === 'Monthly' ? '₹250' : passType === 'Quarterly' ? '₹650' : '₹2100'}</span>
                  </div>
                </div>

                {/* Legally Binding Agreement Checkbox */}
                <div className="p-3 bg-red-50/50 border border-slate-100 rounded flex items-start gap-2.5">
                  <input
                    id="termsAccept"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 cursor-pointer accent-[#991b1b]"
                  />
                  <label htmlFor="termsAccept" className="text-[10px] text-slate-650 font-mono leading-normal cursor-pointer select-none">
                    Confirm that all passenger variables registered match the authorized passenger identity card. I accept that illegal pass transfers trigger state penalties.
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="py-1.5 px-4 font-mono text-xs uppercase tracking-wider border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleIssuePass}
                    disabled={loading || !termsAccepted}
                    className="py-2.5 px-6 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-50 text-white font-mono text-xs uppercase font-bold tracking-wider rounded transition-colors cursor-pointer"
                  >
                    {loading ? 'Committing To Ledger...' : 'Forge Cryptographic Pass'}
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      )}
    </div>
  );
}
