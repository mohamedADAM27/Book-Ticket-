export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
  role?: 'passenger' | 'admin';
}

export interface Route {
  id: string;
  source: string;
  destination: string;
  fare: number;
  duration: string; // e.g., "6h 30m"
}

export interface Ticket {
  id: string;
  user_id: string;
  route_id: string;
  booking_date: string;
  travel_date: string;
  qr_code: string;
  status: 'valid' | 'expired' | 'already used' | 'invalid';
}

export interface BusPass {
  id: string;
  user_id: string;
  user_name: string;
  pass_type: 'Monthly' | 'Quarterly' | 'Annual';
  issue_date: string;
  expiry_date: string;
  status: 'Active' | 'Expired';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'auth' | 'ticket' | 'pass' | 'route' | 'system' | 'autoscaling';
  message: string;
}

export interface SystemMetrics {
  totalRequests: number;
  avgResponseTimeMs: number;
  activeUsers: number;
  errorCount: number;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  activeInstances: number; // autoscaling count
  loadBalancerStatus: 'healthy' | 'warning' | 'degraded';
}
