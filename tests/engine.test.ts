/**
 * Engine cases, each from an official example or recomputed by hand (RECETTE §4, §17.4).
 * A failing case stops `npm run check`.
 */
import { describe, it, expect } from 'vitest';
import * as E from '../src/lib/engine/sba';
import { P } from '../src/lib/engine/params';

describe('maximum rates (SOP 50 10 8.1, 87 FR 46883)', () => {
  it('variable: prime + 6.5 / 6.0 / 4.5 / 3.0 by amount', () => {
    expect(E.maxRate(50_000, 'variable', 7)).toBe(13.5);
    expect(E.maxRate(50_001, 'variable', 7)).toBe(13);
    expect(E.maxRate(250_000, 'variable', 7)).toBe(13);
    expect(E.maxRate(350_000, 'variable', 7)).toBe(11.5);
    expect(E.maxRate(350_001, 'variable', 7)).toBe(10);
  });
  it('fixed: prime + 8 / 7 / 6 / 5 by amount', () => {
    expect(E.maxRate(25_000, 'fixed', 7)).toBe(15);
    expect(E.maxRate(40_000, 'fixed', 7)).toBe(14);
    expect(E.maxRate(200_000, 'fixed', 7)).toBe(13);
    expect(E.maxRate(1_000_000, 'fixed', 7)).toBe(12);
  });
  it('prime of the parameter file is the H.15 value of November 2, 2026', () => {
    expect(P.prime.rate).toBe(7);
    expect(P.prime.date).toBe('2026-11-02');
  });
});

describe('guaranty fee (FY 2027 notice 5000-881797; SOP 50 10 8.1 fee chart notes)', () => {
  it('SOP note 2: $100,000 at 85% → 2% of $85,000 = $1,700, lender may keep $425', () => {
    const f = E.upfrontFee({ amount: 100_000 });
    expect(f.guaranteed).toBe(85_000);
    expect(f.fee).toBe(1_700);
    expect(f.lenderMayKeep).toBe(425);
  });
  it('SOP note 3: $5,000,000 at 75% → 3.5% of $1M + 3.75% of $2.75M = $138,125', () => {
    expect(E.upfrontFee({ amount: 5_000_000 }).fee).toBe(138_125);
  });
  it('$500,000: 3% of $375,000 = $11,250', () => {
    expect(E.upfrontFee({ amount: 500_000 }).fee).toBe(11_250);
  });
  it('$800,000: 3.5% of $600,000 = $21,000', () => {
    expect(E.upfrontFee({ amount: 800_000 }).fee).toBe(21_000);
  });
  it('FY 2027 relief: 0% up to $700,000, full fee above', () => {
    expect(E.upfrontFee({ amount: 700_000, waiver: true }).fee).toBe(0);
    expect(E.upfrontFee({ amount: 700_001, waiver: true }).fee).toBeGreaterThan(0);
  });
  it('FY 2026 relief reached $950,000 for manufacturers', () => {
    expect(E.upfrontFee({ amount: 900_000, waiver: true, schedule: 'previous' }).fee).toBe(0);
    expect(E.upfrontFee({ amount: 900_000, waiver: true }).fee).toBe(23_625);
  });
  it('short term (12 months or less): 0.25% of the guaranteed portion', () => {
    expect(E.upfrontFee({ amount: 200_000, shortTerm: true }).fee).toBe(375);
  });
  it('SBA Express: 50% guaranty; veteran-owned: no fee', () => {
    expect(E.upfrontFee({ amount: 300_000, program: 'express' }).fee).toBe(4_500);
    expect(E.upfrontFee({ amount: 300_000, program: 'express', veteranExpress: true }).fee).toBe(0);
  });
});

describe('payments', () => {
  it('$250,000 at 10% over 120 months: $3,303.77', () => {
    expect(E.payment(250_000, 10, 120)).toBeCloseTo(3303.77, 2);
  });
  it('balance after all payments is zero', () => {
    expect(E.balanceAfter(100_000, 9, 120, 120)).toBeCloseTo(0, 4);
  });
  it('cost7a adds the financed fee to the principal and flags a rate above the maximum', () => {
    const r = E.cost7a({ amount: 100_000, years: 10, rate: 14 });
    expect(r.principal).toBe(101_700);
    expect(r.overMax).toBe(true);
    expect(E.cost7a({ amount: 100_000, years: 10, rate: 12 }).overMax).toBe(false);
  });
  it('effective rate equals the note rate when there is no fee', () => {
    const mo = E.payment(100_000, 9, 120);
    expect(E.effectiveRate(100_000, mo, 120)).toBeCloseTo(9, 1);
  });
});

describe('504 (SOP 50 10 8.1 pricing steps)', () => {
  it('SOP example: net debenture $350,000, $2,500 closing → gross $362,000', () => {
    // A project of $875,000 gives a 40% net debenture of $350,000.
    const r = E.cost504({ project: 875_000, debentureRate: 6, bankRate: 8, closing: 2_500 });
    expect(r.net).toBe(350_000);
    expect(r.fees.sba).toBe(1_750);
    expect(r.fees.funding).toBe(875);
    expect(r.fees.processing).toBe(5_250);
    expect(r.gross).toBe(362_000);
  });
  it('new business: 15% contribution, 35% debenture', () => {
    const r = E.cost504({ project: 1_000_000, biz: 'new', debentureRate: 6, bankRate: 8 });
    expect(r.borrower).toBe(150_000);
    expect(r.net).toBe(350_000);
  });
});

describe('microloans and prepayment', () => {
  it('13 CFR 120.707: +8.5 points up to $10,000, +7.75 above', () => {
    expect(E.microMaxRate(10_000, 3.5)).toBe(12);
    expect(E.microMaxRate(10_001, 3.5)).toBe(11.25);
  });
  it('13 CFR 120.706: 5-year Treasury 4.70% → 4.75% − 1.25 = 3.50%', () => {
    expect(E.intermediaryRateNow()).toBe(3.5);
  });
  it('recoupment: 25-year loan, $400,000 prepaid in year 2 of $1M → 3% = $12,000', () => {
    expect(E.recoupmentFee(1_000_000, 25, 2, 400_000).fee).toBe(12_000);
    expect(E.recoupmentFee(1_000_000, 10, 2, 400_000).fee).toBe(0);
    expect(E.recoupmentFee(1_000_000, 25, 4, 400_000).fee).toBe(0);
    expect(E.recoupmentFee(1_000_000, 25, 1, 200_000).fee).toBe(0);
  });
});

describe('FOIA file', () => {
  it('FY 2026: 56,130 7(a) loans and 6,075 504 loans, file of September 30, 2026', () => {
    expect(E.F.national.n).toBe(56_130);
    expect(E.F.national.f504!.n).toBe(6_075);
    expect(E.F.asOf).toBe('2026-09-30');
    expect(Object.keys(E.F.states)).toHaveLength(51);
  });
  it('the states add up to the national count, territories apart', () => {
    const sum = Object.values(E.F.states).reduce((a, s) => a + s.n, 0) + Object.values(E.F.territories).reduce((a, n) => a + n, 0);
    expect(sum).toBe(E.F.national.n);
  });
  it('percentile of a rate is monotone and bounded', () => {
    const a = E.ratePercentile(8, 200_000, 'variable')!, b = E.ratePercentile(10, 200_000, 'variable')!;
    expect(a.share).toBeLessThanOrEqual(b.share);
    expect(b.share).toBeLessThanOrEqual(1);
    expect(E.ratePercentile(0, 200_000, 'variable')!.share).toBe(0);
  });
});

// Naive test of 2026-11-08: the prefilled “median” rate was called dearer than 8 loans in 10, the same 350,000
// loan showed two medians and two payments, and the comparison put the fee in two different places.
import { getSpec, typicalRate, placeLine, TYPICAL_VERDICT } from '../src/lib/mini-specs';
describe('one median, one verdict (naive test of 2026-11-08)', () => {
  it('the typical rate of every size reads the typical verdict', () => {
    for (const a of [40_000, 150_000, 250_000, 300_000, 350_000, 1_200_000]) expect(placeLine(typicalRate(a), a, 'variable')).toBe(TYPICAL_VERDICT);
  });
  it('a margin is placed among margins: shares bounded, monotone, ties split', () => {
    const lo = E.marginPlace(2, 150_000, 'variable')!, hi = E.marginPlace(5, 150_000, 'variable')!, mid = E.marginPlace(3, 150_000, 'variable')!;
    expect(lo.below).toBeLessThan(hi.below);
    expect(mid.below + mid.above).toBeLessThan(1);
    expect(E.marginPlace(-10, 150_000, 'variable')!.below).toBe(0);
    expect(E.marginPlace(10, 150_000, 'variable')!.above).toBe(0);
  });
  it('the cap reads “at the SBA cap”', () => {
    expect(placeLine(E.maxRate(40_000, 'variable'), 40_000, 'variable')).toBe('at the SBA cap');
  });
  it('home and 7(a) page give the same 350,000 loan the same rate and payment', () => {
    const spec = getSpec('cost');
    const v = { amount: 350_000, years: 10, type: 0, rate: typicalRate(350_000), relief: 0 };
    expect(typicalRate(350_000)).toBe(E.round2(P.prime.rate + E.F.national.medSpreadVBand[2]!));
    expect(spec.inputs.find((i) => i.id === 'rate')!.follow!(v)).toBe(typicalRate(350_000));
    expect(spec.run(v).head[1]).toBe('$4,680');
  });
  it('the comparison finances the SBA fee, as the home calculator does', () => {
    const c = E.compare({ amount: 300_000, sbaYears: 10, sbaRate: 9.75, convYears: 5, convRate: 9.75, convFeePct: 0 });
    const h = E.cost7a({ amount: 300_000, years: 10, rate: 9.75 });
    expect(c.sba.monthly).toBeCloseTo(h.monthly, 6);
    // Naive test of 2026-11-08: 10 years against 5 put a total of $101,129 in large type. The head is now the true
    // yearly cost, fair whatever the terms; the total names the longer loan.
    const out = getSpec('compare').run({ amount: 300_000, sbaRate: 9.75, sbaYears: 10, convRate: 9.75, convYears: 5, convFee: 0 });
    expect(out.head[0]).toBe('Lower true yearly cost (APR), fees counted: the bank loan');
    expect(out.head[1]).toBe('9.75%');
    expect(out.rows[out.rows.length - 1][0]).toBe('Lower total: the bank loan, mostly because it runs 5 years, not 10');
  });
  it('the comparison starts on the same term on both sides', () => {
    const spec = getSpec('compare');
    expect(spec.inputs.find((i) => i.id === 'sbaYears')!.def).toBe(spec.inputs.find((i) => i.id === 'convYears')!.def);
  });
  it('one example amount on every page: the median loan of the SBA file', () => {
    for (const k of ['cost', 'ratecheck', 'fee', 'express', 'compare', 'qualify']) expect(getSpec(k).inputs.find((i) => i.id === 'amount')!.def, k).toBe(220_000);
  });
  it('the rate checker splits similar loans into three shares that add up to 100', () => {
    const out = getSpec('ratecheck').run({ amount: 220_000, type: 0, rate: typicalRate(220_000) });
    const shares = out.rows.filter(([l]) => /margin than yours|same margin/i.test(l)).map(([, v]) => Number(v.split(' ')[0]));
    expect(shares).toHaveLength(3);
    expect(Math.abs(shares.reduce((a, b) => a + b, 0) - 100)).toBeLessThanOrEqual(1);
  });
  it('the state calculator puts the payment in large type, not a count of loans', () => {
    const out = getSpec('state').run({ st: 0, amount: 220_000, rate: typicalRate(220_000), relief: 0 });
    expect(out.head[0]).toBe('Monthly payment over 10 years');
    expect(out.head[1]).toMatch(/^\$/);
  });
});
