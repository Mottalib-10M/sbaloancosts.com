/** Mini-calculator types (RECETTE §9.3). Each spec lives in `lib/mini-specs.ts` and calls the tested engine. */
export interface MiniInput { id: string; label: string; def: number; unit?: string; max?: number; decimals?: number; help?: string; options?: Array<{ value: string; label: string }>; /** Shown only when it changes the result (naive test of 2026-11-08: a field without effect reads as a bug). */ showIf?: (v: Record<string, number>) => boolean; /** Value that follows the other fields until the reader types this one (naive test of 2026-11-08: a rate “typical for this size” that stayed put when the size changed). */ follow?: (v: Record<string, number>) => number;
  /** Champ facultatif rangé dans le repli « Plus de détails » ; sa valeur actuelle reste lisible dans le titre du repli. */
  avance?: boolean }
export interface MiniOut { head: [string, string]; rows: Array<[string, string]>; note?: string;
  /** What the prefilled example assumes, in plain words (brief of 2026-11-09): shown in the example mention while nothing is typed. */
  exemple?: string }
export interface MiniSpec { title: string; cta: string; ctaPage?: string; inputs: MiniInput[]; /** `touched`: the fields the reader has changed (3rd naive round: a pre-filled verdict read as “you fit”). */ run: (v: Record<string, number>, touched?: Record<string, boolean>) => MiniOut }
