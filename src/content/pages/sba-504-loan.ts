import { definePage } from '../../lib/guide-types';
import { P } from '../../lib/engine/params';
import * as E from '../../lib/engine/sba';
import { formatNumber } from '../../lib/format';

const F5 = P.fees504;
const N5 = E.F.national.f504!;

export default definePage({
  id: 'sba-504-loan',
  group: 'loans',
  order: 40,
  tool: { kind: 'mini:cost504' },
  related: ['sba-7a-loan', 'sba-guaranty-fee', 'sba-loans-by-state', 'sba-prepayment-penalty'],
  sources: ['page504', 'fees504', 'sop', 'foia'],
  slug: 'sba-504-loan',
  nav: 'SBA 504 loan',
  card: 'The bank, CDC and owner split, every 504 fee, and the payment on a building.',
  title: 'SBA 504 Loan FY 2027: Fees, Down Payment and Payment',
  description: `SBA 504 loan for FY 2027: 10% to 20% down, the CDC debenture and its fees (0.5% SBA, 0.203% a year, processing, funding), worked out on your building.`,
  h1: 'SBA 504 loan for a building: the three parts and every fee',
  intro: 'A 504 loan finances a building or long-lived equipment in three parts: a bank loan, a loan from a certified development company (CDC, a nonprofit lender approved by SBA), and your own cash. Type the project cost to see each part, the fees and the payments.',
  resume: (h) => `An SBA 504 loan pays for owner-occupied real estate and heavy equipment in three parts. A bank or other private lender funds about ${F5.structure.bank}% of the project with a first mortgage; a certified development company (CDC) funds up to ${F5.structure.cdc}% with a loan backed by SBA and sold to investors as a bond, called a debenture; and the business puts in ${F5.structure.borrower}%, or ${F5.structure.borrowerNew}% for a business under two years old or a single-use (special-purpose) building such as a hotel, and ${F5.structure.borrowerNewSpecial}% when both apply. The CDC loan runs ${F5.terms.join(', ')} years at a fixed rate set when it is sold. Its fees are financed in it: for loans approved from ${h.date(P.fy.from)}, SBA charges ${formatNumber(F5.upfront, 2)}% up front and ${formatNumber(F5.annual, 3)}% a year, the CDC up to ${formatNumber(F5.processingMax, 1)}% for processing and at least ${formatNumber(F5.cdcServicingMin, 3)}% a year for servicing, plus funding, underwriting and closing costs. SBA’s loan file counts ${h.num(N5.n)} 504 loans approved ${h.fy}, for ${h.mil(N5.total)}, with a median CDC loan of ${h.m(N5.medAmt)}.`,
  faqs: (h) => [
    { q: 'What is the interest rate on an SBA 504 loan?', a: 'The CDC loan rate is fixed for the life of the loan and set when SBA sells the month’s CDC loans to investors, based on the market for long-term government debt: the 10-year Treasury is the usual benchmark for 20- and 25-year loans. The yearly fees come on top. Your CDC gives you the rate of the month your loan funds. The SBA loan file does not publish 504 rates, so this site does not show a median for them.' },
    { q: 'Is the 504 down payment really only 10%?', a: `For an existing business buying a general-purpose building, yes: ${F5.structure.borrower}% of the project. It rises to ${F5.structure.borrowerNew}% if the business is under two years old or the building has a single use, such as a hotel or a car wash, and to ${F5.structure.borrowerNewSpecial}% when both apply. The bank may ask for more on its own part.` },
    { q: 'Can a 504 loan pay for working capital?', a: 'No. The 504 funds fixed assets: land, buildings, construction, renovation and machinery with a useful life of at least ten years, plus some soft costs of the project. Working capital and inventory belong to the 7(a) program, which can be paired with a 504 loan when a project needs both. Refinancing existing debt is possible under the 504 with or without expansion, on conditions set in SBA’s lending rules.' },
  ],
  body: (h) => {
    // Same project as the calculator above (naive test of 2026-11-10: $1,500,000 there, $2,000,000 here).
    const PROJECT = 1_500_000;
    const ex = E.cost504({ project: PROJECT, debentureRate: P.prime.rate, bankRate: P.prime.rate + 1.5 });
    const rows: Array<[string, string, string]> = [
      ['SBA upfront guaranty fee', `${formatNumber(F5.upfront, 2)}% of the CDC loan before fees`, h.m(ex.fees.sba)],
      ['Funding fee', `${formatNumber(F5.funding, 2)}% of the CDC loan before fees`, h.m(ex.fees.funding)],
      ['CDC processing fee', `up to ${formatNumber(F5.processingMax, 1)}%`, h.m(ex.fees.processing)],
      ['Closing costs', `up to ${h.m(F5.closingFinancedMax)} financed`, h.m(2500)],
      ['Bond sale (underwriters’) fee, plus rounding up to the next $1,000', `${formatNumber(F5.underwriter20_25, 2)}% (20 and 25 years), ${formatNumber(F5.underwriter10, 3)}% (10 years) of the CDC loan with fees`, h.m(ex.fees.underwriter)],
      ['SBA annual fee', `${formatNumber(F5.annual, 3)}% a year (${formatNumber(F5.annualRefiNoExpansion, 3)}% for refinancing without expansion)`, 'in each payment'],
      ['CDC servicing fee', `at least ${formatNumber(F5.cdcServicingMin, 3)}% a year`, 'in each payment'],
    ];
    return `<h2>The fees, on the same ${h.m(PROJECT)} building</h2>
<p>The CDC loan before fees is ${F5.structure.cdc}% of the project, ${h.m(ex.net)} here. The fees below are added to it, and the total is rounded up to the next thousand, which gives a CDC loan with fees of ${h.m(ex.gross)}: ${h.m(ex.gross - ex.net)} of fees financed over the life of the loan, the sum of the amounts below.</p>
${h.table(['Fee', 'Rule now', 'On this project'], rows, `SBA’s 504 fee notice and lending rules, listed under Sources. Closing costs set at ${h.m(2500)} for the example.`, ['l', 'l', 'r'])}
<p>Since ${h.date(P.fy.from)}, the SBA upfront fee and the annual fee are waived for manufacturers, farms and listed food suppliers, and businesses in a rural area, with no limit on the amount, unlike the 7(a) relief. The yearly fees are charged on what you still owe and paid with each installment, so they act like a higher rate.</p>
<h2>How big 504 loans are</h2>
<p>The 504 is a large-ticket program: the median CDC loan approved ${h.fy} was ${h.m(N5.medAmt)}, against ${h.m(E.F.national.medAmt)} for a 7(a) loan, and ${h.pc(N5.term25Share)} of CDC loans ran 25 years. The largest CDC loan allowed is ${h.m(F5.maxDebenture)}, or ${h.m(F5.maxDebentureManufacturing)} for manufacturers and certain energy projects; the bank’s first mortgage has no SBA cap. The ${h.a('sba-loans-by-state', 'state pages')} show where 504 lending is concentrated.</p>
<h2>504 or 7(a) for a building?</h2>
<p>The 504 asks for less cash up front than most bank loans and fixes the rate on its share for up to 25 years. A 7(a) real estate loan can be used when the project also needs working capital, closes with one lender and usually carries a variable rate. On a building alone, compare the blended rate of the two 504 parts, fees included, with the 7(a) quote and its ${h.a('sba-guaranty-fee', 'guaranty fee')}. Ask the CDC for its loan’s prepayment terms before signing, since a fixed-rate CDC loan is not repaid early for free.</p>`;
  },
});
