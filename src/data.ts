// Static data for the E-Mais Landing Page
// Image URLs are managed via the admin panel (/admin) and stored in localStorage.

import type { EventHighlight, TrendingPackage } from './types';

export function getEventHighlights(): EventHighlight[] {
  return [];
}

export function getTrendingPackages(): TrendingPackage[] {
  return [];
}

// Legacy static exports kept for backwards compatibility
export const EVENT_HIGHLIGHTS: EventHighlight[] = getEventHighlights();
export const TRENDING_PACKAGES: TrendingPackage[] = getTrendingPackages();
