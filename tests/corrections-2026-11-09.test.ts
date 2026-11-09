/**
 * Corrections ciblées après le tour final des testeurs naïfs du 2026-11-09 (RECETTE §15.8 : un test verrouille
 * chaque texte réparé). Trois testeurs sur trois : la comparaison désignait un gagnant avec l'exemple (même taux,
 * même durée), « median » portait le verdict, le plafond 13,00 % contre 13,50 % sans dire qu'il dépend du montant,
 * et la mention d'exemple ne disait pas ce que l'exemple supposait.
 */
import { describe, expect, it } from 'vitest';
import { getSpec, typicalRate, placeLine, TYPICAL_VERDICT, EXAMPLE_AMOUNT } from '../src/lib/mini-specs';
import { PAGES } from '../src/lib/guides';
import { helpers } from '../src/lib/helpers';
import { plier } from '../src/lib/plier';

const defaults = (k: string) => {
  const s = getSpec(k);
  const v: Record<string, number> = Object.fromEntries(s.inputs.map((i) => [i.id, i.def]));
  for (const i of s.inputs) if (i.follow) v[i.id] = i.follow(v);
  return v;
};

describe('comparaison SBA / prêt bancaire', () => {
  it('avec l’exemple, aucun gagnant : le surcoût du prêt SBA, en dollars', () => {
    const out = getSpec('compare').run(defaults('compare'), {});
    expect(out.head[0]).not.toMatch(/Lower/);
    expect(out.head[0]).toMatch(/Type the bank’s offer/);
    expect(out.head[1]).toMatch(/^\$[\d,]+ more$/);
    expect(out.exemple).toMatch(/both at/);
  });
  it('une ligne par prêt, sans point médian', () => {
    const out = getSpec('compare').run(defaults('compare'), { convRate: true });
    for (const [l, v] of out.rows) expect(`${l} ${v}`).not.toContain(' · ');
    expect(out.head[1]).toMatch(/less$/);
  });
});

describe('mots simples là où on les lit', () => {
  it('le verdict ne dit plus « median »', () => {
    expect(TYPICAL_VERDICT).not.toMatch(/median/);
    expect(placeLine(typicalRate(EXAMPLE_AMOUNT), EXAMPLE_AMOUNT, 'variable')).toBe(TYPICAL_VERDICT);
  });
  it('le plafond se dit « for this loan size », le coût réel se dit APR', () => {
    const out = getSpec('cost').run(defaults('cost'), {});
    const labels = out.rows.map(([l]) => l);
    expect(labels).toContain('SBA cap for this loan size (highest rate allowed)');
    expect(labels.some((l) => /APR/.test(l))).toBe(true);
    expect(out.note).toMatch(/True yearly cost: your .* rate plus the \$[\d,]+ SBA fee/);
  });
  it('les mêmes groupes exonérés dans le libellé, l’aide et la note', () => {
    const relief = getSpec('cost').inputs.find((i) => i.id === 'relief')!;
    expect(relief.label).toMatch(/Manufacturer, farm, food supplier or rural/);
    expect(relief.help).not.toMatch(/three/);
  });
});

describe('la mention d’exemple dit ce que l’exemple suppose', () => {
  it.each(['cost', 'ratecheck', 'fee', 'express', 'compare', 'cost504', 'micro', 'prepay', 'state', 'lender'])('%s', (k) => {
    const out = getSpec(k).run(defaults(k), {});
    expect(out.exemple).toBeTruthy();
    expect(out.exemple).toMatch(/\$|%/);
  });
});

describe('504 : la bonne nouvelle en mots, des montants plutôt que des pourcentages', () => {
  it('ligne « bank loan is paid off » et frais annuels en dollars', () => {
    const out = getSpec('cost504').run(defaults('cost504'), {});
    expect(out.rows[0][0]).toMatch(/the bank loan is paid off/);
    expect(out.rows.find(([l]) => /Yearly fees/.test(l))![1]).toMatch(/^about \$/);
    expect(out.note).not.toMatch(/debenture|bond sale|agent fee/);
  });
});

describe('pages d’État', () => {
  it('la durée se choisit, le gros chiffre la nomme', () => {
    const v = { ...defaults('state'), years: 25 };
    expect(getSpec('state').run(v, { years: true }).head[0]).toBe('Monthly payment over 25 years');
  });
  it('la liste des prêteurs n’est pas une recommandation', () => {
    const h = helpers(true);
    const tx = PAGES.find((p) => p.id === 'sba-loans-texas')!;
    expect(tx.body(h)).toMatch(/not a recommendation\. Rates fall as loans get bigger: .* so their rates do not compare/);
  });
});

describe('page 7(a) : les conditions restent ouvertes', () => {
  it('la section « requirements » est un <details open>', () => {
    const h = helpers(true);
    const p = PAGES.find((x) => x.id === 'sba-7a-loan')!;
    expect(plier(p.body(h))).toMatch(/<details class="pli" open><summary><h2 id="requirements" data-ouvert>/);
  });
});
