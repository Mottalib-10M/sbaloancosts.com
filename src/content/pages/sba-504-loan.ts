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
  card: 'The bank, CDC and owner split, every FY 2027 debenture fee, and the payment on a building.',
  title: `SBA 504 Loan ${P.fees504.label}: Fees, Down Payment and Payment`,
  description: `SBA 504 loan for ${P.fees504.label}: 10% to 20% down, the CDC debenture and its fees (0.5% SBA, 0.203% a year, processing, funding), worked out on your building.`,
  h1: 'SBA 504 loan: the three-part split and every fee on the CDC loan',
  intro: 'A 504 loan finances a building or long-lived equipment in three parts: a bank loan, a loan from a certified development company (CDC, a nonprofit lender approved by SBA) called the debenture, and your own cash. Type the project cost to see each part, the fees and the payments.',
  resume: (h) => `An SBA 504 loan pays for owner-occupied real estate and heavy equipment through three lenders at once. A bank or other private lender funds about ${F5.structure.bank}% of the project with a first mortgage; a certified development company (CDC) funds up to ${F5.structure.cdc}% with a debenture guaranteed by SBA and sold to investors; and the business puts in ${F5.structure.borrower}%, or ${F5.structure.borrowerNew}% for a business under two years old or a special-purpose building, and ${F5.structure.borrowerNewSpecial}% when both apply. The debenture runs ${F5.terms.join(', ')} years at a fixed rate set when it is sold. Its fees are financed in it: under ${F5.label}, SBA charges ${formatNumber(F5.upfront, 2)}% up front and ${formatNumber(F5.annual, 3)}% a year, the CDC up to ${formatNumber(F5.processingMax, 1)}% for processing and at least ${formatNumber(F5.cdcServicingMin, 3)}% a year for servicing, plus funding, underwriting and closing costs. In ${h.fy}, ${h.num(N5.n)} 504 loans were approved for ${h.mil(N5.total)}, with a median debenture of ${h.m(N5.medAmt)}.`,
  faqs: (h) => [
    { q: 'What is the interest rate on an SBA 504 loan?', a: 'The debenture rate is fixed for the life of the loan and set when SBA’s debentures are sold, based on the market for long-term government debt: the 10-year Treasury is the usual benchmark for 20- and 25-year debentures. The yearly fees come on top. Your CDC gives you the rate of the month your loan funds. The SBA loan file does not publish 504 rates, so this site does not show a median for them.' },
    { q: 'Is the 504 down payment really only 10%?', a: `For an existing business buying a general-purpose building, yes: ${F5.structure.borrower}% of the project. It rises to ${F5.structure.borrowerNew}% if the business is under two years old or the property is special-purpose, such as a hotel or a car wash, and to ${F5.structure.borrowerNewSpecial}% when both apply. The bank may ask for more on its own part.` },
    { q: 'Can a 504 loan pay for working capital?', a: 'No. The 504 funds fixed assets: land, buildings, construction, renovation and machinery with a useful life of at least ten years, plus some soft costs of the project. Working capital and inventory belong to the 7(a) program, which can be paired with a 504 loan when a project needs both. Refinancing existing debt is possible under the 504 with or without expansion, on conditions set in SBA’s lending rules.' },
    { q: 'Who are the busiest 504 lenders?', a: `Certified development companies, nonprofit corporations that SBA certifies to serve a given area. In ${h.fy} the most active nationwide were ${N5.cdcs.map((c) => `${c.name} (${h.num(c.n)} loans)`).join(', ')}. The state pages list the busiest CDCs in each state.` },
  ],
  body: (h) => {
    const ex = E.cost504({ project: 2_000_000, debentureRate: P.prime.rate, bankRate: P.prime.rate + 1.5 });
    const rows: Array<[string, string, string]> = [
      ['SBA upfront guaranty fee', `${formatNumber(F5.upfront, 2)}% of the net debenture`, h.m(ex.fees.sba)],
      ['Funding fee', `${formatNumber(F5.funding, 2)}% of the net debenture`, h.m(ex.fees.funding)],
      ['CDC processing fee', `up to ${formatNumber(F5.processingMax, 1)}%`, h.m(ex.fees.processing)],
      ['Closing costs', `up to ${h.m(F5.closingFinancedMax)} financed`, h.m(2500)],
      ['Underwriters’ fee, and rounding up to the thousand', `${formatNumber(F5.underwriter20_25, 2)}% (20 and 25 years), ${formatNumber(F5.underwriter10, 3)}% (10 years) of the gross debenture`, h.m(ex.fees.underwriter)],
      ['SBA annual fee', `${formatNumber(F5.annual, 3)}% a year (${formatNumber(F5.annualRefiNoExpansion, 3)}% for refinancing without expansion)`, 'in each payment'],
      ['CDC servicing fee', `at least ${formatNumber(F5.cdcServicingMin, 3)}% a year`, 'in each payment'],
    ];
    return `<h2>The fees, on a ${h.m(2_000_000)} building</h2>
<p>The net debenture is ${F5.structure.cdc}% of the project, ${h.m(ex.net)} here. The fees below are added to it, and the total is rounded up to the next thousand, which gives a gross debenture of ${h.m(ex.gross)}: ${h.m(ex.gross - ex.net)} of fees financed over the life of the loan, the sum of the amounts below.</p>
${h.table(['Fee', `${F5.label} rule`, 'On this project'], rows, `SBA Information Notice ${F5.notice} and SOP 50 10 8.1. Closing costs set at ${h.m(2500)} for the example.`, ['l', 'l', 'r'])}
<p>The SBA upfront fee and the annual fee are waived under ${F5.label} for ${F5.waived}, with no ceiling on the amount, unlike the 7(a) relief. The yearly fees, ${formatNumber(ex.annualFeePct, 3)}% here, are charged on the outstanding balance and paid with each installment, so they act like a higher rate.</p>
<h2>How big 504 loans are</h2>
<p>The 504 is a large-ticket program: the median debenture in ${h.fy} was ${h.m(N5.medAmt)}, against ${h.m(E.F.national.medAmt)} for a 7(a) loan, and ${h.pc(N5.term25Share)} of debentures ran 25 years. The maximum debenture is ${h.m(F5.maxDebenture)}, or ${h.m(F5.maxDebentureManufacturing)} for manufacturers and certain energy projects; the bank’s first mortgage has no SBA ceiling. The ${h.a('sba-loans-by-state', 'state pages')} show where 504 lending is concentrated.</p>
<h2>504 or 7(a) for a building?</h2>
<p>The 504 asks for less cash up front than most bank loans and fixes the rate on its share for up to 25 years. A 7(a) real estate loan can be used when the project also needs working capital, closes with one lender and usually carries a variable rate. On a building alone, compare the blended rate of the two 504 parts, fees included, with the 7(a) quote and its ${h.a('sba-guaranty-fee', 'guaranty fee')}. Ask the CDC for the debenture’s prepayment terms before signing, since a fixed-rate debenture is not repaid early for free.</p>`;
  },
});
