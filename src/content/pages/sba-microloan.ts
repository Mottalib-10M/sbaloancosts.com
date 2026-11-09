import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { formatNumber } from '../../lib/format';

const M = P.micro;

export default definePage({
  id: 'sba-microloan',
  group: 'loans',
  order: 50,
  tool: { kind: 'mini:micro' },
  related: ['sba-express-loan', 'sba-7a-loan', 'sba-loan-rates', 'home'],
  sources: ['micro', 'pageMicro', 'prime'],
  slug: 'sba-microloan',
  nav: 'SBA microloan',
  card: 'Up to $50,000 through a nonprofit lender: the legal rate ceiling worked out from today’s Treasury rate.',
  title: 'SBA Microloan 2026: Maximum Rate, Amount and Payment',
  description: 'SBA microloan in 2026: up to $50,000 over 7 years from a nonprofit intermediary, the highest rate it may charge under 13 CFR 120.707, and your payment.',
  h1: 'SBA microloan: the rate ceiling and what a small loan really costs',
  intro: `Microloans of up to ${'$50,000'} are made by nonprofit intermediaries with money SBA lends them. Their rate cap follows a formula; the calculator applies it.`,
  resume: (h) => `An SBA microloan is a loan of up to ${h.m(M.max)}, repaid within ${M.maxYears} years, made by an intermediary, usually a nonprofit community lender, that borrows the money from SBA. It can pay for working capital, materials, supplies, furniture, fixtures and equipment, but not real estate or existing debt. The rate is set by the intermediary, under a ceiling written into 13 CFR 120.707: the rate the intermediary pays SBA plus ${formatNumber(M.spreadLarge, 2)} points on loans over ${h.m(M.smallUpTo)}, or plus ${formatNumber(M.spreadSmall, 2)} points on ${h.m(M.smallUpTo)} or less. The intermediary’s own rate follows the 5-year Treasury: on a new SBA loan it is that yield rounded to the nearest eighth, less ${formatNumber(M.intermediaryLessTreasury, 2)} points. With the 5-year Treasury at ${h.r(P.treasury5y.rate)} on ${h.date(P.treasury5y.date)}, that gives ${h.r(E.intermediaryRateNow())} and a ceiling of ${h.r(E.microMaxRate(M.max, E.intermediaryRateNow()))} on a ${h.m(M.max)} microloan. Older SBA loans to the intermediary carry their own rates, so the real ceiling varies from one lender to the next.`,
  faqs: (h) => [
    { q: 'Who makes SBA microloans?', a: 'Intermediaries: mostly private nonprofit community development lenders that SBA has approved. SBA lends them the money and gives them grants to provide marketing, management and technical help to their borrowers. SBA does not review microloans for credit; the intermediary decides and services the loan. SBA’s microloan page explains how to find one near you.' },
    { q: 'Can I borrow the full $50,000 as a microloan?', a: `Only in some cases. The rule says intermediaries should generally lend no more than ${h.m(M.smallUpTo)} to a borrower, and above ${h.m(M.creditElsewhereAbove)} the borrower must show it cannot get credit elsewhere at comparable rates and has good prospects. No borrower may owe one intermediary more than ${h.m(M.max)} at a time.` },
    { q: 'Why is a microloan rate higher than a 7(a) rate?', a: `Because the rule lets the intermediary add up to ${formatNumber(M.spreadSmall, 2)} points to its own cost of money, to pay for the advice and the losses on small loans to new businesses. A 7(a) Express loan of the same size may cost less if a bank will make it; a microloan is often the option when it will not.` },
  ],
  body: (h) => {
    const inter = E.intermediaryRateNow();
    const amts = [5000, 10000, 15000, 25000, 50000];
    const rows = amts.map((a) => {
      const mx = E.microMaxRate(a, inter);
      const mo = E.payment(a, mx, M.maxYears * 12);
      return [h.m(a), h.r(mx), h.m(mo), h.m(mo * M.maxYears * 12 - a)];
    });
    const x = 25000;
    const ex = E.cost7a({ amount: x, years: 7, rate: E.maxRate(x, 'variable'), program: 'express' });
    return `<h2>The ceiling on common amounts</h2>
${h.table(['Microloan', 'Highest rate allowed', `Payment over ${M.maxYears} years`, 'Interest at that rate'], rows, `Intermediary rate ${h.r(inter)} (5-year Treasury ${h.r(P.treasury5y.rate)} of ${h.date(P.treasury5y.date)}, rounded, less ${formatNumber(M.intermediaryLessTreasury, 2)}). Your intermediary’s actual SBA rate may differ.`, ['r', 'r', 'r', 'r'])}
<p>Note the step at ${h.m(M.smallUpTo)}: a loan of ${h.m(10000)} may carry ${formatNumber(M.spreadSmall - M.spreadLarge, 2)} point more than one of ${h.m(10001)}. Specialized intermediaries, whose microloans average ${h.m(M.smallUpTo)} or less, borrow from SBA at the Treasury rate less ${formatNumber(M.specializedLessTreasury, 2)} points, so their ceiling is lower.</p>
<h2>Microloan or SBA Express?</h2>
<p>A ${h.m(x)} SBA Express loan over 7 years at today’s variable cap, ${h.r(ex.maxRate)}, costs ${h.m(ex.monthly)} a month with its ${h.m(ex.fee.fee)} guaranty fee financed. The microloan ceiling for the same amount is ${h.r(E.microMaxRate(x, inter))}, and there is no SBA guaranty fee, though the intermediary may charge its own fees and require training. The two are made by different lenders to different borrowers: a bank making an Express loan wants a credit history, while a microlender is set up for owners who do not yet have one. See ${h.a('sba-express-loan', 'SBA Express')} for the bank side.</p>
<h2>What to ask an intermediary</h2>
<p>Four questions settle the cost of a microloan. What rate does it pay SBA on the loan that funds yours, since that sets your ceiling? What rate and fees will it charge you, in writing? Is training or business advice required, and does it cost anything? And what collateral and personal guarantee does it require? The rule leaves those last points to the intermediary, which must still take into account its own rules and SBA’s on eligibility. Because the term can run to ${M.maxYears} years, a lower payment is possible on a longer term, at the price of more interest over the life of the loan.</p>
<h2>What the SBA data does not show</h2>
<p>SBA publishes its loan-level file for 7(a) and 504 loans, not for microloans, so this page cannot show what microloan borrowers actually paid. The figures above are the legal ceilings, computed from the rule and today’s Treasury rate; ask each intermediary for its rate, fees and the SBA rate it pays.</p>`;
  },
});
