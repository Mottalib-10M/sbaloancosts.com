import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { slugOf } from '../../lib/state-pages';
import { shortBank } from '../../lib/mini-specs';

const S = E.F.states;
const codes = E.STATES;
const by = (k: (s: (typeof S)[E.StateCode]) => number) => [...codes].sort((a, b) => k(S[b]) - k(S[a]));
const perCap = by((s) => s.n);

export default definePage({
  id: 'sba-loans-by-state',
  group: 'data',
  order: 100,
  tool: { kind: 'mini:state' },
  related: ['sba-lenders', 'sba-loan-rates', 'sba-504-loan', 'home'],
  sources: ['foia', 'sop', 'prime'],
  slug: 'sba-loans-by-state',
  nav: 'SBA loans by state',
  card: 'Approvals, median loan, median rate and the share of local lenders in every state and DC.',
  title: `SBA Loans by State FY ${E.F.fy}: Approvals, Median Loan and Rate`,
  description: `SBA loans by state for FY ${E.F.fy}: 7(a) approvals, median loan, median variable rate, share at the SBA maximum and local lenders in all 50 states and DC.`,
  h1: `SBA loans by state: ${E.F.fy} approvals in the 50 states and DC`,
  intro: 'Pick a state to set your rate against the loans approved there, or open its page for the lenders, trades and 504 activity behind the numbers.',
  resume: (h) => `SBA approved ${h.num(E.F.national.n)} 7(a) loans in ${h.fy}, but not evenly. ${S[perCap[0]].name} had the most, ${h.num(S[perCap[0]].n)}, ahead of ${S[perCap[1]].name} (${h.num(S[perCap[1]].n)}) and ${S[perCap[2]].name} (${h.num(S[perCap[2]].n)}); ${S[perCap[perCap.length - 1]].name} had the fewest, ${h.num(S[perCap[perCap.length - 1]].n)}. The median loan ranged from ${h.m(S[by((s) => s.medAmt)[0]].medAmt)} in ${S[by((s) => s.medAmt)[0]].name} to ${h.m(S[by((s) => -s.medAmt)[0]].medAmt)} in ${S[by((s) => -s.medAmt)[0]].name}, which matters for price because SBA’s rate cap and fee both change with the amount. Who lends differs just as much: in some states most loans come from a bank based in the state, in others nearly all come from SBA specialists elsewhere. The table counts every approval by the state of the project, from SBA’s loan-level file as of ${h.date(E.F.asOf)}, and the rates are those set at approval, when prime was ${h.r(6.75)} to ${h.r(7)}; it is ${h.r(P.prime.rate)} now.`,
  faqs: (h) => [
    { q: 'Do SBA rules differ from one state to another?', a: `No. The maximum rates, the guaranty fee and the terms are federal and the same everywhere. What differs is the market: which lenders are active, how large the loans are and how many are priced at the cap. Some states run their own loan or guarantee programs that can be combined with SBA loans; those are not covered here.` },
    { q: 'Why is the median loan so different between states?', a: `Mostly because of what is financed. Where hotels, real estate and business purchases dominate, loans are large; where the volume is small Express loans from a few big banks, the median drops toward ${h.m(50000)}. The size then drives the price, since smaller loans have higher allowed margins.` },
    { q: 'Are loans counted where the business is or where the bank is?', a: 'Where the project is. The SBA file gives the project state for each loan and, separately, the lender’s address. This page counts by project state, and the share of local lenders compares the two. A business in one state can therefore borrow from a bank headquartered across the country, and many do.' },
  ],
  body: (h) => {
    const rows = codes.map((c) => {
      const s = S[c];
      return [h.a(slugOf(c), s.name), h.num(s.n), h.m(s.medAmt), s.medV !== null ? h.r(s.medV) : 'n/a', s.atCapV !== null ? h.pc(s.atCapV) : 'n/a', h.pc(s.localLenderShare), shortBank(s.lenders[0].name)];
    });
    const hiLocal = by((s) => s.localLenderShare).slice(0, 3);
    const loLocal = by((s) => -s.localLenderShare).slice(0, 3);
    const hiCap = by((s) => s.atCapV ?? 0).slice(0, 3);
    return `<div data-sommaire>
${h.table(['State', `${h.fy} 7(a) loans`, 'Median loan', 'Median variable rate', 'Variable at the cap', 'Local lenders', 'Busiest lender'], rows, `SBA 7(a) FOIA file of ${h.date(E.F.asOf)}. Local lenders: share of loans from a lender whose address is in the state.`, ['l', 'r', 'r', 'r', 'r', 'r', 'l'])}
</div>
<h2>Three patterns in the table</h2>
<p><strong>Local banks against national lenders.</strong> ${hiLocal.map((c) => `${S[c].name} (${h.pc(S[c].localLenderShare)})`).join(', ')} keep the most SBA lending with banks based in the state. At the other end, ${loLocal.map((c) => `${S[c].name} (${h.pc(S[c].localLenderShare)})`).join(', ')} rely almost entirely on lenders from elsewhere, which usually work by phone and online.</p>
<p><strong>Loans at the ceiling.</strong> The share of variable loans priced at the SBA maximum was highest in ${hiCap.map((c) => `${S[c].name} (${h.pc(S[c].atCapV!)})`).join(', ')}, against ${h.pc(E.F.national.atCapV!)} nationwide. Their median loans were ${hiCap.map((c) => h.m(S[c].medAmt)).join(', ')}, and their busiest lenders ${hiCap.map((c) => shortBank(S[c].lenders[0].name)).join(', ')}: the cap is reached mostly on small loans, and by some lenders far more than others.</p>
<p><strong>Size.</strong> A state’s median loan sets which rate cap and fee step most of its borrowers face. Under ${h.m(150000)}, SBA guarantees ${P.sevenA.guaranty.smallPct}% and the fee is ${P.fees7a.tiers[0].rate}% of that; above, the guaranty drops to ${P.sevenA.guaranty.largePct}% and the fee rises. The calculator above shows where your own amount falls in your state.</p>
<h2>How to read a state page</h2>
<p>Each state page is written from the same file but picks its own subjects: the measures on which the state sits furthest from the other fifty come first, whether that is who lends, how large the loans are, how many start-ups or business purchases were financed, how often SBA Express was used or how much 504 lending took place. Two neighboring states can therefore read quite differently. Every page also lists the five busiest lenders with their median loan and rate, and the median rate by size band next to today’s cap, so a quote can be checked against both the local market and the legal limit. Counts are by approval date between ${h.date('2025-10-01')} and ${h.date('2026-09-30')}; rates are those set at approval.</p>
<p>The territories are counted in the national totals but have no page here: Puerto Rico, the U.S. Virgin Islands and Guam together had ${h.num(Object.values(E.F.territories).reduce((a, n) => a + n, 0))} approvals.</p>`;
  },
});
