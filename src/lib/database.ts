import { supabase } from '@/lib/supabase';
import { SalesItem, WasteEntry, StockoutEntry, CalendarEvent, AnomalyTag } from '@/types/operations';

// ─── Row Mappers (snake_case DB → camelCase App) ───

export function mapSalesRow(row: any): SalesItem {
  return {
    id: row.id,
    date: typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0],
    item: row.item,
    category: row.category,
    quantity: Number(row.quantity),
    revenue: Number(row.revenue),
    source: row.source as 'square' | 'manual',
  };
}

export function mapWasteRow(row: any): WasteEntry {
  return {
    id: row.id,
    date: typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0],
    item: row.item,
    category: row.category,
    quantity: Number(row.quantity),
    reason: row.reason,
    costLost: Number(row.cost_lost),
  };
}

export function mapStockoutRow(row: any): StockoutEntry {
  return {
    id: row.id,
    date: typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0],
    item: row.item,
    time: row.time_of_day,
    reason: row.reason,
    estimatedLostSales: Number(row.estimated_lost_sales),
  };
}

export function mapEventRow(row: any): CalendarEvent {
  return {
    id: row.id,
    date: typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0],
    name: row.name,
    type: row.type,
    impactPercent: Number(row.impact_percent),
    notes: row.notes || '',
  };
}

export function mapAnomalyRow(row: any): AnomalyTag {
  return {
    id: row.id,
    date: typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0],
    type: row.type,
    severity: row.severity,
    description: row.description,
    excludeFromBaseline: row.exclude_from_baseline,
  };
}

// ─── Fetch All ───

export async function fetchSales(): Promise<SalesItem[]> {
  const { data, error } = await supabase
    .from('sales_data')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapSalesRow);
}

/** Batch insert (e.g. Google Sheet CSV import). Omits id — DB generates keys. */
export async function insertSalesBatch(entries: Omit<SalesItem, 'id'>[]): Promise<SalesItem[]> {
  if (entries.length === 0) return [];
  const rows = entries.map(e => ({
    date: e.date,
    item: e.item,
    category: e.category,
    quantity: e.quantity,
    revenue: e.revenue,
    source: e.source,
  }));
  const { data, error } = await supabase.from('sales_data').insert(rows).select();
  if (error) throw error;
  return (data || []).map(mapSalesRow);
}

export async function fetchWaste(): Promise<WasteEntry[]> {
  const { data, error } = await supabase
    .from('waste_entries')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapWasteRow);
}

export async function fetchStockouts(): Promise<StockoutEntry[]> {
  const { data, error } = await supabase
    .from('stockout_entries')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapStockoutRow);
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapEventRow);
}

export async function fetchAnomalies(): Promise<AnomalyTag[]> {
  const { data, error } = await supabase
    .from('anomaly_tags')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapAnomalyRow);
}

// ─── Inserts ───

export async function insertWaste(entry: Omit<WasteEntry, 'id'>): Promise<WasteEntry> {
  const { data, error } = await supabase
    .from('waste_entries')
    .insert({
      date: entry.date,
      item: entry.item,
      category: entry.category,
      quantity: entry.quantity,
      reason: entry.reason,
      cost_lost: entry.costLost,
    })
    .select()
    .single();
  if (error) throw error;
  return mapWasteRow(data);
}

export async function insertStockout(entry: Omit<StockoutEntry, 'id'>): Promise<StockoutEntry> {
  const { data, error } = await supabase
    .from('stockout_entries')
    .insert({
      date: entry.date,
      item: entry.item,
      time_of_day: entry.time,
      reason: entry.reason,
      estimated_lost_sales: entry.estimatedLostSales,
    })
    .select()
    .single();
  if (error) throw error;
  return mapStockoutRow(data);
}

export async function insertEvent(entry: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      date: entry.date,
      name: entry.name,
      type: entry.type,
      impact_percent: entry.impactPercent,
      notes: entry.notes,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEventRow(data);
}

export async function updateEvent(id: string, patch: Partial<Omit<CalendarEvent, 'id'>>): Promise<CalendarEvent> {
  const row: Record<string, unknown> = {};
  if (patch.date !== undefined) row.date = patch.date;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.impactPercent !== undefined) row.impact_percent = patch.impactPercent;
  if (patch.notes !== undefined) row.notes = patch.notes;
  const { data, error } = await supabase.from('calendar_events').update(row).eq('id', id).select().single();
  if (error) throw error;
  return mapEventRow(data);
}

export async function insertAnomaly(entry: Omit<AnomalyTag, 'id'>): Promise<AnomalyTag> {
  const { data, error } = await supabase
    .from('anomaly_tags')
    .insert({
      date: entry.date,
      type: entry.type,
      severity: entry.severity,
      description: entry.description,
      exclude_from_baseline: entry.excludeFromBaseline,
    })
    .select()
    .single();
  if (error) throw error;
  return mapAnomalyRow(data);
}

// ─── Deletes ───

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteAnomaly(id: string): Promise<void> {
  const { error } = await supabase.from('anomaly_tags').delete().eq('id', id);
  if (error) throw error;
}

// ─── Realtime Subscriptions ───

export function subscribeToTable(
  table: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`realtime-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}
