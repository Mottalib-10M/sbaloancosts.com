/** Registry of pages: every file of `src/content/pages/`, then the 51 state pages. */
import type { PageDef, Group } from './guide-types';
import { STATE_PAGES } from './state-pages';
const mods = import.meta.glob<{ default: PageDef }>('../content/pages/*.ts', { eager: true });
const TOPIC: PageDef[] = Object.entries(mods)
  .map(([file, m]) => {
    const g = m.default;
    const base = file.split('/').pop()!.replace(/\.ts$/, '');
    if (g.id !== base) throw new Error(`${file}: id “${g.id}” differs from the file name`);
    return g;
  });
export const PAGES: PageDef[] = [...TOPIC, ...STATE_PAGES].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
export const GROUPS: Group[] = ['loans', 'costs', 'data', 'states'];
export const pageById = (id: string) => PAGES.find((p) => p.id === id);
