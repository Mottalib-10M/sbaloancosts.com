/**
 * Folded sections (brief of 2026-11-09, naive testers of 2026-11-08: 13 to 21 phone screens per page, the
 * useful part lost under tables and rules). Every `<h2>` section of a page body becomes a `<details>` whose
 * summary is the heading itself: the text stays in the HTML served, word for word, for search engines and
 * assistants, and the page on a phone shrinks to the calculator plus a list of headings to open.
 * Content before the first `<h2>` stays open.
 */
export function plier(html: string): string {
  return html
    .split(/(?=<h2[\s>])/)
    .map((part) => {
      const m = part.match(/^<h2([^>]*)>([\s\S]*?)<\/h2>/);
      if (!m) return part;
      // `data-ouvert` on the heading: the section answers the page's own question and stays open (brief of 2026-11-09:
      // the essential is never folded; final naive test: the 7(a) requirements were folded three screens down).
      return `<details class="pli"${/\bdata-ouvert\b/.test(m[1]) ? ' open' : ''}><summary><h2${m[1]}>${m[2]}</h2></summary><div class="pli-corps">${part.slice(m[0].length)}</div></details>`;
    })
    .join('');
}

/** Opens the folded section that holds the target of a link (#examples, #requirements) before the browser scrolls. */
export const SCRIPT_PLI = `(function(){function o(){var h=location.hash.slice(1);if(!h)return;var t=document.getElementById(decodeURIComponent(h));if(!t)return;var d=t.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details');}t.scrollIntoView();}addEventListener('hashchange',o);if(document.readyState!=='loading')o();else addEventListener('DOMContentLoaded',o);})();`;
