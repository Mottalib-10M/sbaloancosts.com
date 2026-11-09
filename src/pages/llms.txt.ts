/** llms.txt (RECETTE §21): what the site is, where its figures come from, its main pages. Built from the data. */
import type { APIRoute } from 'astro';
import { PAGES } from '../lib/guides';
import { route } from '../i18n/routes';
import { SITE_URL, LAST_UPDATED } from '../data/site-config';
import { P } from '../lib/engine/params';
import * as E from '../lib/engine/sba';
import { formatMoney, formatNumber } from '../lib/format';
export const GET: APIRoute = () => {
  const m = (n: number) => formatMoney(Math.round(n), 0);
  const N = E.F.national;
  const lines = [
    '# SBA Loan Costs',
    '',
    `> Cost of SBA 7(a), Express, 504 and microloans from SBA's own rules and loan data: maximum rates by amount (SOP 50 10 8.1, 87 FR 46883) on the prime of ${P.prime.date} (${formatNumber(P.prime.rate, 2)}%), the ${P.fees7a.label} guaranty fee (notice ${P.fees7a.notice}) and 504 fees (notice ${P.fees504.notice}), and the rates actually charged on ${formatNumber(N.n, 0)} 7(a) loans approved in FY ${E.F.fy} (median ${m(N.medAmt)}, median variable rate ${formatNumber(N.medV!, 2)}%, ${Math.round(N.atCapV! * 100)}% of variable loans at the maximum), by size, state and lender, from the SBA 7(a) & 504 FOIA file as of ${E.F.asOf} (U.S. Government Works). No borrower is named. Figures read on ${LAST_UPDATED}. Published by Radif Partners: an independent site, not a lender and not affiliated with the U.S. Small Business Administration.`,
    '',
    '## Calculators and guides',
    `- [SBA loan cost calculator](${SITE_URL}${route('home', 'en')}): guaranty fee, maximum rate, payment, total cost and where your rate falls among real approvals.`,
    ...PAGES.map((p) => `- [${p.nav}](${SITE_URL}${route(p.id, 'en')}): ${p.card}`),
    '',
    '## Method',
    `- [Method and sources](${SITE_URL}${route('method', 'en')})`,
    `- [About](${SITE_URL}${route('about', 'en')})`,
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
