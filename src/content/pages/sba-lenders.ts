import { definePage } from '../../lib/guide-types';
import { P, DATA_YEAR } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { shortBank } from '../../lib/mini-specs';
import { formatNumber } from '../../lib/format';

const N = E.F.national;
const L = N.lenders;
const byCap = [...L].filter((l) => l.atCapV !== null).sort((a, b) => b.atCapV! - a.atCapV!);
const low = [...L].filter((l) => l.medSpreadV !== null).sort((a, b) => a.medSpreadV! - b.medSpreadV!);

export default definePage({
  id: 'sba-lenders',
  group: 'data',
  order: 90,
  tool: { kind: 'mini:lender' },
  related: ['sba-loan-rates', 'sba-loans-by-state', 'sba-express-loan', 'sba-7a-loan'],
  sources: ['foia', 'sop', 'prime', 'primeHistory'],
  slug: 'sba-lenders',
  nav: 'Top SBA lenders',
  card: 'The 25 busiest 7(a) lenders: volume, median loan, margin over prime and share priced at the cap.',
  title: `Top SBA Lenders FY ${E.F.fy}: Volume, Rates and Share at the Cap`,
  description: `Top SBA lenders in FY ${E.F.fy}: the 25 busiest 7(a) lenders by approvals, with their median loan, median margin over prime and share of loans at the SBA cap.`,
  h1: `Top SBA lenders: who made the ${formatNumber(N.n, 0)} loans approved ${DATA_YEAR}, and at what price`,
  intro: 'Lenders publish rate ranges; SBA publishes what they charged. Pick a lender below to compare its pricing with the rate it quoted you.',
  resume: (h) => `${h.num(N.lenderCount)} lenders approved at least one SBA 7(a) loan ${h.fy}, but the volume is concentrated: the ${L.length} busiest made ${h.pc(L.reduce((a, l) => a + l.n, 0) / N.n)} of all approvals. ${shortBank(L[0].name)} led with ${h.num(L[0].n)} loans, followed by ${shortBank(L[1].name)} (${h.num(L[1].n)}) and ${shortBank(L[2].name)} (${h.num(L[2].n)}). Their pricing differs widely. Measured as the margin over the prime rate of the month of approval, the median ranged from ${formatNumber(low[0].medSpreadV!, 2)} points at ${shortBank(low[0].name)} to ${formatNumber(low[low.length - 1].medSpreadV!, 2)} points at ${shortBank(low[low.length - 1].name)}. The share of variable loans priced at the SBA cap for their size went from none at several large banks to ${h.pc(byCap[0].atCapV!)} at ${shortBank(byCap[0].name)} and ${h.pc(byCap[1].atCapV!)} at ${shortBank(byCap[1].name)}. Loan size explains part of the gap, since small loans carry higher caps; lender policy explains the rest. Every figure here is counted from SBA’s own loan-level file, as of ${h.date(E.F.asOf)}.`,
  faqs: (h) => [
    { q: 'Which bank makes the most SBA loans?', a: `By number of 7(a) loans approved ${h.fy}, ${shortBank(L[0].name)}, with ${h.num(L[0].n)} loans and a median of ${h.m(L[0].medAmt)}. By dollar volume the order changes: ${shortBank([...L].sort((a, b) => b.total - a.total)[0].name)} lent the most, ${h.mil([...L].sort((a, b) => b.total - a.total)[0].total)}, because its loans are larger. Neither ranking says which lender is cheapest for you.` },
    { q: 'What is a Preferred Lender?', a: `A lender SBA has given delegated authority to approve 7(a) loans without sending the credit file to SBA first. Most volume goes through them: ${h.pc(N.programs.plp / N.n)} of the loans approved ${h.fy} were Preferred Lenders Program loans, and ${h.pc(N.programs.express / N.n)} were SBA Express, also decided by the lender. Status says nothing about price.` },
    { q: 'Why does the margin matter more than the rate?', a: `Because prime moved during the year, from ${h.r(7)} to ${h.r(6.75)} and back to ${h.r(P.prime.rate)}, the same lender charged different rates in different months for the same pricing. The margin over prime strips that out, and it is what stays fixed in a variable-rate note for the life of the loan.` },
  ],
  body: (h) => {
    const rows = L.map((l) => [shortBank(l.name), l.hq, h.num(l.n), h.m(l.medAmt), l.medSpreadV !== null ? formatNumber(l.medSpreadV, 2) : 'n/a', l.atCapV !== null ? h.pc(l.atCapV) : 'n/a', h.pc(l.expressShare)]);
    const small = L.filter((l) => l.medVBand[0] !== null).sort((a, b) => a.medVBand[0]! - b.medVBand[0]!);
    const wide = L.filter((l) => l.states >= 50).map((l) => shortBank(l.name));
    return `<h2>The 25 busiest SBA 7(a) lenders</h2>
${h.table(['Lender', 'Based in', 'Loans', 'Median loan', 'Typical margin over prime', 'Variable loans at the cap', 'Through Express'], rows, `SBA’s public 7(a) loan file of ${h.date(E.F.asOf)}, loans approved ${h.fy}. Margin = rate at approval less the prime of the first business day of that month.`, ['l', 'l', 'r', 'r', 'r', 'r', 'r'])}
<h2>Same size of loan, different prices</h2>
<p>The fairest comparison is between loans of the same size. On loans of ${h.m(50000)} or less, where the cap at approval was prime plus ${formatNumber(E.maxSpread(50000, 'variable'), 1)}, the median variable rate went from ${h.r(small[0].medVBand[0]!)} at ${shortBank(small[0].name)} to ${h.r(small[small.length - 1].medVBand[0]!)} at ${shortBank(small[small.length - 1].name)}.</p>
${h.table(['Lender', `Median variable rate, loans ${E.BAND_LABELS[0]}`, `Median, ${E.BAND_LABELS[1]}`], small.map((l) => [shortBank(l.name), h.r(l.medVBand[0]!), l.medVBand[1] !== null ? h.r(l.medVBand[1]!) : 'too few']), `Loans approved ${h.fy}; lenders among the 25 busiest with at least ${E.F.minCell} variable loans in the band. Rates at approval, prime ${h.r(6.75)} to ${h.r(7)}.`, ['l', 'r', 'r'])}
<p>The address in the file is the lender’s, not its market. ${wide.length} of the 25 busiest lent in 50 or more states and territories, among them ${wide.slice(0, 4).join(', ')}. The state pages show which lenders are busiest in each, see ${h.a('sba-loans-by-state', 'SBA loans by state')}.</p>
<h2>Using the table with a quote in hand</h2>
<p>Start with the margin, not the rate: subtract today’s prime, ${h.r(P.prime.rate)}, from the rate you were offered and compare the result with the lender’s median margin in the table. A quote well above that lender’s own median is a quote you can question with the same lender. Then compare with lenders of similar size: a bank whose median loan is ${h.m(L[0].medAmt)} prices a different business from one whose median is ${h.m([...L].sort((a, b) => b.medAmt - a.medAmt)[0].medAmt)}. Finally, check the share at the cap. A lender that prices a large share of its small loans at the cap will rarely move far below it; one that almost never does has room to negotiate. The calculator above runs this comparison for any of the 20 busiest lenders.</p>
<h2>What this table cannot tell you</h2>
<p>The file records approvals, not applications, so it says nothing about how often a lender says no. It records the rate at approval, not the fees a lender may charge within SBA’s limits. And a median hides the spread: a lender with a low median can still quote a high rate to a borrower it sees as risky. Use the figures to frame a negotiation, not to pick a lender blind. Check the rate you were offered on the ${h.a('sba-loan-rates', 'rates page')}.</p>`;
  },
});
