import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { categories, items } from '@/data/mockData';
import { Trash2, Upload, Plus, X, Search } from 'lucide-react';

import { toast } from '@/components/ui/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const wasteReasons = ['Expired', 'Overproduction', 'Damaged', 'Quality issue', 'Customer return'];

const WasteTracker: React.FC = () => {
  const { waste, addWasteEntry } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [formCat, setFormCat] = useState(categories[0]);
  const [formItem, setFormItem] = useState(items[categories[0]][0]);
  const [formQty, setFormQty] = useState('1');
  const [formReason, setFormReason] = useState(wasteReasons[0]);
  const [formDate, setFormDate] = useState('2026-04-06');

  const handleCatChange = (cat: string) => {
    setFormCat(cat);
    setFormItem(items[cat][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(formQty);
    if (qty <= 0) return;
    addWasteEntry({
      date: formDate,
      item: formItem,
      category: formCat,
      quantity: qty,
      reason: formReason,
      costLost: qty * 6,
    });
    setFormQty('1');
    setShowForm(false);
  };

  const handleCSVUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').slice(1);
      let count = 0;
      lines.forEach(line => {
        const parts = line.split(',').map(s => s.trim().replace(/"/g, ''));
        if (parts.length >= 4) {
          addWasteEntry({
            date: parts[0] || '2026-04-06',
            item: parts[1] || 'Unknown',
            category: parts[2] || 'Other',
            quantity: parseInt(parts[3]) || 1,
            reason: parts[4] || 'Imported',
            costLost: (parseInt(parts[3]) || 1) * 5,
          });
          count++;
        }
      });
      toast({ title: 'CSV Imported', description: `${count} waste entries added` });
    };
    reader.readAsText(file);
  }, [addWasteEntry]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleCSVUpload(file);
    else toast({ title: 'Invalid File', description: 'Please upload a CSV file', variant: 'destructive' });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCSVUpload(file);
  };

  const filtered = useMemo(() => {
    let data = [...waste];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(w => w.item.toLowerCase().includes(q));
    }
    if (filterCat !== 'All') data = data.filter(w => w.category === filterCat);
    return data.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
  }, [waste, search, filterCat]);

  // Chart data: waste by category (last 7 days)
  const chartData = useMemo(() => {
    return categories.map(cat => ({
      category: cat.slice(0, 6),
      quantity: waste.filter(w => w.category === cat && w.date >= '2026-03-30').reduce((sum, w) => sum + w.quantity, 0),
      cost: waste.filter(w => w.category === cat && w.date >= '2026-03-30').reduce((sum, w) => sum + w.costLost, 0),
    }));
  }, [waste]);

  const totalWaste = waste.filter(w => w.date === '2026-04-06').reduce((sum, w) => sum + w.quantity, 0);
  const totalCost = waste.filter(w => w.date === '2026-04-06').reduce((sum, w) => sum + w.costLost, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <Trash2 size={22} className="text-[#E91E63]" />
            Waste Tracking
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and reduce food waste across all categories</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E91E63] text-white text-xs font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
        >
          {showForm ? <X size={12} /> : <Plus size={12} />}
          {showForm ? 'Cancel' : 'Add Entry'}
        </button>
      </div>

      {/* Summary + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-3xl font-bold font-mono text-amber-500">{totalWaste}</div>
            <div className="text-xs text-gray-500 mt-1">Items Wasted Today</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-3xl font-bold font-mono text-red-500">${totalCost}</div>
            <div className="text-xs text-gray-500 mt-1">Cost Lost Today</div>
          </div>

          {/* CSV Upload Zone */}
          <div className="col-span-2">
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                dragOver ? 'border-[#E91E63] bg-pink-50' : 'border-gray-200 bg-white'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Drop CSV file here</p>
              <p className="text-xs text-gray-400 mt-1">or</p>
              <label className="inline-block mt-2 px-3 py-1.5 text-xs font-medium text-[#E91E63] border border-[#E91E63] rounded-lg cursor-pointer hover:bg-pink-50 transition-colors">
                Browse Files
                <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
              </label>
              <p className="text-xs text-gray-400 mt-2">Format: date, item, category, quantity, reason</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Waste by Category (7 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #eee' }} />
              <Bar dataKey="quantity" fill="#E91E63" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Manual Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-sm font-semibold text-[#1a1a1a] mb-3">Log Waste Entry</h3>
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
              <label className="text-xs text-gray-500 block mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formQty}
                onChange={e => setFormQty(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Reason</label>
              <select
                value={formReason}
                onChange={e => setFormReason(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
              >
                {wasteReasons.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-3 py-1.5 bg-[#E91E63] text-white text-sm font-medium rounded-lg hover:bg-[#D81B60] transition-colors"
              >
                Add
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
            placeholder="Search waste items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
        >
          <option value="All">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost Lost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{w.date}</td>
                  <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">{w.item}</td>
                  <td className="px-4 py-2.5 text-gray-500">{w.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-amber-600">{w.quantity}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{w.reason}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-500">${w.costLost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WasteTracker;
