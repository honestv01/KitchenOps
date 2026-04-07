import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { categories, last30Days } from '@/data/mockData';
import { BarChart3, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';


const COLORS = ['#E91E63', '#FF6B9D', '#FFB3D9', '#B2F5EA', '#E9D5FF', '#FFD4B8'];

const AnalyticsView: React.FC = () => {
  const { sales, waste, stockouts } = useAppContext();
  const [period, setPeriod] = useState<7 | 14 | 30>(7);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const periodDays = last30Days.slice(-period);

  // Daily revenue trend
  const revenueTrend = useMemo(() => {
    return periodDays.map(date => {
      let daySales = sales.filter(s => s.date === date);
      if (selectedCategory !== 'All') daySales = daySales.filter(s => s.category === selectedCategory);
      const dayWaste = waste.filter(w => w.date === date);
      const dayStockouts = stockouts.filter(s => s.date === date);
      return {
        date: date.slice(5),
        revenue: daySales.reduce((sum, s) => sum + s.revenue, 0),
        items: daySales.reduce((sum, s) => sum + s.quantity, 0),
        wasteCost: dayWaste.reduce((sum, w) => sum + w.costLost, 0),
        stockouts: dayStockouts.length,
        lostRevenue: dayStockouts.reduce((sum, s) => sum + s.estimatedLostSales, 0),
      };
    });
  }, [sales, waste, stockouts, periodDays, selectedCategory]);

  // Category pie chart
  const categoryPie = useMemo(() => {
    return categories.map(cat => ({
      name: cat,
      value: sales
        .filter(s => periodDays.includes(s.date) && s.category === cat)
        .reduce((sum, s) => sum + s.revenue, 0),
    }));
  }, [sales, periodDays]);

  // Waste by reason
  const wasteByReason = useMemo(() => {
    const reasons: Record<string, number> = {};
    waste.filter(w => periodDays.includes(w.date)).forEach(w => {
      reasons[w.reason] = (reasons[w.reason] || 0) + w.quantity;
    });
    return Object.entries(reasons).map(([reason, qty]) => ({ reason, quantity: qty })).sort((a, b) => b.quantity - a.quantity);
  }, [waste, periodDays]);

  // Stockout by reason
  const stockoutByReason = useMemo(() => {
    const reasons: Record<string, number> = {};
    stockouts.filter(s => periodDays.includes(s.date)).forEach(s => {
      reasons[s.reason] = (reasons[s.reason] || 0) + 1;
    });
    return Object.entries(reasons).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  }, [stockouts, periodDays]);

  // Totals
  const totalRevenue = revenueTrend.reduce((sum, d) => sum + d.revenue, 0);
  const totalWasteCost = revenueTrend.reduce((sum, d) => sum + d.wasteCost, 0);
  const totalLostRevenue = revenueTrend.reduce((sum, d) => sum + d.lostRevenue, 0);
  const avgDailyRevenue = Math.round(totalRevenue / period);
  const wasteRate = totalRevenue > 0 ? ((totalWasteCost / totalRevenue) * 100).toFixed(1) : '0';

  // Waste trend (daily)
  const wasteTrend = useMemo(() => {
    return periodDays.map(date => {
      const dayWaste = waste.filter(w => w.date === date);
      const daySales = sales.filter(s => s.date === date);
      const totalSold = daySales.reduce((sum, s) => sum + s.quantity, 0);
      const totalWasted = dayWaste.reduce((sum, w) => sum + w.quantity, 0);
      return {
        date: date.slice(5),
        wastePercent: totalSold > 0 ? parseFloat(((totalWasted / totalSold) * 100).toFixed(1)) : 0,
        wasteCost: dayWaste.reduce((sum, w) => sum + w.costLost, 0),
      };
    });
  }, [waste, sales, periodDays]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <BarChart3 size={22} className="text-[#E91E63]" />
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Performance trends and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
          >
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {([7, 14, 30] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p ? 'bg-[#E91E63] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {p}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-[#1a1a1a]">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Total Revenue</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-[#1a1a1a]">${avgDailyRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Avg Daily</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-amber-500">${totalWasteCost.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Waste Cost</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-red-500">${totalLostRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Lost Revenue</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-[#E91E63]">{wasteRate}%</div>
          <div className="text-xs text-gray-500">Waste Rate</div>
        </div>
      </div>

      {/* Revenue + Items Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E91E63" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E91E63" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eee' }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#E91E63" strokeWidth={2} fill="url(#revGrad2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={categoryPie}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {categoryPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eee' }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Waste + Stockout Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Waste Rate Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={wasteTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eee' }} formatter={(v: number) => [`${v}%`, 'Waste Rate']} />
              <Line type="monotone" dataKey="wastePercent" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Waste by Reason</h3>
          <div className="space-y-2">
            {wasteByReason.map((w, i) => {
              const maxQty = wasteByReason[0]?.quantity || 1;
              return (
                <div key={w.reason}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-600">{w.reason}</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{w.quantity}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${(w.quantity / maxQty) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Stockouts by Reason</h3>
          <div className="space-y-2">
            {stockoutByReason.map((s, i) => {
              const maxCount = stockoutByReason[0]?.count || 1;
              return (
                <div key={s.reason}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-gray-600">{s.reason}</span>
                    <span className="font-mono font-medium text-[#1a1a1a]">{s.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-400 transition-all"
                      style={{ width: `${(s.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stockouts Over Time */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Daily Stockouts & Lost Revenue</h3>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eee' }} />
            <Bar yAxisId="left" dataKey="stockouts" fill="#E91E63" radius={[4, 4, 0, 0]} barSize={12} name="Stockouts" />
            <Line yAxisId="right" type="monotone" dataKey="lostRevenue" stroke="#EF4444" strokeWidth={2} dot={{ r: 2 }} name="Lost Revenue ($)" />
          </ComposedChart>
        </ResponsiveContainer>

      </div>
    </div>
  );
};

export default AnalyticsView;
