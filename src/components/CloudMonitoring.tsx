import React, { useState, useEffect } from 'react';
import { SystemMetrics, LogEntry } from '../types';
import { api } from '../lib/api';

export default function CloudMonitoring() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [trafficRate, setTrafficRate] = useState<number>(0); // 0, 1, or 2
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchMetricsAndLogs = async () => {
    setUpdating(true);
    try {
      const [mData, lData] = await Promise.all([
        api.getMetrics(),
        api.getLogs()
      ]);
      setMetrics(mData);
      setLogs(lData);
    } catch (err) {
      console.error('Error fetching metrics from Express endpoints', err);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchMetricsAndLogs();
    // Poll metrics every 3 seconds to show live simulation
    const timer = setInterval(() => {
      fetchMetricsAndLogs();
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleTrafficChange = async (rate: number) => {
    setLoading(true);
    try {
      const data = await api.triggerSimulatorTraffic(rate);
      setTrafficRate(rate);
      if (data.success) {
        setMetrics(data.metrics);
      }
      setTimeout(fetchMetricsAndLogs, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerError = async () => {
    try {
      await api.triggerSimulatorError();
      setTimeout(fetchMetricsAndLogs, 100);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cloud control header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white text-slate-900 p-5 rounded-lg border border-slate-200 shadow-sm animate-fade-in">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-[#991b1b] uppercase font-bold">
            Operations Management Node
          </span>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">Google Cloud Console Simulator</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Cloud Run Service: <span className="text-[#991b1b] font-semibold">bus-pass-service-v1</span> | Region: <span className="text-slate-800 font-semibold">asia-south1</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMetricsAndLogs}
            disabled={updating}
            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-slate-700 font-mono text-[10px] cursor-pointer transition-colors"
          >
            Fetch Telemetry
          </button>
        </div>
      </div>

      {/* INFRASTRUCTURE CONTROLLER */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <h4 className="text-xs font-mono uppercase font-bold text-[#991b1b]">
            Simulator Controls & Scaling Stimulators
          </h4>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Increase traffic payload to see Google Cloud Run trigger auto-scaling thresholds. Simulate direct Database faults to trace failovers.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {/* Traffic Regulator */}
          <div className="flex-1 space-y-1.5">
            <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">REGULATE SYNTHETIC LOAD</span>
            <div className="grid grid-cols-3 gap-1 border border-slate-200 p-1 bg-slate-50 rounded">
              {([0, 1, 2] as const).map(rate => (
                <button
                  key={rate}
                  onClick={() => handleTrafficChange(rate)}
                  disabled={loading}
                  className={`py-1 text-center font-mono text-[9px] font-bold rounded uppercase cursor-pointer transition-colors ${
                    trafficRate === rate
                      ? rate === 2
                        ? 'bg-red-700 text-white shadow-sm'
                        : 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-150'
                  }`}
                >
                  {rate === 0 ? 'Normal' : rate === 1 ? 'Moderate' : 'Spike (Load)'}
                </button>
              ))}
            </div>
          </div>

          {/* Fault Injector */}
          <div className="flex justify-start items-end">
            <button
              onClick={handleTriggerError}
              className="w-full md:w-auto py-2.5 px-4 bg-red-50 hover:bg-red-100 text-[#991b1b] hover:text-red-950 border border-red-200 hover:border-red-300 font-mono text-[10px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
            >
              Inject Db Exception
            </button>
          </div>
        </div>
      </div>

      {/* GRAPH CONTAINER (METRICS BLOCK) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Container Instances</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-extrabold text-slate-900 font-mono">{metrics?.activeInstances ?? 1}</h3>
            <span className="text-[10px] font-mono text-[#991b1b] font-bold uppercase">
              ({metrics && metrics.activeInstances > 1 ? 'Auto-Scaled' : 'Minimum Limit'})
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono mt-1">Managed serverless pods</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Request Count</p>
          <h3 className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
            {metrics?.totalRequests ?? 45}
          </h3>
          <p className="text-[9px] text-slate-400 font-mono mt-1">Direct hit counters</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Average Latency</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
              {metrics?.avgResponseTimeMs ?? 24}ms
            </h3>
            <span className="text-[9px] font-mono text-emerald-800 uppercase font-semibold">
              {(metrics?.avgResponseTimeMs ?? 24) < 50 ? 'Low Overhead' : 'High queue'}
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono mt-1">Processing cycle speed</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 p-4 rounded-lg flex flex-col justify-between h-[110px] shadow-sm">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">System Exception Counter</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className={`text-3xl font-extrabold font-mono mt-1 ${
              (metrics?.errorCount ?? 0) > 0 ? 'text-[#991b1b]' : 'text-slate-900'
            }`}>
              {metrics?.errorCount ?? 0}
            </h3>
            <span className={`text-[10px] font-mono font-bold uppercase ${
              (metrics?.errorCount ?? 0) > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}>
              ({(metrics?.errorCount ?? 0) > 0 ? 'Active Alarms' : 'Silent'})
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono mt-1">Google stackdriver telemetry</p>
        </div>
      </div>

      {/* METERS BAR CHART (CPU / MEMORY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Progress */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center bg-transparent">
            <span className="text-xs font-mono font-bold text-slate-800 uppercase">Container CPU Usage</span>
            <span className="text-xs font-extrabold font-mono text-slate-900">{metrics?.cpuUsage ?? 15}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (metrics?.cpuUsage ?? 15) > 80
                  ? 'bg-[#991b1b]'
                  : (metrics?.cpuUsage ?? 15) > 50
                  ? 'bg-amber-600'
                  : 'bg-slate-900'
              }`}
              style={{ width: `${metrics?.cpuUsage ?? 15}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            High CPU levels trigger immediate scale cycles. Load balancing distributes queries.
          </p>
        </div>

        {/* Memory Progress */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center bg-transparent">
            <span className="text-xs font-mono font-bold text-slate-800 uppercase">Container Memory Allocation</span>
            <span className="text-xs font-extrabold font-mono text-slate-900">{metrics?.memoryUsage ?? 38}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (metrics?.memoryUsage ?? 38) > 80 ? 'bg-[#991b1b]' : 'bg-slate-900'
              }`}
              style={{ width: `${metrics?.memoryUsage ?? 38}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Guaranteed high-availability memory block provided via serverless ingress nodes.
          </p>
        </div>
      </div>

      {/* LIVE SYSLOG TERMINAL */}
      <div className="bg-white border border-slate-200 p-5 rounded-lg shadow-sm space-y-3.5">
        <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center bg-transparent">
          <div className="flex items-center gap-2">
            <h5 className="font-mono text-xs font-bold tracking-wider uppercase text-slate-850">
              Stdout Logging Feed: Google Cloud Logging (Stackdriver)
            </h5>
          </div>
          <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
            Buffer: {logs.length} Lines
          </span>
        </div>

        {/* Dynamic Log Lines Console Box */}
        <div className="bg-slate-50 border border-slate-150 p-4 rounded-md font-mono text-[10px] space-y-1.5 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
          {logs.length === 0 ? (
            <div className="text-slate-400 italic text-center py-5">
              Listening for Express system calls... No lines returned.
            </div>
          ) : (
            logs.map(log => {
              const dateText = new Date(log.timestamp).toISOString();
              let categoryTag = `[${log.category.toUpperCase()}]`;
              let color = 'text-slate-600';
              if (log.level === 'error') {
                color = 'text-red-650 font-extrabold';
              } else if (log.level === 'warn') {
                color = 'text-amber-700 font-bold';
              } else if (log.category === 'autoscaling') {
                color = 'text-sky-700 font-semibold';
              } else if (log.category === 'ticket') {
                color = 'text-emerald-700 font-semibold';
              } else if (log.category === 'auth') {
                color = 'text-purple-700 font-semibold';
              }

              return (
                <div key={log.id} className={`${color} flex gap-2 break-all md:break-normal`}>
                  <span className="text-slate-400 shrink-0">{dateText.split('T')[1].replace('Z', '')}</span>
                  <span className="text-slate-450 uppercase shrink-0 font-bold">{categoryTag}</span>
                  <span className="leading-relaxed">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
