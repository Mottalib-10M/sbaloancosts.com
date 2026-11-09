/**
 * Mini-calculator (RECETTE §9.3): a few fields, the figure of the page's subject in large type, two to
 * four lines of detail and a link to the full calculator. The arithmetic is the engine's, through
 * `lib/mini-specs.ts`. First render = build defaults (§17.5). `primary`: main tool of a tool page
 * (result marked `data-resultat`, first screen); otherwise the form is `data-simulateur-secondaire`.
 */
import { useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import MentionExemple from './MentionExemple';
import { getSpec } from '../../lib/mini-specs';

interface Props { kind: string; lang?: string; href?: string; defaults?: Record<string, number>; primary?: boolean; idPrefix?: string; title?: string }

export default function MiniSim({ kind, lang = 'en', href, defaults = {}, primary = false, idPrefix = 'm', title }: Props) {
  const spec = getSpec(kind);
  // Fields with `follow` (a typical rate for the amount) track the others until the reader types them.
  const settle = (o: Record<string, number>, keep: Record<string, boolean>) => {
    const n = { ...o };
    for (const i of spec.inputs) if (i.follow && !keep[i.id]) n[i.id] = i.follow(n);
    return n;
  };
  const [v, setV] = useState<Record<string, number>>(() => settle(Object.fromEntries(spec.inputs.map((i) => [i.id, defaults[i.id] ?? i.def])), Object.fromEntries(Object.keys(defaults).map((k) => [k, true]))));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const out = useMemo(() => spec.run(v, touched), [v, spec, touched]);
  const set = (id: string) => (x: number) => { const keep = { ...touched, [id]: true }; setV((o) => settle({ ...o, [id]: x }, keep)); setTouched((o) => (o[id] ? o : { ...o, [id]: true })); };
  const fid = (id: string) => `${idPrefix}-${kind}-${id}`;
  return (
    <div data-chrome data-mini={kind} className={`not-prose rechner ${primary ? '' : 'my-8'} border border-navy-300 bg-white p-4 sm:p-5`}>
      <p className="font-serif text-lg font-semibold text-navy-900">{title ?? spec.title}</p>
      <div className="mt-3 grid gap-5 sm:grid-cols-2">
        <form className="grid content-start gap-3" onSubmit={(e) => e.preventDefault()} {...(primary ? {} : { 'data-simulateur-secondaire': '' })}>
          {spec.inputs.filter((i) => !i.showIf || i.showIf(v)).map((i) => i.options
            ? <SelectField key={i.id} id={fid(i.id)} label={i.label} value={String(v[i.id])} onChange={(x) => set(i.id)(Number(x))} options={i.options} help={i.help} />
            : <NumberField key={i.id} id={fid(i.id)} label={i.label} value={v[i.id]} onChange={set(i.id)} unit={i.unit} max={i.max} decimals={i.decimals} help={i.help} />)}
        </form>
        <div aria-live="polite" {...(primary ? { 'data-resultat': '' } : {})} className="self-start border-l-4 border-accent-500 bg-accent-50 p-4">
          {/* Trame (testeurs naïfs du 2026-11-08) : mention tant qu'aucun champ n'est modifié. */}
          <MentionExemple lang={lang} touched={touched} texte={out.exemple} />
          <p className="text-sm font-medium text-navy-700">{out.head[0]}</p>
          <p className="tabular-nums mt-1 text-4xl font-bold text-navy-900">{out.head[1]}</p>
          <table className="ledger mt-3 w-full text-sm"><tbody>
            {out.rows.map(([l, x]) => <tr key={l}><td className="pr-3 text-navy-700">{l}</td><td className="tabular-nums text-right text-navy-900">{x}</td></tr>)}
          </tbody></table>
          {out.note && <p className="mt-2 text-xs text-navy-600">{out.note}</p>}
        </div>
      </div>
      {href && spec.cta && <a href={href} className="mt-4 inline-block text-sm font-medium text-accent-700 underline underline-offset-2 hover:text-accent-900">{spec.cta}</a>}
    </div>
  );
}
