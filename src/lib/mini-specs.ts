/**
 * Calculators, one per subject (RECETTE §9.3). Each calls the tested engine of `lib/engine/sba.ts`; none
 * computes on its own. Rates a reader is offered by a lender are typed by the reader: the only rates loaded
 * are the prime of the parameter file, SBA's maximums and the medians of the SBA FOIA file.
 */
import type { MiniSpec } from './mini-types';
import { P, DATA_YEAR, FEES_PREV } from './engine/params';
import * as E from './engine/sba';
import { formatMoney as fm, formatNumber, displayDate } from './format';

const m = (n: number) => fm(Math.round(n), 0);
const r2 = (x: number) => `${formatNumber(x, 2)}%`;
const opt = (labels: string[]) => labels.map((label, i) => ({ value: String(i), label }));
const money = (id: string, label: string, def: number, max = P.sevenA.maxLoan, help?: string) => ({ id, label, def, unit: '$', max, help });
const rateIn = (id: string, label: string, def: number, help?: string) => ({ id, label, def, unit: '%', max: 30, decimals: 2, help });
const dd = (iso: string) => displayDate(iso, 'en-US');
const PRIME = `prime rate ${r2(P.prime.rate)} on ${dd(P.prime.date)}`;
const TYPES = opt(['Variable (follows the prime rate)', 'Fixed for the whole term']);
const TYPE_HELP = `The prime rate is the base rate banks lend from: ${r2(P.prime.rate)} today. A variable SBA rate is prime plus a margin that stays the same for the life of the loan.`;
const type = (v: number): E.RateType => (Math.round(v) === 1 ? 'fixed' : 'variable');
const YEARS = [5, 7, 10, 15, 20, 25];
// Short labels: the longer one was cut in the select on a phone (naive test of 2026-11-08).
// “10 years (buying a business)” made a landscaper and a machine shop think the tool was not for them (2026-11-08).
const TERM = YEARS.map((y) => ({ value: String(y), label: `${y} years${y === 10 ? ' (most loans)' : y === 25 ? ' (real estate)' : ''}` }));
const TERM_HELP = 'Equipment, vehicles, working capital or buying a business: up to 10 years. Real estate: up to 25 years.';
// One question per group, so each reader can answer for their own business (editor, 2026-11-08: relief testable simply).
// “A farm or food business” made a café owner pick it (naive test of 2026-11-08): restaurants are not on the list.
const RELIEF = opt(['None of these', 'A manufacturer (machine shop, food processor…)', 'A farm or food supplier (not a restaurant)', 'Located in a rural area']);
const RELIEF_LABEL = 'Manufacturer, farm or rural? You may pay no SBA fee';
const RELIEF_HELP = `$0 fee up to ${m(P.fees7a.waiver.upTo)} for these three. Restaurants and cafés count only in a rural area. Your lender checks your industry code and address.`;
/** The common example: the median 7(a) loan of the SBA file, the same on every page (naive test of 2026-11-08:
 *  $100,000, $150,000, $300,000, $350,000 and $500,000 on five pages made the same results look inconsistent). */
export const EXAMPLE_AMOUNT = Math.round(E.F.national.medAmt / 10000) * 10000;
const EXAMPLE_HELP = `Example: ${m(EXAMPLE_AMOUNT)}, the median SBA 7(a) loan approved ${DATA_YEAR}. Type yours.`;
const RATE_HELP = `Example until you type your quote: the typical rate for this amount, today’s prime ${r2(P.prime.rate)} plus the median margin paid on similar SBA loans.`;
const relief = (x: number) => Math.round(x) >= 1;
/** While nothing is typed the figures are an example (editor, 2026-11-08): MiniSim now shows the trame's
 *  « Example, not your result yet » (MentionExemple) above the result, so the head no longer adds “(example)”. */
const typed = (touched?: Record<string, boolean>) => !!touched && Object.keys(touched).length > 0;
const ex = (label: string, _touched?: Record<string, boolean>) => label;
const ST = E.STATES.map((s, i) => ({ value: String(i), label: E.stateName(s) }));
export const stateIndex = (s: E.StateCode) => E.STATES.indexOf(s);
const st = (v: number): E.StateCode => E.STATES[Math.max(0, Math.min(E.STATES.length - 1, Math.round(v)))];
export const LENDERS = E.F.national.lenders.slice(0, 20);
const LEND = LENDERS.map((l, i) => ({ value: String(i), label: shortBank(l.name) }));
export function shortBank(name: string) {
  // Usual short names; the legal name stays in the FOIA file. No cut in the middle of a word.
  if (/^Manufacturers and Traders Trust/i.test(name)) return 'M&T Bank';
  return name.replace(/,? A Division of .*$/i, '').replace(/,? National Association$/i, '').replace(/,? N\.A\.$/i, '').replace(/^The /, '').replace(/ Company$/, '').replace(/,? LLC$/, '').replace(/ Corporation$/, '').replace(/,? Inc\.$/, '');
}
/**
 * The reader's rate placed among last year's loans of the same size, on its margin over prime (naive test of
 * 2026-11-08: a prefilled “median” rate on today's prime was called dearer than 8 loans in 10 priced on last
 * year's lower prime). The same margin as the median always reads “about the median”.
 */
export function placeLine(rate: number, amount: number, t: E.RateType): string | null {
  const pl = E.marginPlace(rate - P.prime.rate, amount, t);
  if (!pl) return null;
  if (rate > E.maxRate(amount, t) + 1e-9) return 'above the SBA cap';
  if (Math.abs(rate - E.maxRate(amount, t)) < 1e-9) return 'at the SBA cap';
  if (pl.below >= 0.95) return 'higher than almost all loans of this size';
  if (pl.above >= 0.95) return 'lower than almost all loans of this size';
  if (pl.below > 0.55) return `higher than about ${Math.round(pl.below * 10)} in 10 loans of this size`;
  if (pl.above > 0.55) return `lower than about ${Math.round(pl.above * 10)} in 10 loans of this size`;
  return 'about the median for this size';
}
const FY = DATA_YEAR;
const LAST = 'similar SBA loans';
const FOIA_NOTE = `Similar loans: the SBA 7(a) loans of the same size approved ${DATA_YEAR}, from SBA’s public loan file.`;
const MARGIN_NOTE = `Rates are compared on the margin over prime, so a change in prime does not count against you.`;
/** “31 in 100”: a share of loans never shown as a percent next to rates (naive test of 2026-11-08). */
const per100 = (x: number) => `${Math.round(x * 100)} in 100`;
/** Typical rate for an amount: median of FY loans of the same size band, moved to today's prime by its median spread. */
export function typicalRate(amount: number, t: E.RateType = 'variable'): number {
  const b = E.bandOf(amount);
  if (t === 'variable') {
    const s = E.F.national.medSpreadVBand[b];
    if (s !== null) return E.round2(Math.min(P.prime.rate + s, E.maxRate(amount, 'variable')));
  }
  const cell = E.F.national.spreads.F[b];
  return E.round2(Math.min(P.prime.rate + (cell ? cell.p[10] : E.maxSpread(amount, t)), E.maxRate(amount, t)));
}

const SPECS: Record<string, MiniSpec> = {
  /** Home and 7(a) page: the whole cost of a standard 7(a) loan. */
  cost: {
    title: 'SBA 7(a) loan: monthly payment, SBA fee, SBA cap and total cost',
    cta: 'How the cost is worked out',
    ctaPage: 'method',
    inputs: [
      money('amount', 'Loan amount', EXAMPLE_AMOUNT, P.sevenA.maxLoan, `${EXAMPLE_HELP} Up to ${m(P.sevenA.maxLoan)}.`),
      { id: 'years', label: 'Term', def: 10, options: TERM, help: TERM_HELP },
      { id: 'type', label: 'Rate type', def: 0, options: TYPES, help: TYPE_HELP },
      { ...rateIn('rate', 'Rate the lender offers you', typicalRate(EXAMPLE_AMOUNT), RATE_HELP), follow: (v) => typicalRate(v.amount, type(v.type)) },
      { id: 'relief', label: RELIEF_LABEL, def: 0, options: RELIEF, help: RELIEF_HELP },
    ],
    run: (v, touched) => {
      const t = type(v.type);
      const r = E.cost7a({ amount: v.amount, years: Math.round(v.years) || 10, rate: v.rate, type: t, waiver: relief(v.relief) });
      const place = placeLine(v.rate, v.amount, t);
      const rows: Array<[string, string]> = [
        ['SBA guaranty fee, added to the loan', r.fee.waived ? '$0 (waived)' : m(r.fee.fee)],
        ['SBA cap (highest rate allowed)', `${r2(r.maxRate)}${r.overMax ? ': yours is above it' : ''}`],
        ['Interest, all years', m(r.interest)],
        ['Total: fee + interest', m(r.interest + r.fee.fee)],
        ['True yearly cost, fee included', r2(E.effectiveRate(r.principal - r.fee.fee, r.monthly, r.months))],
      ];
      if (place) rows.push([`Your rate vs. ${LAST}`, place]);
      const feeTip = !relief(v.relief) && r.fee.fee > 0 && v.amount <= P.fees7a.waiver.upTo ? `Fee counted: ${m(r.fee.fee)}. A manufacturer, farm, food supplier or rural business pays $0: change the last field. ` : '';
      return { head: [ex('Monthly payment', touched), m(r.monthly)], rows, note: `${feeTip}${PRIME[0].toUpperCase()}${PRIME.slice(1)}. ${FOIA_NOTE}` };
    },
  },
  /** Rate page: today's maximums and where an offer sits. */
  ratecheck: {
    title: 'Is the rate you were offered high or low?',
    cta: 'See the SBA cap table and real rates',
    ctaPage: 'sba-loan-rates',
    inputs: [
      money('amount', 'Loan amount', EXAMPLE_AMOUNT, P.sevenA.maxLoan, EXAMPLE_HELP),
      { id: 'type', label: 'Rate type', def: 0, options: TYPES },
      { ...rateIn('rate', 'Rate offered', typicalRate(EXAMPLE_AMOUNT), RATE_HELP), follow: (v) => typicalRate(v.amount, type(v.type)) },
    ],
    run: (v, touched) => {
      const t = type(v.type);
      const mx = E.maxRate(v.amount, t);
      const pl = E.marginPlace(v.rate - P.prime.rate, v.amount, t);
      const line = placeLine(v.rate, v.amount, t);
      const b = E.bandOf(v.amount);
      const rows: Array<[string, string]> = [
        [`SBA cap today (highest rate allowed)`, `${r2(mx)} (prime + ${formatNumber(E.maxSpread(v.amount, t), 1)})`],
        ['Your margin over prime', `${formatNumber(v.rate - P.prime.rate, 2)} points`],
      ];
      if (pl) {
        rows.push([`Typical margin, loans of ${E.BAND_LABELS[b]}`, `${formatNumber(pl.median, 2)} points`]);
        rows.push(['Typical rate today', r2(E.round2(Math.min(P.prime.rate + pl.median, mx)))]);
        // Three shares that add up to 100 (naive test of 2026-11-08: “45% / 30%”, where are the other 25?).
        const same = Math.max(0, 1 - pl.below - pl.above);
        rows.push([`Of ${formatNumber(pl.n, 0)} similar ${t} loans: lower margin than yours`, per100(pl.below)]);
        rows.push(['Same margin as yours', per100(same)]);
        rows.push(['Higher margin than yours', per100(pl.above)]);
      }
      const atCap = t === 'variable' ? E.F.national.atCapVBand[b] : null;
      if (atCap !== null) rows.push(['Loans of this size priced at the cap', per100(atCap)]);
      return { head: [typed(touched) ? 'Your rate is' : 'This example rate is', line ?? r2(v.rate)], rows, note: `${PRIME[0].toUpperCase()}${PRIME.slice(1)}. Margin = rate minus prime. Typical = the median: half of similar loans paid less, half more. ${FOIA_NOTE}` };
    },
  },
  /** Guaranty fee page: FY 2027 against FY 2026. */
  fee: {
    title: `SBA guaranty fee on loans approved from ${dd(P.fy.from)}`,
    cta: 'Full cost with interest',
    ctaPage: 'home',
    inputs: [
      money('amount', 'Loan amount', EXAMPLE_AMOUNT, P.sevenA.maxLoan, EXAMPLE_HELP),
      { id: 'prog', label: 'Loan type', def: 0, options: opt(['Standard 7(a)', `SBA Express (${P.sevenA.guaranty.expressPct}% guaranty)`]) },
      { id: 'relief', label: RELIEF_LABEL, def: 0, options: RELIEF, help: RELIEF_HELP },
    ],
    run: (v, touched) => {
      const program: E.Program = Math.round(v.prog) === 1 ? 'express' : 'standard';
      const amount = program === 'express' ? Math.min(v.amount, P.sevenA.expressMax) : v.amount;
      const now = E.upfrontFee({ amount, program, waiver: relief(v.relief) });
      const prev = E.upfrontFee({ amount, program, waiver: relief(v.relief), schedule: 'previous' });
      const rows: Array<[string, string]> = [
        ['Guaranteed portion', `${m(now.guaranteed)} (${now.pct}%)`],
        ['Rate applied to it', now.waived ? 'waived' : `${formatNumber(now.rateApplied, 2)}%${amount > 1_000_000 && program === 'standard' ? ` (3.75% above ${m(1_000_000)} guaranteed)` : ''}`],
        [`Same loan approved ${FEES_PREV}`, prev.waived ? '$0 (waived)' : m(prev.fee)],
      ];
      if (now.lenderMayKeep > 0) rows.push(['Part the lender may keep', m(now.lenderMayKeep)]);
      return { head: [ex('One-time SBA guaranty fee', touched), now.waived ? '$0' : m(now.fee)], rows, note: `${program === 'express' && v.amount > P.sevenA.expressMax ? `SBA Express stops at ${m(P.sevenA.expressMax)}: amount capped. ` : ''}Fee schedule for loans approved ${dd(P.fy.from)} to ${dd(P.fy.to)}. Loans of 12 months or less pay ${formatNumber(P.fees7a.shortTermRate, 2)}% instead.` };
    },
  },
  /** Express page. */
  express: {
    title: 'SBA Express loan: fee and payment',
    cta: 'Compare with a standard 7(a)',
    ctaPage: 'sba-7a-loan',
    inputs: [
      money('amount', 'Loan amount', EXAMPLE_AMOUNT, P.sevenA.expressMax, `${EXAMPLE_HELP} SBA Express: ${m(P.sevenA.expressMax)} at most.`),
      { id: 'years', label: 'Term', def: 10, options: TERM.filter((o) => Number(o.value) <= 10) },
      { ...rateIn('rate', 'Rate offered', typicalRate(EXAMPLE_AMOUNT), RATE_HELP), follow: (v) => typicalRate(Math.min(v.amount, P.sevenA.expressMax)) },
      { id: 'vet', label: 'Owned by a veteran or a veteran’s spouse?', def: 0, options: opt(['No', 'Yes: no guaranty fee']) },
    ],
    run: (v) => {
      const amount = Math.min(v.amount, P.sevenA.expressMax);
      const fee = E.upfrontFee({ amount, program: 'express', veteranExpress: Math.round(v.vet) === 1 });
      const std = E.upfrontFee({ amount });
      const months = (Math.round(v.years) || 10) * 12;
      const mo = E.payment(amount + fee.fee, v.rate, months);
      return { head: ['Monthly payment', m(mo)], rows: [
        ['Guaranty fee on the 50% guaranteed part', fee.waived ? '$0 (veteran)' : m(fee.fee)],
        ['Same amount as a standard 7(a)', m(std.fee)],
        ['SBA cap (highest rate allowed), variable', r2(E.maxRate(amount, 'variable'))],
        ['Interest over the term', m(mo * months - amount - fee.fee)],
      ], note: `${PRIME[0].toUpperCase()}${PRIME.slice(1)}. Express has the same SBA cap as other 7(a) loans; its guaranty is ${P.sevenA.guaranty.expressPct}%, so the fee is charged on half the loan.` };
    },
  },
  /** SBA against a conventional loan typed by the reader. */
  compare: {
    title: 'SBA 7(a) or a conventional loan: which costs less?',
    cta: 'Check the SBA rate against the cap',
    ctaPage: 'sba-loan-rates',
    inputs: [
      money('amount', 'Loan amount', EXAMPLE_AMOUNT, P.sevenA.maxLoan, EXAMPLE_HELP),
      { ...rateIn('sbaRate', 'SBA rate offered', typicalRate(EXAMPLE_AMOUNT), RATE_HELP), follow: (v) => typicalRate(v.amount) },
      { id: 'sbaYears', label: 'SBA term', def: 10, options: TERM },
      { ...rateIn('convRate', 'Conventional rate offered', typicalRate(EXAMPLE_AMOUNT), 'Type the bank’s quote. Until you do, it is the same rate as the SBA line.'), follow: (v) => v.sbaRate },
      // Same term by default (naive test of 2026-11-08: 10 years against 5 put “$101,129” in large type, read as
      // “SBA costs $100,000 more”, while the gap came from the length). The reader types the bank's real term.
      { id: 'convYears', label: 'Conventional term', def: 10, options: TERM, help: 'Bank loans are often shorter: type the term on the bank’s offer.' },
      { id: 'convFee', label: 'Conventional origination fee', def: 0, unit: '%', max: 10, decimals: 2, help: 'From the bank’s term sheet; 0 until you type it.' },
    ],
    run: (v, touched) => {
      const c = E.compare({ amount: v.amount, sbaYears: Math.round(v.sbaYears) || 10, sbaRate: v.sbaRate, convYears: Math.round(v.convYears) || 5, convRate: v.convRate, convFeePct: v.convFee });
      // Two answers of the same weight (naive test of 2026-11-08: “SBA payment is lower” in large type read as
      // “SBA is cheaper” while it cost more in total).
      // The head is the true yearly cost, the one figure that stays fair when the terms differ; the payment and the
      // total follow, each with the term that explains it.
      const sy = Math.round(v.sbaYears) || 10, cy = Math.round(v.convYears) || 10;
      const da = c.sba.apr - c.conv.apr;
      const dm = c.sba.monthly - c.conv.monthly, dc = c.sba.cost - c.conv.cost;
      const cheapYears = dc > 0 ? cy : sy, dearYears = dc > 0 ? sy : cy;
      const why = sy === cy ? '' : `, mostly because it runs ${cheapYears} years, not ${dearYears}`;
      return { head: [Math.abs(da) < 0.005 ? 'True yearly cost, fees counted: the same' : `Lower true yearly cost, fees counted: the ${da > 0 ? 'conventional' : 'SBA'} loan`, r2(Math.min(c.sba.apr, c.conv.apr))], rows: [
        ['True yearly cost: SBA · conventional', `${r2(c.sba.apr)} · ${r2(c.conv.apr)}`],
        [`Monthly: SBA, ${sy} yrs · conventional, ${cy} yrs`, `${m(c.sba.monthly)} · ${m(c.conv.monthly)}`],
        ['Fees: SBA (added to the loan) · bank', `${m(c.sba.fee)} · ${m(c.conv.fee)}`],
        ['Fees and interest, all years: SBA · conventional', `${m(c.sba.cost)} · ${m(c.conv.cost)}`],
        [Math.abs(dc) < 0.5 ? 'Total paid in fees and interest' : `Lower total: the ${dc > 0 ? 'conventional' : 'SBA'} loan${why}`, Math.abs(dc) < 0.5 ? 'the same' : m(Math.abs(dc))],
      ], note: `${Math.abs(dm) >= 0.5 && sy !== cy ? 'A longer loan has the lower payment and the higher total: choose by what your monthly cash flow can carry. ' : ''}The SBA fee is added to the loan; the bank fee is paid at signing. The true yearly cost spreads every fee over the loan, so it compares two offers fairly even when their terms differ.` };
    },
  },
  /** 504 page. */
  cost504: {
    title: 'SBA 504 loan: the three parts and their fees',
    cta: 'See the 504 fee table',
    ctaPage: 'sba-504-loan',
    inputs: [
      money('project', 'Project cost (building, land, equipment)', 1500000, 20_000_000),
      { id: 'biz', label: 'Your business', def: 0, options: opt(['Existing, standard property', 'New business (under 2 years)', 'Special-purpose property', 'New business and special property']) },
      { id: 'term', label: 'Term of the CDC loan', def: 25, options: P.fees504.terms.map((t) => ({ value: String(t), label: `${t} years` })) },
      rateIn('deb', 'Rate on the CDC loan (fixed)', P.prime.rate, `Set when SBA sells the month’s CDC loans: ask your CDC for the latest. The ${r2(P.prime.rate)} shown is only an example, not a published rate.`),
      rateIn('bank', 'Bank rate on the first loan', P.prime.rate + 1.5, 'Type your bank’s quote. The figure shown is only an example.'),
    ],
    run: (v) => {
      const biz = (['existing', 'new', 'special', 'newSpecial'] as E.Biz504[])[Math.round(v.biz)] ?? 'existing';
      const t = (Math.round(v.term) as 10 | 20 | 25) || 25;
      const r = E.cost504({ project: v.project, biz, term: t, debentureRate: v.deb, bankRate: v.bank });
      const by = r.bankMonths / 12;
      const rows: Array<[string, string]> = [
        [`Your cash (${r.borrowerPct}%)`, m(r.borrower)],
        [`Bank loan (${P.fees504.structure.bank}%), ${by} years`, `${m(r.bank)} · ${m(r.bankMonthly)}/mo`],
        [`CDC loan, ${t} years, fees included`, `${m(r.gross)} · ${m(r.debMonthly)}/mo`],
      ];
      if (r.months > r.bankMonths) rows.push([`From year ${by + 1}, CDC loan only`, `${m(r.debMonthly)}/mo`]);
      rows.push(['Fees added to the CDC loan', m(r.gross - r.net)], ['Yearly fees on the CDC loan balance', `${formatNumber(r.annualFeePct, 3)}%`]);
      return { head: [r.months > r.bankMonths ? `Monthly payments, first ${by} years (bank + CDC)` : 'Monthly payments (bank + CDC)', m(r.debMonthly + r.bankMonthly)], rows, note: `CDC: a nonprofit lender approved by SBA (certified development company). Its loan is backed by SBA and sold to investors as a bond, called a debenture. Fees added to it: SBA ${formatNumber(P.fees504.upfront, 2)}%, funding ${formatNumber(P.fees504.funding, 2)}%, CDC processing up to ${formatNumber(P.fees504.processingMax, 1)}%, closing costs and the bond sale fee. Each year: SBA ${formatNumber(P.fees504.annual, 3)}% and CDC servicing from ${formatNumber(P.fees504.cdcServicingMin, 3)}%. A small agent fee is not included.` };
    },
  },
  /** Microloan page. */
  micro: {
    title: 'SBA microloan: highest rate allowed and payment',
    cta: 'Read the microloan rules',
    ctaPage: 'sba-microloan',
    inputs: [
      money('amount', 'Microloan amount', 25000, P.micro.max, `${m(P.micro.max)} at most.`),
      rateIn('inter', 'Rate the intermediary pays SBA', E.intermediaryRateNow(), `Ask the lender. Prefilled with the rate for a loan SBA would make it now: 5-year Treasury ${r2(P.treasury5y.rate)} (${dd(P.treasury5y.date)}), rounded to 1/8, less ${formatNumber(P.micro.intermediaryLessTreasury, 2)}.`),
      rateIn('rate', 'Rate offered to you', 10),
      { id: 'years', label: 'Term', def: 6, unit: 'yrs', max: P.micro.maxYears },
    ],
    run: (v) => {
      const mx = E.microMaxRate(v.amount, v.inter);
      const n = Math.max(1, Math.round(Math.min(v.years || 1, P.micro.maxYears) * 12));
      const mo = E.payment(v.amount, v.rate, n);
      return { head: ['Highest rate the intermediary may charge', r2(mx)], rows: [
        ['Margin allowed', `${formatNumber(v.amount <= P.micro.smallUpTo ? P.micro.spreadSmall : P.micro.spreadLarge, 2)} points (${v.amount <= P.micro.smallUpTo ? `${m(P.micro.smallUpTo)} or less` : `over ${m(P.micro.smallUpTo)}`})`],
        ['Your rate', `${r2(v.rate)}${v.rate > mx + 1e-9 ? ': above the limit' : ''}`],
        ['Monthly payment', m(mo)],
        ['Interest over the term', m(mo * n - v.amount)],
      ], note: `SBA microloan rules: ${P.micro.maxYears} years at most. Fees and required training are set by each intermediary and are not included.` };
    },
  },
  /** Prepayment page: subsidy recoupment fee. */
  prepay: {
    title: 'SBA prepayment penalty (subsidy recoupment fee)',
    cta: 'Full 7(a) cost',
    ctaPage: 'home',
    inputs: [
      money('loan', 'Original loan amount', 1000000),
      { id: 'term', label: 'Term of the loan', def: 25, options: TERM },
      { id: 'year', label: 'Prepayment in year', def: 2, options: [1, 2, 3, 4].map((y) => ({ value: String(y), label: y === 4 ? 'Year 4 or later' : `Year ${y}` })) },
      money('paid', 'Amount prepaid that year', 400000),
    ],
    run: (v) => {
      const r = E.recoupmentFee(v.loan, Math.round(v.term), Math.round(v.year), v.paid);
      return { head: ['Prepayment fee', m(r.fee)], rows: [
        ['Applies to terms of', `${P.sevenA.recoupment.minTermYears} years or more`],
        ['Free threshold that year', `${m(r.threshold)} (${P.sevenA.recoupment.thresholdPct}%)`],
        ['Rate in that year', r.rate ? `${r.rate}% of the amount prepaid` : 'none'],
        ['Verdict', r.applies ? 'fee due' : Math.round(v.term) < P.sevenA.recoupment.minTermYears ? 'no fee: term under 15 years' : r.rate === 0 ? 'no fee after year 3' : 'no fee: within the 25%'],
      ], note: 'SBA rule: the fee is on the whole amount prepaid in that year once it exceeds 25% of the highest principal balance in that 12-month period. A 7(a) lender may not charge a prepayment fee of its own.' };
    },
  },
  /** State pages: the reader's rate against the state's approvals. */
  state: {
    title: 'Your loan against approvals in your state',
    cta: 'All states compared',
    ctaPage: 'sba-loans-by-state',
    inputs: [
      { id: 'st', label: 'State', def: 0, options: ST },
      money('amount', 'Loan amount', EXAMPLE_AMOUNT, P.sevenA.maxLoan, 'Example: the median SBA loan in this state. Type yours.'),
      { ...rateIn('rate', 'Variable rate offered', typicalRate(EXAMPLE_AMOUNT), `Example until you type your quote: the typical rate for this amount nationwide, today’s prime ${r2(P.prime.rate)} plus the median margin.`), follow: (v) => typicalRate(v.amount) },
      { id: 'relief', label: RELIEF_LABEL, def: 0, options: RELIEF, help: RELIEF_HELP },
    ],
    run: (v, touched) => {
      const s = E.F.states[st(v.st)];
      const b = E.bandOf(v.amount);
      const medState = s.medVBand[b];
      const place = placeLine(v.rate, v.amount, 'variable');
      const r = E.cost7a({ amount: v.amount, years: 10, rate: v.rate, waiver: relief(v.relief) });
      // The reader's answer in large type, the state's statistics below (naive test of 2026-11-08: “4,698”,
      // a count of loans, was the big figure and read as nobody's result).
      const rows: Array<[string, string]> = [
        [`Your rate vs. ${LAST} nationwide`, place ?? '—'],
        [`${s.name}: typical rate at approval, loans of ${E.BAND_LABELS[b]}`, medState !== null ? r2(medState) : 'too few loans to show'],
        ['SBA guaranty fee, added to the loan', r.fee.waived ? '$0 (waived)' : m(r.fee.fee)],
        [`${s.name}: SBA 7(a) loans approved ${DATA_YEAR}`, formatNumber(s.n, 0)],
        [`${s.name}: median loan`, m(s.medAmt)],
      ];
      return { head: [ex('Monthly payment over 10 years', touched), m(r.monthly)], rows, note: `${FOIA_NOTE} ${PRIME[0].toUpperCase()}${PRIME.slice(1)}. ${MARGIN_NOTE}` };
    },
  },
  /** Lender page: one lender's pricing in the FOIA file. */
  lender: {
    title: 'How a lender priced its SBA loans',
    cta: 'Check your own rate',
    ctaPage: 'sba-loan-rates',
    inputs: [
      { id: 'l', label: 'Lender', def: 0, options: LEND },
      rateIn('rate', 'Rate it offers you (variable)', typicalRate(150000)),
    ],
    run: (v) => {
      const L = LENDERS[Math.max(0, Math.min(LENDERS.length - 1, Math.round(v.l)))];
      const spread = v.rate - P.prime.rate;
      return { head: [`${shortBank(L.name)}: typical margin over prime (variable)`, L.medSpreadV !== null ? `${formatNumber(L.medSpreadV, 2)} pts` : '—'], rows: [
        ['Your margin over today’s prime', `${formatNumber(spread, 2)} points`],
        ['Its variable loans priced at the SBA cap', L.atCapV !== null ? per100(L.atCapV) : '—'],
        [`Its SBA 7(a) loans approved ${FY}`, formatNumber(L.n, 0)],
        ['Its median loan', m(L.medAmt)],
      ], note: `Margin = rate at approval minus the prime rate of that month. Loans approved ${FY}, from SBA’s public loan file.` };
    },
  },
};

export function getSpec(kind: string): MiniSpec {
  const s = SPECS[kind];
  if (!s) throw new Error(`Unknown calculator: ${kind}`);
  return s;
}
export const SPEC_IDS = Object.keys(SPECS);
