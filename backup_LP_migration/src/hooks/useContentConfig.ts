import { useState, useEffect, useCallback, useRef } from 'react';
import type { EventHighlight, TrendingPackage } from '../types';
import {
  DEFAULT_EVENTS,
  DEFAULT_PACKAGES,
} from '../contentConfig';

/* ---------- Session token helper ---------- */
function getSessionToken(): string {
  return localStorage.getItem('emais_admin_token')
      || localStorage.getItem('emais_master_token')
      || '';
}

const CACHE_KEY = 'emais_content_cache';
const CACHE_VERSION = 'v3'; // Bump this to force-clear all browser caches
const CACHE_VER_KEY = 'emais_cache_version';

/* ── Audit helpers ── */
const now = () => new Date().toISOString();

const DEFAULT_CATEGORIES = [
  'Futebol',
  'Futebol Americano',
  'F1 / Automobilismo',
  'UFC / MMA',
  'Tênis',
  'Basquete',
  'WWE / Wrestling',
  'Multiesportivo',
  'Outros',
];

/** Quem está logado no painel ADMIN (edita / cria conteúdo) */
function getAdminUser(): string {
  const v = localStorage.getItem('emais_admin_auth');
  return (v && v !== '1') ? v : 'admin';
}

/** Quem está logado no painel MASTER (aprova / rejeita) */
function getMasterUser(): string {
  const v = localStorage.getItem('emais_master_auth');
  return (v && v !== '1') ? v : 'master';
}

interface ContentStore {
  events: EventHighlight[];
  packages: TrendingPackage[];
  categories: string[];
  categoryIcons: Record<string, string>;
}

function loadCache(): ContentStore | null {
  try {
    if (localStorage.getItem(CACHE_VER_KEY) !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.setItem(CACHE_VER_KEY, CACHE_VERSION);
      return null;
    }
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !Array.isArray(parsed?.events) ||
      !Array.isArray(parsed?.packages) ||
      !Array.isArray(parsed?.categories)
    ) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    // Migrate old caches that lack categoryIcons
    if (!parsed.categoryIcons || typeof parsed.categoryIcons !== 'object') {
      parsed.categoryIcons = {};
    }
    return parsed as ContentStore;
  } catch { return null; }
}

function saveCache(data: ContentStore) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

async function fetchContent(): Promise<ContentStore> {
  const res = await fetch('/api/content');
  if (!res.ok) throw new Error('API error');
  const json = await res.json();
  return {
    events:         json.events         ?? DEFAULT_EVENTS,
    packages:       json.packages       ?? DEFAULT_PACKAGES,
    categories:     json.categories     ?? DEFAULT_CATEGORIES,
    categoryIcons:  json.categoryIcons  ?? {},
  };
}

async function putContent(data: ContentStore & { heroImages?: Record<string, string> }) {
  const res = await fetch('/api/content', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getSessionToken()}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Save failed');
}

const UPDATE_EVENT = 'emais_content_update';
const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('emais_content') : null;

export function useContentConfig() {
  const cached = loadCache();
  const [content, setContent] = useState<ContentStore>(cached ?? {
    events: DEFAULT_EVENTS,
    packages: DEFAULT_PACKAGES,
    categories: DEFAULT_CATEGORIES,
    categoryIcons: {},
  });
  const [loading, setLoading] = useState(!cached);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const lastUpdated = useRef<string>('');
  const isSaving = useRef(false);
  const hasLocalUnsaved = useRef(false);

  const refetch = useCallback(async () => {
    if (isSaving.current) return;
    if (hasLocalUnsaved.current) return; // não sobrescrebe se há alterações locais não salvas
    try {
      const res = await fetch('/api/content');
      if (!res.ok) return;
      const json = await res.json();
      const key = json.updated_at ?? JSON.stringify(json).slice(0, 40);
      if (key === lastUpdated.current) return;
      lastUpdated.current = key;
      const data: ContentStore = {
        events:         json.events         ?? DEFAULT_EVENTS,
        packages:       json.packages       ?? DEFAULT_PACKAGES,
        categories:     json.categories     ?? DEFAULT_CATEGORIES,
        categoryIcons:  json.categoryIcons  ?? {},
      };
      setContent(data);
      saveCache(data);
    } catch { /* keep current */ }
  }, []);

  useEffect(() => {
    let active = true;

    if (cached) {
      lastUpdated.current = JSON.stringify(cached).slice(0, 40);
      setLoading(false);
    } else {
      fetchContent()
        .then(data => { if (active) { setContent(data); saveCache(data); lastUpdated.current = JSON.stringify(data).slice(0, 40); } })
        .catch(() => {})
        .finally(() => { if (active) setLoading(false); });
    }

    const poll = setInterval(() => { if (active) refetch(); }, 5000);

    const handleBC = () => { if (active) refetch(); };
    if (bc) bc.addEventListener('message', handleBC);

    return () => {
      active = false;
      clearInterval(poll);
      if (bc) bc.removeEventListener('message', handleBC);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch]);

  /* ── Save helper ── */
  const persist = useCallback(async (next: ContentStore) => {
    // Merge imagens do localStorage para não perder dados salvos por outras instâncias do hook
    // (ex: ImageAdmin salva imagem, MasterAdmin aprova sem ter carregado a imagem na sua instância)
    const localCache = loadCache();
    const merged: ContentStore = {
      ...next,
      packages: next.packages.map(pkg => {
        // Se o pacote desta instância não tem imagem (undefined/null, NÃO string vazia),
        // busca no cache local por createdAt
        if (localCache && (pkg.img == null || pkg.badgeImg == null)) {
          const cachedPkg = localCache.packages.find(p =>
            pkg.createdAt ? p.createdAt === pkg.createdAt : (p.title === pkg.title && p.loc === pkg.loc)
          );
          if (cachedPkg) {
            return {
              ...pkg,
              img:      pkg.img      ?? cachedPkg.img      ?? '',
              badgeImg: pkg.badgeImg ?? cachedPkg.badgeImg ?? '',
            };
          }
        }
        return pkg;
      }),
    };

    isSaving.current = true;
    hasLocalUnsaved.current = true;
    setSaving(true);
    setSaveError(false);
    setContent(merged);
    saveCache(merged);
    lastUpdated.current = JSON.stringify(merged).slice(0, 40);
    window.dispatchEvent(new Event(UPDATE_EVENT));
    try {
      const heroRaw = localStorage.getItem('emais_image_config');
      const heroImages = heroRaw ? JSON.parse(heroRaw) : {};
      await putContent({ ...merged, heroImages });
      hasLocalUnsaved.current = false;
      setSaveError(false);
      bc?.postMessage('update');
    } catch (err) {
      console.warn('[useContentConfig] API save failed:', err);
      setSaveError(true);
    } finally {
      isSaving.current = false;
      setSaving(false);
    }
  }, []);

  /* ── Events ── */
  const updateEvent = useCallback((i: number, d: Partial<EventHighlight>) =>
    persist({ ...content, events: content.events.map((e, idx) => idx === i ? { ...e, ...d, status: 'pending' } : e) }), [content, persist]);

  const approveEvent = useCallback((i: number) =>
    persist({ ...content, events: content.events.map((e, idx) => idx === i ? { ...e, status: 'approved' } : e) }), [content, persist]);

  const rejectEvent = useCallback((i: number) =>
    persist({ ...content, events: content.events.map((e, idx) => idx === i ? { ...e, status: 'rejected' } : e) }), [content, persist]);

  const masterUpdateEvent = useCallback((i: number, d: Partial<EventHighlight>) =>
    persist({ ...content, events: content.events.map((e, idx) => idx === i ? { ...e, ...d } : e) }), [content, persist]);

  const addEvent = useCallback(() =>
    persist({ ...content, events: [...content.events, { title: 'Novo Evento', location: 'Local', date: 'Data', img: '' }] }), [content, persist]);

  const removeEvent = useCallback((i: number) =>
    persist({ ...content, events: content.events.filter((_, idx) => idx !== i) }), [content, persist]);

  const reorderEvent = useCallback((from: number, to: number) => {
    const arr = [...content.events];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    return persist({ ...content, events: arr });
  }, [content, persist]);

  /* ── Packages ── */
  const updatePackage = useCallback((i: number, d: Partial<TrendingPackage>) => {
    const user = getAdminUser();
    const audit = { updatedBy: user, updatedAt: now(), status: 'pending' as const };
    return persist({ ...content, packages: content.packages.map((p, idx) => idx === i ? { ...p, ...d, ...audit } : p) });
  }, [content, persist]);

  const setPackageTrending = useCallback((i: number, isTrending: boolean) =>
    persist({ ...content, packages: content.packages.map((p, idx) => idx === i ? { ...p, isTrending } : p) }), [content, persist]);

  const approvePackage = useCallback((i: number) => {
    const user = getMasterUser();
    return persist({ ...content, packages: content.packages.map((p, idx) => idx === i ? { ...p, status: 'approved', approvedBy: user, approvedAt: now(), rejectedBy: undefined, rejectedAt: undefined } : p) });
  }, [content, persist]);

  const rejectPackage = useCallback((i: number) => {
    const user = getMasterUser();
    return persist({ ...content, packages: content.packages.map((p, idx) => idx === i ? { ...p, status: 'rejected', rejectedBy: user, rejectedAt: now(), approvedBy: undefined, approvedAt: undefined } : p) });
  }, [content, persist]);

  const masterUpdatePackage = useCallback((i: number, d: Partial<TrendingPackage>) => {
    const user = getMasterUser();
    const audit = { status: 'approved' as const, approvedBy: user, approvedAt: now() };
    return persist({ ...content, packages: content.packages.map((p, idx) => idx === i ? { ...p, ...d, ...audit } : p) });
  }, [content, persist]);

  const addPackage = useCallback(() => {
    const user = getAdminUser();
    return persist({ ...content, packages: [...content.packages, { tag: 'NOVO', title: 'Novo Pacote', loc: 'Local', date: 'Data', price: '0', img: '', badge: 'novo', description: '', flightDetails: '', hotelDetails: '', ticketDetails: '', createdBy: user, createdAt: now() }] });
  }, [content, persist]);

  const removePackage = useCallback((i: number, deletedBy?: string) => {
    const user = deletedBy || getAdminUser();
    return persist({ ...content, packages: content.packages.map((p, idx) =>
      idx === i ? { ...p, deletedAt: now(), deletedBy: user } : p
    )});
  }, [content, persist]);

  const restorePackage = useCallback((i: number) =>
    persist({ ...content, packages: content.packages.map((p, idx) =>
      idx === i ? { ...p, deletedAt: undefined, deletedBy: undefined } : p
    )}), [content, persist]);

  const permanentRemovePackage = useCallback((i: number) =>
    persist({ ...content, packages: content.packages.filter((_, idx) => idx !== i) }), [content, persist]);

  const reorderPackage = useCallback((from: number, to: number) => {
    const arr = [...content.packages];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    return persist({ ...content, packages: arr });
  }, [content, persist]);

  /* ── Categories ── */
  const addCategory = useCallback((name: string) =>
    persist({ ...content, categories: [...content.categories, name.trim()] }), [content, persist]);

  const removeCategory = useCallback((i: number) =>
    persist({ ...content, categories: content.categories.filter((_, idx) => idx !== i) }), [content, persist]);

  const updateCategory = useCallback((i: number, name: string) =>
    persist({ ...content, categories: content.categories.map((c, idx) => idx === i ? name.trim() : c) }), [content, persist]);

  const reorderCategory = useCallback((from: number, to: number) => {
    const arr = [...content.categories];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    return persist({ ...content, categories: arr });
  }, [content, persist]);

  /* ── Category Icons ── */
  const updateCategoryIcon = useCallback((name: string, icon: string) =>
    persist({ ...content, categoryIcons: { ...content.categoryIcons, [name]: icon } }), [content, persist]);

  /* ── Global ── */
  const resetAll = useCallback(async () => {
    const defaults = { events: DEFAULT_EVENTS, packages: DEFAULT_PACKAGES, categories: DEFAULT_CATEGORIES, categoryIcons: {} };
    await persist(defaults);
  }, [persist]);

  const exportConfig = useCallback(() => JSON.stringify(content, null, 2), [content]);

  const importConfig = useCallback(async (json: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(json) as ContentStore;
      await persist(parsed);
      return true;
    } catch { return false; }
  }, [persist]);

  return {
    events: content.events,
    packages: content.packages,
    categories: content.categories,
    categoryIcons: content.categoryIcons,
    loading, saving, saveError,
    updateEvent, addEvent, removeEvent, reorderEvent,
    approveEvent, rejectEvent, masterUpdateEvent,
    updatePackage, addPackage, removePackage, restorePackage, permanentRemovePackage, reorderPackage,
    approvePackage, rejectPackage, masterUpdatePackage, setPackageTrending,
    addCategory, removeCategory, updateCategory, reorderCategory, updateCategoryIcon,
    resetAll, exportConfig, importConfig,
  };
}
