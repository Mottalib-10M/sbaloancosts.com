/**
 * One page = ONE definition: URL, snippets, H1, standfirst, citable block, FAQ, body, sources, tool.
 * Topic pages live in `src/content/pages/<id>.ts`; the 51 state pages are built in `lib/state-pages.ts`.
 */
import type { SourceKey } from './engine/params';
import type { Helpers } from './helpers';

export type Group = 'loans' | 'costs' | 'data' | 'states';
export interface FAQ { q: string; a: string }
/** Tools: `mini:<spec>`, a spec of `lib/mini-specs.ts`. */
export interface ToolDef { kind: string; props?: Record<string, string | number | boolean> }

export interface PageDef {
  id: string;
  group: Group;
  order: number;
  /** Main tool, first screen: the page is a tool page (`data-outil`). */
  tool?: ToolDef;
  mini?: ToolDef;
  related: string[];
  sources: SourceKey[];
  slug: string;
  nav: string;
  card: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  /** Heading of the FAQ block (defaults to the site-wide one). */
  faqTitle?: string;
  /** Kicker above the H1 (defaults to the group label). */
  kicker?: string;
  /** Citable block, 120 words or more, one paragraph (RECETTE §21). */
  resume: (h: Helpers) => string;
  faqs: (h: Helpers) => FAQ[];
  /** HTML. A second tool can be placed inside with `<!--tool:mini:spec-->` or `<!--tool:mini:spec|{"amount":40000}-->`. */
  body: (h: Helpers) => string;
}
export const definePage = (g: PageDef): PageDef => g;
