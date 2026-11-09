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
    { q: 'Which prime rate does an SBA lender use?', a: `Usually the prime rate in effect on the first business day of the month, as printed in a national financial newspaper or website: ${h.r(P.prime.rate)} on ${h.date(P.prime.date)}. SBA’s lending rules also allow another base, such as SOFR (the Secured Overnight Financing Rate) or a 5- or 10-year Treasury rate, or SBA’s own optional base rate; the note names the base, the margin and the reset dates.` },
    { q: 'Can a lender charge less than the SBA cap?', a: `Yes, and most do. The cap is only a limit: of the variable 7(a) loans approved ${h.fy}, ${h.pc(1 - N.atCapV!)} were priced below it. The margin is negotiated like any other loan term, and a second quote from another SBA lender is the usual way to bring it down, especially on smaller loans where the gap between median and cap is widest.` },
    { q: 'Why are rates on small SBA loans higher?', a: `Because SBA allows it: the cap is prime plus ${formatNumber(E.maxSpread(1, 'variable'), 1)} points up to ${h.m(50000)} against prime plus ${formatNumber(E.maxSpread(1e6, 'variable'), 1)} above ${h.m(350000)}. A small loan costs a lender nearly as much to underwrite and service as a large one, so lenders price closer to the cap. The median for loans approved ${h.fy} was ${h.r(N.medVBand[0]!)} for the smallest loans and ${h.r(N.medVBand[3]!)} for the largest.` },
    { q: 'Does the rate in the SBA data include the guaranty fee?', a: 'No. The file records the note rate at approval. The guaranty fee is a separate one-time charge, usually added to the loan, so the true yearly cost is a little higher than the note rate. The calculator on the home page shows the true yearly cost with the fee counted.' },
  ],
  body: (h) => {
    const bands = E.BAND_LABELS.map((lab, i) => {
      const c = N.rates.V[i];
      return [lab, h.num(c.n), h.r(c.p[5]), h.r(c.p[10]), h.r(c.p[15]), `${Math.round(N.atCapVBand[i]! * 100)} in 100`];
    });
    const months = ym.map((k) => [h.ml(k), h.num(N.months[k as keyof typeof N.months]), h.r(N.primeByMonth[k as keyof typeof N.primeByMonth])]);
    const hist = P.primeHistory.changes.map(([d, r]) => `${h.date(d as string)}: ${h.r(r as number)}`).join('; ');
    return `<h2>Where SBA loan rates really fell</h2>
<p>Each row is a size band, cut at the same amounts as SBA’s rate steps. Read it as “a quarter of borrowers paid this rate or less”, then half (the typical rate, or median), then three quarters. These are rates at approval, on the prime of that month, which was ${h.r(6.75)} for most of the year; on today’s ${h.r(P.prime.rate)} prime each would be a quarter point higher for the same margin.</p>
${h.table(['Loan size', 'Variable loans', 'A quarter paid up to', 'Half paid up to (typical)', 'Three quarters paid up to', 'Priced at the cap'], bands, `SBA’s public 7(a) loan file of ${h.date(E.F.asOf)}, variable-rate loans approved ${h.fy}.`, ['l', 'r', 'r', 'r', 'r', 'r'])}
<p>On loans of ${h.m(50000)} or less, the three-quarter mark is the cap itself. Above ${h.m(350000)} the spread narrows: three quarters of loans were at ${h.r(N.rates.V[3].p[15])} or less, while the cap at approval was prime plus 3. Fixed rates were rarer, ${h.pc(N.fixedShare)} of approvals, with a median of ${h.r(N.medF!)}, and only ${h.pc(N.atCapF!)} at their own cap.</p>
<h2>Prime during the year</h2>
<p>Because the margin is fixed and prime moves, the same loan costs more or less from one month to the next. Daily prime changes since September 2025: ${hist}. The volume of approvals by month shows the gap left by the federal shutdown: no 7(a) loan in the file was approved in October 2025.</p>
${h.table(['Month of approval', '7(a) loans', 'Prime, first business day'], months, `Counts from SBA’s public loan file; prime from the Federal Reserve’s DPRIME series.`, ['l', 'r', 'r'])}
<h2>Reading a quote</h2>
<p>Ask for the margin, not only the rate: “prime plus 2.75” stays true whatever prime does. Compare it with the typical (median) margin for your size, ${N.medSpreadVBand.map((s, i) => `${formatNumber(s!, 2)} points ${E.BAND_LABELS[i]}`).join(', ')}. Why can two sizes with the same typical rate at approval show different typical rates today? The typical rate and the typical margin are each the middle of their own list, and prime changed during the year, so they do not always move together; the calculator uses the margin. A quote that matches the cap is legal; it is also above what most borrowers of the same size paid. Lenders price very differently from one another, as the ${h.a('sba-lenders', 'lender page')} shows, and each state has its own mix, see ${h.a('sba-loans-by-state', 'SBA loans by state')}.</p>`;
  },
});
