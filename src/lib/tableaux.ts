/**
 * Tableaux lisibles sur téléphone (testeurs naïfs du 2026-11-08, RECETTE §15.8).
 *
 * Sur quatre sites, les trois testeurs ont lu « $2,00( » au bord droit d'un tableau sans comprendre
 * qu'il fallait le faire glisser : le défilement horizontal avec ombre (audit du 2026-10-28) ne suffit
 * pas, la colonne qui porte la réponse reste hors de l'écran. Règle de la trame :
 *
 * - sous 768 px, un tableau du contenu de TROIS COLONNES OU PLUS devient une pile de fiches, qu'il déborde
 *   ou non (aucun testeur ne fait défiler, calculobeca.com) : une fiche par ligne, la première cellule en
 *   titre, chaque autre valeur précédée du nom de sa colonne (`data-label`). Un tableau de deux colonnes
 *   reste un tableau, sauf s'il déborde (il devient alors aussi des fiches) ;
 * - `data-label` est posé au build par `ContentTable.astro` et `tableHtml()` ; le script de BaseLayout
 *   (`SCRIPT_TABLEAUX`) le pose sur les autres tableaux (Markdown, HTML écrit à la main) à partir de leur
 *   `<thead>`, décide de l'empilement au rendu, et garde l'ombre de défilement pour ce qui déborde encore ;
 * - `empile: true` force les fiches sous 768 px, même à deux colonnes ; `data-pas-de-fiches` (ou `empile: false`) les refuse
 *   (tableau à lire en grille : barème croisé, calendrier) : il défile alors, avec l'ombre ;
 * - un tableau rendu par React (dans un `astro-island`) n'est pas modifié par le script, pour ne pas
 *   troubler l'hydratation : le composant pose lui-même `className="empile"` et `data-label`
 *   (`etiquettes()`).
 * Styles : `table.empile` dans `global.css`.
 */
export type Cellule = string | number;
export interface OptionsTableau { caption?: string; align?: Array<'l' | 'r'>; empile?: boolean | 'auto'; className?: string; highlightRow?: number }

/** Nom de colonne de chaque cellule d'une ligne ; la première cellule (titre de la fiche) n'en porte pas. */
export function etiquettes(headers: string[], nCellules: number): string[] {
  return Array.from({ length: nCellules }, (_, i) => (i === 0 ? '' : (headers[i] ?? '').trim()));
}

const esc = (s: Cellule) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Attributs du `<table>` selon la règle d'empilement (partagé par ContentTable.astro et tableHtml). */
export function attributsTableau(empile: boolean | 'auto' = 'auto', colonnes = 0): { classe: string; pasDeFiches: boolean } {
  return { classe: empile === true || (empile === 'auto' && colonnes >= 3) ? 'empile' : '', pasDeFiches: empile === false };
}

/**
 * HTML d'un tableau de contenu (pages écrites en chaînes, `set:html`). Le texte des cellules est
 * échappé ; une cellule qui doit porter du HTML se passe déjà échappée par le site à travers son
 * propre gabarit.
 */
export function tableHtml(headers: string[], rows: Cellule[][], o: OptionsTableau = {}): string {
  const { classe, pasDeFiches } = attributsTableau(o.empile, headers.length);
  const al = (i: number) => (o.align?.[i] === 'r' ? ' class="text-right"' : '');
  const cls = [classe, o.className].filter(Boolean).join(' ');
  return `<table${cls ? ` class="${cls}"` : ''}${pasDeFiches ? ' data-pas-de-fiches' : ''}>`
    + (o.caption ? `<caption>${esc(o.caption)}</caption>` : '')
    + `<thead><tr>${headers.map((h, i) => `<th scope="col"${al(i)}>${esc(h)}</th>`).join('')}</tr></thead>`
    + `<tbody>${rows.map((r, ri) => {
      const lab = etiquettes(headers, r.length);
      return `<tr${ri === o.highlightRow ? ' class="ligne-vedette"' : ''}>${r.map((c, i) => `<td data-label="${esc(lab[i])}"${al(i)}>${esc(c)}</td>`).join('')}</tr>`;
    }).join('')}</tbody></table>`;
}

/**
 * Script de fin de page (BaseLayout) : fiches sous 768 px pour les tableaux de 3 colonnes ou plus et pour ceux qui débordent, puis ombre
 * de défilement (`.tableau-defile`, retirée en fin de défilement) pour ceux qui débordent encore.
 * Recalculé au chargement, quand le contenu de <main> change et quand la largeur change.
 * En ES5 et sans dépendance : il est injecté tel quel dans la page.
 */
export const SCRIPT_TABLEAUX = `(function(){var L=768;
function nc(t){var m=0;for(var i=0;i<t.rows.length;i++)m=Math.max(m,t.rows[i].cells.length);return m}
function ent(t){var h=t.tHead&&t.tHead.rows[t.tHead.rows.length-1];if(!h)return null;var e=[];for(var i=0;i<h.cells.length;i++){var c=h.cells[i];for(var k=0;k<(c.colSpan||1);k++)e.push((c.textContent||'').replace(/\\s+/g,' ').trim())}return e}
function eti(t){var e=ent(t);if(!e)return false;for(var j=0;j<t.tBodies.length;j++)for(var i=0;i<t.tBodies[j].rows.length;i++){var r=t.tBodies[j].rows[i],x=0;for(var k=0;k<r.cells.length;k++){var c=r.cells[k];if(!c.hasAttribute('data-label'))c.setAttribute('data-label',x===0?'':(e[x]||''));x+=c.colSpan||1}}return true}
function deb(b){return b.scrollWidth-b.clientWidth>4}
function v(){var etroit=window.innerWidth<L;
document.querySelectorAll('main table').forEach(function(t){if(!etroit||t.classList.contains('empile')||t.hasAttribute('data-pas-de-fiches')||t.closest('astro-island'))return;var b=t.closest('.overflow-x-auto')||t;var n=nc(t);if((n>=3||(n>=2&&deb(b)))&&eti(t))t.classList.add('empile','empile-auto')});
document.querySelectorAll('main table,main .overflow-x-auto').forEach(function(t){var b=t.closest('.overflow-x-auto')||t,d=deb(b);b.classList.toggle('tableau-defile',d);if(d&&!b.__fin){b.__fin=1;b.addEventListener('scroll',function(){b.classList.toggle('fin',b.scrollLeft+b.clientWidth>=b.scrollWidth-4)},{passive:true})}})}
var r=0;function w(){if(!r){r=1;requestAnimationFrame(function(){r=0;v()})}}
v();addEventListener('load',function(){v();var m=document.querySelector('main');if(m&&window.MutationObserver)new MutationObserver(w).observe(m,{childList:true,subtree:true})});addEventListener('resize',w)})();`;
