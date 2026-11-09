/** Writing helpers handed to every page: links, numbers from the engine, tables, sources. */
import { route, ROUTES } from '../i18n/routes';
import { P, type SourceKey } from './engine/params';
import * as E from './engine/sba';
import { formatMoney, formatNumber, displayDate } from './format';
import { pct } from './pct';
import { etiquettes } from './tableaux';
export { pct };

const esc = (s: string | number) => String(s).replace(/&(?!(?:[a-z]+|#\d+);)/g, '&amp;').replace(/</g, '&lt;');
export function table(headers: string[], rows: Array<Array<string | number>>, caption?: string, align: Array<'l' | 'r'> = []) {
  const al = (i: number) => (align[i] === 'r' ? 'text-right' : 'text-left');
  // On a phone each row becomes a card (class `empile`, global.css): nothing cut at the right edge.
  // A cell holding HTML (« <strong>First-try price only</strong>: … ») is wrapped in one <span>: on a phone the
  // card row is a flex box and each tag or text node would otherwise become its own column.
  // Labels from the trame (lib/tableaux.ts `etiquettes`): the first cell, title of the card, carries none.
  const labs = etiquettes(headers.map((h) => String(h).replace(/<[^>]+>/g, '')), headers.length);
  const lab = (i: number) => (labs[i] ?? '').replace(/"/g, '&quot;');
  return `<div class="not-prose my-6 overflow-x-auto"><table class="journal empile w-full text-sm">${caption ? `<caption class="mb-2 text-left text-sm text-navy-600">${caption}</caption>` : ''}<thead><tr>${headers.map((h, i) => `<th scope="col" class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-navy-700 ${al(i)}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td data-label="${lab(i)}" class="tabular-nums border-b border-navy-100 px-3 py-2 text-navy-800 ${al(i)}">${i > 0 && typeof c !== 'number' && /</.test(c) ? `<span>${c}</span>` : typeof c === 'number' ? esc(formatNumber(c, 0)) : c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** “August 2026” from "2026-08". */
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;

export function helpers(strict = false) {
  const m = (n: number) => formatMoney(Math.round(n), 0);
  const a = (id: string, text: string) => {
    if (!ROUTES.some((r) => r.id === id)) { if (strict) throw new Error(`Unknown page id in a link: ${id}`); return text; }
    return `<a href="${route(id, 'en')}">${text}</a>`;
  };
  /** Rate in percent with two decimals: “9.75%”. */
  const r = (x: number) => `${formatNumber(x, 2)}%`;
  /** “$32.4 billion”, “$58.3 million”. */
  const mil = (x: number) => (x >= 1e9 ? `$${formatNumber(x / 1e9, 1)} billion` : `$${formatNumber(x / 1e6, 1)} million`);
  return {
    P,
    E,
    F: E.F,
    a,
    m,
    r,
    mil,
    num: (n: number) => formatNumber(n, 0),
    num1: (n: number) => formatNumber(n, 1),
    num2: (n: number) => formatNumber(n, 2),
    pc: pct,
    /** “November 8, 2026” from an ISO date. */
    date: (iso: string) => displayDate(iso, 'en-US'),
    ml: monthLabel,
    read: displayDate(P.retrieved_at, 'en-US'),
    fy: `FY ${E.F.fy}`,
    table,
    /** Link to an official source of the parameter file. */
    src: (key: SourceKey, text?: string) => { const s = P.sources[key]; return `<a href="${s.url}" target="_blank" rel="nofollow noopener noreferrer">${text ?? s.label.en}</a>`; },
    box: (title: string, html: string, kind: 'info' | 'tip' | 'warning' | 'example' = 'info') => `<div class="callout callout-${kind}"><span class="callout-title">${title}</span>${html}</div>`,
  };
}
export type Helpers = ReturnType<typeof helpers>;
