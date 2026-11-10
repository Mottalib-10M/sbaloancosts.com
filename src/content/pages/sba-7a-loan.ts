import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { typicalRate, EXAMPLE_AMOUNT } from '../../lib/mini-specs';
import { formatMoney, formatNumber } from '../../lib/format';

const $ = (n: number) => formatMoney(Math.round(n), 0);
const N = E.F.national;

export default definePage({
  id: 'sba-7a-loan',
  group: 'loans',
  order: 10,
  // Naive test of 2026-11-10: the home calculator repeated here (“I am going round in circles”). This page answers
  // “can my business get one?”; the payment is one link away, on the home calculator.
  tool: { kind: 'mini:qualify' },
  related: ['sba-loan-rates', 'sba-guaranty-fee', 'sba-express-loan', 'sba-504-loan'],
  sources: ['page7a', 'cfr', 'sop', 'fees7a', 'fixedRates', 'foia'],
  slug: 'sba-7a-loan',
  nav: 'SBA 7(a) loan',
  card: 'Who qualifies, amounts, terms, the SBA cap and the guaranty fee, with the payment on today’s prime.',
  title: 'SBA 7(a) Loan 2026: Requirements, Rate Caps, Fees, Payment',
  description: 'SBA 7(a) loan requirements and costs in 2026: who qualifies, up to $5 million over 10 or 25 years, rate capped at prime plus 3 to 6.5, guaranty fee and payment.',
  h1: 'SBA 7(a) loan: requirements, costs and how it is built',
  intro: `The SBA 7(a) loan is SBA’s main business loan: up to ${$(P.sevenA.maxLoan)}, made by your bank and partly guaranteed by SBA (the U.S. Small Business Administration). Choose your situation below: you see what the lender will ask of you. The seven SBA requirements follow, already open.`,
  resume: (h) => `An SBA 7(a) loan is a business loan made by a bank, credit union or licensed lender and guaranteed in part by the U.S. Small Business Administration. The loan can reach ${h.m(P.sevenA.maxLoan)}; SBA guarantees ${P.sevenA.guaranty.smallPct}% of loans up to ${h.m(P.sevenA.guaranty.smallUpTo)} and ${P.sevenA.guaranty.largePct}% above, with at most ${h.m(P.sevenA.maxGuarantyAmount)} guaranteed. Terms run up to ${P.sevenA.maturity.workingCapital} years for working capital and equipment and ${P.sevenA.maturity.realEstate} years for real estate. The lender sets the rate, but SBA’s lending rules cap it: on a variable loan, prime plus ${formatNumber(E.maxSpread(1, 'variable'), 1)} points up to ${h.m(50000)}, falling to prime plus ${formatNumber(E.maxSpread(1e6, 'variable'), 1)} above ${h.m(350000)}. With prime at ${h.r(P.prime.rate)} on ${h.date(P.prime.date)}, that is ${h.r(E.maxRate(1, 'variable'))} to ${h.r(E.maxRate(1e6, 'variable'))}. The borrower also pays a one-time guaranty fee, ${P.fees7a.tiers[0].rate}% to ${P.fees7a.tiers[2].rateOver1M}% of the guaranteed part on loans approved from ${h.date(P.fy.from)}. SBA’s loan file counts ${h.num(N.n)} 7(a) loans approved ${h.fy}, with a median of ${h.m(N.medAmt)}.`,
  faqs: (h) => [
    { q: 'How much can a business borrow with a 7(a) loan?', a: `Up to ${h.m(P.sevenA.maxLoan)} in total, counting the business and its affiliates. SBA’s share is capped at ${h.m(P.sevenA.maxGuarantyAmount)}, so on the largest loans the lender keeps more of the risk. Few loans come close to that limit: half of the loans approved ${h.fy} were for ${h.m(N.medAmt)} or less, and ${h.pc(N.smallShare)} were for ${h.m(P.sevenA.guaranty.smallUpTo)} or less.` },
    { q: 'Does a 7(a) loan need collateral?', a: `SBA’s lending rules do not let a lender decline a loan for lack of collateral alone, but it requires the lender to take what is available above set amounts, often including a lien on a home with enough equity. In SBA’s file of loans approved ${h.fy}, ${h.pc(N.collateralShare)} of 7(a) loans were recorded as secured by collateral.` },
    { q: 'What are the requirements for an SBA loan?', a: `SBA lists seven: an operating business, run for profit, located in the U.S., small under SBA’s size limits, in an eligible activity, unable to get the same credit on reasonable terms without the guarantee, and able to repay. A start-up also puts in at least ${P.sevenA.startupEquity}% of the project cost. The money can buy real estate, equipment, working capital or an existing business. The lender checks each point and decides.` },
  ],
  body: (h) => {
    const rows = P.sevenA.variableSpreads.map((s, i) => {
      const lo = i === 0 ? 0 : (P.sevenA.variableSpreads[i - 1].upTo as number) + 1;
      const amt = s.upTo ?? 1_000_000;
      return [s.upTo === null ? `over ${h.m(lo - 1)}` : `${lo ? h.m(lo) : '$0'} to ${h.m(s.upTo)}`, `prime + ${formatNumber(s.spread, 1)}`, h.r(E.maxRate(amt, 'variable')), h.r(typicalRate(amt))];
    });
    // The page's one example (brief of 2026-11-10, rule 1): the same $220,000 loan as every calculator.
    const X = EXAMPLE_AMOUNT;
    const ex = E.cost7a({ amount: X, years: 10, rate: E.maxRate(X, 'variable') });
    const exLow = E.cost7a({ amount: X, years: 10, rate: typicalRate(X) });
    return `<h2 id="requirements" data-ouvert>SBA loan requirements: who can get a 7(a) loan</h2>
<p>SBA lists seven points. The lender checks each one, not SBA, and meeting all seven is not a promise of a loan:</p>
<ol>
<li>an operating business;</li>
<li>run for profit;</li>
<li>located in the U.S.;</li>
<li>small for its industry, under SBA’s size limits;</li>
<li>not in an activity SBA excludes, such as lending, life insurance, gambling, or owning property the business does not itself use;</li>
<li>unable to get the credit it wants on reasonable terms elsewhere without SBA: the lender checks this and writes down why, such as a longer term or less collateral than a regular loan allows; it does not mean another bank must have turned you down;</li>
<li>able to repay from the business’s cash flow, with sound credit.</li>
</ol>
<p><strong>A new business or a start-up</strong> brings a business plan and cash of its own: at least ${P.sevenA.startupEquity}% of the total project cost. <strong>An existing business</strong> shows its tax returns and cash flow. <strong>To buy a business</strong>, the lender values it and asks how much of the price you pay in cash.</p>
<p><strong>In every case, each owner of 20% or more personally guarantees the loan:</strong> if the business cannot repay, the lender can ask you to, from your own assets, and it often takes a lien on a home with enough equity. Ask the lender what it will take before you sign.</p>
<h2>What SBA guarantees, and the highest rate it allows</h2>
<p>SBA does not hand out the money. Your bank lends it and SBA guarantees part of it: if the business fails to repay, SBA covers the bank for that share. That guarantee is what lets a bank lend to a business it would otherwise turn down, for longer or with less collateral. In exchange, the bank must charge no more than the SBA cap, the highest rate allowed, which gets tighter as the loan gets larger:</p>
${h.table(['Loan amount', 'Variable cap', 'Cap today', 'Typical rate today'], rows, `SBA caps from SBA’s lending rules (see Sources), prime ${h.r(P.prime.rate)} of ${h.date(P.prime.date)}. Typical = the middle of the SBA loans approved ${h.fy} (half paid less, half more), moved to today’s prime.`, ['l', 'l', 'r', 'r'])}
<p>On the ${h.m(X)} example over 10 years, the cap is ${h.r(ex.maxRate)}: ${h.m(ex.monthly)} a month. At the typical rate, ${h.r(typicalRate(X))}, it is ${h.m(exLow.monthly)} a month, ${h.m(ex.interest - exLow.interest)} less interest over the loan for the same SBA guarantee. Your own figures: the ${h.a('home', 'calculator on the home page')}; your quote against real loans: the ${h.a('sba-loan-rates', 'rates page')}.</p>
<h2>Fees the borrower pays, and one it does not</h2>
<p>The guaranty fee is the only fee SBA charges you, once, usually added to the loan: ${h.m(ex.fee.fee)} on the ${h.m(X)} example. Manufacturers, farms, listed food suppliers and rural businesses pay nothing up to ${h.m(P.fees7a.waiver.upTo)}; the ${h.a('sba-guaranty-fee', 'guaranty fee page')} has every amount. Lenders also pay SBA a yearly fee that they may not pass on to you.</p>
<p>Lenders may charge some fees of their own, such as packaging help, within SBA’s limits; ask for them in writing with the quote. A loan of 15 years or more also carries a ${h.a('sba-prepayment-penalty', 'prepayment fee')} in its first three years.</p>`;
  },
});
