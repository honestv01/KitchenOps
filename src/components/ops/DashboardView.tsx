import React, { useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import {
  computeTodayMetrics,
  computeWeeklyTrend,
  computeCategoryBreakdown,
  computeRecommendations,
  APP_REFERENCE_DATE,
  addCalendarDays,
} from '@/data/mockData';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Trash2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Clock,
  Database,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const DashboardView: React.FC = () => {
  const { lastSyncTime, syncSalesData, setCurrentView, sales, waste, stockouts, events, anomalies, dbConnected } = useAppContext();
  const metrics = useMemo(() => computeTodayMetrics(sales, waste, stockouts), [sales, waste, stockouts]);
  const weeklyTrend = useMemo(() => computeWeeklyTrend(sales, waste, stockouts), [sales, waste, stockouts]);
  const categoryData = useMemo(() => computeCategoryBreakdown(sales, waste), [sales, waste]);
  const recommendations = useMemo(() => computeRecommendations(sales, waste, stockouts, events, anomalies).slice(0, 5), [sales, waste, stockouts, events, anomalies]);

  const tomorrow = addCalendarDays(APP_REFERENCE_DATE, 1);
  const tomorrowEvents = events.filter(e => e.date === tomorrow);
  const recentStockouts = stockouts.filter(s => s.date === APP_REFERENCE_DATE).slice(0, 4);

  const barColors = ['#E91E63', '#FF6B9D', '#FFB3D9', '#B2F5EA', '#E9D5FF', '#FFD4B8'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a]">Daily Operations</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            Monday, April 6, 2026
            {dbConnected && <span className="flex items-center gap-1 text-emerald-500 text-xs"><Database size={10}/> Live</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400"><Clock size={12}/><span>Last sync: {lastSyncTime || 'Never'}</span></div>
          <button onClick={syncSalesData} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors"><RefreshCw size={12}/>Sync Square</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Items Sold" value={metrics.totalItems.toLocaleString()} icon={<Package size={16}/>} color="bg-[#E91E63]" trend="+8% vs avg" trendUp={true}/>
        <MetricCard label="Revenue" value={`$${metrics.totalRevenue.toLocaleString()}`} icon={<DollarSign size={16}/>} color="bg-emerald-500" trend="+12% vs avg" trendUp={true}/>
        <MetricCard label="Waste" value={`${metrics.wasteCount} items`} icon={<Trash2 size={16}/>} color="bg-amber-500" trend={`${metrics.wastePercent}% rate`} trendUp={false} subtitle={`$${metrics.wasteCost} lost`}/>
        <MetricCard label="Stockouts" value={`${metrics.stockoutCount}`} icon={<AlertTriangle size={16}/>} color="bg-red-500" trend={`$${metrics.lostRevenue} missed`} trendUp={false}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-[#1a1a1a]">7-Day Revenue</h3><span className="text-xs text-gray-400">Last 7 days</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyTrend}>
              <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#E91E63" stopOpacity={0.2}/><stop offset="95%" stopColor="#E91E63" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`}/>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #eee' }} formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}/>
              <Area type="monotone" dataKey="revenue" stroke="#E91E63" strokeWidth={2} fill="url(#revGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-[#1a1a1a]">Category Sales Today</h3><span className="text-xs text-gray-400">By units sold</span></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false}/>
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#666' }} axisLine={false} tickLine={false} width={80}/>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #eee' }}/>
              <Bar dataKey="sales" radius={[0, 4, 4, 0]} barSize={18}>{categoryData.map((_, i) => (<Cell key={i} fill={barColors[i % barColors.length]}/>))}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-[#1a1a1a]">Tomorrow's Top Items</h3><button onClick={() => setCurrentView('production')} className="text-xs text-[#E91E63] hover:underline flex items-center gap-1">Full plan <ArrowRight size={10}/></button></div>
          <div className="space-y-2">{recommendations.map((rec, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <div><span className="text-sm text-[#1a1a1a] font-medium">{rec.item}</span><span className="text-xs text-gray-400 ml-2">{rec.category}</span></div>
              <div className="flex items-center gap-2"><span className="text-sm font-mono font-bold text-[#1a1a1a]">{rec.recommended}</span><span className={`w-2 h-2 rounded-full ${rec.confidence === 'high' ? 'bg-emerald-400' : rec.confidence === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`}/></div>
            </div>
          ))}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-[#1a1a1a]">Today's Stockouts</h3><button onClick={() => setCurrentView('stockouts')} className="text-xs text-[#E91E63] hover:underline flex items-center gap-1">Log more <ArrowRight size={10}/></button></div>
          {recentStockouts.length === 0 ? <p className="text-xs text-gray-400 py-4 text-center">No stockouts today</p> : (
            <div className="space-y-2">{recentStockouts.map((so) => (
              <div key={so.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div><span className="text-sm text-[#1a1a1a] font-medium">{so.item}</span><span className="text-xs text-gray-400 ml-2">{so.time}</span></div>
                <span className="text-xs text-red-500 font-medium">-${so.estimatedLostSales}</span>
              </div>
            ))}</div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-[#1a1a1a]">Upcoming Events</h3><button onClick={() => setCurrentView('events')} className="text-xs text-[#E91E63] hover:underline flex items-center gap-1">Manage <ArrowRight size={10}/></button></div>
          <div className="space-y-2">
            {tomorrowEvents.map(ev => (
              <div key={ev.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div><span className="text-sm text-[#1a1a1a] font-medium">{ev.name}</span><span className="text-xs text-gray-400 ml-2">{ev.date}</span></div>
                <span className={`text-xs font-mono font-bold ${ev.impactPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{ev.impactPercent > 0 ? '+' : ''}{ev.impactPercent}%</span>
              </div>
            ))}
            {events.filter(e => e.date > tomorrow).slice(0, 3).map(ev => (
              <div key={ev.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div><span className="text-sm text-[#1a1a1a] font-medium">{ev.name}</span><span className="text-xs text-gray-400 ml-2">{ev.date}</span></div>
                <span className={`text-xs font-mono font-bold ${ev.impactPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{ev.impactPercent > 0 ? '+' : ''}{ev.impactPercent}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string; trend: string; trendUp: boolean; subtitle?: string }> = ({ label, value, icon, color, trend, trendUp, subtitle }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span><div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-white`}>{icon}</div></div>
    <div className="text-2xl font-bold font-mono text-[#1a1a1a]">{value}</div>
    <div className="flex items-center gap-1 mt-1">{trendUp ? <TrendingUp size={12} className="text-emerald-500"/> : <TrendingDown size={12} className="text-red-400"/>}<span className={`text-xs ${trendUp ? 'text-emerald-500' : 'text-red-400'}`}>{trend}</span></div>
    {subtitle && <span className="text-xs text-gray-400 mt-0.5 block">{subtitle}</span>}
  </div>
);

export default DashboardView;
