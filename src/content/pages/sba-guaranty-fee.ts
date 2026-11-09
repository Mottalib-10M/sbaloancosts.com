import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { formatNumber } from '../../lib/format';

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
  h1: 'SBA guaranty fee on loans approved from October 1, 2026, worked out on your loan',
  intro: 'SBA’s one-time fee on 7(a) loans. It is charged on the part of the loan SBA guarantees, not the whole loan, and is usually added to the loan. Manufacturers, farms, food suppliers and rural businesses may pay nothing: the last field below.',
  resume: (h) => `The SBA guaranty fee, also called the upfront fee, is a one-time charge on every 7(a) loan with a term over 12 months. For loans approved from ${h.date(P.fy.from)} to ${h.date(P.fy.to)}, SBA’s fee notice sets it at ${T[0].rate}% of the guaranteed portion for loans of ${h.m(T[0].upTo)} or less, ${T[1].rate}% for loans up to ${h.m(T[1].upTo)}, and, on larger loans, ${T[2].rate}% of the guaranteed portion up to ${h.m(1_000_000)} plus ${T[2].rateOver1M}% of the guaranteed amount above that. Because SBA guarantees ${P.sevenA.guaranty.smallPct}% or ${P.sevenA.guaranty.largePct}% of a standard loan, a ${h.m(100000)} loan pays ${h.m(E.upfrontFee({ amount: 100000 }).fee)} and a ${h.m(500000)} loan ${h.m(E.upfrontFee({ amount: 500000 }).fee)}. Manufacturers, farms and listed food suppliers, and businesses in rural areas pay nothing on loans of ${h.m(P.fees7a.waiver.upTo)} or less. Loans of 12 months or less pay ${formatNumber(P.fees7a.shortTermRate, 2)}%. The fee is usually added to the loan rather than paid in cash.`,
  faqs: (h) => [
    { q: 'Who pays the SBA guaranty fee, the bank or the borrower?', a: `The lender owes it to SBA and may pass it to the borrower, which nearly all do; it is then paid at closing or, more often, financed in the loan. On loans of ${h.m(T[0].upTo)} or less the lender may keep up to ${P.fees7a.lenderRetainSmall}% of the fee. The separate ${formatNumber(P.fees7a.annualServiceFee, 2)}% annual service fee is the lender’s alone and cannot be charged to you.` },
    { q: 'Do two loans taken close together pay a higher fee?', a: `They can. When two or more 7(a) loans are approved for the same business and its affiliates within 90 days of each other, SBA treats them as one loan to set the guaranty percentage and the fee. Splitting ${h.m(300000)} into two loans of ${h.m(150000)} does not keep the ${T[0].rate}% rate.` },
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
    const fx = E.cost7a({ amount: 500000, years: 10, rate: E.maxRate(500000, 'variable') });
    return `<h2>The schedule on real amounts</h2>
${h.table(['Loan', 'Guaranteed', 'Fee now', 'Share of the loan', 'Manufacturer, farm, food supplier or rural, now', `Manufacturer, ${h.feesPrev}`], rows, `Standard 7(a), term over 12 months. “Now”: loans approved from ${h.date(P.fy.from)}. SBA fee notices listed under Sources.`, ['r', 'r', 'r', 'r', 'r', 'r'])}
<h2>Two cliffs worth knowing</h2>
<p>Up to ${h.m(T[1].upTo)} the fee is not graduated like an income tax: the whole guaranteed amount takes the rate of its band. Only on loans above ${h.m(T[1].upTo)} does part of it, the guaranteed amount above ${h.m(1_000_000)}, pay a second rate, ${T[2].rateOver1M}%. Going from ${h.m(150000)} to ${h.m(150001)} drops the guaranty from ${P.sevenA.guaranty.smallPct}% to ${P.sevenA.guaranty.largePct}% but raises the rate from ${T[0].rate}% to ${T[1].rate}%, adding ${h.m(jump)} to the fee for one extra dollar. Crossing ${h.m(T[1].upTo)} adds ${h.m(j7)}. If a project is close to either line, borrowing a little less, or putting in a little more cash, can be worth more than a quarter point of rate.</p>
<p>The relief has a cliff too. Up to ${h.m(P.fees7a.waiver.upTo)} a qualifying business pays nothing; one dollar more and it pays the full fee on the whole guaranteed amount. For loans approved ${h.feesPrev}, manufacturers had relief up to ${h.m(P.fees7aPrev.waiver.upTo)}, so a manufacturer borrowing ${h.m(900000)} now pays ${h.m(E.upfrontFee({ amount: 900000, waiver: true }).fee)} where it paid nothing a year earlier.</p>
<h2>Who qualifies for the zero fee</h2>
<p>Three kinds of business pay no fee on a 7(a) loan of ${h.m(P.fees7a.waiver.upTo)} or less approved from ${h.date(P.fy.from)}. Manufacturers: businesses whose industry code (the NAICS code, North American Industry Classification System, on their tax and loan forms) starts with 31, 32 or 33; machine shops, metal fabricators and food processors are among them. The food supply chain: the list in the notice covers farming and ranching codes, a few wholesale codes, grocery stores, refrigerated and farm-product trucking and refrigerated warehousing; restaurants, cafés and bars are not on it. Rural businesses: the test is the address of the business, under SBA’s own definition of a rural area, and this site cannot run it for you. Ask the lender to check your address before you sign, since on a ${h.m(500000)} loan the answer is worth ${h.m(E.upfrontFee({ amount: 500000 }).fee)}. For SBA Express, a business owned by a veteran pays no fee at any amount up to the Express limit, see ${h.a('sba-express-loan', 'SBA Express')}.</p>
<h2>What the fee does to the true yearly cost</h2>
<p>Take ${h.m(500000)} over 10 years at ${h.r(E.maxRate(500000, 'variable'))}, the SBA cap today for that size. With the ${h.m(fx.fee.fee)} fee financed, the payment is ${h.m(fx.monthly)}; measured on the ${h.m(500000)} the business actually receives, that is a true yearly cost of ${h.r(E.effectiveRate(500000, fx.monthly, fx.months))}, ${formatNumber(E.effectiveRate(500000, fx.monthly, fx.months) - E.maxRate(500000, 'variable'), 2)} point above the rate on the loan contract. The ${h.a('home', 'calculator on the home page')} shows that true yearly cost for any quote, so two offers with different fees can be compared on one figure.</p>`;
  },
});
