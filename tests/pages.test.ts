/**
 * Editorial rules checked on every page definition before the build (RECETTE §6, §7, §11, §21):
 * snippet lengths, key term first, citable block ≥ 120 words, FAQ 40-90 words and unique across the
 * site, no em dash, no SBA rule figure typed in a topic page, existing tools, body length.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { PAGES } from '../src/lib/guides';
import { helpers } from '../src/lib/helpers';
import { getSpec } from '../src/lib/mini-specs';
// Fees, caps and prime of the parameter file are never typed in a page body (RECETTE §17.4): they come from h.P or h.E.
const TYPED = /\b7\.00%|\b13\.50%|\b10\.00%|\$700,000|\$950,000|\$3,750,000|\b0\.55%|\b0\.203%|\b3\.75%|\b2\.00%|\b4\.70%/;

const h = helpers(true);
const text = (html: string) => html.replace(/<table[\s\S]*?<\/table>/g, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ');
const words = (s: string) => text(s).split(/\s+/).filter((w) => /[A-Za-z0-9$]/.test(w)).length;
const BAD_START = /^(US|U\.S\.|United States|American|America|Calculator|Calculate|How|What|Why|When|Which|Who|Is|Are|Do|Does|Can|FAQ|About)\b/;
const allQ = new Map<string, string>();

describe.each(PAGES.map((p) => [p.id, p] as const))('%s', (_id, p) => {
  it('snippets', () => {
    expect(p.title.length, `title ${p.title.length}: ${p.title}`).toBeGreaterThanOrEqual(50);
    expect(p.title.length, `title ${p.title.length}: ${p.title}`).toBeLessThanOrEqual(60);
    expect(p.description.length, `description ${p.description.length}: ${p.description}`).toBeGreaterThanOrEqual(150);
    expect(p.description.length, `description ${p.description.length}: ${p.description}`).toBeLessThanOrEqual(160);
    expect(BAD_START.test(p.title), `title starts with a banned word: ${p.title}`).toBe(false);
    expect(/[—]|\s[:;!?]/.test(p.title + p.description), 'em dash or space before punctuation').toBe(false);
    expect(p.slug).toMatch(/^[a-z0-9-]+$/);
  });
  it('citable block of 120 words or more', () => {
    expect(words(p.resume(h))).toBeGreaterThanOrEqual(120);
  });
  it('FAQ: 3 to 8 questions of 40 to 90 words, never reused', () => {
    const f = p.faqs(h);
    expect(f.length).toBeGreaterThanOrEqual(3);
    expect(f.length).toBeLessThanOrEqual(8);
    for (const x of f) {
      const n = words(x.a);
      expect(n, `${x.q} (${n} words)`).toBeGreaterThanOrEqual(40);
      expect(n, `${x.q} (${n} words)`).toBeLessThanOrEqual(90);
      const k = x.q.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      expect(allQ.has(k) && allQ.get(k) !== p.id, `question reused from ${allQ.get(k)}: ${x.q}`).toBe(false);
      allQ.set(k, p.id);
    }
  });
  it('no SBA figure typed in the page source', () => {
    const file = `src/content/pages/${p.id}.ts`;
    if (!existsSync(file)) return; // state pages: built from the data in lib/state-pages.ts
    const src = readFileSync(file, 'utf8').split('\n').filter((l) => !/^\s*(title|description|h1|nav|card|intro):/.test(l)).join('\n');
    const hit = src.match(TYPED);
    expect(hit, `typed figure “${hit?.[0]}”: use h.P or h.E`).toBeNull();
  });
  it('body: length, no em dash, tools exist, sources', () => {
    const b = p.body(h);
    const all = p.intro + p.resume(h) + b + p.faqs(h).map((f) => f.q + f.a).join(' ');
    expect(/—|&mdash;/.test(all), 'em dash').toBe(false);
    expect(/undefined|NaN|null%|\$NaN/.test(text(all)), 'unfilled value').toBe(false);
    // Prose only (tables and the tool left out): citable block, body and FAQ answers. RECETTE: tool pages 500 words.
    const n = words(p.resume(h)) + words(b) + p.faqs(h).reduce((a, f) => a + words(f.a), 0);
    const min = p.tool ? 500 : 1200;
    expect(n, `${n} words (min ${min})`).toBeGreaterThanOrEqual(min);
    for (const t of [p.tool, p.mini].filter(Boolean)) if (t!.kind.startsWith('mini:')) expect(() => getSpec(t!.kind.slice(5))).not.toThrow();
    expect(p.tool || p.mini, 'every page carries a calculator').toBeTruthy();
    expect(p.sources.length).toBeGreaterThanOrEqual(2);
  });
});
