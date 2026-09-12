import React, { useState } from 'react';
import { 
  FileText, 
  Brain, 
  Timer, 
  Server, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  Sparkles, 
  Calendar, 
  ChevronDown,
  Layers,
  BarChart2,
  Users
} from 'lucide-react';
import { DEPARTMENT_SUMMARIES, OFFICER_WORKLOAD_DATA } from '../data/mockData';
import { AILogsModal } from './AILogsModal';

export const AnalyticsView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'30d' | 'quarter' | 'year'>('30d');
  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  const deptChartData = [
    { name: 'Roads', percentage: 80, count: 5420, color: '#131b2e' },
    { name: 'Water', percentage: 65, count: 3910, color: '#497cff' },
    { name: 'Sanitation', percentage: 40, count: 2840, color: '#006c4a' },
    { name: 'Power', percentage: 25, count: 1450, color: '#ffbd2e' },
    { name: 'Parks', percentage: 15, count: 665, color: '#82f5c1' },
  ];

  return (
    <div id="analytics-view-container" className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-end gap-3 pb-2 border-b border-[#c6c6cd]/30">
        <div>
          <h1 className="font-bold text-2xl md:text-3xl text-[#0b1c30] tracking-tight">
            System Performance
          </h1>
          <p className="text-xs md:text-sm text-[#45464d] mt-1">
            Real-time municipal grievance telemetry and AI routing metrics.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-2 bg-[#ffffff] border border-[#c6c6cd]/40 rounded-xl p-1 shadow-2xs">
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeframe === '30d'
                ? 'bg-[#131b2e] text-white shadow-xs'
                : 'text-[#45464d] hover:text-[#0b1c30]'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeframe('quarter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'quarter'
                ? 'bg-[#131b2e] text-white shadow-xs'
                : 'text-[#45464d] hover:text-[#0b1c30]'
            }`}
          >
            This Quarter
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              timeframe === 'year'
                ? 'bg-[#131b2e] text-white shadow-xs'
                : 'text-[#45464d] hover:text-[#0b1c30]'
            }`}
          >
            This Year
          </button>
        </div>
      </div>

      {/* Bento Metric Cards (4 items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Complaints */}
        <div className="bg-[#ffffff] rounded-2xl p-5 border border-[#c6c6cd]/40 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#76777d] uppercase tracking-wider">
              Total Complaints
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#131b2e]">
              <FileText className="w-5 h-5 text-[#497cff]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0b1c30] tracking-tight">
              14,285
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#006c4a] font-semibold mt-1.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+12% from last month</span>
            </div>
          </div>
        </div>

        {/* Metric 2: AI Routing Accuracy (Emerald Highlight) */}
        <div className="bg-[#82f5c1]/30 rounded-2xl p-5 border border-[#006c4a]/30 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#005137] uppercase tracking-wider">
              AI Routing Accuracy
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#006c4a] flex items-center justify-center text-[#82f5c1]">
              <Brain className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#002114] tracking-tight">
              98.4%
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#005137] font-bold mt-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#006c4a]" />
              <span>Optimal Performance</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Avg Resolution */}
        <div className="bg-[#ffffff] rounded-2xl p-5 border border-[#c6c6cd]/40 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#76777d] uppercase tracking-wider">
              Avg. Resolution
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#131b2e]">
              <Timer className="w-5 h-5 text-[#00714e]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#0b1c30] tracking-tight">
              4.2d
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#006c4a] font-semibold mt-1.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>-1.1d from last month</span>
            </div>
          </div>
        </div>

        {/* Metric 4: System Load */}
        <div className="bg-[#ffffff] rounded-2xl p-5 border border-[#c6c6cd]/40 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold text-[#76777d] uppercase tracking-wider">
              System Load
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#131b2e]">
              <Server className="w-5 h-5 text-[#76777d]" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-[#0b1c30] tracking-tight">
                42%
              </div>
              <span className="text-xs font-semibold text-[#006c4a]">Normal</span>
            </div>
            <div className="w-full bg-[#eff4ff] h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-[#006c4a] h-full rounded-full w-[42%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Workload Table vs System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Complaints by Department Chart */}
          <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#c6c6cd]/40 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg text-[#0b1c30]">
                  Complaints by Department
                </h3>
                <p className="text-xs text-[#45464d] mt-0.5">
                  Proportional volume distribution across municipal divisions
                </p>
              </div>
              <div className="text-xs text-[#76777d] font-semibold bg-[#eff4ff] px-2.5 py-1 rounded-lg">
                14,285 Total
              </div>
            </div>

            {/* Custom Interactive SVG Horizontal Bar Chart */}
            <div className="space-y-4">
              {deptChartData.map((item, idx) => {
                const isHovered = activeBar === idx;

                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setActiveBar(idx)}
                    onMouseLeave={() => setActiveBar(null)}
                    className="group cursor-pointer"
                  >
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-[#0b1c30] group-hover:font-bold transition-all">
                        {item.name}
                      </span>
                      <span className="text-[#45464d]">
                        {item.count.toLocaleString()} cases ({item.percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-4 bg-[#f0f4fc] rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                          opacity: isHovered ? 1 : 0.88,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Officer Workload Table */}
          <div className="bg-[#ffffff] rounded-2xl p-6 border border-[#c6c6cd]/40 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-[#0b1c30]">
                  Officer Workload
                </h3>
                <p className="text-xs text-[#45464d]">
                  Active dispatch queues and 30-day field resolution ratios
                </p>
              </div>
              <span className="text-xs font-semibold text-[#006c4a] bg-[#82f5c1]/30 px-2.5 py-1 rounded-full">
                4 Active Supervisors
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#c6c6cd]/30 text-[11px] font-bold text-[#76777d] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Officer</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Active</th>
                    <th className="py-2.5 px-3 text-center">Resolved (30d)</th>
                    <th className="py-2.5 px-3">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c6c6cd]/20 text-xs">
                  {OFFICER_WORKLOAD_DATA.map((officer) => (
                    <tr key={officer.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={officer.avatar}
                            alt={officer.name}
                            className="w-8 h-8 rounded-full border border-[#c6c6cd]/40 object-cover"
                          />
                          <div>
                            <span className="font-bold text-[#0b1c30] block">
                              {officer.name}
                            </span>
                            <span className="text-[10px] text-[#76777d]">
                              {officer.role}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff4ff] text-[#0b1c30] border border-[#c6c6cd]/30">
                          {officer.department}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#0b1c30]">
                        {officer.activeCases}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#006c4a]">
                        {officer.resolved30d}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-[#eff4ff] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#006c4a] h-full rounded-full"
                              style={{ width: `${officer.efficiencyScore}%` }}
                            />
                          </div>
                          <span className="font-bold text-[#0b1c30]">
                            {officer.efficiencyScore}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: AI System Health Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-[#c6c6cd]/40 shadow-xs sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#c6c6cd]/30 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#006c4a]" />
                <h3 className="font-bold text-sm text-[#0b1c30]">
                  AI System Health
                </h3>
              </div>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c4a] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006c4a]" />
              </span>
            </div>

            {/* Health Indicators */}
            <div className="space-y-4 text-xs">
              {/* Service 1: Language Detection */}
              <div className="bg-[#ffffff] p-3 rounded-xl border border-[#c6c6cd]/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#0b1c30]">
                    Language Detection
                  </span>
                  <span className="text-[#006c4a] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Operational
                  </span>
                </div>
                <div className="text-[#76777d] flex justify-between text-[11px] mt-1">
                  <span>Latency: 45ms</span>
                  <span>Hindi / Hinglish / English</span>
                </div>
              </div>

              {/* Service 2: Category Prediction */}
              <div className="bg-[#ffffff] p-3 rounded-xl border border-[#c6c6cd]/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#0b1c30]">
                    Category Prediction
                  </span>
                  <span className="text-[#006c4a] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Operational
                  </span>
                </div>
                <div className="text-[#76777d] flex justify-between text-[11px] mt-1">
                  <span>Confidence Avg: 94%</span>
                  <span>Gemini 3.7 Flash</span>
                </div>
              </div>

              {/* Service 3: Duplicate Matching */}
              <div className="bg-[#ffffff] p-3 rounded-xl border border-[#c6c6cd]/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-[#0b1c30]">
                    Duplicate Matching
                  </span>
                  <span className="text-[#497cff] font-bold flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    Processing
                  </span>
                </div>
                <div className="text-[#76777d] flex justify-between text-[11px] mt-1">
                  <span>Queue: 12</span>
                  <span>Spatial GIS Cosine Sim</span>
                </div>
                <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-[#497cff] h-full rounded-full w-[65%] animate-pulse" />
                </div>
              </div>
            </div>

            {/* View Detailed Logs CTA Button */}
            <div className="mt-5 pt-3 border-t border-[#c6c6cd]/30">
              <button
                id="view-ai-logs-btn"
                onClick={() => setIsLogsOpen(true)}
                className="w-full bg-[#131b2e] hover:bg-[#000000] text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
              >
                <Cpu className="w-3.5 h-3.5 text-[#82f5c1]" />
                <span>View Detailed Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Telemetry Logs Modal */}
      <AILogsModal
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
      />
    </div>
  );
};
