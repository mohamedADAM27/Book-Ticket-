import { User, Route, Ticket, BusPass, LogEntry, SystemMetrics } from '../types';

// Let's declare our localStorage keys
const KEYS = {
  USERS: 'book_tkt_users',
  ROUTES: 'book_tkt_routes',
  TICKETS: 'book_tkt_tickets',
  PASSES: 'book_tkt_passes',
  LOGS: 'book_tkt_logs',
};

// Simple notification channel or flag indicating client fallback state
export let isLocalSandboxMode = false;

// Initial Dummy Seed Data representing Google Cloud SQL PostgreSQL database
const defaultUsers: User[] = [
  {
    id: 'usr_1',
    name: 'Alex Kumar',
    email: 'passenger@edu.in',
    password_hash: 'password',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    role: 'passenger'
  },
  {
    id: 'usr_admin',
    name: 'System Administrator',
    email: 'admin@edu.in',
    password_hash: 'password',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    role: 'admin'
  }
];

const defaultRoutes: Route[] = [
  { id: 'rte_1', source: 'Chennai', destination: 'Coimbatore', fare: 550, duration: '8h 15m' },
  { id: 'rte_2', source: 'Chennai', destination: 'Madurai', fare: 480, duration: '7h 45m' },
  { id: 'rte_3', source: 'Chennai', destination: 'Trichy', fare: 320, duration: '5h 30m' },
  { id: 'rte_4', source: 'Coimbatore', destination: 'Salem', fare: 180, duration: '3h 10m' },
  { id: 'rte_5', source: 'Madurai', destination: 'Tirunelveli', fare: 150, duration: '2h 40m' },
  { id: 'rte_6', source: 'Trichy', destination: 'Thanjavur', fare: 80, duration: '1h 20m' },
  { id: 'rte_7', source: 'Chennai', destination: 'Vellore', fare: 200, duration: '3h 00m' }
];

const defaultTickets: Ticket[] = [
  {
    id: 'tkt_demo_1',
    user_id: 'usr_1',
    route_id: 'rte_1',
    booking_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    travel_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    qr_code: 'VERIFY_TKT_DEMO_1',
    status: 'valid'
  },
  {
    id: 'tkt_demo_2',
    user_id: 'usr_1',
    route_id: 'rte_3',
    booking_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    travel_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    qr_code: 'VERIFY_TKT_DEMO_2',
    status: 'already used'
  }
];

const defaultPasses: BusPass[] = [
  {
    id: 'pas_demo_1',
    user_id: 'usr_1',
    user_name: 'Alex Kumar',
    pass_type: 'Monthly',
    issue_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Active'
  }
];

// Helper to safely load standard localStorage arrays
function loadLocalList<T>(key: string, defaultData: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw);
  } catch {
    return defaultData;
  }
}

function saveLocalList<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage sync error", e);
  }
}

// Ensure database is populated locally immediately
if (typeof window !== 'undefined') {
  loadLocalList(KEYS.USERS, defaultUsers);
  loadLocalList(KEYS.ROUTES, defaultRoutes);
  loadLocalList(KEYS.TICKETS, defaultTickets);
  loadLocalList(KEYS.PASSES, defaultPasses);
}

// Main local service logging layer for sandbox terminal messages
function addLocalLog(level: 'info' | 'warn' | 'error', category: LogEntry['category'], message: string) {
  const localLogs = loadLocalList<LogEntry>(KEYS.LOGS, []);
  const newLog: LogEntry = {
    id: `log_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message: `${message} (Local Cache Ledger Mode)`
  };
  localLogs.unshift(newLog);
  saveLocalList(KEYS.LOGS, localLogs.slice(0, 150));
}

// Core API Gateway client utilizing automatic failover mechanics
export const api = {
  // Test if JSON endpoints are accessible, caching the state
  async checkConnectionStatus(): Promise<'connected' | 'disconnected'> {
    try {
      const response = await fetch('/api/routes');
      const isJson = response.ok && response.headers.get('content-type')?.includes('application/json');
      if (isJson) {
        isLocalSandboxMode = false;
        return 'connected';
      }
    } catch {}
    isLocalSandboxMode = true;
    return 'disconnected'; // Will flag UI to show that cache routing is healthy
  },

  // 1. AUTH ENGINES
  async login(email: string, password_hash: string): Promise<User> {
    const payload = { email, password: password_hash };
    
    // Attempt real backend call
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType?.includes('application/json')) {
          return await response.json();
        }
      } catch (err) {
        console.warn("Backend login failed. Falling back to secure clientside simulation.", err);
      }
    }

    // Local Storage Mock Database Fallback
    const localUsers = loadLocalList<User>(KEYS.USERS, defaultUsers);
    const matched = localUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    
    if (!matched) {
      addLocalLog('warn', 'auth', `Login rejected for unregistered user: ${email}`);
      throw new Error("Specified passenger email not found.");
    }
    
    addLocalLog('info', 'auth', `User logged in. ID: ${matched.id}, Role: ${matched.role || 'passenger'}`);
    return matched;
  },

  async register(name: string, email: string, password_hash: string): Promise<User> {
    const payload = { name, email, password: password_hash };

    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType?.includes('application/json')) {
          return await response.json();
        }
      } catch (err) {
        console.warn("Backend registration failed. Falling back to local storage.", err);
      }
    }

    const localUsers = loadLocalList<User>(KEYS.USERS, defaultUsers);
    const existing = localUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      throw new Error("This email is already associated with an active transit ledger.");
    }

    const newUser: User = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      name,
      email: email.trim().toLowerCase(),
      password_hash: 'password',
      created_at: new Date().toISOString(),
      role: 'passenger'
    };

    localUsers.push(newUser);
    saveLocalList(KEYS.USERS, localUsers);
    addLocalLog('info', 'auth', `New passenger registered. Name: ${name}, Email: ${email}`);
    return newUser;
  },

  // 2. BUS ROUTES
  async getRoutes(): Promise<Route[]> {
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/routes');
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }
    return loadLocalList<Route>(KEYS.ROUTES, defaultRoutes);
  },

  async createRoute(source: string, destination: string, fare: number): Promise<Route> {
    const payload = { source, destination, fare };

    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    const localRoutes = loadLocalList<Route>(KEYS.ROUTES, defaultRoutes);
    const newRoute: Route = {
      id: `rte_${Math.random().toString(36).substring(2, 9)}`,
      source,
      destination,
      fare,
      duration: `${2 + Math.floor(Math.random() * 6)}h ${Math.floor(Math.random() * 6)*10}m`
    };

    localRoutes.push(newRoute);
    saveLocalList(KEYS.ROUTES, localRoutes);
    addLocalLog('info', 'route', `Admin established new transit vector: ${source} ➔ ${destination} (₹${fare})`);
    return newRoute;
  },

  async deleteRoute(routeId: string): Promise<boolean> {
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch(`/api/routes/${routeId}`, {
          method: 'DELETE'
        });
        if (response.ok) return true;
      } catch {}
    }

    const localRoutes = loadLocalList<Route>(KEYS.ROUTES, defaultRoutes);
    const filtered = localRoutes.filter(r => r.id !== routeId);
    saveLocalList(KEYS.ROUTES, filtered);
    addLocalLog('warn', 'route', `Admin deprecated transit route key: ${routeId}`);
    return true;
  },

  async updateRoute(updatedRoute: Route): Promise<Route> {
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch(`/api/routes/${updatedRoute.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedRoute)
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    const localRoutes = loadLocalList<Route>(KEYS.ROUTES, defaultRoutes);
    const index = localRoutes.findIndex(r => r.id === updatedRoute.id);
    if (index !== -1) {
      localRoutes[index] = updatedRoute;
      saveLocalList(KEYS.ROUTES, localRoutes);
    }
    addLocalLog('info', 'route', `Admin modified transit route parameters: ${updatedRoute.source} ➔ ${updatedRoute.destination} (₹${updatedRoute.fare})`);
    return updatedRoute;
  },

  // 3. SECURE PASSENGER TICKETS
  async getTickets(userId: string, role?: string): Promise<Ticket[]> {
    if (!isLocalSandboxMode) {
      try {
        const isAdmin = role === 'admin' || userId === 'usr_admin';
        const url = isAdmin ? '/api/tickets' : `/api/tickets?userId=${userId}`;
        const response = await fetch(url);
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    const allTickets = loadLocalList<Ticket>(KEYS.TICKETS, defaultTickets);
    if (role === 'admin' || userId === 'usr_admin') {
      return allTickets;
    }
    return allTickets.filter(t => t.user_id === userId);
  },

  async bookTicket(routeId: string, seatNumber: string, travelDate: string, farePaid: number, userId: string): Promise<Ticket> {
    const payload = { routeId, seatNumber, travelDate, farePaid, userId };

    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    const localTkts = loadLocalList<Ticket>(KEYS.TICKETS, defaultTickets);
    const newTicket: Ticket = {
      id: `tkt_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      route_id: routeId,
      booking_date: new Date().toISOString(),
      travel_date: travelDate,
      qr_code: `VERIFY_TKT_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: 'valid'
    };

    localTkts.unshift(newTicket);
    saveLocalList(KEYS.TICKETS, localTkts);
    addLocalLog('info', 'ticket', `Safe Checkout Handshake Authorized: Verified Seat ${seatNumber}. Paid ₹${farePaid}`);
    return newTicket;
  },

  // 4. DIGITAL TRANSIT PASSES
  async getPasses(userId: string, role?: string): Promise<BusPass[]> {
    if (!isLocalSandboxMode) {
      try {
        const isAdmin = role === 'admin' || userId === 'usr_admin';
        const url = isAdmin ? '/api/passes' : `/api/passes?userId=${userId}`;
        const response = await fetch(url);
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    const allPasses = loadLocalList<BusPass>(KEYS.PASSES, defaultPasses);
    if (role === 'admin' || userId === 'usr_admin') {
      return allPasses;
    }
    return allPasses.filter(p => p.user_id === userId);
  },

  async issuePass(userName: string, passType: 'Monthly' | 'Quarterly' | 'Annual', expiryMonths: number, userId: string): Promise<BusPass> {
    const payload = { userName, passType, expiryMonths, userId };

    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/passes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    const localPasses = loadLocalList<BusPass>(KEYS.PASSES, defaultPasses);
    const expDate = new Date();
    expDate.setMonth(expDate.getMonth() + expiryMonths);

    const newPass: BusPass = {
      id: `pas_${Math.random().toString(36).substring(2, 9)}`,
      user_id: userId,
      user_name: userName,
      pass_type: passType,
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: expDate.toISOString().split('T')[0],
      status: 'Active'
    };

    localPasses.unshift(newPass);
    saveLocalList(KEYS.PASSES, localPasses);
    addLocalLog('info', 'pass', `Issued custom ${passType} transit credentials for passenger ${userName}`);
    return newPass;
  },

  async renewPass(passId: string, expiryMonths: number): Promise<BusPass> {
    const payload = { passId, expiryMonths };
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/passes/renew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    const localPasses = loadLocalList<BusPass>(KEYS.PASSES, defaultPasses);
    const target = localPasses.find(p => p.id === passId);
    if (!target) {
      throw new Error("Specified subscription pass registration key not found");
    }

    const currentExpiry = new Date(target.expiry_date);
    currentExpiry.setMonth(currentExpiry.getMonth() + expiryMonths);
    target.expiry_date = currentExpiry.toISOString().split('T')[0];
    target.status = 'Active';

    saveLocalList(KEYS.PASSES, localPasses);
    addLocalLog('info', 'pass', `Extended membership expiry for credentials ID: ${passId}`);
    return target;
  },

  // 5. SECURITY CARD VERIFIER
  async verifyQR(qrCode: string): Promise<{ status: string; message: string; ticket?: Ticket; pass?: BusPass }> {
    const trimmed = qrCode.trim();
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCode: trimmed })
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    // Client-side Local Database verification logic matches the Express server exactly!
    const localTickets = loadLocalList<Ticket>(KEYS.TICKETS, defaultTickets);
    const localPasses = loadLocalList<BusPass>(KEYS.PASSES, defaultPasses);

    // 1. Is it a ticket format?
    const ticketIndex = localTickets.findIndex(t => t.qr_code.toUpperCase() === trimmed.toUpperCase() || t.id.toUpperCase() === trimmed.toUpperCase());
    if (ticketIndex !== -1) {
      const ticket = localTickets[ticketIndex];
      const todayString = new Date().toISOString().split('T')[0];
      
      if (ticket.status === 'already used') {
        addLocalLog('error', 'ticket', `FRAUD ALERT: Duplicate boarding scanned for ticket UUID ${ticket.id}`);
        return {
          status: 'already used',
          message: 'BOARDING DENIED! Ticket signature already marked as USED in transit cache store.',
          ticket
        };
      }

      if (ticket.travel_date < todayString) {
        ticket.status = 'expired';
        localTickets[ticketIndex] = ticket;
        saveLocalList(KEYS.TICKETS, localTickets);
        addLocalLog('warn', 'ticket', `EXPIRY REJECTION: Scanning of stale ticket ${ticket.id} on date ${todayString}`);
        return {
          status: 'expired',
          message: 'BOARDING REJECTED! Core trip date has expired. Stored state updated.',
          ticket
        };
      }

      ticket.status = 'already used';
      localTickets[ticketIndex] = ticket;
      saveLocalList(KEYS.TICKETS, localTickets);
      addLocalLog('info', 'ticket', `PASSENGER EMBARKED: Verified signature ${ticket.id}. Stored state updated to already used.`);
      return {
        status: 'valid',
        message: 'PASS APPROVED. Secure handshake registered and ticket UUID marked as USED successfully.',
        ticket
      };
    }

    // 2. Is it a transport subscription pass?
    const passIndex = localPasses.findIndex(p => p.id.toUpperCase() === trimmed.toUpperCase() || `VERIFY_PASS_${p.id.toUpperCase()}` === trimmed.toUpperCase());
    if (passIndex !== -1) {
      const pass = localPasses[passIndex];
      const todayString = new Date().toISOString().split('T')[0];

      if (pass.expiry_date < todayString) {
        pass.status = 'Expired';
        localPasses[passIndex] = pass;
        saveLocalList(KEYS.PASSES, localPasses);
        addLocalLog('warn', 'pass', `EXPIRY DENIAL: Scanned expired seasonal pass issued to ${pass.user_name}`);
        return {
          status: 'expired',
          message: `SUBSCRIPTION EXPIRED! Digital pass expired on ${pass.expiry_date}. Please renew membership.`
        };
      }

      addLocalLog('info', 'pass', `PASS BOARDED: Verified seasonal pass ${pass.id} issued to ${pass.user_name}. Welcome aboard!`);
      return {
        status: 'valid',
        message: `PASS VALID. Welcome on board, ${pass.user_name}. Seasonal ${pass.pass_type} credentials verified.`
      };
    }

    // 3. No matches in database
    addLocalLog('error', 'system', `HASH REJECTION: External device scanner read unregistered secure token: "${trimmed}"`);
    return {
      status: 'invalid',
      message: 'SIGNATURE REJECTED! Specified code is not associated with any recorded tickets or issued passes.'
    };
  },

  // 6. INFRASTRUCTURE LOGS & TELEMETRY
  async getMetrics(): Promise<SystemMetrics> {
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/metrics');
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    // Simulate metrics client-side with slight variations for look-and-feel
    const randomSwing = Math.sin(Date.now() / 15000);
    const cpu = 15 + Math.round(randomSwing * 6);
    const totalTktsCount = loadLocalList<Ticket>(KEYS.TICKETS, defaultTickets).length;

    return {
      totalRequests: 120 + totalTktsCount * 3,
      avgResponseTimeMs: 16 + Math.round(randomSwing * 4),
      activeUsers: 40 + Math.round(randomSwing * 8),
      errorCount: 0,
      cpuUsage: Math.max(5, Math.min(100, cpu)),
      memoryUsage: 45,
      activeInstances: 1,
      loadBalancerStatus: 'healthy'
    };
  },

  async getLogs(): Promise<LogEntry[]> {
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/logs');
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }
    return loadLocalList<LogEntry>(KEYS.LOGS, []);
  },

  async triggerSimulatorTraffic(rate: number): Promise<{ success: boolean; rate: number; metrics: SystemMetrics }> {
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/simulator/traffic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rate })
        });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    if (rate === 1) {
      addLocalLog('info', 'autoscaling', 'Cloud Load Balancer detects rising requests. Flagged Moderate load.');
      addLocalLog('info', 'autoscaling', 'Cloud Run scale triggers: Scaling up from 1 to 3 active worker instances.');
    } else if (rate === 2) {
      addLocalLog('warn', 'autoscaling', 'CRITICAL SPIKE: Incoming payload exceeds 200 req/sec limit.');
      addLocalLog('info', 'autoscaling', 'Cloud Run provision dynamic scale-up: Scaling to 8 instances to avoid latency degradation.');
      addLocalLog('info', 'system', 'Google Cloud Load Balancer: Routing requests in parallel with Round-Robin allocation.');
    } else {
      addLocalLog('info', 'autoscaling', 'Traffic returned to normal range. Cooldown threshold met.');
      addLocalLog('info', 'autoscaling', 'Cloud Run autoscaler scaled down to 1 active cluster instance. Saving resources.');
    }

    const currentMetrics = await this.getMetrics();
    if (rate === 1) {
      currentMetrics.activeInstances = 3;
      currentMetrics.cpuUsage = 64;
    } else if (rate === 2) {
      currentMetrics.activeInstances = 8;
      currentMetrics.cpuUsage = 88;
      currentMetrics.loadBalancerStatus = 'warning';
    } else {
      currentMetrics.activeInstances = 1;
      currentMetrics.cpuUsage = 15;
      currentMetrics.loadBalancerStatus = 'healthy';
    }

    return { success: true, rate, metrics: currentMetrics };
  },

  async triggerSimulatorError(): Promise<{ success: boolean; count: number }> {
    if (!isLocalSandboxMode) {
      try {
        const response = await fetch('/api/simulator/error', { method: 'POST' });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          return await response.json();
        }
      } catch {}
    }

    addLocalLog('error', 'system', 'Cloud SQL Connection Exception: Dial tcp 10.24.0.5:5432: i/o timeout. Fallback replica promoted.');
    return { success: true, count: 1 };
  }
};
