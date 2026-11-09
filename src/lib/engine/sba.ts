/**
 * SBA loan cost engine. Pure functions; every rule and rate comes from `data/params-2026.json`
 * (fee notices 5000-881797 and 5000-881796, SOP 50 10 8.1, 87 FR 46883, 13 CFR 120) and every
 * observed figure from `data/foia.json` (SBA 7(a) and 504 FOIA files, built by scripts/build-data.py).
 */
import { P } from './params';
import FOIA from '../../data/foia.json';

export const F = FOIA;
export type RateType = 'variable' | 'fixed';
export type Program = 'standard' | 'express';
export type StateCode = keyof typeof FOIA.states;
export const STATES = Object.keys(FOIA.states).sort((a, b) => FOIA.states[a as StateCode].name.localeCompare(FOIA.states[b as StateCode].name)) as StateCode[];
export const stateName = (s: StateCode) => FOIA.states[s].name;

const clampAmt = (a: number) => Math.max(0, Math.min(P.sevenA.maxLoan, a));
const step = (steps: Array<{ upTo: number | null; spread: number }>, amount: number) =>
  (steps.find((s) => s.upTo === null || amount <= s.upTo) ?? steps[steps.length - 1]).spread;

/** Maximum spread over prime allowed for a 7(a) loan of this size (variable: SOP 50 10 8.1; fixed: 87 FR 46883). */
export function maxSpread(amount: number, type: RateType): number {
  return step(type === 'fixed' ? P.sevenA.fixedSpreads : P.sevenA.variableSpreads, clampAmt(amount));
}
/** Maximum initial rate, in percent, on the prime of the parameter file (or another prime). */
export function maxRate(amount: number, type: RateType, prime = P.prime.rate): number {
  return round2(prime + maxSpread(amount, type));
}

/** SBA guaranty percentage: 85 % up to $150,000, 75 % above; SBA Express 50 %. */
export function guarantyPct(amount: number, program: Program = 'standard'): number {
  if (program === 'express') return P.sevenA.guaranty.expressPct;
  return amount <= P.sevenA.guaranty.smallUpTo ? P.sevenA.guaranty.smallPct : P.sevenA.guaranty.largePct;
}
export function guaranteedPortion(amount: number, program: Program = 'standard'): number {
  return Math.min((clampAmt(amount) * guarantyPct(amount, program)) / 100, P.sevenA.maxGuarantyAmount);
}

type FeeSchedule = { tiers: Array<{ upTo: number; rate: number; rateOver1M?: number }>; waiver: { upTo: number; rate: number } };
export interface FeeInput { amount: number; program?: Program; waiver?: boolean; shortTerm?: boolean; veteranExpress?: boolean; schedule?: 'current' | 'previous' }
export interface FeeResult { guaranteed: number; pct: number; fee: number; rateApplied: number; waived: boolean; lenderMayKeep: number }

/** SBA guaranty fee (upfront fee) on a 7(a) loan, on the guaranteed portion, by gross loan amount. */
export function upfrontFee({ amount, program = 'standard', waiver = false, shortTerm = false, veteranExpress = false, schedule = 'current' }: FeeInput): FeeResult {
  const a = clampAmt(amount);
  const S: FeeSchedule = schedule === 'previous' ? P.fees7aPrev : P.fees7a;
  const g = guaranteedPortion(a, program);
  const pct = guarantyPct(a, program);
  const base = { guaranteed: g, pct, waived: false, lenderMayKeep: 0 };
  if (program === 'express' && veteranExpress) return { ...base, fee: 0, rateApplied: 0, waived: true };
  if (waiver && a <= S.waiver.upTo) return { ...base, fee: 0, rateApplied: 0, waived: true };
  if (shortTerm) return { ...base, fee: round2((g * P.fees7a.shortTermRate) / 100), rateApplied: P.fees7a.shortTermRate };
  const tier = S.tiers.find((t) => a <= t.upTo) ?? S.tiers[S.tiers.length - 1];
  let fee: number;
  if (tier.rateOver1M !== undefined) fee = (Math.min(g, 1_000_000) * tier.rate) / 100 + (Math.max(0, g - 1_000_000) * tier.rateOver1M) / 100;
  else fee = (g * tier.rate) / 100;
  const lenderMayKeep = a <= S.tiers[0].upTo ? (fee * P.fees7a.lenderRetainSmall) / 100 : 0;
  return { ...base, fee: round2(fee), rateApplied: tier.rate, lenderMayKeep: round2(lenderMayKeep) };
}

/** Level monthly payment. rate in percent a year, n months. */
export function payment(principal: number, ratePct: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const r = ratePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}
export function totalInterest(principal: number, ratePct: number, months: number): number {
  return payment(principal, ratePct, months) * months - principal;
}
/** Balance left after k payments. */
export function balanceAfter(principal: number, ratePct: number, months: number, k: number): number {
  const r = ratePct / 100 / 12, pmt = payment(principal, ratePct, months);
  if (r === 0) return Math.max(0, principal - pmt * k);
  return Math.max(0, principal * Math.pow(1 + r, k) - (pmt * (Math.pow(1 + r, k) - 1)) / r);
}

export interface Cost7aInput { amount: number; years: number; rate: number; type?: RateType; program?: Program; waiver?: boolean; financeFee?: boolean; packagingFee?: number }
export interface Cost7aResult { fee: FeeResult; maxRate: number; overMax: boolean; principal: number; months: number; monthly: number; interest: number; total: number; costOfCredit: number }
/** What a 7(a) loan costs the borrower: guaranty fee (paid in cash or financed), interest at the rate typed, any packaging fee typed. */
export function cost7a({ amount, years, rate, type = 'variable', program = 'standard', waiver = false, financeFee = true, packagingFee = 0 }: Cost7aInput): Cost7aResult {
  const a = clampAmt(amount);
  const months = Math.max(1, Math.round(years * 12));
  const fee = upfrontFee({ amount: a, program, waiver, shortTerm: months <= 12 });
  const principal = financeFee ? a + fee.fee : a;
  const monthly = payment(principal, rate, months);
  const interest = monthly * months - principal;
  const mx = maxRate(a, type);
  const costOfCredit = interest + fee.fee + packagingFee;
  return { fee, maxRate: mx, overMax: rate > mx + 1e-9, principal, months, monthly, interest, total: a + costOfCredit, costOfCredit };
}

/** Annual percentage cost of a loan whose fees are paid up front: the rate that equates the net amount received with the payments. */
export function effectiveRate(netReceived: number, monthly: number, months: number): number {
  if (netReceived <= 0 || monthly <= 0) return 0;
  let lo = 0, hi = 1; // monthly rate
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const pv = (monthly * (1 - Math.pow(1 + mid, -months))) / mid;
    if (pv > netReceived) lo = mid; else hi = mid;
  }
  return round2(((lo + hi) / 2) * 12 * 100);
}

export interface CompareInput { amount: number; sbaYears: number; sbaRate: number; waiver?: boolean; convYears: number; convRate: number; convFeePct: number }
/** SBA 7(a) against a conventional loan typed by the reader: monthly payment, cash cost of credit, effective rate. */
export function compare({ amount, sbaYears, sbaRate, waiver = false, convYears, convRate, convFeePct }: CompareInput) {
  // Fee financed, as on the home calculator (naive test of 2026-11-08: “financed” there, “paid at closing” here).
  const s = cost7a({ amount, years: sbaYears, rate: sbaRate, waiver, financeFee: true });
  const n = Math.max(1, Math.round(convYears * 12));
  const convMonthly = payment(amount, convRate, n);
  const convFee = (amount * convFeePct) / 100;
  const convInterest = convMonthly * n - amount;
  return {
    sba: { monthly: s.monthly, fee: s.fee.fee, interest: s.interest, cost: s.interest + s.fee.fee, months: s.months, apr: effectiveRate(amount, s.monthly, s.months) },
    conv: { monthly: convMonthly, fee: convFee, interest: convInterest, cost: convInterest + convFee, months: n, apr: effectiveRate(amount - convFee, convMonthly, n) },
  };
}

/** Subsidy recoupment fee (SOP 50 10 8.1): term of 15 years or more, voluntary prepayment above 25 % in one of the first three years. */
export function recoupmentFee(loan: number, termYears: number, year: number, prepaid: number): { fee: number; applies: boolean; rate: number; threshold: number } {
  const R = P.sevenA.recoupment;
  const threshold = (loan * R.thresholdPct) / 100;
  const y = Math.round(year);
  const rate = termYears >= R.minTermYears && y >= 1 && y <= R.byYear.length ? R.byYear[y - 1] : 0;
  const applies = rate > 0 && prepaid > threshold;
  return { fee: applies ? round2((prepaid * rate) / 100) : 0, applies, rate, threshold };
}

export type Biz504 = 'existing' | 'new' | 'special' | 'newSpecial';
export interface Cost504Input { project: number; biz?: Biz504; term?: 10 | 20 | 25; debentureRate: number; bankRate: number; bankYears?: number; closing?: number; cdcServicing?: number; waiver?: boolean }
/** A 504 project: borrower contribution, bank first loan, CDC debenture with its fees financed (SOP pricing steps). */
export function cost504({ project, biz = 'existing', term = 25, debentureRate, bankRate, bankYears, closing = 2500, cdcServicing = P.fees504.cdcServicingMin, waiver = false }: Cost504Input) {
  const S = P.fees504.structure;
  const borrowerPct = biz === 'newSpecial' ? S.borrowerNewSpecial : biz === 'existing' ? S.borrower : biz === 'new' ? S.borrowerNew : S.borrowerSpecial;
  const borrower = (project * borrowerPct) / 100;
  const bank = (project * S.bank) / 100;
  const net = project - borrower - bank;
  const sbaFee = waiver ? 0 : (net * P.fees504.upfront) / 100;
  const funding = (net * P.fees504.funding) / 100;
  const processing = (net * P.fees504.processingMax) / 100;
  const close = Math.min(closing, P.fees504.closingFinancedMax);
  const uw = term === 10 ? P.fees504.underwriter10 : P.fees504.underwriter20_25;
  const grossRaw = (net + sbaFee + funding + processing + close) / (1 - uw / 100);
  const gross = Math.ceil(grossRaw / 1000) * 1000;
  const months = term * 12;
  const annualFeePct = (waiver ? 0 : P.fees504.annual) + cdcServicing;
  // Ongoing fees are charged on the unpaid balance with each payment: added to the note rate for the payment.
  const debMonthly = payment(gross, debentureRate + annualFeePct, months);
  const bankMonths = Math.round((bankYears ?? (term === 10 ? 10 : 10)) * 12);
  const bankMonthly = payment(bank, bankRate, bankMonths);
  return {
    borrowerPct, borrower, bank, net, fees: { sba: sbaFee, funding, processing, closing: close, underwriter: gross - (net + sbaFee + funding + processing + close) },
    gross, annualFeePct: round2(annualFeePct * 1000) / 1000, debMonthly, bankMonthly, months, bankMonths,
    debInterestAndFees: debMonthly * months - gross, bankInterest: bankMonthly * bankMonths - bank,
  };
}

/** Microloan: the most an intermediary may charge (13 CFR 120.707) given its own SBA loan rate. */
export function microMaxRate(amount: number, intermediaryRate: number): number {
  return round2(intermediaryRate + (amount <= P.micro.smallUpTo ? P.micro.spreadSmall : P.micro.spreadLarge));
}
/** The rate SBA would charge an intermediary borrowing now (13 CFR 120.706): 5-year Treasury to the nearest 1/8, less 1.25 or 2 points. */
export function intermediaryRateNow(specialized = false): number {
  const t = Math.round(P.treasury5y.rate / P.micro.intermediaryRoundTo) * P.micro.intermediaryRoundTo;
  return round2(t - (specialized ? P.micro.specializedLessTreasury : P.micro.intermediaryLessTreasury));
}

/** Size band of the FOIA tables (the steps of the variable-rate maximum). */
export function bandOf(amount: number): number {
  const b = FOIA.bands.findIndex(([lo, hi]) => amount > lo && (hi === null || amount <= hi));
  return b < 0 ? FOIA.bands.length - 1 : b;
}
export const BAND_LABELS = ['$50,000 or less', '$50,001 to $250,000', '$250,001 to $350,000', 'over $350,000'];

/** Share of FY loans of the same band and rate type priced at or below `rate` (percentile, 0 to 1). */
export function ratePercentile(rate: number, amount: number, type: RateType): { share: number; n: number; median: number } | null {
  const cell = FOIA.national.rates[type === 'fixed' ? 'F' : 'V'][bandOf(amount)];
  if (!cell) return null;
  const p = cell.p; // 21 points: min, 5 %, ..., 95 %, max
  const median = p[10];
  if (rate <= p[0]) return { share: 0, n: cell.n, median };
  if (rate >= p[20]) return { share: 1, n: cell.n, median };
  // Highest step whose value is <= rate; ties (many loans at the same rate) take the upper end of the tie.
  let k = 0;
  for (let i = 0; i <= 20; i++) if (p[i] <= rate + 1e-9) k = i;
  if (k < 20 && p[k] < rate && p[k + 1] > p[k]) {
    const frac = (rate - p[k]) / (p[k + 1] - p[k]);
    return { share: Math.min(1, (k + frac) / 20), n: cell.n, median };
  }
  return { share: k / 20, n: cell.n, median };
}

/**
 * Where a margin over prime falls among FY loans of the same band and rate type (naive test of 2026-11-08:
 * a rate on today's prime set against rates priced on last year's lower prime read as “the median is
 * expensive”). Margins are compared with margins, so the prime of either date drops out.
 * `below`: share of loans with a lower margin; `above`: share with a higher one; the rest had the same margin.
 */
export function marginPlace(margin: number, amount: number, type: RateType): { below: number; above: number; n: number; median: number } | null {
  const cell = FOIA.national.spreads[type === 'fixed' ? 'F' : 'V'][bandOf(amount)];
  if (!cell) return null;
  const p = cell.p, eps = 1e-9, x = margin;
  let below: number, upTo: number;
  if (x <= p[0] + eps) below = 0;
  else if (x > p[20] + eps) below = 1;
  else {
    const k = p.findIndex((y) => y >= x - eps);
    below = Math.abs(p[k] - x) < eps ? k / 20 : (k - 1 + (x - p[k - 1]) / (p[k] - p[k - 1])) / 20;
  }
  if (x >= p[20] - eps) upTo = 1;
  else if (x < p[0] - eps) upTo = 0;
  else {
    let k = 0;
    for (let i = 0; i <= 20; i++) if (p[i] <= x + eps) k = i;
    upTo = Math.abs(p[k] - x) < eps ? k / 20 : (k + (x - p[k]) / (p[k + 1] - p[k])) / 20;
  }
  return { below, above: 1 - upTo, n: cell.n, median: p[10] };
}

/** Prime in effect on the first business day of a month of the FOIA year. */
export const primeOf = (ym: string): number | undefined => (FOIA.national.primeByMonth as Record<string, number>)[ym];

export function round2(x: number) { return Math.round(x * 100) / 100; }
