import React, { useState } from 'react';
import { Route, Ticket, User } from '../types';
import QRCodeSVG from './QRCodeSVG';
import { motion } from 'motion/react';
import { api } from '../lib/api';

interface TicketBookingProps {
  user: User;
  routes: Route[];
  onBookingSuccess: (newTicket: Ticket) => void;
}

export default function TicketBooking({ user, routes, onBookingSuccess }: TicketBookingProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [travelDate, setTravelDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Tomorrow as default
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);

  // Multi-step form state
  const [step, setStep] = useState<number>(1);
  const [passengerCardId, setPassengerCardId] = useState<string>('PAS-9921-A');
  
  // Interactive seat choice states
  const [selectedSeat, setSelectedSeat] = useState<string>('2D');
  const [seatPreference, setSeatPreference] = useState<string>('Seat 2D (Window)');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState<string>('4321 5678 9876 5432');
  const [cardExpiry, setCardExpiry] = useState<string>('12/29');
  const [cardCvv, setCardCvv] = useState<string>('456');
  const [cardHolder, setCardHolder] = useState<string>(user.name || 'Alex Kumar');
  const [upiId, setUpiId] = useState<string>('passenger@okicici');
  const [netbankingBank, setNetbankingBank] = useState<string>('State Bank of India');
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // PG Verification simulation state
  const [paymentVerifying, setPaymentVerifying] = useState<boolean>(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string>('');

  const selectedRouteObj = routes.find(r => r.id === selectedRouteId);
  const calculatedTotalCost = selectedRouteObj ? selectedRouteObj.fare + (selectedSeat.startsWith('1') ? 50 : 0) : 0;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!selectedRouteId) {
      setError('Please select an authorized route to continue.');
      setLoading(false);
      return;
    }

    if (!travelDate) {
      setError('A future travel date is required for ticket provisioning.');
      setLoading(false);
      return;
    }

    // Verify day selection is not in past
    const selectedDate = new Date(travelDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDate < today) {
      setError('Travel date cannot be in the past.');
      setLoading(false);
      return;
    }

    // Payment validation checks
    if (paymentMethod === 'card') {
      if (!cardHolder || !cardNumber || !cardExpiry || !cardCvv) {
        setError('Cardholder Name, 16-Digit Card Number, Expiry, and CVV are required.');
        setLoading(false);
        return;
      }
      if (cardNumber.replace(/\s/g, '').length !== 16) {
        setError('Invalid Credit Card format: Must represent a 16-digit card number.');
        setLoading(false);
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setError('Invalid UPI VPA address: A valid address containing @ provider handle is required.');
        setLoading(false);
        return;
      }
    }

    setPaymentVerifying(true);
    const steps = [
      "Initializing SSL/TLS Handshake pipe with Merchant banking servers...",
      "Translating credential strings into temporary dynamic transaction hashes...",
      "Contacting sandbox central routing gateway node...",
      "Authenticating virtual cards / UPI wallet signatures...",
      "Verified! Authorization Approved. Payment Token generated: SEC_PG_9912",
      "Syncing verified receipt and compiling encrypted boarding QR signature..."
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setPaymentStatusMessage(steps[i]);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      const data = await api.bookTicket(selectedRouteId, selectedSeat, travelDate, calculatedTotalCost, user.id);

      setGeneratedTicket(data);
      onBookingSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Booking transaction failed. Try again.');
    } finally {
      setLoading(false);
      setPaymentVerifying(false);
    }
  };

  const handleReset = () => {
    setGeneratedTicket(null);
    setStep(1);
    setSelectedRouteId('');
    setTermsAccepted(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* booking Form Container */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm lg:col-span-3 space-y-5 relative overflow-hidden">
        {paymentVerifying && (
          <div id="payment-gate-overlay" className="absolute inset-0 bg-white/95 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-[#991b1b] animate-spin mb-4" />
            <span className="text-[10px] font-mono tracking-widest text-[#991b1b] uppercase font-bold block mb-1">
              SECURE REGULATED PAYMENT GATEWAY
            </span>
            <p className="text-xs font-bold text-slate-800 mb-2">
              Verifying Transaction Credentials & Issuing Token...
            </p>
            <div className="bg-[#fef2f2] border border-red-100 rounded px-4 py-2.5 text-[10.5px] font-mono text-slate-700 max-w-sm">
              {paymentStatusMessage}
            </div>
            <span className="text-[10px] text-slate-400 font-mono italic mt-4 block">
              Sandboxed SEC_PG Checkpoint Tunnel Active
            </span>
          </div>
        )}
        <div>
          <p className="text-[10px] font-mono tracking-widest text-[#991b1b] uppercase">
            Centralized Fare Ticketing
          </p>
          <h3 className="text-lg font-bold text-slate-900 mt-1">Book Route Ticket</h3>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Pricing calculated automatically via Central database. Manual modifications are restricted.
          </p>
          
          {/* Step indicator */}
          <div className="grid grid-cols-4 gap-1.5 mt-4 text-center">
            {[
              { s: 1, label: 'Route' },
              { s: 2, label: 'Details' },
              { s: 3, label: 'Payment' },
              { s: 4, label: 'Checkout' }
            ].map(item => (
              <div key={item.s} className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                  step === item.s 
                    ? 'bg-[#991b1b] text-white' 
                    : step > item.s 
                    ? 'bg-[#991b1b]/10 text-[#991b1b]' 
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {item.s}
                </div>
                <span className={`text-[8.5px] font-mono uppercase mt-1 ${
                  step === item.s ? 'text-[#991b1b] font-bold' : 'text-slate-400'
                }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#fef2f2] border-l-4 border-[#991b1b] text-xs text-[#991b1b] font-mono">
            {error}
          </div>
        )}

        <div className="space-y-4">
          
          {/* STEP 1: ROUTE & DATE SELECTION */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Route Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase mb-1.5 font-semibold">
                  Authorized Dialect Route (Tamilnadu Districts)
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 outline-none p-2.5 rounded focus:border-[#991b1b] focus:ring-1 focus:ring-[#fee2e2]"
                  required
                >
                  <option value="">-- Choose Route from Core DB --</option>
                  {routes.map((route) => (
                    <option key={route.id} value={route.id}>
                      {route.source} to {route.destination} ({route.duration})
                    </option>
                  ))}
                </select>
              </div>

              {/* Central Fare Box */}
              {selectedRouteObj ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="border-r border-slate-200/60 font-semibold text-slate-800">
                    <p className="text-[9px] text-slate-400 uppercase">Fare Cost</p>
                    <p className="text-lg font-bold text-[#991b1b] mt-0.5">₹{selectedRouteObj.fare}</p>
                  </div>
                  <div className="border-r border-slate-200/60 font-semibold text-slate-800">
                    <p className="text-[9px] text-slate-400 uppercase">Est. Duration</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1">{selectedRouteObj.duration}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 uppercase">Provider ID</p>
                    <p className="text-sm font-semibold text-slate-800 mt-1 truncate">{selectedRouteObj.id}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded text-center py-5 text-xs text-slate-400 font-mono italic">
                  Select a route above to compute fare automatically.
                </div>
              )}

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-mono text-slate-700 uppercase mb-1.5 font-semibold">
                  Departure Travel Date
                </label>
                <input
                  type="date"
                  required
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full text-xs font-mono bg-transparent border border-slate-200 outline-none p-2.5 rounded focus:border-[#991b1b]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedRouteId || !travelDate}
                  onClick={() => setStep(2)}
                  className="py-2 px-5 bg-slate-950 hover:bg-[#991b1b] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  Next: Passenger Details
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PASSENGER PREFERENCES & SEAT CHOOSING */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-mono uppercase font-bold text-[#991b1b] mb-1">
                  Choose Your Passenger Seat
                </h5>
                <p className="text-[11px] text-slate-500 font-mono leading-relaxed mb-3">
                  Click on an available seat in the luxury coach layout below to select it. Front row seats (Row 1) include premium low-vibration upgrades (+₹50).
                </p>
              </div>

              {/* Graphic Seat choosing layout */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4 max-w-sm mx-auto shadow-inner">
                <div className="text-center text-[10px] uppercase font-mono tracking-wider font-bold text-slate-450 mb-3 flex items-center justify-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <span>DRIVER CABIN / FRONT</span>
                </div>

                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5].map(rowNum => (
                    <div key={rowNum} className="flex justify-between items-center gap-2">
                      {/* Left: Seats A & B */}
                      <div className="flex gap-2">
                        {['A', 'B'].map(colId => {
                          const seatId = `${rowNum}${colId}`;
                          const isOccupied = ['1B', '2C', '3A', '4D', '5B'].includes(seatId);
                          const isSelected = selectedSeat === seatId;
                          const isPremium = rowNum === 1;
                          return (
                            <button
                              key={seatId}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => {
                                setSelectedSeat(seatId);
                                const label = isPremium 
                                  ? `Premium Seat ${seatId} (Front Row)` 
                                  : `Seat ${seatId} (${colId === 'A' ? 'Window' : 'Aisle'})`;
                                setSeatPreference(label);
                              }}
                              className={`w-9 h-9 rounded-md border text-[9.5px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                                isOccupied
                                  ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-40'
                                  : isSelected
                                  ? 'bg-[#991b1b] border-[#991b1b] text-white ring-2 ring-red-200 shadow-sm'
                                  : 'bg-white hover:bg-[#fff5f5] text-slate-700 border-slate-200 hover:border-[#991b1b]/30'
                              }`}
                            >
                              <span>{seatId}</span>
                              {isPremium && !isSelected && !isOccupied && (
                                <span className="text-[6.5px] text-[#991b1b] absolute top-0 right-0.5 font-bold">★</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Travel Aisle passage spacer */}
                      <span className="text-[8.5px] font-mono tracking-wider text-slate-300 pointer-events-none select-none select-none h-9 flex items-center text-center px-1 font-semibold">
                         AISLE
                      </span>

                      {/* Right: Seats C & D */}
                      <div className="flex gap-2">
                        {['C', 'D'].map(colId => {
                          const seatId = `${rowNum}${colId}`;
                          const isOccupied = ['1B', '2C', '3A', '4D', '5B'].includes(seatId);
                          const isSelected = selectedSeat === seatId;
                          const isPremium = rowNum === 1;
                          return (
                            <button
                              key={seatId}
                              type="button"
                              disabled={isOccupied}
                              onClick={() => {
                                setSelectedSeat(seatId);
                                const label = isPremium 
                                  ? `Premium Seat ${seatId} (Front Row)` 
                                  : `Seat ${seatId} (${colId === 'D' ? 'Window' : 'Aisle'})`;
                                setSeatPreference(label);
                              }}
                              className={`w-9 h-9 rounded-md border text-[9.5px] font-mono font-bold flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                                isOccupied
                                  ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed opacity-40'
                                  : isSelected
                                  ? 'bg-[#991b1b] border-[#991b1b] text-white ring-2 ring-red-200 shadow-sm'
                                  : 'bg-white hover:bg-[#fff5f5] text-slate-700 border-slate-200 hover:border-[#991b1b]/30'
                              }`}
                            >
                              <span>{seatId}</span>
                              {isPremium && !isSelected && !isOccupied && (
                                <span className="text-[6.5px] text-[#991b1b] absolute top-0 right-0.5 font-bold">★</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Legend panel */}
                <div className="grid grid-cols-3 gap-1 mt-4 pt-2.5 border-t border-slate-200 font-mono text-[8.5px] text-slate-400 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded bg-white border border-slate-200 block" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded bg-[#991b1b] block" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded bg-slate-200 block" />
                    <span>Occupied</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                    Passenger ID Card Code
                  </label>
                  <input
                    type="text"
                    value={passengerCardId}
                    onChange={(e) => setPassengerCardId(e.target.value.toUpperCase())}
                    className="w-full text-xs font-mono bg-transparent border border-slate-200 p-2.5 rounded outline-none focus:border-[#991b1b]"
                    placeholder="e.g. PAS-9921-A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                    Current Allotted Seat
                  </label>
                  <input
                    type="text"
                    disabled
                    value={seatPreference}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-200 p-2.5 rounded text-[#991b1b] font-bold"
                  />
                </div>
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
                  disabled={!passengerCardId || !selectedSeat}
                  className="py-2 px-5 bg-slate-950 hover:bg-[#991b1b] text-white font-mono text-xs uppercase tracking-wider rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  Next: Secure Settlement
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SECURE TRANSACTION PAYMENT */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-mono uppercase font-bold text-[#991b1b] mb-1">
                  Ticket Fare Secure Settlement
                </h5>
                <p className="text-[11px] text-slate-500 font-mono">
                  Outstanding Cost: <span className="font-bold text-[#991b1b]">₹{calculatedTotalCost}</span> (Real-time transit tax included).
                </p>
              </div>

              {/* Payment Tabs */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'card', label: 'Credit Card' },
                  { id: 'upi', label: 'UPI Wallet' },
                  { id: 'netbanking', label: 'Net Banking' }
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

              {/* Credit Card Input */}
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

              {/* UPI Input */}
              {paymentMethod === 'upi' && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Government UPI ID address
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded outline-none focus:border-[#991b1b]"
                      placeholder="passenger@okicici"
                    />
                    <span className="text-[9px] text-slate-400 font-mono block mt-1">
                      Pay instantly via any UPI app (GPay, PhonePe, BHIM, Paytm).
                    </span>
                  </div>
                </div>
              )}

              {/* Net Banking Input */}
              {paymentMethod === 'netbanking' && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded">
                  <div>
                    <label className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                      Select Retail Bank Node
                    </label>
                    <select
                      value={netbankingBank}
                      onChange={(e) => setNetbankingBank(e.target.value)}
                      className="w-full text-xs font-mono bg-white border border-slate-200 p-2 rounded outline-none"
                    >
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Canara Bank">Canara Bank</option>
                    </select>
                    <span className="text-[9px] text-slate-400 font-mono block mt-1">
                      Redirects to our sandbox secure banking server page on confirmation.
                    </span>
                  </div>
                </div>
              )}

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
                  Next: Final checkout
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: LEDGER REGISTRATION & CHECKOUT AGREEMENT */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h5 className="text-xs font-mono uppercase font-bold text-[#991b1b] mb-1">
                  Final Checkout & Core Ledger Sync
                </h5>
                <p className="text-[11px] text-slate-500 font-mono">
                  Please review your reservation parameters before launching cryptographic sync.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="border border-slate-200 rounded p-4 bg-slate-50 text-xs font-mono leading-relaxed space-y-2">
                <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 font-bold uppercase tracking-wider text-slate-800 text-[10px]">
                  <span>Item Description</span>
                  <span>Database status</span>
                </div>
                <div className="flex justify-between">
                  <span>Passenger Name:</span>
                  <span className="font-semibold text-slate-900">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passenger ID Card:</span>
                  <span className="font-semibold text-slate-900">{passengerCardId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chosen Route:</span>
                  <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                    {selectedRouteObj ? `${selectedRouteObj.source} → ${selectedRouteObj.destination}` : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Travel Departure:</span>
                  <span className="font-semibold text-slate-900">{travelDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Seat Allocation:</span>
                  <span className="font-semibold text-slate-900 uppercase">{seatPreference}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settlement Method:</span>
                  <span className="font-semibold text-slate-900 uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-dashed border-slate-200 pt-1.5 text-[#991b1b]">
                  <span>Total Due Charged:</span>
                  <span>₹{calculatedTotalCost}</span>
                </div>
              </div>

              {/* Legally Binding Agreement Checkbox */}
              <div className="p-3 bg-red-50/50 border border-slate-100 rounded flex items-start gap-2.5">
                <input
                  id="ticketTermsAccept"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 cursor-pointer accent-[#991b1b]"
                />
                <label htmlFor="ticketTermsAccept" className="text-[10px] text-slate-650 font-mono leading-normal cursor-pointer select-none">
                  Confirm reservation data is accurate. I acknowledge single-use check-in constraints.
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
                  onClick={handleBookingSubmit}
                  disabled={loading || !termsAccepted}
                  className="py-2.5 px-6 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-50 text-white font-mono text-xs uppercase font-bold tracking-wider rounded transition-colors cursor-pointer"
                >
                  {loading ? 'Routing reservation...' : 'Reserve ticket & Generate QR'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Generated Ticket Panel */}
      <div className="lg:col-span-2 flex flex-col justify-start">
        {generatedTicket ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            id="ticket-booking-qr-anim"
            className="bg-white border-2 border-dashed border-slate-200 rounded-lg p-5 shadow-sm space-y-4 relative"
          >
            <div className="text-center pb-3 border-b border-dashed border-slate-200">
              <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase">
                ({generatedTicket.status})
              </span>
              <h4 className="font-bold text-sm tracking-tight text-slate-900 mt-2 font-mono uppercase">
                Transit Boarding Ticket
              </h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Ticket ID: {generatedTicket.id}
              </p>
            </div>

            {/* QR Generation */}
            <div className="flex justify-center py-2 bg-slate-50 border border-slate-100 rounded">
              <QRCodeSVG value={generatedTicket.qr_code} size={130} />
            </div>

            {/* Ticket details */}
            <div className="space-y-2.5 font-mono text-xs text-slate-600 border-t border-dashed border-slate-200 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase">Route</span>
                <span className="text-slate-800 font-bold">
                  {selectedRouteObj ? `${selectedRouteObj.source} → ${selectedRouteObj.destination}` : 'Tamilnadu Central Route'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase">Departure</span>
                <span className="text-slate-800 font-bold">{generatedTicket.travel_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase">Allotted Seat</span>
                <span className="text-slate-800 font-bold uppercase">{seatPreference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 text-[10px] uppercase">Authorized Fare</span>
                <span className="text-[#991b1b] font-bold">
                  ₹{calculatedTotalCost}
                </span>
              </div>
              <div className="flex justify-between text-[10px] border-t border-slate-100 pt-2 text-slate-400">
                <span>Pushed to DB:</span>
                <span>{new Date(generatedTicket.booking_date).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="text-emerald-800 font-mono text-[10px] leading-relaxed">
              Digitally Provisioned! Show the generated QR code above to the scanner device at checkout.
            </div>

            <button
              onClick={handleReset}
              className="w-full py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded font-mono text-[10px] uppercase transition-colors"
            >
              Book Another Route
            </button>
          </motion.div>
        ) : (
          <div className="h-full border border-dashed border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-8 text-center text-slate-400 font-mono text-xs min-h-[350px]">
            <span>Reserved ticket output will generate here automatically with QR cryptographic signature.</span>
          </div>
        )}
      </div>
    </div>
  );
}
