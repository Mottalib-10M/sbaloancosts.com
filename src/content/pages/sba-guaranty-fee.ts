import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { formatNumber } from '../../lib/format';
import { typicalRate, EXAMPLE_AMOUNT } from '../../lib/mini-specs';

const T = P.fees7a.tiers;

export default definePage({
  id: 'sba-guaranty-fee',
  group: 'costs',
  order: 30,
  tool: { kind: 'mini:fee' },
  related: ['sba-7a-loan', 'sba-express-loan', 'sba-504-loan', 'home'],
  sources: ['fees7a', 'fees7aPrev', 'sop', 'cfr'],
  slug: 'sba-guaranty-fee',
  nav: 'SBA guaranty fee',
  card: 'The one-time SBA fee by loan size, who pays nothing, and what changed on October 1, 2026.',
  title: 'SBA Guaranty Fee FY 2027: Rates, Waivers and Examples',
  description: `SBA guaranty fee for FY 2027: 2% to 3.75% of the guaranteed part by loan size, the waiver up to $700,000 for manufacturers and rural firms, worked examples.`,
  h1: 'SBA guaranty fee on loans approved from October 1, 2026',
  intro: 'SBA’s one-time fee on 7(a) loans. It is charged on the part of the loan SBA guarantees, not the whole loan, and is usually added to the loan. Manufacturers, farms, food suppliers and rural businesses may pay nothing: the last field below.',
  resume: (h) => `The SBA guaranty fee, also called the upfront fee, is a one-time charge on every 7(a) loan with a term over 12 months. For loans approved from ${h.date(P.fy.from)} to ${h.date(P.fy.to)}, SBA’s fee notice sets it at ${T[0].rate}% of the guaranteed portion for loans of ${h.m(T[0].upTo)} or less, ${T[1].rate}% for loans up to ${h.m(T[1].upTo)}, and, on larger loans, ${T[2].rate}% of the guaranteed portion up to ${h.m(1_000_000)} plus ${T[2].rateOver1M}% of the guaranteed amount above that. Because SBA guarantees ${P.sevenA.guaranty.smallPct}% or ${P.sevenA.guaranty.largePct}% of a standard loan, a ${h.m(100000)} loan pays ${h.m(E.upfrontFee({ amount: 100000 }).fee)} and a ${h.m(500000)} loan ${h.m(E.upfrontFee({ amount: 500000 }).fee)}. Manufacturers, farms and listed food suppliers, and businesses in rural areas pay nothing on loans of ${h.m(P.fees7a.waiver.upTo)} or less. Loans of 12 months or less pay ${formatNumber(P.fees7a.shortTermRate, 2)}%. The fee is usually added to the loan rather than paid in cash.`,
  faqs: (h) => [
    { q: 'Who pays the SBA guaranty fee, the bank or the borrower?', a: `The lender owes it to SBA and may pass it to the borrower, which nearly all do; it is then paid at closing or, more often, financed in the loan. On loans of ${h.m(T[0].upTo)} or less the lender may keep up to ${P.fees7a.lenderRetainSmall}% of the fee. The separate ${formatNumber(P.fees7a.annualServiceFee, 2)}% annual service fee is the lender’s alone and cannot be charged to you.` },
    { q: 'Is the guaranty fee refunded if the loan is paid off early?', a: 'No. It is a one-time charge for SBA’s guarantee at approval and is not prorated. Paying early stops the interest, and on loans of 15 years or more it may trigger SBA’s prepayment fee in the first three years, but the guaranty fee stays paid.' },
    { q: 'Do veterans pay the SBA fee?', a: `Not on SBA Express loans: the fee notice for loans approved from ${h.date(P.fy.from)} keeps the fee at zero for Express loans to businesses owned by veterans and certain spouses. On standard 7(a) loans, veterans pay the same schedule as everyone else unless another relief applies, such as the manufacturer or rural waiver.` },
  ],
  body: (h) => {
    const amts = [50000, 150000, 250000, 500000, 700000, 1_000_000, 2_000_000, 5_000_000];
    const rows = amts.map((a) => {
      const f = E.upfrontFee({ amount: a });
      const pv = E.upfrontFee({ amount: a, waiver: true, schedule: 'previous' });
      const w = E.upfrontFee({ amount: a, waiver: true });
      return [h.m(a), h.m(f.guaranteed), h.m(f.fee), `${formatNumber((f.fee / a) * 100, 2)}%`, w.waived ? '$0' : h.m(w.fee), pv.waived ? '$0' : h.m(pv.fee)];
    });
    const jump = E.upfrontFee({ amount: 150001 }).fee - E.upfrontFee({ amount: 150000 }).fee;
    const j7 = E.upfrontFee({ amount: 700001 }).fee - E.upfrontFee({ amount: 700000 }).fee;
    // The page's one example (brief of 2026-11-10, rule 1): the $220,000 loan at the typical rate, as on the home page.
    const X = EXAMPLE_AMOUNT;
    const fx = E.cost7a({ amount: X, years: 10, rate: typicalRate(X) });
    const apr = E.effectiveRate(X, fx.monthly, fx.months);
    return `<h2>The SBA guaranty fee on real amounts</h2>
${h.table(['Loan', 'Guaranteed by SBA', 'Fee now', 'Share of the loan', 'Manufacturer, farm, food supplier or rural, now', `Manufacturer, ${h.feesPrev}`], rows, `Standard 7(a), term over 12 months. “Now”: loans approved from ${h.date(P.fy.from)}. SBA fee notices listed under Sources.`, ['r', 'r', 'r', 'r', 'r', 'r'])}
<p>Two amounts make the fee jump. One dollar over ${h.m(T[0].upTo)} adds ${h.m(jump)}, because the whole guaranteed part moves to the next rate. One dollar over ${h.m(T[1].upTo)} adds ${h.m(j7)}. Close to either line, borrowing a little less can be worth more than a quarter point of rate.</p>
<h2>Who pays no SBA fee</h2>
<p>Three kinds of business pay no fee on a 7(a) loan of ${h.m(P.fees7a.waiver.upTo)} or less approved from ${h.date(P.fy.from)}:</p>
<ul>
<li><strong>Manufacturers:</strong> factories, machine shops, metal fabricators, food processors. Your lender checks the trade code on your tax forms.</li>
<li><strong>Farms and food suppliers on SBA’s list:</strong> farming and ranching, some food wholesalers, grocery stores, refrigerated trucking and storage. Restaurants, cafés and bars are not on it.</li>
<li><strong>Rural businesses:</strong> the test is the business’s address. This site cannot run it for you: ask the lender before you sign.</li>
</ul>
<p>The relief has a cliff: one dollar over ${h.m(P.fees7a.waiver.upTo)} and the full fee is due. On SBA Express, a business owned by a veteran pays no fee, see ${h.a('sba-express-loan', 'SBA Express')}.</p>
<h2>What the fee does to the true yearly cost</h2>
<p>On the ${h.m(X)} example over 10 years at ${h.r(typicalRate(X))}, with the ${h.m(fx.fee.fee)} fee added to the loan, the payment is ${h.m(fx.monthly)}. Measured on the ${h.m(X)} the business actually receives, the true yearly cost (APR) is ${h.r(apr)}, the same figure as on the ${h.a('home', 'home calculator')}. That is ${formatNumber(apr - typicalRate(X), 2)} point above the rate on the loan contract: the fee’s weight, spread over the years.</p>`;
  },
});
