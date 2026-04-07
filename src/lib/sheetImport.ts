import type { SalesItem } from '@/types/operations';

/** Strip UTF-8 BOM often present in Google / Excel CSV exports */
function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

/**
 * RFC-style split: delimiter can be comma, tab, or semicolon. Handles "quoted,fields".
 */
export function parseDelimitedRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let i = 0;
  let inQuotes = false;
  const t = stripBom(text);
  while (i < t.length) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === delimiter) {
      row.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (c === '\r') {
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(cur);
      cur = '';
      if (row.some(cell => cell.trim().length > 0)) rows.push(row);
      row = [];
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  row.push(cur);
  if (row.some(cell => cell.trim().length > 0)) rows.push(row);
  return rows;
}

export function detectDelimiter(firstLine: string): string {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const semis = (firstLine.match(/;/g) || []).length;
  if (tabs >= commas && tabs >= semis && tabs > 0) return '\t';
  if (semis > commas) return ';';
  return ',';
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

const HEADER_ALIASES: Record<string, 'date' | 'item' | 'category' | 'quantity' | 'revenue' | 'source'> = {
  date: 'date',
  'sale date': 'date',
  day: 'date',
  item: 'item',
  product: 'item',
  sku: 'item',
  name: 'item',
  category: 'category',
  type: 'category',
  dept: 'category',
  quantity: 'quantity',
  qty: 'quantity',
  units: 'quantity',
  count: 'quantity',
  revenue: 'revenue',
  amount: 'revenue',
  total: 'revenue',
  sales: 'revenue',
  'line total': 'revenue',
  source: 'source',
  origin: 'source',
};

type ParsedColMap = {
  date: number;
  item: number;
  category: number;
  quantity: number;
  revenue: number;
  source?: number;
};

function resolveHeader(cell: string): 'date' | 'item' | 'category' | 'quantity' | 'revenue' | 'source' | undefined {
  const n = normalizeHeader(cell);
  const direct = HEADER_ALIASES[n];
  if (direct) return direct;
  const compact = n.replace(/[^a-z0-9]/g, '');
  for (const [alias, key] of Object.entries(HEADER_ALIASES)) {
    if (alias.replace(/[^a-z0-9]/g, '') === compact) return key;
  }
  return undefined;
}

function mapHeaders(headers: string[]): ParsedColMap | null {
  const idx: Partial<Record<'date' | 'item' | 'category' | 'quantity' | 'revenue' | 'source', number>> = {};
  headers.forEach((h, i) => {
    const key = resolveHeader(h);
    if (!key || idx[key] !== undefined) return;
    idx[key] = i;
  });
  if (idx.date === undefined || idx.item === undefined || idx.quantity === undefined || idx.revenue === undefined) {
    return null;
  }
  return {
    date: idx.date,
    item: idx.item,
    category: idx.category ?? -1,
    quantity: idx.quantity,
    revenue: idx.revenue,
    source: idx.source,
  };
}

function parseMoney(s: string): number {
  const cleaned = String(s).replace(/[$€£,\s]/g, '').replace(/[^\d.-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseQty(s: string): number {
  const n = parseFloat(String(s).replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : 0;
}

/** Accepts ISO dates, Sheets serial-ish strings, M/D/YYYY */
export function normalizeSheetDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (mdy) {
    const [, mo, da, y] = mdy;
    const mm = mo.padStart(2, '0');
    const dd = da.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return null;
}

export type SheetImportResult = {
  rows: Omit<SalesItem, 'id'>[];
  errors: string[];
  skipped: number;
};

/**
 * Parses Google Sheets CSV/TSV export or pasted table text.
 * Expected columns (header row): Date, Item, Category (optional), Quantity, Revenue [, Source]
 */
export function parseSalesFromSheetText(text: string): SheetImportResult {
  const errors: string[] = [];
  const lines = stripBom(text).split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { rows: [], errors: ['Need a header row and at least one data row.'], skipped: 0 };
  }
  const delim = detectDelimiter(lines[0]);
  const matrix = parseDelimitedRows(text, delim);
  if (matrix.length < 2) {
    return { rows: [], errors: ['Could not parse rows.'], skipped: 0 };
  }
  const colMap = mapHeaders(matrix[0]);
  if (!colMap) {
    return {
      rows: [],
      errors: [
        'Missing required columns. Use: Date, Item, Quantity, Revenue (Category optional).',
      ],
      skipped: 0,
    };
  }

  const rows: Omit<SalesItem, 'id'>[] = [];
  let skipped = 0;
  for (let r = 1; r < matrix.length; r++) {
    const line = matrix[r];
    const rowNum = r + 1;
    try {
      const dateRaw = line[colMap.date]?.trim() ?? '';
      const item = line[colMap.item]?.trim() ?? '';
      const cat =
        colMap.category >= 0 ? (line[colMap.category]?.trim() || 'General') : 'General';
      const qtyRaw = line[colMap.quantity] ?? '';
      const revRaw = line[colMap.revenue] ?? '';
      const sourceRaw =
        colMap.source !== undefined ? (line[colMap.source]?.trim().toLowerCase() || 'manual') : 'manual';

      if (!dateRaw && !item && !qtyRaw && !revRaw) {
        skipped++;
        continue;
      }

      const date = normalizeSheetDate(dateRaw);
      if (!date) {
        errors.push(`Row ${rowNum}: invalid date "${dateRaw}"`);
        skipped++;
        continue;
      }
      if (!item) {
        errors.push(`Row ${rowNum}: missing item`);
        skipped++;
        continue;
      }
      const quantity = parseQty(qtyRaw);
      const revenue = parseMoney(revRaw);
      if (quantity <= 0) {
        errors.push(`Row ${rowNum}: quantity must be > 0`);
        skipped++;
        continue;
      }
      if (revenue < 0) {
        errors.push(`Row ${rowNum}: invalid revenue`);
        skipped++;
        continue;
      }

      const source: 'square' | 'manual' =
        sourceRaw === 'square' ? 'square' : 'manual';

      rows.push({ date, item, category: cat, quantity, revenue, source });
    } catch {
      errors.push(`Row ${rowNum}: could not parse`);
      skipped++;
    }
  }

  return { rows, errors, skipped };
}

export const SALES_SHEET_TEMPLATE = `Date,Item,Category,Quantity,Revenue,Source
2026-04-06,Latte,Beverages,42,189.00,manual
2026-04-06,Croissant,Pastries,30,135.50,manual`;
