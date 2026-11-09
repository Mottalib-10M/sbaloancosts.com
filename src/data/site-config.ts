/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://sbaloancosts.com";
export const SITE_NAMES: Record<string, string> = {"en": "SBA Loan Costs"};
// Partie du nom affichée en couleur dans l'en-tête (RECETTE §10.3), « » pour aucune.
export const BRAND_ACCENT = "Costs";
export const LANG_TAGS: Record<string, string> = {"en": "en-US"};
export const OG_LOCALES: Record<string, string> = {"en": "en_US"};
export const LOCALE_TAG = 'en-US';
export const CURRENCY = 'USD';
export const YEAR = 2026;
/** Année de création du site — signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
export const LAST_UPDATED = '2026-11-08';
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"en": "Independent publisher of SBA loan cost calculators, based in Clermont-Ferrand, France, working from SBA’s fee notices, its lending rules and its public 7(a) and 504 loan files"};
export const AUTHOR_DESC: Record<string, string> = {"en": "Radif Partners publishes SBA Loan Costs. We read each fiscal year's SBA fee notices, the lending SOP and the Federal Register rate notices, note the date and address of each figure, and load the agency's quarterly loan-by-loan 7(a) and 504 files to count what borrowers were actually charged, state by state and lender by lender. We are not a lender or a broker, take no referral fees and ask for no contact details. Not affiliated with the U.S. Small Business Administration."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"en": ["SBA 7(a) loan guaranty fees for fiscal year 2027", "SBA 7(a) maximum interest rates under SOP 50 10 8.1", "SBA 504 debenture fees", "SBA Microloan program rate limits", "SBA 7(a) and 504 FOIA loan data", "Bank prime loan rate"]};
export const CONTACT_EMAIL = "contact@sbaloancosts.com";
export const THEME_COLOR = '#1F4E79';
export const LOGO_SYMBOL = '7(a)';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime : 'none' pour tous les sites (RECETTE §15.6, décision de l'éditeur du 2026-10-06) :
 *  aucun bandeau ; Clarity chargé en mode sans cookie (consentv2 denied) ; GA4 avec cookies si GA4_ID.
 *  'opt-in' / 'notice' ne servent plus qu'aux sites anciens qui les portent encore. */
export const CONSENT_MODE: 'opt-in' | 'notice' | 'none' = 'none';
/** Propriété Google Analytics 4 (décision de l'éditeur du 2026-10-17, RECETTE §15.6) : GA4 normal,
 *  avec cookies _ga / _ga_<ID> (390 jours), sans bandeau, publicité refusée. Créée par
 *  `seo-platform/scripts/create-ga4.ts accounts/372759688` (RECETTE §15.3, étape 15), puis
 *  pages légales régénérées : `python3 scripts/gen-legal-pages.py .`. Vide = pas de GA4. */
export const GA4_ID = 'G-LJGKJFYBB3';
/** Projet Microsoft Clarity (compte amradif), chargé sans cookie. Vide = aucune mesure. */
export const CLARITY_ID = 'zb6gba3xru';
export const INDEXNOW_KEY = '90e89212187c31e4540b82d357c9499f';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE — À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',            // raison sociale ou nom commercial exploité
  legalForm: '',             // ex. entreprise individuelle, SASU, GmbH, eenmanszaak
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "France",
  phone: '',                 // ligne de contact publiée
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "VAT",
  vatNumber: '',             // laisser vide si non assujetti
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city'];  // forme juridique non publiée, comme sur les autres sites du portefeuille (RECETTE, 2026-09-22)

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;
