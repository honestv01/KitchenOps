import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { categories, items } from '@/data/mockData';
import { AlertTriangle, Plus, X, Clock, Search, AlertCircle } from 'lucide-react';

const stockoutReasons = ['Underproduced', 'Unexpected rush', 'Supply delay', 'Staff error', 'Equipment failure'];
const timeSlots = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM',
];

const StockoutLogger: React.FC = () => {
  const { stockouts, addStockout } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDays, setFilterDays] = useState(14);

  // Form state
  const [formCat, setFormCat] = useState(categories[0]);
  const [formItem, setFormItem] = useState(items[categories[0]][0]);
  const [formTime, setFormTime] = useState('12:00 PM');
  const [formReason, setFormReason] = useState(stockoutReasons[0]);
  const [formLost, setFormLost] = useState('50');
  const [formDate, setFormDate] = useState('2026-04-06');

  const handleCatChange = (cat: string) => {
    setFormCat(cat);
    setFormItem(items[cat][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addStockout({
      date: formDate,
      item: formItem,
      time: formTime,
      reason: formReason,
      estimatedLostSales: parseInt(formLost) || 50,
    });
    setShowForm(false);
  };

  // Filter stockouts
  const cutoffDate = new Date('2026-04-06');
  cutoffDate.setDate(cutoffDate.getDate() - filterDays);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  const filtered = useMemo(() => {
    let data = stockouts.filter(s => s.date >= cutoff);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s => s.item.toLowerCase().includes(q));
    }
    return data.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  }, [stockouts, search, cutoff]);

  // Repeat offenders
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(s => { counts[s.item] = (counts[s.item] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filtered]);

  const totalLost = filtered.reduce((sum, s) => sum + s.estimatedLostSales, 0);

  // Group by date for timeline
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach(s => {
      if (!groups[s.date]) groups[s.date] = [];
      groups[s.date].push(s);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <AlertTriangle size={22} className="text-[#E91E63]" />
            Stockout Log
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track missed sales and identify patterns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E91E63] text-white text-xs font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? 'Cancel' : 'Log Stockout'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-3xl font-bold font-mono text-red-500">{filtered.length}</div>
          <div className="text-xs text-gray-500 mt-1">Stockouts ({filterDays}d)</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-3xl font-bold font-mono text-red-500">${totalLost.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1">Est. Lost Revenue</div>
        </div>
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Repeat Offenders</h3>
          <div className="flex flex-wrap gap-2">
            {itemCounts.map(([item, count]) => (
              <span key={item} className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 font-medium border border-red-100">
                {item} <span className="font-mono font-bold ml-1">x{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Add Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#E91E63]/20 p-4 border-2">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-[#E91E63]" />
            Log Stockout
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category</label>
              <select
                value={formCat}
                onChange={e => handleCatChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Item</label>
              <select
                value={formItem}
                onChange={e => setFormItem(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              >
                {items[formCat].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Time</label>
              <select
                value={formTime}
                onChange={e => setFormTime(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              >
                {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Reason</label>
              <select
                value={formReason}
                onChange={e => setFormReason(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              >
                {stockoutReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-3 py-1.5 bg-[#E91E63] text-white text-sm font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
              >
                Log
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
          />
        </div>
        <select
          value={filterDays}
          onChange={e => setFilterDays(parseInt(e.target.value))}
          className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        {grouped.map(([date, entries]) => (
          <div key={date} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">{date}</span>
              <span className="text-xs text-gray-400">{entries.length} stockout{entries.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {entries.map(s => (
                <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono w-16 shrink-0">
                      <Clock size={10} />
                      {s.time}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#1a1a1a]">{s.item}</span>
                      <span className="text-xs text-gray-400 ml-2">{s.reason}</span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-red-500">-${s.estimatedLostSales}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockoutLogger;
