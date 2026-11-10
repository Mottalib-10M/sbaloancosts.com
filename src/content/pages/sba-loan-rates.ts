import { definePage } from '../../lib/guide-types';
import { P, DATA_YEAR } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { formatNumber } from '../../lib/format';

const N = E.F.national;
const ym = Object.keys(N.months);

export default definePage({
  id: 'sba-loan-rates',
  group: 'costs',
  order: 20,
  tool: { kind: 'mini:ratecheck' },
  related: ['sba-7a-loan', 'sba-lenders', 'sba-loans-by-state', 'sba-vs-conventional-loan'],
  sources: ['sop', 'fixedRates', 'prime', 'primeHistory', 'foia'],
  slug: 'sba-loan-rates',
  nav: 'SBA loan rates',
  card: `Today’s caps by loan size, and where ${formatNumber(N.n, 0)} real approvals were actually priced.`,
  title: 'SBA Loan Rates November 2026: Caps and Rates Actually Paid',
  description: `SBA loan rates for November 2026: the maximum by loan size on a ${formatNumber(P.prime.rate, 2)}% prime, and the rates borrowers actually paid on ${formatNumber(N.n, 0)} 7(a) loans approved in FY ${E.F.fy}.`,
  h1: 'SBA loan rates: the SBA cap and what borrowers really paid',
  intro: `SBA sets a cap (the highest rate allowed), not a rate. Type the rate you were quoted: you see whether it is high or low next to the loans of the same size SBA approved ${DATA_YEAR}. Then ask the lender for the margin, the part above prime, not only the rate.`,
  resume: (h) => `SBA 7(a) rates are set by the lender, under an SBA cap that depends on the loan amount and on the prime rate. For a variable loan the cap is prime plus ${formatNumber(E.maxSpread(1, 'variable'), 1)} points up to ${h.m(50000)}, plus ${formatNumber(E.maxSpread(100000, 'variable'), 1)} up to ${h.m(250000)}, plus ${formatNumber(E.maxSpread(300000, 'variable'), 1)} up to ${h.m(350000)} and plus ${formatNumber(E.maxSpread(1e6, 'variable'), 1)} above. With prime at ${h.r(P.prime.rate)} on ${h.date(P.prime.date)}, the caps run from ${h.r(E.maxRate(1, 'variable'))} down to ${h.r(E.maxRate(1e6, 'variable'))}. Real loans sit well below them on average. In SBA’s own loan-level file, the median variable rate on loans approved ${h.fy} was ${h.r(N.medV!)}, and ${h.pc(N.atCapV!)} of variable loans were at the cap. That share was ${h.pc(N.atCapVBand[0]!)} on loans of ${h.m(50000)} or less and ${h.pc(N.atCapVBand[1]!)} between ${h.m(50001)} and ${h.m(250000)}. So the size of the loan, more than anything, decides whether a quote at the cap is ordinary or worth pushing back on.`,
  faqs: (h) => [
    { q: 'Which prime rate does an SBA lender use?', a: `Usually the prime rate in effect on the first business day of the month, as printed in a national financial newspaper or website: ${h.r(P.prime.rate)} on ${h.date(P.prime.date)}. SBA’s lending rules also allow another base, such as SOFR (the Secured Overnight Financing Rate, a market rate between banks) or a 5- or 10-year Treasury rate (what the U.S. government pays to borrow), or SBA’s own optional base rate; the note names the base, the margin and the reset dates.` },
    { q: 'Can a lender charge less than the SBA cap?', a: `Yes, and most do. The cap is only a limit: of the variable 7(a) loans approved ${h.fy}, ${h.pc(1 - N.atCapV!)} were priced below it. The margin is negotiated like any other loan term, and a second quote from another SBA lender is the usual way to bring it down, especially on smaller loans, where the gap between the typical rate and the cap is widest.` },
    { q: 'Why are rates on small SBA loans higher?', a: `Because SBA allows it: the cap is prime plus ${formatNumber(E.maxSpread(1, 'variable'), 1)} points up to ${h.m(50000)} against prime plus ${formatNumber(E.maxSpread(1e6, 'variable'), 1)} above ${h.m(350000)}. A small loan costs a lender nearly as much to underwrite and service as a large one, so lenders price closer to the cap. The median for loans approved ${h.fy} was ${h.r(N.medVBand[0]!)} for the smallest loans and ${h.r(N.medVBand[3]!)} for the largest.` },
  ],
  body: (h) => {
    const bands = E.BAND_LABELS.map((lab, i) => {
      const c = N.rates.V[i];
      return [lab, h.num(c.n), h.r(c.p[5]), h.r(c.p[10]), h.r(c.p[15]), `${Math.round(N.atCapVBand[i]! * 100)} in 100`];
    });
    const months = ym.map((k) => [h.ml(k), h.num(N.months[k as keyof typeof N.months]), h.r(N.primeByMonth[k as keyof typeof N.primeByMonth])]);
    const hist = P.primeHistory.changes.map(([d, r]) => `${h.date(d as string)}: ${h.r(r as number)}`).join('; ');
    // “What to do now” first and open (brief of 2026-11-10, rule 3: never fold the essential).
    return `<h2 data-ouvert>How to read your bank’s quote</h2>
<p>Ask for the margin, not only the rate: “prime plus 2.75” stays true whatever prime does. Then set it against the typical margin for your loan size, the one half of borrowers paid less than: ${N.medSpreadVBand.map((s, i) => `${formatNumber(s!, 2)} points ${E.BAND_LABELS[i]}`).join(', ')}. A quote at the cap is legal, but it is above what most borrowers of the same size paid: get a second quote. The ${h.a('sba-lenders', 'lender page')} shows how differently lenders price, and ${h.a('sba-loans-by-state', 'SBA loans by state')} what they charge where you are.</p>
<h2>What borrowers really paid: SBA loan rates by size</h2>
<p>Each row is a loan size, cut at the same amounts as SBA’s rate steps. Read it as “a quarter of borrowers paid this rate or less”, then half (the typical rate), then three quarters. These are rates at approval, when prime was ${h.r(6.75)} for most of the year; on today’s ${h.r(P.prime.rate)} prime each would be a quarter point higher for the same margin.</p>
${h.table(['Loan size', 'Variable loans', 'A quarter paid up to', 'Half paid up to (typical)', 'Three quarters paid up to', 'Priced at the cap'], bands, `SBA’s public 7(a) loan file of ${h.date(E.F.asOf)}, variable-rate loans approved ${h.fy}.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>On loans of ${h.m(50000)} or less, the three-quarter mark is the cap itself. Fixed rates were rarer, ${h.pc(N.fixedShare)} of approvals, and only ${h.pc(N.atCapF!)} sat at their own cap.</p>
<h2>How prime moved during the year</h2>
<p>Because the margin is fixed and prime moves, the same loan costs more or less from one month to the next. Prime changes since September 2025: ${hist}. No 7(a) loan in the file was approved in October 2025, the month of the federal government shutdown.</p>
${h.table(['Month of approval', '7(a) loans', 'Prime, first business day'], months, `Counts from SBA’s public loan file; prime from the Federal Reserve’s daily series.`, ['l', 'r', 'r'])}`;
  },
});
