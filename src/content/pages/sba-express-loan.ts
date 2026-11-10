import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { EXAMPLE_AMOUNT, shortBank } from '../../lib/mini-specs';

const N = E.F.national;
const X = P.sevenA;

export default definePage({
  id: 'sba-express-loan',
  group: 'loans',
  order: 60,
  tool: { kind: 'mini:express' },
  related: ['sba-7a-loan', 'sba-guaranty-fee', 'sba-microloan', 'sba-lenders'],
  sources: ['page7a', 'sop', 'fees7a', 'foia'],
  slug: 'sba-express-loan',
  nav: 'SBA Express loan',
  card: 'Up to $500,000 with a 50% guaranty: the fee, the rate cap, and the banks that use it most.',
  title: 'SBA Express Loan 2026: $500,000 Limit, Fee, Rate and Payment',
  description: 'SBA Express loan in 2026: up to $500,000 with a 50% SBA guaranty, the guaranty fee (none for veterans), the same rate caps as 7(a), and your payment worked out.',
  h1: 'SBA Express loan: smaller guaranty, smaller fee, same rate cap',
  intro: 'SBA Express is the fast lane of the 7(a) program. Type an amount and a rate to see the fee and the payment, and how they compare with a standard loan.',
  resume: (h) => `SBA Express is a 7(a) loan of up to ${h.m(X.expressMax)} that a lender approves on its own forms and under its own procedures, without waiting for SBA to review the file. In exchange, SBA guarantees only ${X.guaranty.expressPct}% of it, against ${X.guaranty.smallPct}% or ${X.guaranty.largePct}% on a standard 7(a) loan. That smaller guaranty lowers the guaranty fee, which is charged on the guaranteed part: for loans approved from ${h.date(P.fy.from)}, a ${h.m(100000)} Express loan pays ${h.m(E.upfrontFee({ amount: 100000, program: 'express' }).fee)}, against ${h.m(E.upfrontFee({ amount: 100000 }).fee)} as a standard loan. Businesses owned by a veteran or a veteran’s spouse pay no fee at all. The SBA cap is the same as for every 7(a) loan, prime plus ${E.maxSpread(1, 'variable')} points at most on the smallest amounts. Express is the most used route for small loans: ${h.pc(N.programs.express / N.n)} of the ${h.num(N.n)} 7(a) loans approved ${h.fy} went through it.`,
  faqs: (h) => [
    { q: 'Is an SBA Express loan faster than a standard 7(a)?', a: 'Usually, because the lender makes the credit decision itself under delegated authority and may use its own application and loan documents, so SBA does not review the credit before approval. The real time depends on the lender’s own process and on how quickly you supply financial statements and tax returns.' },
    { q: 'Can SBA Express be a line of credit?', a: `Yes. Express can be a term loan or a revolving line of credit, within the ${h.m(X.expressMax)} limit, which counts every Express loan the business and its affiliates still owe. SBA’s lending rules set separate maturity rules for Express lines, and the lender may renew a line with a new Express loan before amortizing payments begin.` },
    { q: 'Why do some banks make mostly Express loans?', a: `Because the decision stays in house. Among the busiest SBA lenders (loans approved ${h.fy}), ${N.lenders.filter((l) => l.expressShare >= 0.9).slice(0, 4).map((l) => `${shortBank(l.name)} (${h.pc(l.expressShare)})`).join(', ')} made nine in ten or more of their 7(a) loans through Express, mostly small ones.` },
  ],
  body: (h) => {
    const amts = [25000, 50000, 150000, 250000, 350000, 500000];
    const rows = amts.map((a) => [h.m(a), h.m(E.upfrontFee({ amount: a, program: 'express' }).fee), h.m(E.upfrontFee({ amount: a }).fee), h.r(E.maxRate(a, 'variable'))]);
    const big = N.lenders.filter((l) => l.expressShare >= 0.75).slice(0, 6);
    const lrows = big.map((l) => [shortBank(l.name), h.num(l.n), h.pc(l.expressShare), h.m(l.medAmt), l.medV !== null ? h.r(l.medV) : 'n/a']);
    return `<h2>Fee: Express against standard</h2>
${h.table(['Loan', 'Express fee', 'Standard 7(a) fee', 'Variable cap today'], rows, `Fees for loans approved from ${h.date(P.fy.from)}; prime ${h.r(P.prime.rate)} of ${h.date(P.prime.date)}.`, ['r', 'r', 'r', 'r'])}
<p>The fee gap grows with the amount, because the guaranteed part of an Express loan is half the loan while a standard loan above ${h.m(X.guaranty.smallUpTo)} is three quarters guaranteed. For the lender the trade is the reverse: half of every Express loan stays at its own risk, against a quarter or less on a standard loan.</p>
<h2>Who lends through Express</h2>
<p>A handful of large banks carry most of the Express volume, with a median loan near ${h.m(50000)}. Their median rates were set when prime was ${h.r(6.75)} to ${h.r(7)}.</p>
${h.table(['Lender', `7(a) loans, ${h.fy}`, 'Through Express', 'Median loan', 'Typical variable rate'], lrows, `SBA’s public loan file of ${h.date(E.F.asOf)}. Lenders among the 25 busiest with at least three quarters of their loans through Express.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The rate depends on the lender far more than on the program. On small loans, where the cap is highest, some Express lenders priced most of their loans at the cap and others well below it; the ${h.a('sba-lenders', 'lender page')} lists the share at the cap for each. When does Express cost less than a standard loan? Only through the fee, since the rate cap is the same: on the ${h.m(EXAMPLE_AMOUNT)} example the Express fee is ${h.m(E.upfrontFee({ amount: EXAMPLE_AMOUNT, program: 'express' }).fee)} against ${h.m(E.upfrontFee({ amount: EXAMPLE_AMOUNT }).fee)}. The rate the lender quotes usually matters more. A standard loan at a margin half a point lower saves more than that gap over 10 years on any amount above a few tens of thousands of dollars, so compare the two quotes on the true yearly cost, not on the program name.</p>
<h2>What the lender decides on its own</h2>
<p>Under Express the lender uses its own application, credit memo, note and collateral documents, and SBA does not review the credit before the guaranty is issued. That is why the same bank may approve an Express loan in days and a standard 7(a) loan in weeks. It also means the lender’s own policy, not SBA’s, sets most of the paperwork you are asked for. SBA’s lending rules still apply on eligibility, use of proceeds, the SBA cap and the fees, and an Express loan used to buy a business must meet SBA’s rules for a change of ownership.</p>
<p>Express is also not the only small-loan route: a ${h.a('sba-microloan', 'microloan')} reaches owners a bank will not lend to, and the ${h.a('sba-7a-loan', 'standard 7(a)')} goes up to ${h.m(X.maxLoan)}.</p>`;
  },
});
