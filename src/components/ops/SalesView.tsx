import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { SALES_SHEET_TEMPLATE } from '@/lib/sheetImport';
import { toast } from '@/components/ui/use-toast';
import { ShoppingCart, Search, RefreshCw, Clock, ArrowUpDown, Upload, FileSpreadsheet, Download } from 'lucide-react';

type SortField = 'date' | 'item' | 'category' | 'quantity' | 'revenue';
type SortDir = 'asc' | 'desc';

const SalesView: React.FC = () => {
  const { sales, lastSyncTime, syncSalesData, importSalesFromSheet } = useAppContext();
  const [search, setSearch] = useState('');
  const [sheetDrag, setSheetDrag] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const perPage = 25;

  const categories = ['All', ...Array.from(new Set(sales.map(s => s.category)))];

  const filtered = useMemo(() => {
    let data = [...sales];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s => s.item.toLowerCase().includes(q) || s.category.toLowerCase().includes(q));
    }
    if (filterCategory !== 'All') data = data.filter(s => s.category === filterCategory);
    if (filterDate) data = data.filter(s => s.date === filterDate);

    data.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'item') cmp = a.item.localeCompare(b.item);
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category);
      else if (sortField === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortField === 'revenue') cmp = a.revenue - b.revenue;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [sales, search, filterCategory, filterDate, sortField, sortDir]);

  const pageData = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const totalRevenue = filtered.reduce((sum, s) => sum + s.revenue, 0);
  const totalItems = filtered.reduce((sum, s) => sum + s.quantity, 0);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const handleSheetFile = useCallback(async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.tsv') && file.type !== 'text/csv' && file.type !== 'text/tab-separated-values') {
      toast({ title: 'Unsupported file', description: 'Use a .csv or .tsv file exported from Google Sheets.', variant: 'destructive' });
      return;
    }
    await importSalesFromSheet(file);
  }, [importSalesFromSheet]);

  const onSheetDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setSheetDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) void handleSheetFile(f);
  }, [handleSheetFile]);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([SALES_SHEET_TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sales-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const submitPaste = useCallback(async () => {
    const t = pasteText.trim();
    if (!t) {
      toast({ title: 'Paste is empty', variant: 'destructive' });
      return;
    }
    await importSalesFromSheet(t);
    setPasteText('');
    setPasteOpen(false);
  }, [pasteText, importSalesFromSheet]);

  const SortHeader: React.FC<{ field: SortField; label: string; align?: string }> = ({ field, label, align }) => (
    <th
      className={`px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-[#E91E63] transition-colors ${align || 'text-left'}`}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={10} className={sortField === field ? 'text-[#E91E63]' : 'text-gray-300'} />
      </span>
    </th>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a1a] flex items-center gap-2">
            <ShoppingCart size={22} className="text-[#E91E63]" />
            Sales Data
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Square POS or Google Sheet import — 30-day history</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock size={12} />
            <span>{lastSyncTime}</span>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={12} />
            Template
          </button>
          <button
            type="button"
            onClick={() => setPasteOpen(o => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet size={12} />
            Paste from Sheet
          </button>
          <button
            onClick={syncSalesData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] text-white text-xs font-medium rounded-lg hover:bg-[#333] transition-colors"
          >
            <RefreshCw size={12} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Google Sheet import */}
      <div
        className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
          sheetDrag ? 'border-[#E91E63] bg-pink-50/50' : 'border-gray-200 bg-white'
        }`}
        onDragOver={e => { e.preventDefault(); setSheetDrag(true); }}
        onDragLeave={() => setSheetDrag(false)}
        onDrop={onSheetDrop}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E91E63]/10 flex items-center justify-center shrink-0">
              <Upload className="text-[#E91E63]" size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1a1a1a]">Import from Google Sheets</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                In Sheets: <span className="font-medium">File → Download → Comma-separated values (.csv)</span>. Required columns:{' '}
                <span className="font-mono text-gray-600">Date, Item, Quantity, Revenue</span> — optional: Category, Source.
              </p>
            </div>
          </div>
          <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E91E63] text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-[#D81B60] transition-colors shrink-0">
            <FileSpreadsheet size={14} />
            Choose CSV
            <input
              type="file"
              accept=".csv,.tsv,text/csv,text/tab-separated-values"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void handleSheetFile(f);
              }}
            />
          </label>
        </div>
        {pasteOpen && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs text-gray-500">Paste copied cells from Google Sheets (tab-separated):</p>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={5}
              placeholder={'Date\tItem\tCategory\tQuantity\tRevenue\n2026-04-06\tLatte\tBeverages\t12\t54.00'}
              className="w-full text-xs font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setPasteOpen(false); setPasteText(''); }} className="text-xs text-gray-500 px-2 py-1">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submitPaste()}
                className="text-xs px-3 py-1.5 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#333]"
              >
                Import pasted rows
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-[#1a1a1a]">{filtered.length.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Records</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-[#1a1a1a]">{totalItems.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Units Sold</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <div className="text-xl font-bold font-mono text-emerald-600">${totalRevenue.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#E91E63] focus:border-[#E91E63]"
          />
        </div>
        <select
          value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(0); }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setPage(0); }}
          className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-[#1a1a1a] focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
        />
        {(search || filterCategory !== 'All' || filterDate) && (
          <button
            onClick={() => { setSearch(''); setFilterCategory('All'); setFilterDate(''); setPage(0); }}
            className="text-xs text-[#E91E63] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <SortHeader field="date" label="Date" />
                <SortHeader field="item" label="Item" />
                <SortHeader field="category" label="Category" />
                <SortHeader field="quantity" label="Qty" />
                <SortHeader field="revenue" label="Revenue" />
                <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {pageData.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">{s.date}</td>
                  <td className="px-4 py-2.5 font-medium text-[#1a1a1a]">{s.item}</td>
                  <td className="px-4 py-2.5 text-gray-500">{s.category}</td>
                  <td className="px-4 py-2.5 font-mono font-medium text-[#1a1a1a]">{s.quantity}</td>
                  <td className="px-4 py-2.5 font-mono text-emerald-600">${s.revenue.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.source === 'square' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.source}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
              if (pageNum >= totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-7 h-7 text-xs rounded ${
                    pageNum === page ? 'bg-[#E91E63] text-white' : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 text-xs rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesView;
