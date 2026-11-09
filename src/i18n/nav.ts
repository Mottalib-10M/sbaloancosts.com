import { route, type Locale } from './routes';
import { PAGES, pageById } from '../lib/guides';
import type { Group } from '../lib/guide-types';
export interface NavLink { href: string; label: string } export interface NavCategory { label: string; links: NavLink[] }
const CORE: Record<string, string> = { home: 'SBA loan cost calculator', method: 'Method and sources', about: 'About', widget: 'Embed the calculator', contact: 'Contact', editorial: 'Editorial policy', privacy: 'Privacy', terms: 'Legal notice', cookies: 'Cookies' };
const GROUP_LABEL: Record<Group, string> = { loans: 'SBA loan programs', costs: 'Rates, fees and comparisons', data: 'Who lends, and where', states: 'SBA loans by state' };
export const GROUPS_ORDER: Group[] = ['loans', 'costs', 'data'];
export const groupLabel = (g: Group) => GROUP_LABEL[g];
export const label = (id: string, _lang: Locale = 'en') => CORE[id] ?? pageById(id)?.nav ?? id;
const link = (id: string, lang: Locale): NavLink => ({ href: route(id, lang), label: label(id, lang) });
const inGroup = (g: Group, lang: Locale) => PAGES.filter((p) => p.group === g).map((p) => link(p.id, lang));
// Top menu: one or two words each, never on two lines (full labels stay in the footer, RECETTE §10.3).
const COURT: Record<Group, string> = { loans: 'Loan programs', costs: 'Rates and fees', data: 'Lenders, states', states: 'States' };
export const navCategories = (lang: Locale, court = true): NavCategory[] =>
  GROUPS_ORDER.map((g) => ({ label: court ? COURT[g] : GROUP_LABEL[g], links: inGroup(g, lang) })).filter((c) => c.links.length);
export const navDirect = (_lang: Locale): NavLink[] => [];
export const footerColumns = (lang: Locale): NavCategory[] => [...GROUPS_ORDER.map((g) => ({ label: GROUP_LABEL[g], links: inGroup(g, lang) })).filter((c) => c.links.length), { label: 'This site', links: ['home', 'method', 'about', 'contact', 'editorial', 'widget', 'terms', 'privacy', 'cookies'].map((i) => link(i, lang)) }];
export const popularLinks = (_lang: Locale): NavLink[] => [];
