import { SalesItem, WasteEntry, StockoutEntry, CalendarEvent, AnomalyTag, ProductionRecommendation } from '@/types/operations';

/** When true, the app loads rich demo data so charts and KPIs render without a populated database. */
export const USE_VIRTUAL_DATA = true;

/** Fixed "today" for demo timelines (dashboard, calendar, metrics). */
export const APP_REFERENCE_DATE = '2026-04-06';

export function addCalendarDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

export const categories = ['Sandwiches', 'Salads', 'Pastries', 'Beverages', 'Soups', 'Bowls'];

export const items: Record<string, string[]> = {
  Sandwiches: ['Turkey Club', 'BLT', 'Grilled Cheese', 'Chicken Pesto', 'Veggie Wrap'],
  Salads: ['Caesar Salad', 'Greek Salad', 'Cobb Salad', 'Garden Salad'],
  Pastries: ['Croissant', 'Blueberry Muffin', 'Cinnamon Roll', 'Scone', 'Danish'],
  Beverages: ['Latte', 'Cappuccino', 'Iced Tea', 'Smoothie', 'Drip Coffee'],
  Soups: ['Tomato Soup', 'Chicken Noodle', 'Clam Chowder', 'Minestrone'],
  Bowls: ['Grain Bowl', 'Poke Bowl', 'Burrito Bowl', 'Acai Bowl'],
};

function generateDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date(`${APP_REFERENCE_DATE}T12:00:00`);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export const last30Days = generateDates(30);
export const last7Days = last30Days.slice(-7);

const wasteReasonsPool = ['Expired', 'Overproduction', 'Damaged', 'Quality issue', 'Customer return'];
const stockoutReasonsPool = ['Rush hour', 'Supplier delay', 'Prep shortfall', 'Unexpected demand', 'Equipment issue'];

function createVirtualDataset(): {
  sales: SalesItem[];
  waste: WasteEntry[];
  stockouts: StockoutEntry[];
  events: CalendarEvent[];
  anomalies: AnomalyTag[];
} {
  let seq = 0;
  const nextId = () => `virt-${++seq}`;

  const sales: SalesItem[] = [];
  last30Days.forEach((date, dayIdx) => {
    const dayWave = 0.75 + 0.35 * Math.sin(dayIdx * 0.4) + (dayIdx % 5) * 0.045;
    categories.forEach((cat, ci) => {
      const catItems = items[cat];
      const lines = 2 + ((dayIdx + ci) % 3);
      for (let k = 0; k < lines; k++) {
        const item = catItems[(dayIdx + k + ci) % catItems.length];
        const qty = Math.max(4, Math.round(10 + 22 * dayWave + ((ci * 4 + k * 3) % 18)));
        const unitPrice = 7 + (ci % 5) + (k % 4);
        const revenue = Math.round(qty * unitPrice * (0.92 + 0.06 * ((k + dayIdx) % 3)));
        sales.push({
          id: nextId(),
          date,
          item,
          category: cat,
          quantity: qty,
          revenue,
          source: 'square',
        });
      }
    });
  });

  const waste: WasteEntry[] = [];
  last30Days.forEach((date, dayIdx) => {
    categories.forEach((cat, ci) => {
      if ((dayIdx + ci * 2) % 4 === 0) return;
      const item = items[cat][(dayIdx + ci) % items[cat].length];
      const qty = 1 + ((dayIdx * 3 + ci) % 8);
      waste.push({
        id: nextId(),
        date,
        item,
        category: cat,
        quantity: qty,
        reason: wasteReasonsPool[(dayIdx + ci) % wasteReasonsPool.length],
        costLost: Math.round(qty * (5.5 + (ci % 4) * 1.2)),
      });
    });
  });

  const stockouts: StockoutEntry[] = [];
  last7Days.forEach((date, i) => {
    const picks = i % 3 === 0 ? 2 : 1;
    for (let p = 0; p < picks; p++) {
      const cat = categories[(i + p * 2) % categories.length];
      const item = items[cat][(i + p) % items[cat].length];
      const hour = 9 + ((i * 3 + p * 5) % 10);
      const minute = (i * 17 + p * 23) % 60;
      stockouts.push({
        id: nextId(),
        date,
        item,
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        reason: stockoutReasonsPool[(i + p) % stockoutReasonsPool.length],
        estimatedLostSales: 28 + i * 12 + p * 18,
      });
    }
  });

  const events: CalendarEvent[] = [];
  const eventSeeds: Array<{
    dayOffset: number;
    name: string;
    type: CalendarEvent['type'];
    impactPercent: number;
    notes: string;
  }> = [
    { dayOffset: -14, name: 'Supplier delay (resolved)', type: 'other', impactPercent: -8, notes: 'Short stock on dairy' },
    { dayOffset: -12, name: 'March BOGO weekend', type: 'promotion', impactPercent: 24, notes: 'Pastries + drinks' },
    { dayOffset: -10, name: 'Cold snap', type: 'weather', impactPercent: -15, notes: 'Soup demand up' },
    { dayOffset: -7, name: 'Easter Sunday', type: 'holiday', impactPercent: -35, notes: 'Reduced hours' },
    { dayOffset: -5, name: 'Farmers market', type: 'festival', impactPercent: 18, notes: 'Nearby foot traffic' },
    { dayOffset: -3, name: 'Lunch rush promo', type: 'promotion', impactPercent: 12, notes: 'Half sandwiches' },
    { dayOffset: -2, name: 'High school game night', type: 'sports', impactPercent: 20, notes: 'Late crowd' },
    { dayOffset: -1, name: 'Wind advisory', type: 'weather', impactPercent: -10, notes: 'Outdoor seating closed' },
    { dayOffset: 0, name: 'Monday staff training', type: 'other', impactPercent: -5, notes: 'Short lunch window' },
    { dayOffset: 1, name: 'Spring Street Festival', type: 'festival', impactPercent: 32, notes: 'Main st. closed — booths' },
    { dayOffset: 2, name: 'Corporate catering', type: 'promotion', impactPercent: 14, notes: 'Large AM order' },
    { dayOffset: 3, name: 'Rain PM', type: 'weather', impactPercent: -12, notes: 'Walk-ins down' },
    { dayOffset: 4, name: 'Pop-up vendor fair', type: 'festival', impactPercent: 22, notes: 'Shared courtyard' },
    { dayOffset: 5, name: 'City marathon', type: 'sports', impactPercent: 45, notes: 'Breakfast + early lunch' },
    { dayOffset: 6, name: 'Tax deadline stress', type: 'other', impactPercent: 8, notes: 'Coffee spike' },
    { dayOffset: 7, name: 'Earth Day promo', type: 'promotion', impactPercent: 16, notes: 'Reusable cup discount' },
    { dayOffset: 8, name: 'Local sports final', type: 'sports', impactPercent: 18, notes: 'Evening surge' },
    { dayOffset: 10, name: 'Sunny weekend', type: 'weather', impactPercent: 14, notes: 'Patio + smoothies' },
    { dayOffset: 12, name: 'Heavy rain forecast', type: 'weather', impactPercent: -14, notes: 'Delivery only push' },
    { dayOffset: 14, name: 'Art walk opening', type: 'festival', impactPercent: 26, notes: 'Gallery district' },
    { dayOffset: 17, name: 'School break starts', type: 'holiday', impactPercent: 20, notes: 'Families + snacks' },
    { dayOffset: 21, name: 'Memorial weekend prep', type: 'promotion', impactPercent: 10, notes: 'Pre-order platters' },
    { dayOffset: 25, name: 'Heat wave', type: 'weather', impactPercent: 18, notes: 'Cold drinks' },
    { dayOffset: 28, name: 'Quarterly inventory', type: 'other', impactPercent: -6, notes: 'Early close' },
  ];
  eventSeeds.forEach(seed => {
    events.push({
      id: nextId(),
      date: addCalendarDays(APP_REFERENCE_DATE, seed.dayOffset),
      name: seed.name,
      type: seed.type,
      impactPercent: seed.impactPercent,
      notes: seed.notes,
    });
  });

  const anomalies: AnomalyTag[] = [
    {
      id: nextId(),
      date: '2026-03-28',
      type: 'weather',
      severity: 'medium',
      description: 'Demo: storm day (excluded from baseline)',
      excludeFromBaseline: true,
    },
  ];

  return { sales, waste, stockouts, events, anomalies };
}

export const virtualDataset = createVirtualDataset();

// ─── Pure computation helpers (accept live data) ───

export function computeTodayMetrics(
  sales: SalesItem[],
  waste: WasteEntry[],
  stockouts: StockoutEntry[]
) {
  const today = APP_REFERENCE_DATE;
  const todaySales = sales.filter(s => s.date === today);
  const todayWaste = waste.filter(w => w.date === today);
  const todayStockouts = stockouts.filter(s => s.date === today);

  const totalItems = todaySales.reduce((sum, s) => sum + s.quantity, 0);
  const wasteCount = todayWaste.reduce((sum, w) => sum + w.quantity, 0);

  return {
    totalItems,
    totalRevenue: todaySales.reduce((sum, s) => sum + s.revenue, 0),
    wasteCount,
    wasteCost: todayWaste.reduce((sum, w) => sum + w.costLost, 0),
    stockoutCount: todayStockouts.length,
    lostRevenue: todayStockouts.reduce((sum, s) => sum + s.estimatedLostSales, 0),
    wastePercent: totalItems > 0
      ? ((wasteCount / totalItems) * 100).toFixed(1)
      : '0',
  };
}

export function computeWeeklyTrend(
  sales: SalesItem[],
  waste: WasteEntry[],
  stockouts: StockoutEntry[]
) {
  return last7Days.map(date => {
    const daySales = sales.filter(s => s.date === date);
    const dayWaste = waste.filter(w => w.date === date);
    const dayStockouts = stockouts.filter(s => s.date === date);
    return {
      date: date.slice(5),
      revenue: daySales.reduce((sum, s) => sum + s.revenue, 0),
      waste: dayWaste.reduce((sum, w) => sum + w.costLost, 0),
      stockouts: dayStockouts.length,
      items: daySales.reduce((sum, s) => sum + s.quantity, 0),
    };
  });
}

export function computeCategoryBreakdown(
  sales: SalesItem[],
  waste: WasteEntry[]
) {
  const today = APP_REFERENCE_DATE;
  return categories.map(cat => {
    const catSales = sales.filter(s => s.date === today && s.category === cat);
    const catWaste = waste.filter(w => w.date === today && w.category === cat);
    return {
      category: cat,
      sales: catSales.reduce((sum, s) => sum + s.quantity, 0),
      revenue: catSales.reduce((sum, s) => sum + s.revenue, 0),
      waste: catWaste.reduce((sum, w) => sum + w.quantity, 0),
      wasteCost: catWaste.reduce((sum, w) => sum + w.costLost, 0),
    };
  });
}

export function computeRecommendations(
  sales: SalesItem[],
  waste: WasteEntry[],
  stockouts: StockoutEntry[],
  events: CalendarEvent[],
  anomalies: AnomalyTag[]
): ProductionRecommendation[] {
  const recommendations: ProductionRecommendation[] = [];
  const last7 = last7Days;
  const tomorrow = addCalendarDays(APP_REFERENCE_DATE, 1);
  const tomorrowEvent = events.find(e => e.date === tomorrow);

  categories.forEach(cat => {
    items[cat].forEach(item => {
      const anomalyDates = anomalies.filter(a => a.excludeFromBaseline).map(a => a.date);
      const validDays = last7.filter(d => !anomalyDates.includes(d));

      const avgSales = validDays.length > 0
        ? validDays.reduce((sum, date) => {
            const daySales = sales.filter(s => s.date === date && s.item === item);
            return sum + daySales.reduce((s, d) => s + d.quantity, 0);
          }, 0) / validDays.length
        : 0;

      const recentStockouts = stockouts.filter(s => last7.includes(s.date) && s.item === item);
      const stockoutAdj = recentStockouts.length * 2;

      const recentWaste = waste.filter(w => last7.includes(w.date) && w.item === item);
      const avgWaste = recentWaste.length > 0
        ? recentWaste.reduce((sum, w) => sum + w.quantity, 0) / 7
        : 0;
      const wasteAdj = -Math.round(avgWaste * 0.5);

      const eventMod = tomorrowEvent ? Math.round(avgSales * (tomorrowEvent.impactPercent / 100)) : 0;
      const recommended = Math.max(1, Math.round(avgSales + stockoutAdj + wasteAdj + eventMod));

      let confidence: 'high' | 'medium' | 'low' = 'high';
      if (validDays.length < 5) confidence = 'low';
      else if (recentStockouts.length > 2 || avgWaste > 3) confidence = 'medium';

      const reasons: string[] = [];
      if (stockoutAdj > 0) reasons.push(`+${stockoutAdj} for ${recentStockouts.length} recent stockouts`);
      if (wasteAdj < 0) reasons.push(`${wasteAdj} to reduce overproduction waste`);
      if (eventMod !== 0) reasons.push(`${eventMod > 0 ? '+' : ''}${eventMod} for "${tomorrowEvent?.name}"`);
      if (reasons.length === 0) reasons.push('Based on 7-day average');

      if (avgSales > 0) {
        recommendations.push({
          item,
          category: cat,
          baseSales: Math.round(avgSales),
          stockoutAdjustment: stockoutAdj,
          wasteAdjustment: wasteAdj,
          eventModifier: eventMod,
          recommended,
          confidence,
          reasoning: reasons.join('; '),
        });
      }
    });
  });

  return recommendations.sort((a, b) => b.recommended - a.recommended);
}
