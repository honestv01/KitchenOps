import React, { useState, useMemo } from 'react';
import { computeRecommendations, APP_REFERENCE_DATE, addCalendarDays } from '@/data/mockData';
import { useAppContext } from '@/contexts/AppContext';
import { Factory, ChevronDown, ChevronUp, Filter, Download, Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

const ProductionEngine: React.FC = () => {
  const { events, sales, waste, stockouts, anomalies } = useAppContext();
  const recommendations = useMemo(() => computeRecommendations(sales, waste, stockouts, events, anomalies), [sales, waste, stockouts, events, anomalies]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterConfidence, setFilterConfidence] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(recommendations.map(r => r.category)))];
  const tomorrow = addCalendarDays(APP_REFERENCE_DATE, 1);
  const tomorrowEvents = events.filter(e => e.date === tomorrow);

  const filtered = recommendations.filter(r => {
    if (filterCategory !== 'All' && r.category !== filterCategory) return false;
    if (filterConfidence !== 'All' && r.confidence !== filterConfidence.toLowerCase()) return false;
    return true;
  });

  const totalRecommended = filtered.reduce((sum, r) => sum + r.recommended, 0);
  const highConfidence = filtered.filter(r => r.confidence === 'high').length;

  const handleExport = () => {
    const csv = ['Item,Category,Base Sales,Stockout Adj,Waste Adj,Event Mod,Recommended,Confidence,Reasoning', ...filtered.map(r => `"${r.item}","${r.category}",${r.baseSales},${r.stockoutAdjustment},${r.wasteAdjustment},${r.eventModifier},${r.recommended},"${r.confidence}","${r.reasoning}"`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `production-plan-${tomorrow}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2"><Factory size={22} className="text-[#E91E63]"/>Production Plan</h1><p className="text-sm text-gray-500 mt-0.5">Tomorrow: Tuesday, April 7, 2026</p></div>
        <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors"><Download size={12}/>Export CSV</button>
      </div>
      {tomorrowEvents.length > 0 && (<div className="bg-[#FFF0F5] border border-[#E91E63]/20 rounded-xl p-3"><div className="flex items-start gap-2"><Info size={14} className="text-[#E91E63] mt-0.5 shrink-0"/><div><span className="text-sm font-medium text-[#1a1a1a]">Events impacting tomorrow:</span><div className="flex flex-wrap gap-2 mt-1">{tomorrowEvents.map(ev => (<span key={ev.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.impactPercent >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{ev.name} ({ev.impactPercent > 0 ? '+' : ''}{ev.impactPercent}%)</span>))}</div></div></div></div>)}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><div className="text-3xl font-bold font-mono text-[#E91E63]">{totalRecommended}</div><div className="text-xs text-gray-500 mt-1">Total Units</div></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><div className="text-3xl font-bold font-mono text-[#1a1a1a]">{filtered.length}</div><div className="text-xs text-gray-500 mt-1">Items</div></div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center"><div className="text-3xl font-bold font-mono text-emerald-500">{highConfidence}</div><div className="text-xs text-gray-500 mt-1">High Confidence</div></div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5"><Filter size={14} className="text-gray-400"/><span className="text-xs text-gray-500">Filter:</span></div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#E91E63]">{categories.map(c => (<option key={c} value={c}>{c}</option>))}</select>
        <select value={filterConfidence} onChange={e => setFilterConfidence(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#E91E63]"><option value="All">All Confidence</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th><th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th><th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Base</th><th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Adj</th><th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produce</th><th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Conf</th><th className="px-4 py-2.5"></th></tr></thead>
          <tbody>{filtered.map(rec => {
            const totalAdj = rec.stockoutAdjustment + rec.wasteAdjustment + rec.eventModifier;
            const isExpanded = expandedItem === rec.item;
            return (<React.Fragment key={rec.item}>
              <tr className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors" onClick={() => setExpandedItem(isExpanded ? null : rec.item)}>
                <td className="px-4 py-3 font-medium text-[#1a1a1a]">{rec.item}</td><td className="px-4 py-3 text-gray-500">{rec.category}</td><td className="px-4 py-3 text-right font-mono text-gray-600">{rec.baseSales}</td>
                <td className="px-4 py-3 text-right"><span className={`font-mono text-sm flex items-center justify-end gap-0.5 ${totalAdj > 0 ? 'text-emerald-600' : totalAdj < 0 ? 'text-red-500' : 'text-gray-400'}`}>{totalAdj > 0 ? <ArrowUpRight size={12}/> : totalAdj < 0 ? <ArrowDownRight size={12}/> : <Minus size={12}/>}{totalAdj > 0 ? '+' : ''}{totalAdj}</span></td>
                <td className="px-4 py-3 text-right"><span className="font-mono font-bold text-lg text-[#1a1a1a]">{rec.recommended}</span></td>
                <td className="px-4 py-3 text-center"><span className={`inline-block w-2.5 h-2.5 rounded-full ${rec.confidence === 'high' ? 'bg-emerald-400' : rec.confidence === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`} title={rec.confidence}/></td>
                <td className="px-4 py-3">{isExpanded ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}</td>
              </tr>
              {isExpanded && (<tr className="bg-gray-50/80"><td colSpan={7} className="px-4 py-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white rounded-lg p-2.5 border border-gray-100"><div className="text-gray-400 mb-1">7-Day Avg Sales</div><div className="font-mono font-bold text-[#1a1a1a]">{rec.baseSales}</div></div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-100"><div className="text-gray-400 mb-1">Stockout Adj</div><div className={`font-mono font-bold ${rec.stockoutAdjustment > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>{rec.stockoutAdjustment > 0 ? '+' : ''}{rec.stockoutAdjustment}</div></div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-100"><div className="text-gray-400 mb-1">Waste Adj</div><div className={`font-mono font-bold ${rec.wasteAdjustment < 0 ? 'text-red-500' : 'text-gray-400'}`}>{rec.wasteAdjustment}</div></div>
                  <div className="bg-white rounded-lg p-2.5 border border-gray-100"><div className="text-gray-400 mb-1">Event Modifier</div><div className={`font-mono font-bold ${rec.eventModifier > 0 ? 'text-blue-600' : rec.eventModifier < 0 ? 'text-red-500' : 'text-gray-400'}`}>{rec.eventModifier > 0 ? '+' : ''}{rec.eventModifier}</div></div>
                </div>
                <div className="mt-2 px-1 text-xs text-gray-500 italic">{rec.reasoning}</div>
              </td></tr>)}
            </React.Fragment>);
          })}</tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionEngine;
