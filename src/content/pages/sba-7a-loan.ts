import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { typicalRate } from '../../lib/mini-specs';
import { formatMoney, formatNumber } from '../../lib/format';

const $ = (n: number) => formatMoney(Math.round(n), 0);
const N = E.F.national;

export default definePage({
  id: 'sba-7a-loan',
  group: 'loans',
  order: 10,
  tool: { kind: 'mini:cost', props: { title: 'Your 7(a) loan: monthly payment, SBA fee and SBA cap' } },
  related: ['sba-loan-rates', 'sba-guaranty-fee', 'sba-express-loan', 'sba-504-loan'],
  sources: ['page7a', 'cfr', 'sop', 'fees7a', 'fixedRates', 'foia'],
  slug: 'sba-7a-loan',
  nav: 'SBA 7(a) loan',
  card: 'Who qualifies, amounts, terms, the SBA cap and the guaranty fee, with the payment on today’s prime.',
  title: 'SBA 7(a) Loan 2026: Requirements, Rate Caps, Fees, Payment',
  description: 'SBA 7(a) loan requirements and costs in 2026: who qualifies, up to $5 million over 10 or 25 years, rate capped at prime plus 3 to 6.5, guaranty fee and payment.',
  h1: 'SBA 7(a) loan: requirements, costs and how it is built',
  intro: `The 7(a) is SBA’s main loan: up to ${$(P.sevenA.maxLoan)}, made by a bank and partly guaranteed by SBA. Who qualifies: the seven SBA loan requirements, open just below the calculator. Type a quote to see the fee, the SBA cap (the highest rate allowed) and the payment.`,
  resume: (h) => `An SBA 7(a) loan is a business loan made by a bank, credit union or licensed lender and guaranteed in part by the U.S. Small Business Administration. The loan can reach ${h.m(P.sevenA.maxLoan)}; SBA guarantees ${P.sevenA.guaranty.smallPct}% of loans up to ${h.m(P.sevenA.guaranty.smallUpTo)} and ${P.sevenA.guaranty.largePct}% above, with at most ${h.m(P.sevenA.maxGuarantyAmount)} guaranteed. Terms run up to ${P.sevenA.maturity.workingCapital} years for working capital and equipment and ${P.sevenA.maturity.realEstate} years for real estate. The lender sets the rate, but SBA’s lending rules cap it: on a variable loan, prime plus ${formatNumber(E.maxSpread(1, 'variable'), 1)} points up to ${h.m(50000)}, falling to prime plus ${formatNumber(E.maxSpread(1e6, 'variable'), 1)} above ${h.m(350000)}. With prime at ${h.r(P.prime.rate)} on ${h.date(P.prime.date)}, that is ${h.r(E.maxRate(1, 'variable'))} to ${h.r(E.maxRate(1e6, 'variable'))}. The borrower also pays a one-time guaranty fee, ${P.fees7a.tiers[0].rate}% to ${P.fees7a.tiers[2].rateOver1M}% of the guaranteed part on loans approved from ${h.date(P.fy.from)}. SBA’s loan file counts ${h.num(N.n)} 7(a) loans approved ${h.fy}, with a median of ${h.m(N.medAmt)}.`,
  faqs: (h) => [
    { q: 'How much can a business borrow with a 7(a) loan?', a: `Up to ${h.m(P.sevenA.maxLoan)} in total, counting the business and its affiliates. SBA’s share is capped at ${h.m(P.sevenA.maxGuarantyAmount)}, so on the largest loans the lender keeps more of the risk. Few loans come close to that limit: half of the loans approved ${h.fy} were for ${h.m(N.medAmt)} or less, and ${h.pc(N.smallShare)} were for ${h.m(P.sevenA.guaranty.smallUpTo)} or less.` },
    { q: 'Does a 7(a) loan need collateral?', a: `SBA’s lending rules do not let a lender decline a loan for lack of collateral alone, but it requires the lender to take what is available above set amounts, often including a lien on a home with enough equity. In SBA’s file of loans approved ${h.fy}, ${h.pc(N.collateralShare)} of 7(a) loans were recorded as secured by collateral.` },
    { q: 'Is a 7(a) rate fixed or variable?', a: `Either. Most are variable: only ${h.pc(N.fixedShare)} of loans approved ${h.fy} carried a fixed rate. A variable rate is prime plus a margin that stays the same for the life of the loan, so the payment moves when prime moves. Fixed rates have their own, slightly higher, caps set by SBA in 2022.` },
    { q: 'What are the requirements for an SBA loan?', a: `SBA lists seven: an operating business, run for profit, located in the U.S., small under SBA’s size standards, in an eligible activity, unable to get the same credit on reasonable terms without the guarantee, and creditworthy with a reasonable ability to repay. A start-up also puts in at least ${P.sevenA.startupEquity}% of the project cost. The lender checks each point and decides.` },
    { q: 'What can the money be used for?', a: 'Buying or building real estate, buying equipment, working capital, buying an existing business, refinancing eligible business debt and paying for leasehold improvements. The use of proceeds sets the longest term: a loan that is mostly real estate can run 25 years, while equipment and working capital usually stop at 10.' },
  ],
  body: (h) => {
    const rows = P.sevenA.variableSpreads.map((s, i) => {
      const lo = i === 0 ? 0 : (P.sevenA.variableSpreads[i - 1].upTo as number) + 1;
      const amt = s.upTo ?? 1_000_000;
      return [s.upTo === null ? `over ${h.m(lo - 1)}` : `${lo ? h.m(lo) : '$0'} to ${h.m(s.upTo)}`, `prime + ${formatNumber(s.spread, 1)}`, h.r(E.maxRate(amt, 'variable')), `prime + ${formatNumber(E.maxSpread(amt, 'fixed'), 0)}${i === 0 ? ' to 8' : ''}`, h.r(N.medVBand[i]!), h.r(typicalRate(amt))];
    });
    const ex = E.cost7a({ amount: 350000, years: 10, rate: E.maxRate(350000, 'variable') });
    const exLow = E.cost7a({ amount: 350000, years: 10, rate: typicalRate(350000) });
    return `<h2 id="requirements" data-ouvert>SBA loan requirements: who can get a 7(a) loan</h2>
<p>SBA’s 7(a) page and its list of excluded businesses, both read on November 9, 2026, say what a business must be. Each point is checked by the lender, not by SBA, and meeting all seven is not a promise of a loan:</p>
<ol>
<li>an operating business;</li>
<li>run for profit;</li>
<li>located in the U.S.;</li>
<li>small under SBA’s size standards, which depend on the industry;</li>
<li>not in an activity SBA’s rules exclude, such as lending, life insurance, gambling, or owning property the business does not itself use;</li>
<li>unable to get the credit it wants on reasonable terms from other, non-government sources;</li>
<li>creditworthy, with a reasonable ability to repay from the business’s cash flow.</li>
</ol>
<p><strong>For a new business or a start-up</strong>, the lender also wants a business plan and cash of your own: SBA’s lending rules ask for at least ${P.sevenA.startupEquity}% of the total project cost. <strong>For an existing business</strong>, it reads the tax returns and the cash flow of the last years. <strong>To buy a business</strong>, it values the business, asks how much of the price you pay in cash and whether the seller lends part of it. In every case each owner of 20% or more personally guarantees the loan. ${h.pc(N.ages.startup / N.n)} of the loans approved ${h.fy} went to businesses not yet open, and ${h.pc(N.ages.buyout / N.n)} paid for a business purchase.</p>
<h2>What part the bank lends and what part SBA guarantees</h2>
<p>SBA does not hand out the money. A lender approves the loan on its own credit judgment, and SBA guarantees part of it: if the borrower defaults, SBA repays the lender that share after the collateral is sold. That guarantee is what lets a bank lend to a business it would otherwise turn down, for a longer term or with less collateral. In exchange, the lender must follow SBA’s lending rules and charge no more than the SBA cap.</p>
<p>Most loans are decided by Preferred Lenders, banks that SBA allows to approve loans themselves without sending the file to SBA: ${h.pc(N.programs.plp / N.n)} of ${h.fy} approvals. Another ${h.pc(N.programs.express / N.n)} went through ${h.a('sba-express-loan', 'SBA Express')}, which has a smaller guaranty and a ${h.m(P.sevenA.expressMax)} cap.</p>
<h2>The highest rate SBA allows, by loan size</h2>
<p>The cap depends on the amount, and it gets tighter as the loan gets larger. Most variable loans are pegged to the prime rate in effect on the first business day of the month, ${h.r(P.prime.rate)} for November 2026. SBA’s rules also allow a few other base rates, which the loan contract would name.</p>
${h.table(['Loan amount', 'Variable cap', 'Variable cap today', 'Fixed cap', 'Typical rate at approval', 'Typical rate today'], rows, `SBA caps from SBA’s lending rules (see Sources), prime ${h.r(P.prime.rate)} of ${h.date(P.prime.date)}. Typical = median of variable-rate loans approved ${h.fy} in SBA’s public loan file, set when prime was ${h.r(6.75)} to ${h.r(7)}; “today” puts the same margin over prime on today’s prime, as on the home page.`, ['l', 'l', 'r', 'l', 'r', 'r'])}
<p>The two typical rates are what borrowers actually got, then and on today’s prime. Across all sizes, ${h.pc(N.atCapV!)} of variable loans were priced at the cap, but the share is ${h.pc(N.atCapVBand[0]!)} for loans of ${h.m(50000)} or less. Read more on the ${h.a('sba-loan-rates', 'rates page')}.</p>
<h2>What the cap is worth on a real loan</h2>
<p>Take ${h.m(350000)} over 10 years with the ${h.m(ex.fee.fee)} fee added to the balance. At the cap, ${h.r(ex.maxRate)}, the payment is ${h.m(ex.monthly)} a month and the interest ${h.m(ex.interest)}. At the typical margin for that size, on today’s prime, ${h.r(typicalRate(350000))}, it is ${h.m(exLow.monthly)} and ${h.m(exLow.interest)}: ${h.m(ex.interest - exLow.interest)} less over the life of the loan for the same SBA guarantee.</p>
<h2>Fees the borrower pays, and one it does not</h2>
<p>The guaranty fee is the only fee SBA charges the borrower. On loans approved from ${h.date(P.fy.from)} it is ${P.fees7a.tiers[0].rate}% of the guaranteed part on loans up to ${h.m(P.fees7a.tiers[0].upTo)} and ${P.fees7a.tiers[1].rate}% on loans up to ${h.m(P.fees7a.tiers[1].upTo)}; on larger loans it is ${P.fees7a.tiers[2].rate}% of the guaranteed part up to ${h.m(1_000_000)}, plus ${P.fees7a.tiers[2].rateOver1M}% of any guaranteed amount above that; manufacturers, farms and listed food suppliers, and rural businesses pay nothing up to ${h.m(P.fees7a.waiver.upTo)}. Lenders also pay SBA ${formatNumber(P.fees7a.annualServiceFee, 2)}% a year on the guaranteed balance, and the notice forbids passing it to the borrower. Details are on the ${h.a('sba-guaranty-fee', 'guaranty fee page')}.</p>
<p>Lenders may charge some fees of their own, such as packaging help, within limits set by SBA; ask for them in writing with the quote. A loan of 15 years or more also carries a ${h.a('sba-prepayment-penalty', 'prepayment fee')} in its first three years.</p>`;
  },
});
