import type { Locale } from './routes';
import { P } from '../lib/engine/params';
import { LEGAL } from '../data/site-config';
import { displayDate } from '../lib/format';
const en = {
  updatedOn: 'Fees, rates and loan data read on', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Fee notices read and loan file counted by',
  skipToContent: 'Skip to content', mainNav: 'Main navigation', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'What borrowers ask before they sign', relatedCalculators: 'Other SBA loan costs', sourcesTitle: 'Check every figure: the official sources', writtenBy: 'Figures worked out by',
  asOf: `SBA fees for loans approved from ${displayDate(P.fy.from, 'en-US')}`, lastUpdated: 'read on', footerValidated: 'Fees read on SBA notices · loans counted in SBA’s public loan file', footerBrowser: 'Every payment is worked out in your browser · nothing you type is sent · no form, no sign-up, no lender referral',
  // Testeur senior du 2026-11-08 : « qui est Radif Partners ? où est le piège ? » : la ville et le modèle, en clair.
  footerDisclaimer: `SBA Loan Costs is an independent site published by Radif Partners, ${LEGAL.city}, ${LEGAL.country}. It is free and earns nothing from lenders: no referral fee, no affiliate link. It is not a lender or a broker and is not affiliated with the U.S. Small Business Administration or with any lender named on it, and it says nothing about whether a business will be approved.`,
  footerPopular: '',
  notFound: 'This address leads nowhere. The SBA loan cost calculator, the rate table and the 51 state pages are one click away.',
  readMore: 'Show the whole paragraph here ▾', disclaimer: 'Estimates from SBA notices and the SBA loan file: a budget, not a loan offer and not financial advice. The lender’s note and SBA’s terms and conditions are what count.',
  attribution: 'Loan counts, amounts and rates: U.S. Small Business Administration, 7(a) & 504 FOIA data (U.S. Government Works), file as of September 30, 2026; calculations by Radif Partners. The SBA has not reviewed or endorsed this site.',
};
export function t(_lang: Locale) { return en; }
