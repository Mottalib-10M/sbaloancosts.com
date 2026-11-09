/**
 * Défauts de trame relevés par les testeurs naïfs du 2026-11-08 (RECETTE §15.8) sur goldbycarat.co.uk,
 * dumpfeesbystate.com, financecertcost.com et moneyfundyields.com. Chaque test verrouille une
 * correction de la trame :
 *  1. résultat pré-rempli marqué « Exemple, pas encore votre résultat » tant que rien n'est modifié ;
 *  2. tableaux qui débordent sur téléphone empilés en fiches (libellé de colonne devant chaque valeur) ;
 *  4. deux calculateurs empilés : un titre et des id propres à chacun ;
 *  5. résumé replié : au moins deux phrases et un lien qui dit ce qu'il fait ;
 *  7. résumé replié : un sigle visible n'a jamais sa définition dans la partie repliée ;
 *  8. FAQ : aide localisée au-dessus des questions, une question ouvrable d'emblée ;
 *  9. champs repliés d'un calculateur : la valeur actuelle de chacun se lit dans le titre du repli.
 */
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { libellesTrame, resultatExemple, resumeRepli } from '../src/lib/libelles-trame';
import { etiquettes, SCRIPT_TABLEAUX, tableHtml } from '../src/lib/tableaux';
import { decouperPhrases, replier } from '../src/lib/clamp';

const appels: Array<Record<string, boolean> | undefined> = [];
vi.mock('../src/lib/mini-specs', () => ({
  getSpec: () => ({
    title: 'Titre de la spec', cta: 'Calculateur complet',
    inputs: [
      { id: 'montant', label: 'Montant', def: 1200 },
      { id: 'choix', label: 'Situation', def: 1, options: [{ value: '1', label: 'Salarié du privé avec plusieurs employeurs dans l’année' }, { value: '2', label: 'Autre' }] },
      { id: 'age', label: 'Âge', def: 40, unit: 'ans', avance: true },
      { id: 'statut', label: 'Statut', def: 2, avance: true, options: [{ value: '1', label: 'Cadre' }, { value: '2', label: 'Non-cadre' }] },
    ],
    run: (v: Record<string, number>, touched?: Record<string, boolean>) => { appels.push(touched); return { head: ['Résultat', String(v.montant)], rows: [['Ligne', '1']] }; },
  }),
}));
const { default: MiniSim } = await import('../src/components/calc/MiniSim');
const { default: MiniSimAutonome } = await import('../src/components/calc/MiniSimAutonome');
const { default: SelectField } = await import('../src/components/ui/SelectField');

describe('1. résultat pré-rempli lu comme un verdict', () => {
  it('mention localisée, repli anglais', () => {
    expect(libellesTrame('fr').exemple).toBe('Exemple, pas encore votre résultat');
    expect(libellesTrame('fr-BE').exemple).toBe('Exemple, pas encore votre résultat');
    expect(libellesTrame('en').exemple).toBe('Example, not your result yet');
    for (const l of ['es', 'de', 'it', 'pt', 'nl', 'pl', 'no']) expect(libellesTrame(l).exemple).not.toBe(libellesTrame('en').exemple);
    expect(libellesTrame('xx').exemple).toBe('Example, not your result yet');
  });
  it('exemple tant qu’aucun champ n’est modifié', () => {
    expect(resultatExemple(undefined)).toBe(true);
    expect(resultatExemple({})).toBe(true);
    expect(resultatExemple({ montant: false })).toBe(true);
    expect(resultatExemple({ montant: true })).toBe(false);
  });
  it('MiniSim et MiniSimAutonome posent la mention au premier rendu et passent touched à run', () => {
    appels.length = 0;
    const fr = renderToStaticMarkup(createElement(MiniSim, { kind: 'k', lang: 'fr' }));
    expect(fr).toContain('Exemple, pas encore votre résultat');
    expect(fr).toContain('data-exemple');
    expect(appels[0]).toEqual({});
    expect(renderToStaticMarkup(createElement(MiniSimAutonome, { kind: 'k', lang: 'de' }))).toContain('Beispiel, noch nicht Ihr Ergebnis');
  });
  // sbaloancosts.com : le MiniSim du site (fusionné, il garde `follow` et `showIf`) ne lit pas l'URL, aucune saisie
  // ne vient d'un lien partagé ; le cas « saisiParLeLecteur » de la trame est vérifié sur MiniSimAutonome.
  it('pas de mention quand les valeurs viennent du lecteur (lien partagé, MiniSimAutonome)', () => {
    appels.length = 0;
    const h = renderToStaticMarkup(createElement(MiniSimAutonome, { kind: 'k', lang: 'en', saisiParLeLecteur: true }));
    expect(h).not.toContain('data-exemple');
    expect(appels[0]).toEqual({ montant: true, choix: true, age: true, statut: true });
  });
});

describe('2. tableaux coupés à droite sur téléphone', () => {
  it('chaque cellule hors la première porte le nom de sa colonne', () => {
    expect(etiquettes(['Site', 'Prix', 'Tonne'], 3)).toEqual(['', 'Prix', 'Tonne']);
    const h = tableHtml(['Site', 'Prix <HT>', 'Tonne'], [['Paris', '12 €', 3]], { empile: true });
    expect(h).toContain('<table class="empile">');
    expect(h).toContain('<td data-label="Prix &lt;HT&gt;">12 €</td>');
    expect(h).toContain('<td data-label="">Paris</td>');
    expect(tableHtml(['a', 'b'], [[1, 2]], { empile: false })).toContain('data-pas-de-fiches');
    expect(tableHtml(['a', 'b'], [[1, 2]])).toMatch(/^<table><thead>/);                 // 2 colonnes : tableau
    expect(tableHtml(['a', 'b', 'c'], [[1, 2, 3]])).toMatch(/^<table class="empile">/);   // dès 3 colonnes : fiches
    expect(tableHtml(['a', 'b', 'c'], [[1, 2, 3]], { empile: false })).not.toContain('empile');
  });

  // Faux DOM réduit à ce que lit le script de BaseLayout.
  type FT = ReturnType<typeof faux>;
  function faux({ cols, deborde, attrs = {}, ile = false, thead = true }: { cols: number; deborde: boolean; attrs?: Record<string, string>; ile?: boolean; thead?: boolean }) {
    const classes = new Set<string>();
    const cell = (txt: string) => { const a: Record<string, string> = {}; return { textContent: txt, colSpan: 1, a, hasAttribute: (k: string) => k in a, setAttribute: (k: string, v: string) => { a[k] = v; } }; };
    const head = { cells: Array.from({ length: cols }, (_, i) => cell(`Col ${i + 1}`)) };
    const body = [0, 1].map((r) => ({ cells: Array.from({ length: cols }, (_, i) => cell(`v${r}${i}`)) }));
    const t = {
      tagName: 'TABLE', head, body, scrollLeft: 0,
      rows: thead ? [head, ...body] : body, tHead: thead ? { rows: [head] } : null, tBodies: [{ rows: body }],
      get scrollWidth() { return deborde && !classes.has('empile') ? 700 : 350; }, clientWidth: 350,
      classList: { contains: (c: string) => classes.has(c), add: (...c: string[]) => c.forEach((x) => classes.add(x)), toggle: (c: string, on: boolean) => { if (on) classes.add(c); else classes.delete(c); } },
      classes, hasAttribute: (k: string) => k in attrs, closest: (s: string) => (s === 'astro-island' && ile ? {} : null), addEventListener: () => {},
    };
    return t;
  }
  function lancer(tables: FT[], largeur: number) {
    const g: Record<string, unknown> = {
      window: { innerWidth: largeur, MutationObserver: undefined }, addEventListener: () => {}, requestAnimationFrame: () => 0,
      document: { querySelectorAll: () => tables, querySelector: () => null },
    };
    new Function(...Object.keys(g), SCRIPT_TABLEAUX)(...Object.values(g));
  }
  it('un tableau qui déborde à 390 px devient des fiches, libellés posés depuis le <thead>', () => {
    const t = faux({ cols: 4, deborde: true });
    lancer([t], 390);
    expect(t.classes.has('empile')).toBe(true);
    expect(t.classes.has('tableau-defile')).toBe(false);
    expect(t.body[0].cells.map((c) => c.a['data-label'])).toEqual(['', 'Col 2', 'Col 3', 'Col 4']);
  });
  it('dès 3 colonnes, fiches même sans débordement (aucun testeur ne fait défiler)', () => {
    const t = faux({ cols: 3, deborde: false });
    lancer([t], 390);
    expect(t.classes.has('empile')).toBe(true);
    expect(t.body[1].cells.map((c) => c.a['data-label'])).toEqual(['', 'Col 2', 'Col 3']);
  });
  it('à 2 colonnes, fiches seulement si le tableau déborde', () => {
    const large = faux({ cols: 2, deborde: true });
    lancer([large], 390);
    expect(large.classes.has('empile')).toBe(true);
  });
  it('les tableaux étroits de 2 colonnes, refusés, sans en-tête ou rendus par React restent des tableaux', () => {
    const etroit = faux({ cols: 2, deborde: false });
    const refuse = faux({ cols: 5, deborde: true, attrs: { 'data-pas-de-fiches': '' } });
    const ile = faux({ cols: 5, deborde: true, ile: true });
    const sansTete = faux({ cols: 5, deborde: true, thead: false });
    lancer([etroit, refuse, ile, sansTete], 390);
    for (const t of [etroit, refuse, ile, sansTete]) expect(t.classes.has('empile')).toBe(false);
    expect(refuse.classes.has('tableau-defile')).toBe(true); // il défile, avec l'ombre
    expect(etroit.body[0].cells[1].a['data-label']).toBeUndefined();
  });
  it('sur ordinateur, rien n’est empilé', () => {
    const t = faux({ cols: 6, deborde: true });
    lancer([t], 1440);
    expect(t.classes.has('empile')).toBe(false);
  });
  it('global.css porte les règles des fiches sous 768 px', () => {
    const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
    expect(css).toMatch(/@media \(max-width: 767px\)[\s\S]*table\.empile thead/);
    expect(css).toContain('content: attr(data-label)');
  });
});

describe('3. listes déroulantes : le choix se lit en entier', () => {
  it('le libellé choisi est affiché dans un bloc qui passe à la ligne, sans troncature', () => {
    const label = 'Salarié du privé avec plusieurs employeurs dans l’année';
    const h = renderToStaticMarkup(createElement(SelectField, { id: 's', label: 'Situation', value: '1', onChange: () => {}, options: [{ value: '1', label }] }));
    expect(h).toMatch(new RegExp(`<span aria-hidden="true" data-choix[^>]*\\[overflow-wrap:anywhere\\][^>]*>${label}</span>`));
    expect(h).toMatch(/<select[^>]*absolute -inset-px[^>]*opacity-0/); // le vrai <select> recouvre tout le champ, bordure comprise (même hauteur que les autres champs)
    expect(h).not.toContain('truncate');
  });
});

describe('4. deux calculateurs empilés sur une même page', () => {
  it('chacun reçoit son titre et des id distincts', () => {
    const a = renderToStaticMarkup(createElement(MiniSim, { kind: 'k', lang: 'fr', title: 'Étape 1 : votre allocation', idPrefix: 'a' }));
    const b = renderToStaticMarkup(createElement(MiniSim, { kind: 'k', lang: 'fr', title: 'Étape 2 : sa durée', idPrefix: 'b' }));
    expect(a).toContain('Étape 1 : votre allocation');
    expect(b).toContain('Étape 2 : sa durée');
    expect(a).not.toContain('Titre de la spec');
    expect(a).toContain('id="a-k-montant"');
    expect(b).toContain('id="b-k-montant"');
    expect(renderToStaticMarkup(createElement(MiniSimAutonome, { kind: 'k', title: 'Step 2', idPrefix: 'z' }))).toContain('Step 2');
    expect(renderToStaticMarkup(createElement(MiniSim, { kind: 'k' }))).toContain('Titre de la spec');
  });
  it('defaults : valeurs propres à la page', () => {
    expect(renderToStaticMarkup(createElement(MiniSim, { kind: 'k', defaults: { montant: 345 } }))).toContain('345');
  });
});

describe('5. résumé replié', () => {
  const texte = 'Le montant dépend du salaire. Il baisse après six mois. Seit 1. April gilt das. La durée dépend de l’âge et des mois travaillés au cours des deux dernières années. On peut le vérifier sur le site officiel.';
  it('au moins deux phrases visibles, jamais coupé au milieu', () => {
    const { tete, suite } = replier(texte);
    expect(decouperPhrases(tete).length).toBeGreaterThanOrEqual(2);
    expect(tete.startsWith('Le montant dépend du salaire. Il baisse après six mois.')).toBe(true);
    expect(`${tete} ${suite}`).toBe(texte);
    expect(replier(texte, { phrases: 1 }).tete.split('. ').length).toBeGreaterThanOrEqual(2);
  });
  it('« 1. April », « U.S. » et « z. B. » ne finissent pas une phrase', () => {
    expect(decouperPhrases('Seit 1. April gilt das. Danach nicht.')).toEqual(['Seit 1. April gilt das.', 'Danach nicht.']);
    expect(decouperPhrases('The U.S. Treasury sets it. Rates move.')).toHaveLength(2);
    expect(decouperPhrases('Das gilt z. B. Mietern. Sonst nicht.')).toHaveLength(2);
  });
  it('rien à replier quand il n’y a que deux phrases', () => {
    expect(replier('Une phrase. Une autre phrase.').suite).toBe('');
  });
  it('le lien est explicite et localisé', () => {
    expect(libellesTrame('fr').lireTout).toBe('Lire tout le paragraphe');
    expect(libellesTrame('en').lireTout).toBe('Show the whole paragraph');
    expect(libellesTrame('xx').lireTout).toBe('Show the whole paragraph');
    for (const l of ['es', 'de', 'it', 'pt', 'nl', 'pl']) expect(libellesTrame(l).lireTout).not.toMatch(/more|plus$/i);
    const src = readFileSync(new URL('../src/components/Clamp.astro', import.meta.url), 'utf8');
    expect(src).toContain('libellesTrame(lang).lireTout');
    expect(src).not.toContain('readMore');
  });
});

describe('7. sigle défini dans la partie repliée', () => {
  const t = 'Le SJR fixe le montant. Il est calculé sur deux ans de salaires bruts versés. On ajoute les primes du mois. Le salaire journalier de référence (SJR) est la moyenne de ces salaires par jour. La suite parle des délais. Puis du reste à savoir.';
  it('la coupure descend jusqu’à la définition du sigle visible', () => {
    const { tete, suite } = replier(t);
    expect(tete).toContain('Le salaire journalier de référence (SJR) est la moyenne');
    expect(suite).toBe('La suite parle des délais. Puis du reste à savoir.');
  });
  it('forme « SIGLE (forme longue) » et sigle absent de la tête', () => {
    const t2 = 'Le montant suit le SJR et les jours travaillés depuis deux ans. Il baisse après six mois pour les hauts salaires. Trois cas font exception à cette règle générale. Le SJR (salaire journalier de référence) se lit sur l’attestation. Fin.';
    expect(replier(t2).tete).toContain('Le SJR (salaire journalier de référence)');
    const t3 = 'Le montant dépend du salaire brut versé pendant deux ans. Il baisse après six mois pour certains salaires élevés. On parle aussi de dégressivité dans les textes. Le salaire journalier de référence (SJR) sert de base. Fin.';
    expect(replier(t3).tete).not.toContain('(SJR)');
  });
  it('jamais de coupure dans une parenthèse ouverte', () => {
    expect(decouperPhrases('Un taux (voir art. 3. Il change) existe. Fin.')).toHaveLength(2);
  });
});

describe('8. FAQ repliée', () => {
  it('aide localisée, repli anglais', () => {
    expect(libellesTrame('fr').faqAide).toBe('Touchez une question pour voir la réponse.');
    expect(libellesTrame('en').faqAide).toBe('Tap a question to see the answer.');
    expect(libellesTrame('xx').faqAide).toBe('Tap a question to see the answer.');
  });
  it('PageLayout affiche l’aide et ouvre la question demandée', () => {
    const src = readFileSync(new URL('../src/layouts/PageLayout.astro', import.meta.url), 'utf8');
    expect(src).toContain('libellesTrame(lang).faqAide');
    expect(src).toMatch(/<details open=\{faq\.open \|\| i === faqOuverte\}/);
  });
});

describe('9. champs repliés : valeur actuelle visible', () => {
  // sbaloancosts.com : le MiniSim du site n'a aucun champ `avance` (il montre ou cache un champ avec
  // `showIf`) ; le repli de la trame est vérifié sur MiniSimAutonome.
  it('le titre du repli dit « Actuellement : … » avec chaque valeur cachée, localisé', () => {
    const fr = renderToStaticMarkup(createElement(MiniSimAutonome, { kind: 'k', lang: 'fr' }));
    expect(fr).toContain('Plus de détails sur votre cas');
    expect(fr).toMatch(/data-actuellement[^>]*>Actuellement\u00a0: Âge 40\u00a0ans · Statut Non-cadre</);
    const en = renderToStaticMarkup(createElement(MiniSimAutonome, { kind: 'k', lang: 'en', defaults: { age: 61 } }));
    expect(en).toMatch(/data-actuellement[^>]*>Now: Âge 61\u00a0ans · Statut Non-cadre</);
    expect(resumeRepli('es', [{ label: 'Edad', valeur: '40' }])).toBe('Ahora: Edad 40');
  });
  it('les champs facultatifs sont dans le repli, les autres en dehors', () => {
    const h = renderToStaticMarkup(createElement(MiniSimAutonome, { kind: 'k', lang: 'fr' }));
    const repli = h.slice(h.indexOf('<details data-repli'));
    expect(repli).toContain('id="m-k-age"');
    expect(repli).not.toContain('id="m-k-montant"');
  });
});
