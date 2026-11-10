/**
 * Les cinq règles du 2026-11-10 (testeurs naïfs : facilité 6 à 7, testeur de 61 ans). Un test verrouille chaque
 * règle appliquée : un seul exemple, un verdict qui ne contredit pas ses chiffres, au plus trois sections et trois
 * questions par page, une issue « je ne sais pas » sur chaque champ difficile.
 */
import { describe, expect, it } from 'vitest';
import { getSpec, typicalRate, EXAMPLE_AMOUNT, SPEC_IDS } from '../src/lib/mini-specs';
import { PAGES } from '../src/lib/guides';
import { helpers } from '../src/lib/helpers';

const h = helpers(true);
const defaults = (k: string) => {
  const s = getSpec(k);
  const v: Record<string, number> = Object.fromEntries(s.inputs.map((i) => [i.id, i.def]));
  for (const i of s.inputs) if (i.follow) v[i.id] = i.follow(v);
  return v;
};

describe('règle 1 : un seul chiffre par cas', () => {
  it('le verdict « typique » ne dit plus « moitié / moitié » au-dessus de 45 / 25 / 30', () => {
    for (const k of ['cost', 'ratecheck']) {
      const out = getSpec(k).run(defaults(k), {});
      const all = [out.head.join(' '), out.sub ?? '', out.note ?? '', ...out.rows.flat()].join(' ');
      expect(all, k).not.toMatch(/half of similar loans paid less, half more/);
    }
    const out = getSpec('cost').run(defaults('cost'), {});
    expect(out.rows.find(([l]) => /Your rate vs/.test(l))![1]).toMatch(/\d+ in 100 paid a lower margin, \d+ a higher one/);
  });
  it('la comparaison par défaut met en gros la même mensualité que l’accueil', () => {
    expect(getSpec('compare').run(defaults('compare'), {}).head[1]).toBe(getSpec('cost').run(defaults('cost'), {}).head[1]);
  });
  it('504 : un chiffre par ligne, plus de « · » entre deux montants', () => {
    const out = getSpec('cost504').run(defaults('cost504'), {});
    for (const [l, v] of out.rows) expect(`${l} ${v}`).not.toContain(' · ');
  });
  it('chaque calculateur dit sous le gros chiffre ce qu’il suppose', () => {
    for (const k of SPEC_IDS) expect(getSpec(k).run(defaults(k), {}).sub, k).toBeTruthy();
  });
  it('les pages reprennent l’exemple de 220 000 $ au taux typique', () => {
    for (const id of ['sba-7a-loan', 'sba-guaranty-fee', 'sba-vs-conventional-loan']) {
      expect(PAGES.find((p) => p.id === id)!.body(h), id).toContain(h.m(EXAMPLE_AMOUNT));
    }
    expect(typicalRate(EXAMPLE_AMOUNT)).toBe(10);
  });
});

describe('règle 2 : la page 7(a) répond à « Can my business get one? » au lieu de répéter l’accueil', () => {
  it('son calculateur n’est pas celui de l’accueil', () => {
    expect(PAGES.find((p) => p.id === 'sba-7a-loan')!.tool!.kind).toBe('mini:qualify');
  });
  it('« Choose… » tant que le lecteur n’a pas répondu', () => {
    const out = getSpec('qualify').run(defaults('qualify'), {});
    expect(out.rows[0][1]).toMatch(/choose your business above/);
    expect(getSpec('qualify').run({ ...defaults('qualify'), stage: 2 }, { stage: true }).rows[0][1]).toMatch(/^at least \$[\d,]+: 10% of the whole project$/);
  });
});

describe('règle 3 : au plus trois sections et trois questions par page', () => {
  it.each(PAGES.map((p) => [p.id, p] as const))('%s', (_id, p) => {
    expect((p.body(h).match(/<h2[\s>]/g) ?? []).length).toBeLessThanOrEqual(3);
    expect(p.faqs(h).length).toBeLessThanOrEqual(3);
  });
});

describe('règle 5 : une issue « je ne sais pas » sur chaque champ difficile', () => {
  it.each([['cost', 'type'], ['cost', 'rate'], ['cost', 'relief'], ['cost', 'years'], ['fee', 'prog'], ['compare', 'convRate'], ['cost504', 'deb'], ['cost504', 'biz'], ['state', 'rate']])('%s.%s', (k, id) => {
    expect(getSpec(k).inputs.find((i) => i.id === id)!.help).toMatch(/Not sure\?|No quote yet\?/);
  });
});
