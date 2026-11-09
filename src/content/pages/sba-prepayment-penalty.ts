import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';

const R = P.sevenA.recoupment;
const N = E.F.national;

export default definePage({
  id: 'sba-prepayment-penalty',
  group: 'costs',
  order: 80,
  tool: { kind: 'mini:prepay' },
  related: ['sba-7a-loan', 'sba-504-loan', 'sba-vs-conventional-loan', 'home'],
  sources: ['cfr', 'sop'],
  slug: 'sba-prepayment-penalty',
  nav: 'SBA prepayment penalty',
  card: 'The 5%, 3% and 1% subsidy recoupment fee: when it applies, when it does not, and how much.',
  title: 'SBA Prepayment Penalty: the 5-3-1 Recoupment Fee Calculator',
  description: 'SBA prepayment penalty on 7(a) loans of 15 years or more: 5%, 3% or 1% of prepayments above 25% in the first three years, with the exact rule and a calculator.',
  h1: 'SBA prepayment penalty: when the 5-3-1 fee applies and how much it is',
  intro: 'SBA charges a fee on large early repayments of long 7(a) loans, and only in the first three years. Type your loan and the amount you plan to repay.',
  resume: (h) => `SBA’s prepayment penalty on 7(a) loans is called the subsidy recoupment fee, and it is set by SBA’s loan regulations. It applies only when three conditions are all met: the loan has a maturity of ${R.minTermYears} years or more; the borrower repays principal ahead of schedule during one of the first three 12-month periods after the first disbursement; and the prepayments in that period exceed ${R.thresholdPct}% of the highest principal balance in it. The fee is then ${R.byYear[0]}% of all prepayments made in the first year, ${R.byYear[1]}% in the second and ${R.byYear[2]}% in the third. From the fourth year there is no SBA fee. Loans shorter than ${R.minTermYears} years, the usual case for equipment and working capital, never pay it. Repaying ${h.m(400000)} in the second year on a ${h.m(1_000_000)}, 25-year loan costs ${h.m(E.recoupmentFee(1_000_000, 25, 2, 400000).fee)}; repaying ${h.m(250000)} costs nothing, because it stays within ${R.thresholdPct}%. Selling the business or refinancing in those years counts as a prepayment.`,
  faqs: (h) => [
    { q: 'Does the SBA prepayment fee apply to a 10-year loan?', a: `No. The subsidy recoupment fee applies only to loans with a maturity of ${R.minTermYears} years or more, which in practice means loans that are mostly real estate. In ${h.fy}, ${h.pc(N.longTermShare)} of 7(a) loans had a term of ${R.minTermYears} years or longer; the other loans can be repaid early without any SBA fee.` },
    { q: 'Can the lender add its own prepayment penalty?', a: 'No. SBA’s lending rules list prepayment fees among the charges a 7(a) lender may not make, together with origination, commitment and renewal fees. The subsidy recoupment fee is SBA’s, collected by the lender on SBA’s behalf. If a 7(a) note or term sheet shows a separate prepayment penalty from the lender, ask about it before signing.' },
    { q: 'How do I avoid the SBA prepayment fee?', a: `Keep each year’s extra principal payments within ${R.thresholdPct}% of the highest balance of that 12-month period, or wait until the fourth year. The periods run from the first disbursement, not from the approval or the calendar year. If a sale or refinance must close in year three, the fee falls to ${R.byYear[2]}%, which may be smaller than the interest saved.` },
  ],
  body: (h) => {
    const loan = 1_000_000;
    const rows = [100000, 250000, 300000, 500000, 1_000_000].flatMap((paid) => [[h.m(paid), ...[1, 2, 3, 4].map((y) => h.m(E.recoupmentFee(loan, 25, y, paid).fee))]]);
    return `<h2>The fee on a ${h.m(loan)}, 25-year loan</h2>
${h.table(['Prepaid in the period', 'Year 1', 'Year 2', 'Year 3', 'Year 4+'], rows, `SBA loan regulations (see Sources). Threshold: ${R.thresholdPct}% of the highest principal balance in the period, about ${h.m(loan * R.thresholdPct / 100)} here.`, ['r', 'r', 'r', 'r', 'r'])}
<p>The rule has a cliff. Once the total for the period exceeds the threshold, the fee is charged on everything prepaid in that period, not only on the part above ${R.thresholdPct}%: ${h.m(250000)} costs nothing in year one, ${h.m(300000)} costs ${h.m(E.recoupmentFee(loan, 25, 1, 300000).fee)}.</p>
<h2>Who it actually concerns</h2>
<p>Most SBA borrowers are outside the rule. The median term of 7(a) loans approved ${h.fy} was ${h.num(N.medTermMonths / 12)} years, and only ${h.pc(N.longTermShare)} of loans ran ${R.minTermYears} years or more. Those are the building loans, where an early sale, a refinance into a ${h.a('sba-504-loan', '504 loan')} or a conventional mortgage, or a large cash windfall can trigger the fee. The 504 debenture has prepayment terms of its own, set in the debenture and not by this rule.</p>
<p>Two details catch borrowers. A loan made for less than ${R.minTermYears} years becomes subject to the fee if its maturity is extended to ${R.minTermYears} years or more within the first 36 months, and prepayments made before the extension count. And SBA does not treat a prepayment caused by the death of the borrower as voluntary, so no fee is due in that case.</p>
<p>A variable-rate loan that may be repaid early is a reason to keep the term under ${R.minTermYears} years when the use of proceeds allows it. A loan that is mostly real estate needs the long term to keep payments affordable, so the fee is usually the price of that choice; plan any sale or refinance for the fourth year where you can.</p>
<p>Before refinancing in the first three years, set the fee against what the new loan saves. A borrower moving ${h.m(800000)} to a loan one point cheaper saves about ${h.m(8000)} of interest a year; at ${R.byYear[1]}% in year two the SBA fee is ${h.m(E.recoupmentFee(loan, 25, 2, 800000).fee)}, recovered in three years. The ${h.a('sba-vs-conventional-loan', 'comparison calculator')} helps with the rest of that decision.</p>`;
  },
});
