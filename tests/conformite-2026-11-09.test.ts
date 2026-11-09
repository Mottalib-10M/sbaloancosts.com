/**
 * Mise en conformité du 2026-11-09 (RECETTE §15.8 : un test verrouille chaque texte réparé). Les testeurs du
 * 2026-11-08 ont buté sur les exercices fiscaux (« FY 2027 » lu en novembre 2026), sur les références de règlements
 * dans les phrases et sur cinq noms pour le même plafond. Le texte visible des pages (H1, chapeau, bloc citable,
 * corps, FAQ) n'en contient plus ; les titres et descriptions de recherche gardent « FY », que les gens tapent.
 */
import { describe, expect, it } from 'vitest';
import { PAGES } from '../src/lib/guides';
import { helpers } from '../src/lib/helpers';
import { plier } from '../src/lib/plier';
import { DATA_YEAR, FEES_NOW, FEES_PREV } from '../src/lib/engine/params';

const h = helpers(true);
const visible = (p: (typeof PAGES)[number]) => [p.h1, p.intro, p.card, p.resume(h), p.body(h), ...p.faqs(h).flatMap((f) => [f.q, f.a])].join(' ').replace(/<table[\s\S]*?<\/table>/g, ' ').replace(/<[^>]+>/g, ' ');

describe('mots simples sur toutes les pages', () => {
  it.each(PAGES.map((p) => [p.id, p] as const))('%s : ni exercice fiscal, ni référence de règlement, ni « ceiling »', (_id, p) => {
    const t = visible(p);
    expect(t).not.toMatch(/\bFY ?\d{4}\b|fiscal year/i);
    expect(t).not.toMatch(/SOP 50|\bCFR\b|\d+ FR \d+|FOIA|Information Notice \d/);
    expect(t).not.toMatch(/\bceilings?\b|last year’s loans/i);
  });
});

describe('périodes écrites en mois', () => {
  it('les trois libellés', () => {
    expect(DATA_YEAR).toBe('Oct. 2025–Sept. 2026');
    expect(FEES_NOW).toBe('Oct. 2026–Sept. 2027');
    expect(FEES_PREV).toBe('Oct. 2025–Sept. 2026');
  });
});

describe('requête « sba loan requirements »', () => {
  it('la page 7(a) porte la section, le titre et une FAQ', () => {
    const p = PAGES.find((x) => x.id === 'sba-7a-loan')!;
    expect(p.body(h)).toContain('<h2 id="requirements" data-ouvert>SBA loan requirements');
    expect(p.title).toMatch(/Requirements/);
    expect(p.faqs(h).some((f) => /requirements for an SBA loan/.test(f.q))).toBe(true);
  });
});

describe('sections repliées', () => {
  it('chaque H2 devient un <details> dont le titre est le H2, le texte reste entier', () => {
    const html = '<p>chapô</p><h2 id="a">Un</h2><p>texte un</p><h2>Deux</h2><p>texte deux</p>';
    const out = plier(html);
    expect(out.startsWith('<p>chapô</p>')).toBe(true);
    expect(out.match(/<details class="pli">/g)).toHaveLength(2);
    expect(out).toContain('<summary><h2 id="a">Un</h2></summary><div class="pli-corps"><p>texte un</p></div></details>');
    expect(out.replace(/<[^>]+>/g, '')).toBe(html.replace(/<[^>]+>/g, ''));
  });
});
