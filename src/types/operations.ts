export interface SalesItem {
  id: string;
  date: string;
  item: string;
  category: string;
  quantity: number;
  revenue: number;
  source: 'square' | 'manual';
}

export interface WasteEntry {
  id: string;
  date: string;
  item: string;
  category: string;
  quantity: number;
  reason: string;
  costLost: number;
}

export interface StockoutEntry {
  id: string;
  date: string;
  item: string;
  time: string;
  reason: string;
  estimatedLostSales: number;
}

export interface CalendarEvent {
  id: string;
  date: string;
  name: string;
  type: 'festival' | 'weather' | 'holiday' | 'promotion' | 'sports' | 'other';
  impactPercent: number; // -50 to +200
  notes: string;
}

export interface AnomalyTag {
  id: string;
  date: string;
  type: 'weather' | 'staffing' | 'equipment' | 'supply' | 'other';
  severity: 'low' | 'medium' | 'high';
  description: string;
  excludeFromBaseline: boolean;
}

export interface ProductionRecommendation {
  item: string;
  category: string;
  baseSales: number;
  stockoutAdjustment: number;
  wasteAdjustment: number;
  eventModifier: number;
  recommended: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

export type ViewType = 'dashboard' | 'production' | 'sales' | 'waste' | 'stockouts' | 'events' | 'anomalies' | 'analytics';

export interface DailyMetrics {
  date: string;
  totalSales: number;
  totalRevenue: number;
  wasteCount: number;
  wasteCost: number;
  stockoutCount: number;
  lostRevenue: number;
}
