/**
 * The 51 state pages (50 states and DC), built from `data/foia.json`. RECETTE §6.2 and §6.4: the data picks
 * the paragraphs, not a draw. About twenty observations are measured for every state; each is scored by how
 * far the state sits from the other fifty (percentile rank), the eight most distinctive are written, in that
 * order, and the direction (high or low) picks the text. The citable block and the FAQ are drawn from the same
 * ranking, so two states share a paragraph only when the data puts them at the same extreme. Names of lenders,
 * development companies, counties, franchise brands and trades come from the file.
 */
import type { PageDef, FAQ } from './guide-types';
import type { Helpers } from './helpers';
import * as E from './engine/sba';
import { P, DATA_YEAR } from './engine/params';
import { stateIndex, shortBank } from './mini-specs';
import { formatMoney, formatNumber, formatPercent, displayDate } from './format';

type St = (typeof E.F.states)[E.StateCode];
const N = E.F.national;
const ALL = Object.values(E.F.states) as St[];
const m = (n: number) => formatMoney(Math.round(n), 0);
const pc = (x: number) => formatPercent(x, 0);
const num = (n: number) => formatNumber(n, 0);
const r = (x: number) => `${formatNumber(x, 2)}%`;
const pts = (x: number) => `${formatNumber(x, 2)} point${Math.abs(x) === 1 ? '' : 's'}`;
const words = (s: string) => s.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
/** Visible text: the months (“Oct. 2025–Sept. 2026”); search snippets keep the term people type, “FY 2026”. */
const FY = DATA_YEAR;
const FYS = `FY ${E.F.fy}`;
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const age = (s: St, k: keyof St['ages']) => s.ages[k] / s.n;
const exp = (s: St) => s.programs.express / s.n;
const per504 = (s: St) => (s.f504 ? s.f504.n / s.n : 0);
const topShare = (s: St) => s.lenders[0].n / s.n;
const density = (s: St) => s.lenderCount / s.n;
const jobs = (s: St) => s.jobs / s.n;
const skew = (s: St) => s.meanAmt / s.medAmt;
const canc = (s: St) => s.cancelled / s.n;
const cty = (s: St) => (s.counties.length ? s.counties[0].n / s.n : null);
const gap = (s: St) => (s.localMedSpreadV !== null && s.outMedSpreadV !== null ? s.localMedSpreadV - s.outMedSpreadV : null);
const NAT = {
  local: sum(ALL.map((s) => s.localLenderShare * s.n)) / sum(ALL.map((s) => s.n)),
  startup: N.ages.startup / N.n, buyout: N.ages.buyout / N.n, young: N.ages.new / N.n, express: N.programs.express / N.n,
  r504: N.f504!.n / N.n, jobs: N.jobs / N.n, canc: N.cancelled / N.n,
};
export const slugOf = (code: E.StateCode) => `sba-loans-${E.F.states[code].name.toLowerCase().replace(/[^a-z]+/g, '-')}`;
const ordinal = (n: number) => `${n}${n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th'}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const natLender = (name: string) => N.lenders.find((l) => l.name === name);

/** Percentile of a state's value among the 51 (0 = lowest, 1 = highest), ties averaged; null if unmeasured. */
function pctile(f: (s: St) => number | null, s: St): number | null {
  const v = f(s);
  if (v === null) return null;
  const vals = ALL.map(f).filter((x): x is number => x !== null);
  const below = vals.filter((x) => x < v).length, eq = vals.filter((x) => x === v).length;
  return (below + (eq - 1) / 2) / Math.max(1, vals.length - 1);
}
/** Rank among the 51, 1 = highest. */
const rankOf = (f: (s: St) => number | null, s: St) => 1 + ALL.filter((x) => (f(x) ?? -Infinity) > (f(s) ?? -Infinity)).length;

const FOOD = ['1111', '1112', '1113', '1121', '1122', '1123', '1124', '1125', '1129', '1141', '1151', '1152', '423820', '4244', '4245', '424910', '445110', '484220', '484230', '493120', '493130'];
const SPECIAL = /hotel|motel|golf|funeral|assisted living|nursing|car wash|marina|bowling|winer|gas station/i;
/** What the rules say about a trade, from its NAICS code or name; null when nothing specific applies. */
function tradeNote(name: string, code: string): string | null {
  const n = name.toLowerCase();
  if (/^3[1-3]/.test(code)) return `As a manufacturer (industry code 31 to 33), a business in this trade pays no guaranty fee, since ${displayDate(P.fy.from, 'en-US')}, on a 7(a) loan of ${m(P.fees7a.waiver.upTo)} or less, and on a 504 project its CDC loan may reach ${m(P.fees504.maxDebentureManufacturing)}.`;
  if (FOOD.some((f) => code.startsWith(f))) return `The trade is on the food supply chain list of SBA’s fee notice for loans approved from ${displayDate(P.fy.from, 'en-US')}, so its 7(a) loans of ${m(P.fees7a.waiver.upTo)} or less pay no guaranty fee, and its 504 loans pay neither the upfront nor the annual SBA fee.`;
  if (SPECIAL.test(n)) return `SBA’s lending rules list these properties as special-purpose, which raises the owner’s contribution on a 504 project to ${P.fees504.structure.borrowerSpecial}% and allows a 7(a) purchase that is mostly real estate to run up to 25 years.`;
  if (/restaurant/.test(n)) return 'Restaurant loans usually mix kitchen equipment, build-out and working capital, so they take a blended maturity close to 10 years unless real estate is more than half of the proceeds.';
  if (/contractor|remodel|construction|site preparation|carpentry|painting/.test(n)) return 'Contractors borrow for trucks, tools and working capital more than for property, so their loans stay near 10 years and the margin steps for smaller loans matter most to them.';
  if (/landscap|courier|taxi|trucking|freight/.test(n)) return 'Vehicles and equipment wear out within a few years, so these loans stay short and small, often through SBA Express.';
  if (/offices of|insurance agenc|accountant|chiropract|practitioner|computer programming/.test(n)) return 'A practice or agency is bought for its client base, so these loans are mostly changes of ownership under SBA’s rules for buying a business, with few hard assets behind them.';
  if (/retailer|store|salon|pet care|mail center/.test(n)) return 'Shops and service outlets are often bought as going concerns or franchise units, with loans small enough that the variable cap may reach prime plus 6 points.';
  return null;
}
const what = (name: string) => name.replace(/\s*\(except[^)]*\)/i, '').toLowerCase();

interface Obs { key: string; score: number; h2: string; p: string; short: string; faq?: FAQ }

/** Paragraphs for a state at either end of the 51, built around its rank and named lenders. */
function extreme(key: string, hi: boolean, s: St, code: E.StateCode, f: (x: St) => number | null): { h2: string; p: string } | null {
  const name = s.name;
  const L = s.lenders;
  const top = rankOf(f, s), bottom = 52 - top;
  const rk = hi ? (top === 1 ? 'the highest among the 50 states and DC' : `${ordinal(top)} highest among the 50 states and DC`) : (bottom === 1 ? 'the lowest among the 50 states and DC' : `${ordinal(bottom)} lowest among the 50 states and DC`);
  const g = gap(s);
  switch (key) {
    case 'local': {
      const own = L.filter((l) => l.hq === code).map((l) => shortBank(l.name));
      const far = L.filter((l) => l.hq !== code).map((l) => shortBank(l.name));
      const price = g === null ? '' : ` Margins: ${pts(s.localMedSpreadV!)} over prime at the median for in-state lenders, ${pts(s.outMedSpreadV!)} for the others.`;
      return hi
        ? { h2: 'One of the most home-grown SBA markets', p: `Few states rely on their own banks the way ${name} does: ${pc(s.localLenderShare)} of its loans came from a lender headquartered there, ${rk}.${own.length ? ` ${list(own.slice(0, 3))} carry most of that.` : ''}${price}` }
        : { h2: 'Almost no in-state SBA lending', p: `Home-state lenders made just ${pc(s.localLenderShare)} of ${name}’s loans, ${rk}. A borrower here usually ends up with ${far.length ? list(far.slice(0, 2)) : 'a lender from another state'}, dealing by phone and online rather than at a branch.${price}` };
    }
    case 'size': return hi
      ? { h2: 'Among the largest SBA loans in the country', p: `${name}’s median loan of ${m(s.medAmt)} is ${rk}. ${pc(s.bands[3] / s.n)} of its loans were above ${m(350000)}, where the variable cap falls to prime plus 3 points and the guaranty fee climbs to ${P.fees7a.tiers[2].rate}% of the guaranteed part once the loan passes ${m(P.fees7a.tiers[1].upTo)}.` }
      : { h2: 'Among the smallest SBA loans in the country', p: `A median of ${m(s.medAmt)} makes ${name}’s loans ${rk} in size. ${pc(s.bands[0] / s.n)} were for ${m(50000)} or less, the band where SBA lets the rate reach prime plus ${formatNumber(E.maxSpread(1, 'variable'), 1)} (${r(E.maxRate(1, 'variable'))} today) and charges ${P.fees7a.tiers[0].rate}% on an ${P.sevenA.guaranty.smallPct}% guaranty.` };
    case '504': {
      const f5 = s.f504;
      if (!f5) return null;
      return hi
        ? { h2: 'A leading 504 state', p: `Relative to its 7(a) volume, ${name} uses 504 loans more than almost anywhere: ${num(f5.n)} of them for ${h0(f5.total)}, a ratio to 7(a) loans ${rk}.${f5.cdcs.length ? ` ${f5.cdcs[0].name} arranged ${num(f5.cdcs[0].n)} on its own.` : ''} Building owners here can count on a CDC that knows the local market.` }
        : { h2: 'Hardly any 504 loans', p: `Only ${num(f5.n)} 504 loans went to ${name} projects against ${num(s.n)} 7(a) loans, a ratio ${rk}.${f5.cdcs.length ? ` The CDC most present was ${f5.cdcs[0].name}.` : ''} For a building, the 504 route is still open and worth pricing against a 7(a) real estate loan.` };
    }
    case 'express': {
      const ex = L.filter((l) => l.expressShare >= 0.7).map((l) => shortBank(l.name));
      return hi
        ? { h2: 'Express is the main route', p: `${pc(exp(s))} of ${name}’s loans were SBA Express, ${rk}.${ex.length ? ` Among the busiest lenders, ${list(ex.slice(0, 3))} made mostly Express loans.` : ''} Most of these are small loans decided by the bank itself, on a ${P.sevenA.guaranty.expressPct}% guaranty.` }
        : { h2: 'Express is rarely used', p: `SBA Express made up only ${pc(exp(s))} of ${name}’s approvals, ${rk}. Preferred Lenders took ${pc(s.programs.plp / s.n)} and loans processed by SBA itself ${pc(s.programs.general / s.n)}, so most borrowers here get the full ${P.sevenA.guaranty.smallPct}% or ${P.sevenA.guaranty.largePct}% guaranty.` };
    }
    case 'cap': {
      const worst = [...L].filter((l) => l.atCapV !== null).sort((a, b) => b.atCapV! - a.atCapV!)[0];
      return hi
        ? { h2: 'Among the most loans at the SBA cap', p: `${pc(s.atCapV!)} of ${name}’s variable loans sat exactly at SBA’s cap, ${rk}.${worst && worst.atCapV! > 0.2 ? ` Of the five busiest lenders, ${shortBank(worst.name)} priced ${pc(worst.atCapV!)} of its ${name} variable loans at the cap.` : ''} Ask any lender quoting the cap what a lower margin would require.` }
        : { h2: 'Almost nobody pays the SBA cap', p: `Just ${pc(s.atCapV!)} of ${name}’s variable loans were at the SBA cap, ${rk}. Lenders here compete below the cap, so the median for your loan size, in the table above, is the better benchmark.` };
    }
    case 'startup': return hi
      ? { h2: 'A start-up state', p: `With ${pc(age(s, 'startup'))} of loans going to businesses not yet open, ${name} ranks ${rk} for start-up lending. Every one of those borrowers had to put in at least ${P.sevenA.startupEquity}% of the project cost, under SBA’s lending rules.` }
      : { h2: 'Lending to going concerns', p: `${name} ranks ${rk} for start-up lending, with ${pc(age(s, 'startup'))} of loans to businesses not yet open; ${pc(age(s, 'existing'))} went to firms more than two years old.` };
    case 'buyout': return hi
      ? { h2: 'A market for business buyers', p: `Acquisitions took ${pc(age(s, 'buyout'))} of ${name}’s SBA loans, ${rk}. Each followed SBA’s rules for buying a business, with their own requirements on the buyer’s equity, the valuation and any seller note.` }
      : { h2: 'Acquisitions are rare', p: `Only ${pc(age(s, 'buyout'))} of ${name}’s loans financed the purchase of a business, ${rk}. Expansion and working capital for current owners made up the bulk.` };
    case 'conc': {
      const top5 = sum(L.map((l) => l.n)) / s.n;
      return hi
        ? { h2: `${shortBank(L[0].name)} dominates`, p: `${shortBank(L[0].name)} alone made ${pc(topShare(s))} of ${name}’s SBA loans, a share for one lender ${rk}, with a median loan of ${m(L[0].medAmt)}. The five busiest together made ${pc(top5)}.` }
        : { h2: 'No single lender dominates', p: `The busiest lender in ${name}, ${shortBank(L[0].name)}, made only ${pc(topShare(s))} of loans, a top-lender share ${rk}, and the five busiest together ${pc(top5)}. ${num(s.lenderCount)} lenders took part.` };
    }
    case 'franchise': return hi
      ? { h2: 'Franchise lending stands out', p: `${pc(s.franchiseShare)} of ${name}’s loans went to franchise units, ${rk}.${s.franchises.length ? ` ${list(s.franchises.map((x) => x.name))} appeared most often.` : ''}` }
      : null;
    case 'fixed': return hi
      ? { h2: 'A fixed-rate market', p: `${name} lenders wrote ${pc(s.fixedShare)} of their SBA loans at a fixed rate, ${rk}${s.medF !== null ? `, at a median of ${r(s.medF)}` : ''}. The fixed cap, prime plus 5 to 8 points, is set in the Federal Register notice of August 1, 2022.` }
      : { h2: 'Fixed rates almost absent', p: `Only ${pc(s.fixedShare)} of ${name}’s loans were fixed-rate, ${rk}. Almost every borrower here carries a prime-based rate whose payment moves when prime does.` };
    case 'long': return hi
      ? { h2: 'Real estate loans weigh heavily', p: `${pc(s.longTermShare)} of ${name}’s loans ran 15 years or more, ${rk}. Those long loans are the only ones exposed to SBA’s 5-3-1 prepayment fee.` }
      : null;
    case 'density': return hi
      ? { h2: 'More lenders per loan than most states', p: `${num(s.lenderCount)} lenders made ${name}’s ${num(s.n)} loans. For that many loans, its number of lenders is ${rk.startsWith('the ') ? rk : `the ${rk}`}. Shopping the same project to three or four of them is realistic here.` }
      : { h2: 'Fewer lenders per loan than most states', p: `${num(s.lenderCount)} lenders made all ${num(s.n)} of ${name}’s loans. For that many loans, its number of lenders is ${rk.startsWith('the ') ? rk : `the ${rk}`}. The national SBA lenders that work by phone widen the choice.` };
    case 'young': return hi
      ? { h2: 'Young firms get a big share', p: `Businesses open two years or less received ${pc(age(s, 'new'))} of ${name}’s SBA loans, ${rk}. With little history to show, these borrowers are judged largely on the owners’ experience, their personal credit and the projections in the business plan.` }
      : { h2: 'Seasoned borrowers', p: `Firms under two years old took only ${pc(age(s, 'new'))} of ${name}’s approvals, ${rk}; the market here is built on businesses with several years of tax returns.` };
    case 'revolver': return hi
      ? { h2: 'A market for credit lines', p: `Revolving lines were ${pc(s.revolverShare)} of ${name}’s approvals, ${rk}. A business that needs cash for seasonal swings or receivables can ask for a line rather than a term loan; the cap on the rate is the same.` }
      : { h2: 'Few businesses here get a revolving credit line', p: `Only ${pc(s.revolverShare)} of ${name}’s SBA approvals were revolving lines, ${rk}. Term loans with a fixed repayment schedule make up the rest.` };
    default: return null;
  }
}

function observations(code: E.StateCode): Obs[] {
  const s = E.F.states[code];
  const name = s.name;
  const L = s.lenders;
  const out: Obs[] = [];
  const add = (key: string, f: (x: St) => number | null, w: number, build: (hi: boolean, p: number) => Omit<Obs, 'key' | 'score'> | null) => {
    const p = pctile(f, s);
    if (p === null) return;
    const o = build(p >= 0.5, p);
    if (!o) return;
    // At the extremes (top or bottom eight of 51) the paragraph is written around the rank instead.
    const x = p >= 0.85 || p <= 0.15 ? extreme(key, p >= 0.5, s, code, f) : null;
    out.push({ key, score: Math.abs(p - 0.5) * 2 * w, ...o, ...(x ?? {}) });
  };
  const locals = L.filter((l) => l.hq === code).map((l) => shortBank(l.name));
  const outside = L.filter((l) => l.hq !== code).map((l) => shortBank(l.name));

  add('local', (x) => x.localLenderShare, 1, (hi) => {
    const g = gap(s);
    const price = g === null ? '' : g < -0.2 ? ` Local lenders also priced lower: their median variable margin was ${pts(s.localMedSpreadV!)} over prime, against ${pts(s.outMedSpreadV!)} for lenders based elsewhere.` : g > 0.2 ? ` They did not price lower, though: a median variable margin of ${pts(s.localMedSpreadV!)} over prime, against ${pts(s.outMedSpreadV!)} for the out-of-state lenders.` : ` The two groups priced alike, with median margins of ${pts(s.localMedSpreadV!)} and ${pts(s.outMedSpreadV!)} over prime.`;
    return hi
      ? { h2: `${name} banks keep most of the lending`, p: `Lenders with their SBA address in ${name} made ${pc(s.localLenderShare)} of the state’s ${num(s.n)} approvals, ${ordinal(s.rank.localLenderShare)} of the 50 states and DC and well above the ${pc(NAT.local)} average.${locals.length ? ` ${list(locals.slice(0, 3))} ${locals.length > 1 ? 'rank' : 'ranks'} among the five busiest.` : ''}${price}`, short: `Home-state lenders made ${pc(s.localLenderShare)} of the loans, against ${pc(NAT.local)} nationwide.`,
        faq: { q: `Do local banks make SBA loans in ${name}?`, a: `More than in most states: ${pc(s.localLenderShare)} of the 7(a) loans for ${name} projects came from a lender whose address in the SBA file is in ${name}, against ${pc(NAT.local)} nationally.${locals.length ? ` ${list(locals.slice(0, 2))} ${locals.length > 1 ? 'were' : 'was'} among the busiest.` : ''} A local lender is a good first quote; a national SBA lender is a good second one.` } }
      : { h2: `Most ${name} loans come from out-of-state lenders`, p: `Only ${pc(s.localLenderShare)} of ${name}’s ${num(s.n)} approvals came from a lender based in the state (${pc(NAT.local)} on average).${outside.length ? ` The volume went to lenders that work across many states, led here by ${list(outside.slice(0, 3))}.` : ''}${price}`, short: `Only ${pc(s.localLenderShare)} of the loans came from lenders based in ${name}.`,
        faq: { q: `Are SBA lenders in ${name} mostly local?`, a: `No. Only ${pc(s.localLenderShare)} of the 7(a) loans for ${name} projects came from a lender whose SBA address is in the state, against ${pc(NAT.local)} nationally.${outside.length ? ` The busiest included ${list(outside.slice(0, 2))}, which lend from elsewhere.` : ''} Applying with one of them is done by phone and online, and the rules and caps are the same.` } };
  });

  add('size', (x) => x.medAmt, 1, (hi) => {
    const fee = E.upfrontFee({ amount: s.medAmt });
    return hi
      ? { h2: 'Larger loans than most states', p: `The median ${name} approval was ${m(s.medAmt)}, ${ordinal(s.rank.medAmt)} of the 50 states and DC (${m(N.medAmt)} nationally). ${s.medAmt > 350000 ? `Above ${m(350000)} the variable cap is prime plus 3 points, ${r(E.maxRate(400000, 'variable'))} today, the tightest in the program` : `At that size the variable cap is prime plus ${formatNumber(E.maxSpread(s.medAmt, 'variable'), 1)} points, ${r(E.maxRate(s.medAmt, 'variable'))} today`}, and the guaranty fee on the median loan is ${m(fee.fee)}.`, short: `The median loan, ${m(s.medAmt)}, was the ${ordinal(s.rank.medAmt)} largest of the 50 states and DC.`,
        faq: { q: `Why are SBA loans in ${name} larger than average?`, a: `The median approval for a ${name} project was ${m(s.medAmt)}, against ${m(N.medAmt)} nationally, because a larger share of loans financed real estate or the purchase of a business. Size changes the price: a larger loan has a lower rate cap, prime plus ${formatNumber(E.maxSpread(1e6, 'variable'), 1)} points above ${m(350000)}, but a higher guaranty fee rate.` } }
      : { h2: 'Smaller loans, higher allowed margins', p: `Half of ${name}’s approvals were for ${m(s.medAmt)} or less, ${ordinal(52 - s.rank.medAmt)} smallest of the 50 states and DC (${m(N.medAmt)} nationally). SBA guarantees ${E.guarantyPct(s.medAmt)}% of a loan that size and the fee is ${m(fee.fee)}, but the variable rate may go up to prime plus ${formatNumber(E.maxSpread(s.medAmt, 'variable'), 1)} points, ${r(E.maxRate(s.medAmt, 'variable'))} today.`, short: `Loans were small: the median was ${m(s.medAmt)}, against ${m(N.medAmt)} nationally.`,
        faq: { q: `What is the typical SBA loan size in ${name}?`, a: `Smaller than in most states: the median 7(a) loan approved ${FY} was ${m(s.medAmt)}, against ${m(N.medAmt)} nationally, and ${pc(s.bands[0] / s.n)} of loans were for ${m(50000)} or less. Small loans carry the widest allowed margin over prime, so comparing two quotes matters more than it does on a large loan.` } };
  });

  add('startup', (x) => age(x, 'startup'), 0.9, (hi) => hi
    ? { h2: 'Start-ups borrow a large share', p: `${pc(age(s, 'startup'))} of ${name}’s loans funded a business that was not yet open (${pc(NAT.startup)} nationwide). SBA’s lending rules ask a start-up to put in cash of its own (an equity injection) of at least ${P.sevenA.startupEquity}% of the total project cost, ${m(s.medAmt * P.sevenA.startupEquity / 90)} on a project financed by a median-size loan.`, short: `${pc(age(s, 'startup'))} of loans went to businesses not yet open.`,
      faq: { q: `Can a start-up get an SBA loan in ${name}?`, a: `Yes, and more often than elsewhere: ${pc(age(s, 'startup'))} of ${name}’s 7(a) loans financed a business that was not yet open, against ${pc(NAT.startup)} nationally. Expect to put in at least ${P.sevenA.startupEquity}% of the project cost yourself, and to show a business plan and projections, since there are no past tax returns to judge.` } }
    : { h2: 'Few start-ups', p: `Businesses not yet open took ${pc(age(s, 'startup'))} of ${name}’s approvals, against ${pc(NAT.startup)} nationwide; established firms over two years old took ${pc(age(s, 'existing'))}. A going concern is judged on its tax returns and cash flow and skips the ${P.sevenA.startupEquity}% start-up equity rule.`, short: `Start-ups took only ${pc(age(s, 'startup'))} of approvals.` });

  add('buyout', (x) => age(x, 'buyout'), 0.9, (hi) => hi
    ? { h2: 'Many loans buy an existing business', p: `Changes of ownership were ${pc(age(s, 'buyout'))} of ${name}’s approvals (${pc(NAT.buyout)} nationally). SBA’s rules for buying a business govern them: the buyer’s equity, the valuation of the business and the debt service coverage are checked under their own rules, and a seller note can count toward equity only on stated terms.`, short: `${pc(age(s, 'buyout'))} of loans financed the purchase of a business.`,
      faq: { q: `How common are SBA business acquisition loans in ${name}?`, a: `More common than average: ${pc(age(s, 'buyout'))} of ${name}’s 7(a) loans financed a change of ownership, against ${pc(NAT.buyout)} nationally. These loans follow SBA’s rules for buying a business, which set the equity, valuation and cash-flow tests. The median rate and the lender table on this page apply to them like any other 7(a) loan.` } }
    : { h2: 'Few business purchases', p: `Only ${pc(age(s, 'buyout'))} of ${name}’s approvals financed a change of ownership (${pc(NAT.buyout)} nationally). Most of the money went to owners expanding, equipping or adding working capital to a business they already run.`, short: `Business purchases were rare, ${pc(age(s, 'buyout'))} of loans.` });

  add('young', (x) => age(x, 'new'), 0.7, (hi) => hi
    ? { h2: 'Young businesses are well represented', p: `Firms open two years or less took ${pc(age(s, 'new'))} of ${name}’s loans, against ${pc(NAT.young)} nationally. With a short record, their lenders lean on the owners’ guarantees and collateral, which SBA requires when available.`, short: `Businesses under two years old took ${pc(age(s, 'new'))} of loans.` }
    : { h2: 'Mostly established borrowers', p: `Businesses open two years or less took only ${pc(age(s, 'new'))} of ${name}’s approvals (${pc(NAT.young)} nationally), leaving most of the volume to firms with a longer track record.`, short: `Only ${pc(age(s, 'new'))} of loans went to businesses under two years old.` });

  add('express', exp, 1, (hi) => hi
    ? { h2: 'SBA Express carries much of the volume', p: `${pc(exp(s))} of ${name}’s approvals were SBA Express loans (${pc(NAT.express)} nationally). Express stops at ${m(P.sevenA.expressMax)}, carries a ${P.sevenA.guaranty.expressPct}% guaranty and lets the lender decide on its own forms; the fee is charged on that smaller guaranteed part.`, short: `${pc(exp(s))} of loans went through SBA Express.`,
      faq: { q: `Is SBA Express common in ${name}?`, a: `Yes: ${pc(exp(s))} of ${name}’s 7(a) loans were Express loans, against ${pc(NAT.express)} nationally. Express is capped at ${m(P.sevenA.expressMax)} and guaranteed at ${P.sevenA.guaranty.expressPct}%, so its guaranty fee is lower than on a standard loan of the same size, while the maximum rate is the same.` } }
    : { h2: 'Standard 7(a) more than Express', p: `Only ${pc(exp(s))} of ${name}’s approvals used SBA Express (${pc(NAT.express)} nationally); ${pc(s.programs.plp / s.n)} were made by Preferred Lenders under delegated authority, with the larger standard guaranty of ${P.sevenA.guaranty.smallPct}% or ${P.sevenA.guaranty.largePct}%.`, short: `Express was used for only ${pc(exp(s))} of loans.` });

  add('fixed', (x) => x.fixedShare, 0.8, (hi) => hi
    ? { h2: 'Fixed rates are frequent', p: `${pc(s.fixedShare)} of ${name}’s loans carried a fixed rate, ${ordinal(s.rank.fixedShare)} of the 50 states and DC (${pc(N.fixedShare)} nationally)${s.medF !== null ? `, with a median of ${r(s.medF)}` : ''}. A fixed rate has its own cap, prime plus 5 to 8 points by amount, and shields the payment from a rise in prime like the one of September 17, 2026.`, short: `${pc(s.fixedShare)} of loans had a fixed rate, against ${pc(N.fixedShare)} nationally.`,
      faq: { q: `Do ${name} lenders offer fixed-rate SBA loans?`, a: `More than in most states: ${pc(s.fixedShare)} of ${name}’s 7(a) loans were fixed-rate, against ${pc(N.fixedShare)} nationally${s.medF !== null ? `, with a median rate of ${r(s.medF)}` : ''}. The fixed cap runs from prime plus 5 points on large loans to prime plus 8 on the smallest. Ask each lender for both options and compare them.` } }
    : { h2: 'Nearly all variable', p: `Only ${pc(s.fixedShare)} of ${name}’s approvals were fixed-rate (${pc(N.fixedShare)} nationally). On the variable loans the margin is set for life but the payment follows prime, which was ${r(7)} in November 2025, ${r(6.75)} from December 11 and ${r(7)} again from September 17, 2026.`, short: `Variable rates dominated: only ${pc(s.fixedShare)} of loans were fixed.` });

  add('cap', (x) => x.atCapV, 1.1, (hi) => hi
    ? { h2: 'Many loans priced at the cap', p: `${pc(s.atCapV!)} of ${name}’s variable loans were at the SBA cap for their size, against ${pc(N.atCapV!)} nationally. Almost all of those are loans of ${m(50000)} or less, where the cap is prime plus ${formatNumber(E.maxSpread(1, 'variable'), 1)} points${s.atCapVBand[0] !== null ? `; in that band ${pc(s.atCapVBand[0])} of ${name}’s loans were at the cap` : ''}.`, short: `${pc(s.atCapV!)} of variable loans were priced at the SBA cap.`,
      faq: { q: `Are many SBA loans in ${name} at the SBA cap?`, a: `More than average: ${pc(s.atCapV!)} of ${name}’s variable-rate 7(a) loans were priced at the SBA cap for their size, against ${pc(N.atCapV!)} nationally. The cap is legal, but most borrowers of the same size paid less, so a quote at the cap is the first thing to compare with another lender.` } }
    : { h2: 'Few loans at the cap', p: `Only ${pc(s.atCapV!)} of ${name}’s variable loans were priced at the SBA cap (${pc(N.atCapV!)} nationally). A quote at the cap would be out of line with what ${name} lenders usually charged.`, short: `Only ${pc(s.atCapV!)} of variable loans sat at the SBA cap.` });

  add('rate', (x) => x.medVBand[1], 0.8, (hi) => s.medVBand[1] === null ? null : hi
    ? { h2: 'Mid-size loans priced above average', p: `On loans of ${E.BAND_LABELS[1]}, the median variable rate in ${name} was ${r(s.medVBand[1])}, against ${r(N.medVBand[1]!)} nationally, for the same cap and the same prime. The gap comes from the lenders active in the state, listed in the table above.`, short: `Mid-size loans were priced at a median of ${r(s.medVBand[1])}, above the national ${r(N.medVBand[1]!)}.` }
    : { h2: 'Mid-size loans priced below average', p: `On loans of ${E.BAND_LABELS[1]}, the median variable rate in ${name} was ${r(s.medVBand[1])}, against ${r(N.medVBand[1]!)} nationally. A ${name} quote above the national median for that size has room to come down.`, short: `Mid-size loans had a median rate of ${r(s.medVBand[1])}, below the national ${r(N.medVBand[1]!)}.` });

  add('504', per504, 1, (hi) => {
    const f5 = s.f504;
    if (!f5) return { h2: 'No 504 loans', p: `No 504 loan was approved for a ${name} project in ${FY}. Buildings and long-lived equipment were financed through 7(a) loans or outside SBA.`, short: `No 504 loan was approved for a ${name} project.` };
    const cd = f5.cdcs.length ? ` The busiest certified development ${f5.cdcs.length > 1 ? 'companies were' : 'company was'} ${list(f5.cdcs.map((c) => `${c.name} (${num(c.n)})`))}.` : '';
    return hi
      ? { h2: '504 loans are well used', p: `${num(f5.n)} 504 loans for ${h0(f5.total)} were approved for ${name} projects, ${formatNumber(per504(s) * 100, 1)} for every 100 7(a) loans against ${formatNumber(NAT.r504 * 100, 1)} nationally, with a median CDC loan of ${m(f5.medAmt)}.${cd}`, short: `The state used 504 loans heavily: ${num(f5.n)} approvals for ${h0(f5.total)}.`,
        faq: { q: `Who arranges SBA 504 loans in ${name}?`, a: `Certified development companies. Over ${FY}, ${num(f5.n)} 504 loans were approved for ${name} projects${f5.cdcs.length ? `, most often through ${list(f5.cdcs.slice(0, 2).map((c) => c.name))}` : ''}. The CDC funds up to ${P.fees504.structure.cdc}% of a building or equipment project with a fixed-rate loan backed by SBA; a bank lends about half and the owner puts in at least ${P.fees504.structure.borrower}%.` } }
      : { h2: '504 lending is light', p: `${name} had ${num(f5.n)} 504 approvals (${h0(f5.total)}), ${formatNumber(per504(s) * 100, 1)} for every 100 7(a) loans against ${formatNumber(NAT.r504 * 100, 1)} nationally.${cd}`, short: `504 lending was light, ${num(f5.n)} approvals.` };
  });

  add('franchise', (x) => x.franchiseShare, 0.8, (hi) => hi
    ? { h2: 'Franchise units are frequent', p: `${pc(s.franchiseShare)} of ${name}’s loans financed a franchise (${pc(N.franchiseShare)} nationally)${s.franchises.length ? `; the brands seen most often were ${list(s.franchises.map((f) => `${f.name} (${num(f.n)})`))}` : ''}. A franchise brand must meet SBA’s eligibility rules before its units can be financed.`, short: `Franchises took ${pc(s.franchiseShare)} of loans.`,
      faq: { q: `Which franchises get SBA loans in ${name}?`, a: `${pc(s.franchiseShare)} of ${name}’s 7(a) loans approved ${FY} went to franchise units, against ${pc(N.franchiseShare)} nationally${s.franchises.length ? `. The most frequent brands were ${list(s.franchises.map((f) => f.name))}` : ''}. The lender checks the brand and the franchise agreement against SBA’s rules; the rate cap and the guaranty fee are the same as for an independent business.` } }
    : { h2: 'Few franchise loans', p: `Franchise units took ${pc(s.franchiseShare)} of ${name}’s approvals, below the ${pc(N.franchiseShare)} national share; independent businesses took nearly all the rest.`, short: `Franchises took only ${pc(s.franchiseShare)} of loans.` });

  add('revolver', (x) => x.revolverShare, 0.8, (hi) => hi
    ? { h2: 'Lines of credit are common', p: `${pc(s.revolverShare)} of ${name}’s approvals were revolving lines rather than term loans (${pc(N.revolverShare)} nationally). A line is drawn and repaid as the business needs; interest runs only on what is drawn, but the guaranty fee is set on the full approved amount.`, short: `${pc(s.revolverShare)} of approvals were revolving lines of credit.` }
    : { h2: 'Term loans, few credit lines', p: `Only ${pc(s.revolverShare)} of ${name}’s approvals were revolving lines (${pc(N.revolverShare)} nationally); the rest were term loans repaid on a fixed schedule.`, short: `Credit lines were only ${pc(s.revolverShare)} of approvals.` });

  add('cu', (x) => x.creditUnionShare, 0.7, (hi) => hi && s.creditUnionShare >= 0.04
    ? { h2: 'Credit unions take part', p: `Credit unions made ${pc(s.creditUnionShare)} of ${name}’s SBA loans, against ${pc(N.creditUnionShare)} nationally. A member business can ask its credit union first; the SBA rules and caps are the same.`, short: `Credit unions made ${pc(s.creditUnionShare)} of loans.` }
    : null);

  add('sold', (x) => x.soldShare, 0.6, (hi) => hi
    ? { h2: 'Many guaranteed parts resold', p: `The guaranteed part of ${pc(s.soldShare)} of ${name}’s loans had been sold on the secondary market by the date of the file (${pc(N.soldShare)} nationally). The borrower keeps the same lender and terms; the sale lets the lender fund new loans.`, short: `${pc(s.soldShare)} of loans had their guaranteed part sold to investors.` }
    : { h2: 'Lenders keep their loans', p: `Only ${pc(s.soldShare)} of ${name}’s loans had their guaranteed part sold on the secondary market (${pc(N.soldShare)} nationally); most lenders here hold what they make.`, short: `Lenders kept most loans on their books.` });

  add('conc', topShare, 1, (hi) => hi
    ? { h2: `One lender stands out: ${shortBank(L[0].name)}`, p: `${shortBank(L[0].name)} made ${pc(topShare(s))} of ${name}’s approvals by itself, ${num(L[0].n)} loans with a median of ${m(L[0].medAmt)}${L[0].medV !== null ? ` and a median variable rate of ${r(L[0].medV)}` : ''}.${natLender(L[0].name)?.atCapV != null ? ` Across all its loans nationally, ${pc(natLender(L[0].name)!.atCapV!)} of its variable loans were at the SBA cap.` : ''}`, short: `${shortBank(L[0].name)} alone made ${pc(topShare(s))} of the loans.`,
      faq: { q: `Which lender makes the most SBA loans in ${name}?`, a: `${shortBank(L[0].name)}, by a wide margin: ${num(L[0].n)} of the ${num(s.n)} 7(a) loans approved for ${name} projects in ${FY}, with a median loan of ${m(L[0].medAmt)}. It was followed by ${list(L.slice(1, 3).map((l) => `${shortBank(l.name)} (${num(l.n)})`))}. Being the busiest says nothing about price; compare its quote with the medians on this page.` } }
    : { h2: 'No dominant lender', p: `The busiest lender, ${shortBank(L[0].name)}, made only ${pc(topShare(s))} of ${name}’s approvals; ${num(s.lenderCount)} lenders shared the rest. With that many lenders active, a second and third quote are easy to get.`, short: `No lender dominated: the busiest made ${pc(topShare(s))} of loans.`,
      faq: { q: `Which lenders are most active for SBA loans in ${name}?`, a: `No single one dominates. The busiest were ${list(L.slice(0, 3).map((l) => `${shortBank(l.name)} (${num(l.n)} loans)`))}, out of ${num(s.lenderCount)} lenders that made at least one 7(a) loan for a ${name} project. The table on this page gives each one’s median loan and median variable rate.` } });

  add('density', density, 0.7, (hi) => hi
    ? { h2: 'Many small lenders', p: `${num(s.lenderCount)} different lenders made at least one ${name} loan, about ${num(density(s) * 100)} per 100 loans, one of the widest fields in the country for the volume.`, short: `${num(s.lenderCount)} lenders were active, a wide field for the volume.` }
    : { h2: 'A few lenders do most of the work', p: `Only ${num(s.lenderCount)} lenders were active for ${num(s.n)} ${name} loans, about ${num(density(s) * 100)} per 100 loans, a narrow field by national standards.`, short: `Only ${num(s.lenderCount)} lenders were active.` });

  add('long', (x) => x.longTermShare, 0.8, (hi) => hi
    ? { h2: 'Long real estate loans', p: `${pc(s.longTermShare)} of ${name}’s loans ran 15 years or more (${pc(N.longTermShare)} nationally), the mark of real estate financing. Those loans carry SBA’s prepayment fee of 5%, 3% and 1% in the first three years on prepayments above 25%.`, short: `${pc(s.longTermShare)} of loans ran 15 years or longer.` }
    : { h2: 'Short terms dominate', p: `Only ${pc(s.longTermShare)} of ${name}’s loans ran 15 years or more (${pc(N.longTermShare)} nationally); the median term was ${num(s.medTermMonths / 12)} years. Loans under 15 years can be repaid early with no SBA fee.`, short: `Few loans ran past 15 years: ${pc(s.longTermShare)}.` });

  add('jobs', jobs, 0.6, (hi) => hi
    ? { h2: 'More jobs per loan', p: `Borrowers reported ${num(s.jobs)} jobs supported, ${formatNumber(jobs(s), 1)} per loan against ${formatNumber(NAT.jobs, 1)} nationally, a sign of larger employers among ${name} borrowers. The figure is the applicant’s own estimate at approval.`, short: `Borrowers reported ${formatNumber(jobs(s), 1)} jobs per loan.` }
    : { h2: 'Smaller employers', p: `Borrowers reported ${num(s.jobs)} jobs supported, ${formatNumber(jobs(s), 1)} per loan against ${formatNumber(NAT.jobs, 1)} nationally: ${name}’s SBA borrowers are mostly small teams. The figure is declared by the applicant at approval.`, short: `Borrowers were small teams, ${formatNumber(jobs(s), 1)} jobs per loan.` });

  add('skew', skew, 0.6, (hi) => hi
    ? { h2: 'A few very large loans', p: `The average ${name} loan, ${m(s.meanAmt)}, was ${formatNumber(skew(s), 1)} times the median, a wider gap than in most states: a small number of multi-million-dollar loans, mostly real estate, sit on top of many small ones.`, short: `A few large loans pushed the average to ${m(s.meanAmt)}.` }
    : { h2: 'Loan sizes are even', p: `The average ${name} loan, ${m(s.meanAmt)}, was only ${formatNumber(skew(s), 1)} times the median, one of the narrowest gaps in the country: few very large loans, and a market built around mid-size ones.`, short: `Loan sizes were even, with an average of ${m(s.meanAmt)}.` });

  add('canc', canc, 0.6, (hi) => hi
    ? { h2: 'Many approvals cancelled', p: `${num(s.cancelled)} of ${name}’s approvals, ${pc(canc(s))}, were later cancelled (${pc(NAT.canc)} nationally). A cancelled loan was approved but not carried through, for example when the borrower chose other financing or the deal fell through.`, short: `${pc(canc(s))} of approvals were later cancelled.` }
    : { h2: 'Few cancellations', p: `Only ${pc(canc(s))} of ${name}’s approvals were later cancelled (${pc(NAT.canc)} nationally); nearly every loan approved went on to be disbursed.`, short: `Few approvals were cancelled, ${pc(canc(s))}.` });

  add('county', cty, 0.6, (hi) => {
    if (!s.counties.length || s.counties.length < 2) return null;
    const c = s.counties;
    return hi
      ? { h2: `Lending centers on ${c[0].name} County`, p: `${c[0].name} County alone had ${num(c[0].n)} approvals, ${pc(cty(s)!)} of the state’s total, ahead of ${list(c.slice(1).map((x) => `${x.name} County (${num(x.n)})`))}.`, short: `${c[0].name} County had ${pc(cty(s)!)} of the state’s loans.` }
      : { h2: 'Spread across the state', p: `No county dominates: the busiest, ${c[0].name} County, had ${pc(cty(s)!)} of approvals, followed by ${list(c.slice(1).map((x) => `${x.name} County (${num(x.n)})`))}.`, short: `Lending was spread out; ${c[0].name} County led with ${pc(cty(s)!)}.` };
  });

  const oi = s.overIndustry;
  if (oi) {
    const note = tradeNote(oi.name, oi.code);
    out.push({ key: 'trade', score: Math.min(1, (oi.ratio - 1) / 3) * 0.9, h2: `More common here than nationally: ${what(oi.name)}`, p: `${num(oi.n)} ${name} loans went to ${what(oi.name)}, ${formatNumber(oi.ratio, 1)} times the national share for that trade. The most frequent trades overall were ${list(s.industries.slice(0, 3).map((i) => what(i.name)))}.${note ? ` ${note}` : ''}`, short: `The state stood out for loans to ${what(oi.name)}.` });
  }
  return out;
}
const h0 = (x: number) => (x >= 1e9 ? `$${formatNumber(x / 1e9, 1)} billion` : `$${formatNumber(x / 1e6, 1)} million`);

function fit(cands: string[], min: number, max: number): string {
  const ok = cands.find((c) => c.length >= min && c.length <= max);
  if (!ok) throw new Error(`No snippet of ${min}-${max} characters: ${cands.map((c) => `${c.length}:${c}`).join(' | ')}`);
  return ok;
}

function page(code: E.StateCode, i: number): PageDef {
  const s = E.F.states[code];
  const name = s.name;
  const obs = observations(code).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
  const shown = obs.slice(0, 8);
  const title = fit([
    `SBA Loans ${name} 2026: Rates, Lenders and Median Loan`,
    `SBA Loans in ${name} 2026: Rates, Lenders, Median Loan`,
    `SBA Loans ${name} 2026: Rates, Lenders, Median Loan Size`,
    `SBA Loans in ${name} 2026: Rates and Lenders`,
    `SBA Loans ${name}: Rates, Lenders, Loan Size`,
    `SBA Loans ${name}: Rates and Top Lenders`,
    `SBA Loans in ${name} 2026: Rates, Top Lenders`,
    `SBA Loans in ${name}: ${FYS} Rates and Lenders`,
  ], 50, 60);
  const description = fit([
    `${num(s.n)} SBA 7(a) loans approved in ${name} in ${FYS}: median ${m(s.medAmt)}, rates paid, busiest lenders and 504 activity, plus your payment at today’s prime.`,
    `${num(s.n)} SBA 7(a) loans approved in ${name} in ${FYS}: median ${m(s.medAmt)}, the rates paid, the busiest lenders and 504 activity, with your payment today.`,
    `${num(s.n)} SBA 7(a) loans approved in ${name} in ${FYS}: median ${m(s.medAmt)}, rates borrowers paid, busiest lenders, 504 loans, and your own monthly payment.`,
    `${num(s.n)} SBA 7(a) loans were approved for ${name} projects in ${FYS}: median ${m(s.medAmt)}, rates paid, busiest lenders and 504 loans, with a payment calculator.`,
    `${num(s.n)} SBA 7(a) loans approved in ${name}, ${FYS}: median ${m(s.medAmt)}, rates paid, busiest lenders, 504 loans and your payment at today’s prime rate of interest.`,
  ], 150, 160);
  const build = (k: number) => `${name}, ${FY}: ${num(s.n)} SBA 7(a) approvals for ${h0(s.total)} (${ordinal(s.rank.n)} of the 50 states and DC, SBA file of ${displayDate(E.F.asOf, 'en-US')}). ${obs.slice(0, k).map((o) => o.short).join(' ')} Today’s cap on a ${m(Math.round(s.medAmt / 1000) * 1000)} variable loan: ${r(E.maxRate(s.medAmt, 'variable'))}.`;
  let k = 4;
  while (words(build(k)) < 125 && k < obs.length) k++;
  const resume = build(k);
  if (words(resume) < 120) throw new Error(`${name}: citable block of ${words(resume)} words`);
  // Questions on what the paragraphs above do not already cover come first, so the answers add to the page.
  const withFaq = obs.filter((o) => o.faq);
  const faqs = [...withFaq.filter((o) => !shown.includes(o)), ...withFaq.filter((o) => shown.includes(o))].slice(0, 3).map((o) => o.faq!);
  for (const f of faqs) { const w = words(f.a); if (w < 40 || w > 90) throw new Error(`${name}: FAQ “${f.q}” has ${w} words`); }
  return {
    id: slugOf(code), group: 'states', order: 500 + i, slug: slugOf(code),
    kicker: 'SBA loans by state',
    tool: { kind: 'mini:state', props: { st: stateIndex(code), amount: Math.round(s.medAmt / 1000) * 1000 } },
    related: ['sba-loans-by-state', 'sba-loan-rates', 'sba-lenders', 'home'],
    sources: ['foia', 'fees7a', 'sop', 'prime'],
    nav: name,
    card: `${num(s.n)} loans approved ${FY}, median ${m(s.medAmt)}.`,
    title, description,
    h1: `SBA loans in ${name}: ${num(s.n)} approved in 12 months, median ${m(s.medAmt)}`,
    intro: `${obs[0].short} ${obs[1].short}`,
    resume: () => resume,
    faqs: () => faqs,
    body: (h: Helpers) => {
      const parts = shown.map((o) => `<h2>${o.h2}</h2><p>${o.p}</p>`);
      // Home state written out (naive test of 2026-11-08: “Based in Texas?” answered “FL”).
      const home = (hq: string) => (hq === code ? `${name} (in-state)` : hq in E.F.states ? E.stateName(hq as E.StateCode) : hq);
      const lenderRows = s.lenders.map((l) => [shortBank(l.name), num(l.n), m(l.medAmt), l.medV !== null ? r(l.medV) : 'n/a', home(l.hq)]);
      // Final naive test of 2026-11-09: the list read as a recommendation, and rates compared across loan sizes.
      const bySize = [...s.lenders].sort((x, y) => y.medAmt - x.medAmt);
      const big = bySize[0], small = bySize[bySize.length - 1];
      const sizes = big && small && big.medAmt > small.medAmt * 1.3 ? `: ${shortBank(big.name)}’s median loan was ${m(big.medAmt)}, ${shortBank(small.name)}’s ${m(small.medAmt)}, so their rates do not compare` : ', so compare a lender’s rate only with loans of a similar size';
      const tbl = h.table(['Lender', `Loans, ${FY}`, 'Median loan', 'Typical variable rate', 'Lender’s home state'], lenderRows, `The five lenders that made the most SBA 7(a) loans for ${name} projects, approved ${FY}: not a recommendation. Rates fall as loans get bigger${sizes}. Ask two of them, or your own bank, for a quote. SBA’s public loan file of ${h.date(E.F.asOf)}.`, ['l', 'r', 'r', 'r', 'l']);
      const bandRows = E.BAND_LABELS.map((lab, k) => [lab, num(s.bands[k]), s.medVBand[k] !== null ? r(s.medVBand[k]!) : 'too few', r(E.maxRate([50000, 250000, 350000, 1000000][k], 'variable'))]);
      const tbl2 = h.table(['Loan size', 'Loans', `Typical variable rate, ${FY}`, 'SBA cap today'], bandRows, `Typical = median, set at approval (prime ${r(6.75)} to ${r(7)}); SBA cap on prime ${r(P.prime.rate)} of ${h.date(P.prime.date)}. Cells under ${E.F.minCell} loans are not shown.`, ['l', 'r', 'r', 'r']);
      const where = s.counties.length ? `<p>Counties with the most approvals: ${list(s.counties.map((c) => `${c.name} (${num(c.n)})`))}. Trades: ${list(s.industries.map((x) => `${what(x.name)} (${num(x.n)})`))}.</p>` : `<p>Trades: ${list(s.industries.map((x) => `${what(x.name)} (${num(x.n)})`))}.</p>`;
      return tbl + parts.slice(0, 4).join('') + tbl2 + parts.slice(4).join('') + where + `<p>All ${h.a('sba-loans-by-state', 'states compared')}.</p>`;
    },
  };
}

export const STATE_PAGES: PageDef[] = E.STATES.map((c, i) => page(c, i));
