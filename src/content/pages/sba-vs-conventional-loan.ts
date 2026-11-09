import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';

const N = E.F.national;

export default definePage({
  id: 'sba-vs-conventional-loan',
  group: 'costs',
  order: 70,
  tool: { kind: 'mini:compare' },
  related: ['sba-loan-rates', 'sba-guaranty-fee', 'sba-7a-loan', 'home'],
  sources: ['sop', 'fees7a', 'cfr', 'foia'],
  slug: 'sba-vs-conventional-loan',
  nav: 'SBA vs. conventional loan',
  card: 'Your two quotes side by side: monthly payment, fees, total cost and the effective rate of each.',
  title: 'SBA vs Conventional Loan: Payment, Fees and True Cost',
  description: 'SBA vs conventional business loan: type both quotes and compare the monthly payment, the guaranty and origination fees, total interest and effective rate.',
  h1: 'SBA or conventional loan: compare the two quotes on one figure',
  intro: 'A bank loan without SBA backing is often shorter and has no guaranty fee; an SBA loan runs longer. Type both offers: you see which has the lower monthly payment and which costs less in total, often not the same loan.',
  resume: (h) => `An SBA 7(a) loan and a conventional bank loan differ less in rate than in structure. The SBA loan adds a one-time guaranty fee, ${P.fees7a.tiers[0].rate}% to ${P.fees7a.tiers[2].rateOver1M}% of the guaranteed part under the ${P.fees7a.label} schedule, and it carries a rate that may not exceed SBA’s cap, ${h.r(E.maxRate(1e6, 'variable'))} to ${h.r(E.maxRate(1, 'variable'))} today on a variable loan depending on size. In return it can run ${P.sevenA.maturity.workingCapital} years for equipment and working capital and ${P.sevenA.maturity.realEstate} years for real estate, often with less cash down. A conventional loan has no SBA fee and no SBA paperwork; its term, any balloon payment and its fees are whatever the bank offers, and a shorter term is common. Because the terms differ, the monthly payment and the total interest point in opposite directions: the longer SBA loan has the lower payment and the higher total interest at the same rate. The effective rate, which spreads every fee over the life of the loan, is the fair single figure to compare.`,
  faqs: (h) => [
    { q: 'Is an SBA loan cheaper than a bank loan?', a: `Not always. SBA rates are capped but not low by rule: the median variable rate on ${h.fy} 7(a) approvals was ${h.r(N.medV!)}, and the guaranty fee comes on top. A business that qualifies for a conventional loan at a similar rate saves the fee. The SBA loan wins on term and down payment, which is why it is often the only offer a younger business gets.` },
    { q: 'Why must the lender show I cannot get credit elsewhere?', a: 'The Small Business Act limits SBA loans to borrowers who cannot get the same credit on reasonable terms without the guarantee. The lender certifies this in the file, typically because the term needed is longer, the collateral is short or the business is new. It is a test of the loan’s structure, not a sign that the borrower was turned down elsewhere.' },
    { q: 'Do both loans need a personal guarantee?', a: 'On an SBA loan, every owner of 20% or more must personally guarantee it, and if no one owns that much, at least one owner must. Conventional lenders usually ask for guarantees too, but set their own threshold. Read both term sheets for the guarantee, the collateral and any covenants before comparing rates.' },
  ],
  body: (h) => {
    const amount = 300000;
    const sbaRate = E.round2(N.medSpreadVBand[2]! + P.prime.rate);
    const rows = [[`SBA 7(a), 10 years at ${h.r(sbaRate)}`, `${P.fees7a.label} fee`], [`Same rate, 5 years`, 'no SBA fee'], [`Same rate, 5 years`, '1% origination fee']];
    const c10 = E.compare({ amount, sbaYears: 10, sbaRate, convYears: 5, convRate: sbaRate, convFeePct: 0 });
    const c1 = E.compare({ amount, sbaYears: 10, sbaRate, convYears: 5, convRate: sbaRate, convFeePct: 1 });
    const t = [
      [rows[0][0], h.m(c10.sba.fee), h.m(c10.sba.monthly), h.m(c10.sba.interest), h.r(c10.sba.apr)],
      [`Conventional, ${rows[1][0].toLowerCase()}, ${rows[1][1]}`, h.m(c10.conv.fee), h.m(c10.conv.monthly), h.m(c10.conv.interest), h.r(c10.conv.apr)],
      [`Conventional, ${rows[2][0].toLowerCase()}, ${rows[2][1]}`, h.m(c1.conv.fee), h.m(c1.conv.monthly), h.m(c1.conv.interest), h.r(c1.conv.apr)],
    ];
    return `<h2>Same rate, different shape</h2>
<p>To isolate the structure, the example below gives both loans the same rate: the ${h.fy} median margin for loans of ${E.BAND_LABELS[2]}, ${h.r(N.medSpreadVBand[2]!)} over prime, applied to today’s prime. The rate of a conventional offer is yours to type in the calculator; this site does not publish bank rates it cannot source.</p>
${h.table(['Loan of ' + h.m(amount), 'Fee', 'Monthly', 'Interest', 'Effective rate'], t, `SBA fee financed and counted in the effective rate; conventional fee paid at closing. Prime ${h.r(P.prime.rate)} of ${h.date(P.prime.date)}.`, ['l', 'r', 'r', 'r', 'r'])}
<p>The five-year loan costs ${h.m(c10.conv.monthly - c10.sba.monthly)} more a month and saves ${h.m(c10.sba.interest - c10.conv.interest)} in interest. For a business whose cash flow is tight, the monthly figure decides; for one with room to spare, the shorter loan is cheaper. The effective rate shows what the fee does: at an equal note rate the SBA loan’s is higher by the weight of the guaranty fee, so a conventional quote is cheaper overall unless its rate is higher by more than that gap.</p>
<h2>What else differs</h2>
<p>Collateral: SBA forbids declining a loan only because collateral is short, but requires the lender to take what is available, including real estate with enough equity. Prepayment: an SBA loan of 15 years or more carries the ${h.a('sba-prepayment-penalty', 'subsidy recoupment fee')} in its first three years; a conventional loan has whatever penalty the bank writes. Rate risk: ${h.pc(1 - N.fixedShare)} of SBA loans are variable, so the payment follows prime. A conventional quote also comes with the bank’s own fees, which belong in the calculator’s fee field.</p>
<p>The best check on an SBA quote is the data: see where its rate falls on the ${h.a('sba-loan-rates', 'rates page')}, and what the lender charged others on the ${h.a('sba-lenders', 'lender page')}.</p>`;
  },
});
