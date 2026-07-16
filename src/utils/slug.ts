/**
 * Utilitários de slug para URLs permanentes das landing pages de pacote.
 * Ex: "GRAND PRIX DE F1 — LAS VEGAS 2026!" → "grand-prix-de-f1-las-vegas-2026"
 */
import type { TrendingPackage } from '../types';

export function slugify(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (combining diacritics)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // qualquer coisa não alfanumérica vira hífen
    .replace(/^-+|-+$/g, '')          // hífens nas pontas
    .slice(0, 80);
}

/** Sanitização leve para digitação manual no campo de slug (preserva hífen final). */
export function sanitizeSlugInput(v: string): string {
  return (v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

/** Garante unicidade do slug diante dos já usados (acrescenta -2, -3, ... se preciso). */
export function uniqueSlug(desired: string, takenSlugs: string[]): string {
  const base = slugify(desired) || 'pacote';
  const taken = new Set(takenSlugs.map(s => (s || '').toLowerCase()).filter(Boolean));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** URL interna da LP do pacote: usa o slug quando existir, senão o índice (retrocompatível). */
export function packagePath(pkg: TrendingPackage, index: number): string {
  return `/pacote/${pkg.slug || index}`;
}

/** Anexa a query string atual (UTMs, fbclid, gclid...) a uma URL de destino. */
export function appendCurrentQuery(url: string): string {
  const search = window.location.search;
  if (!search || search.length <= 1) return url;
  return url + (url.includes('?') ? '&' : '?') + search.slice(1);
}
