/** The parameter file, typed. Every statutory figure shown on a page or used by the engine is read here. */
import RAW from '../../data/params-2026.json';
import FOIA from '../../data/foia.json';
export type SourceKey = keyof typeof RAW.sources;
export const P = RAW;

/**
 * Periods written as months, never as SBA fiscal years (naive testers of 2026-11-08: “FY 2027” read in
 * November 2026 and “last year” for October 2025 to September 2026 confused all three). One label per period,
 * used by every page: the fee schedule in force, the previous one, and the year of the loan file.
 */
const MO = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const ym = (iso: string) => `${MO[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const yearBefore = (iso: string) => `${Number(iso.slice(0, 4)) - 1}${iso.slice(4)}`;
export const span = (from: string, to: string) => `${ym(from)}–${ym(to)}`;
/** Fees in force: loans approved Oct. 2026–Sept. 2027. */
export const FEES_NOW = span(RAW.fy.from, RAW.fy.to);
/** Previous schedule: loans approved Oct. 2025–Sept. 2026. */
export const FEES_PREV = span(yearBefore(RAW.fy.from), yearBefore(RAW.fy.to));
/** Loans of the SBA file: approved Oct. 2025–Sept. 2026. */
export const DATA_YEAR = span(`${FOIA.fy - 1}-10-01`, `${FOIA.fy}-09-30`);
