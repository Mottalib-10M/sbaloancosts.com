import { formatPercent } from './format';
/** Percentage: two decimals under 1 %, one above (pass rates read to a tenth of a point). */
export const pct = (x: number, d?: number) => formatPercent(x, d ?? (x < 0.01 ? 2 : 1));
