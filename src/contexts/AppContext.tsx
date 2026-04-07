import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { ViewType, SalesItem, WasteEntry, StockoutEntry, CalendarEvent, AnomalyTag } from '@/types/operations';
import {
  fetchSales, fetchWaste, fetchStockouts, fetchEvents, fetchAnomalies,
  insertSalesBatch,
  insertWaste, insertStockout, insertEvent, insertAnomaly,
  updateEvent as persistEventUpdate,
  deleteEvent, deleteAnomaly,
  mapSalesRow, mapWasteRow, mapStockoutRow, mapEventRow, mapAnomalyRow,
} from '@/lib/database';
import { parseSalesFromSheetText } from '@/lib/sheetImport';
import { supabase } from '@/lib/supabase';
import { USE_VIRTUAL_DATA, virtualDataset } from '@/data/mockData';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  sales: SalesItem[];
  waste: WasteEntry[];
  stockouts: StockoutEntry[];
  events: CalendarEvent[];
  anomalies: AnomalyTag[];
  addWasteEntry: (entry: Omit<WasteEntry, 'id'>) => void;
  addStockout: (entry: Omit<StockoutEntry, 'id'>) => void;
  addEvent: (entry: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => Promise<void>;
  addAnomaly: (entry: Omit<AnomalyTag, 'id'>) => void;
  removeEvent: (id: string) => void;
  removeAnomaly: (id: string) => void;
  lastSyncTime: string;
  syncSalesData: () => void;
  /** Google Sheets CSV/TSV file or pasted table text */
  importSalesFromSheet: (fileOrText: File | string) => Promise<void>;
  loading: boolean;
  dbConnected: boolean;
}

const AppContext = createContext<AppContextType>({} as AppContextType);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [sales, setSales] = useState<SalesItem[]>([]);
  const [waste, setWaste] = useState<WasteEntry[]>([]);
  const [stockouts, setStockouts] = useState<StockoutEntry[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyTag[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [dbConnected, setDbConnected] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // ─── Load data: virtual demo dataset or Supabase ───
  useEffect(() => {
    let mounted = true;
    if (USE_VIRTUAL_DATA) {
      const { sales: vs, waste: vw, stockouts: vso, events: ve, anomalies: va } = virtualDataset;
      setSales(vs);
      setWaste(vw);
      setStockouts(vso);
      setEvents(ve);
      setAnomalies(va);
      setLastSyncTime(new Date().toLocaleString());
      setDbConnected(false);
      setLoading(false);
      return;
    }
    async function loadAll() {
      try {
        const [s, w, so, ev, an] = await Promise.all([
          fetchSales(), fetchWaste(), fetchStockouts(), fetchEvents(), fetchAnomalies()
        ]);
        if (!mounted) return;
        setSales(s);
        setWaste(w);
        setStockouts(so);
        setEvents(ev);
        setAnomalies(an);
        setLastSyncTime(new Date().toLocaleString());
        setDbConnected(true);
      } catch (err) {
        console.error('Failed to load from DB:', err);
        toast({ title: 'Database Error', description: 'Could not load data. Using empty state.', variant: 'destructive' });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false; };
  }, []);

  // ─── Realtime subscriptions (skipped in virtual demo mode) ───
  useEffect(() => {
    if (USE_VIRTUAL_DATA) return;
    const channels = [
      supabase.channel('rt-waste').on('postgres_changes', { event: '*', schema: 'public', table: 'waste_entries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setWaste(prev => [mapWasteRow(payload.new), ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setWaste(prev => prev.filter(w => w.id !== payload.old.id));
        }
      }).subscribe(),

      supabase.channel('rt-stockouts').on('postgres_changes', { event: '*', schema: 'public', table: 'stockout_entries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setStockouts(prev => [mapStockoutRow(payload.new), ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setStockouts(prev => prev.filter(s => s.id !== payload.old.id));
        }
      }).subscribe(),

      supabase.channel('rt-events').on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setEvents(prev => [...prev, mapEventRow(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setEvents(prev => prev.map(e => e.id === payload.new.id ? mapEventRow(payload.new) : e));
        } else if (payload.eventType === 'DELETE') {
          setEvents(prev => prev.filter(e => e.id !== payload.old.id));
        }
      }).subscribe(),

      supabase.channel('rt-anomalies').on('postgres_changes', { event: '*', schema: 'public', table: 'anomaly_tags' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAnomalies(prev => [mapAnomalyRow(payload.new), ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setAnomalies(prev => prev.filter(a => a.id !== payload.old.id));
        }
      }).subscribe(),

      supabase.channel('rt-sales').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sales_data' }, (payload) => {
        setSales(prev => [mapSalesRow(payload.new), ...prev]);
      }).subscribe(),
    ];

    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, []);

  // ─── Mutations (write to Supabase, realtime updates local state) ───
  const addWasteEntry = useCallback(async (entry: Omit<WasteEntry, 'id'>) => {
    try {
      await insertWaste(entry);
      toast({ title: 'Waste Entry Added', description: `${entry.item} - ${entry.quantity} units logged` });
    } catch (err: any) {
      // Fallback: add locally
      setWaste(prev => [{ ...entry, id: `local-${Date.now()}` }, ...prev]);
      toast({ title: 'Saved Locally', description: 'DB write failed, saved in memory', variant: 'destructive' });
    }
  }, []);

  const addStockout = useCallback(async (entry: Omit<StockoutEntry, 'id'>) => {
    try {
      await insertStockout(entry);
      toast({ title: 'Stockout Logged', description: `${entry.item} at ${entry.time}` });
    } catch (err: any) {
      setStockouts(prev => [{ ...entry, id: `local-${Date.now()}` }, ...prev]);
      toast({ title: 'Saved Locally', description: 'DB write failed', variant: 'destructive' });
    }
  }, []);

  const addEvent = useCallback(async (entry: Omit<CalendarEvent, 'id'>) => {
    try {
      await insertEvent(entry);
      toast({ title: 'Event Added', description: `${entry.name} on ${entry.date}` });
    } catch (err: any) {
      setEvents(prev => [...prev, { ...entry, id: `local-${Date.now()}` }]);
      toast({ title: 'Saved Locally', description: 'DB write failed', variant: 'destructive' });
    }
  }, []);

  const updateEvent = useCallback(async (id: string, patch: Partial<Omit<CalendarEvent, 'id'>>) => {
    if (USE_VIRTUAL_DATA || id.startsWith('local-')) {
      setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
      toast({ title: 'Event updated' });
      return;
    }
    try {
      const updated = await persistEventUpdate(id, patch);
      setEvents(prev => prev.map(e => (e.id === id ? updated : e)));
      toast({ title: 'Event updated' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Update failed', description: 'Could not save changes to the database.', variant: 'destructive' });
    }
  }, []);

  const addAnomaly = useCallback(async (entry: Omit<AnomalyTag, 'id'>) => {
    try {
      await insertAnomaly(entry);
      toast({ title: 'Anomaly Tagged', description: entry.description });
    } catch (err: any) {
      setAnomalies(prev => [{ ...entry, id: `local-${Date.now()}` }, ...prev]);
      toast({ title: 'Saved Locally', description: 'DB write failed', variant: 'destructive' });
    }
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== id));
      await deleteEvent(id);
      toast({ title: 'Event Removed' });
    } catch (err: any) {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  }, []);

  const removeAnomaly = useCallback(async (id: string) => {
    try {
      setAnomalies(prev => prev.filter(a => a.id !== id));
      await deleteAnomaly(id);
      toast({ title: 'Anomaly Removed' });
    } catch (err: any) {
      toast({ title: 'Delete Failed', variant: 'destructive' });
    }
  }, []);

  const syncSalesData = useCallback(async () => {
    if (USE_VIRTUAL_DATA) {
      setLastSyncTime(new Date().toLocaleString());
      toast({ title: 'Demo data', description: 'Using built-in sample data. Turn off USE_VIRTUAL_DATA in mockData.ts to sync from the database.' });
      return;
    }
    try {
      const s = await fetchSales();
      setSales(s);
      setLastSyncTime(new Date().toLocaleString());
      toast({ title: 'Sales Data Synced', description: `${s.length} records refreshed from database` });
    } catch {
      toast({ title: 'Sync Failed', variant: 'destructive' });
    }
  }, []);

  const importSalesFromSheet = useCallback(async (fileOrText: File | string) => {
    const text = typeof fileOrText === 'string' ? fileOrText : await fileOrText.text();
    const { rows, errors, skipped } = parseSalesFromSheetText(text);
    if (rows.length === 0) {
      toast({
        title: 'Nothing to import',
        description: errors[0] ?? 'Add a header row (Date, Item, Quantity, Revenue) and data rows.',
        variant: 'destructive',
      });
      return;
    }
    const warn = [errors.length > 0 ? `${errors.length} row(s) skipped` : '', skipped > 0 ? `${skipped} empty row(s)` : '']
      .filter(Boolean)
      .join('. ');

    if (USE_VIRTUAL_DATA) {
      const local = rows.map((r, i) => ({ ...r, id: `sheet-${Date.now()}-${i}` }));
      setSales(prev => [...local, ...prev]);
      setLastSyncTime(new Date().toLocaleString());
      toast({
        title: 'Imported (demo mode)',
        description: `${local.length} sales rows added to the chart.${warn ? ` ${warn}.` : ''}`,
      });
      return;
    }
    try {
      const inserted = await insertSalesBatch(rows);
      setSales(prev => [...inserted, ...prev]);
      setLastSyncTime(new Date().toLocaleString());
      toast({
        title: 'Import complete',
        description: `${inserted.length} rows saved to the database.${warn ? ` ${warn}.` : ''}`,
      });
    } catch (err) {
      console.error(err);
      const local = rows.map((r, i) => ({ ...r, id: `local-sheet-${Date.now()}-${i}` }));
      setSales(prev => [...local, ...prev]);
      setLastSyncTime(new Date().toLocaleString());
      toast({
        title: 'Saved locally',
        description: `Database write failed; ${local.length} rows kept in memory only.`,
        variant: 'destructive',
      });
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen, toggleSidebar, currentView, setCurrentView,
        sales, waste, stockouts, events, anomalies,
        addWasteEntry, addStockout, addEvent, updateEvent, addAnomaly,
        removeEvent, removeAnomaly, lastSyncTime, syncSalesData, importSalesFromSheet,
        loading, dbConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
