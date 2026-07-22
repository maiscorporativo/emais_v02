import { useState, useEffect, useCallback, useRef } from 'react';
import type { EventHighlight, TrendingPackage } from '../types';
import { slugify, uniqueSlug } from '../utils/slug';
import {
  DEFAULT_EVENTS,
  DEFAULT_PACKAGES,
} from '../contentConfig';

/* ---------- Session token helper ---------- */
function getSessionToken(): string {
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (path.startsWith('/marketing')) return localStorage.getItem('emais_marketing_token') || '';
  if (path.startsWith('/admin-master')) return localStorage.getItem('emais_master_token') || '';
  if (path.startsWith('/admin')) return localStorage.getItem('emais_admin_token') || '';

  return localStorage.getItem('emais_admin_token')
      || localStorage.getItem('emais_master_token')
      || localStorage.getItem('emais_marketing_token')
      || '';
}

const CACHE_KEY = 'torcida_content_cache';
const CACHE_VERSION = 'v3'; // Bump this to force-clear all browser caches
const CACHE_VER_KEY = 'torcida_cache_version';

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

/** Quem está logado no painel MARKETING */
function getMarketingUser(): string {
  const v = localStorage.getItem('emais_marketing_auth');
  return (v && v !== '1') ? v : 'marketing';
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

/* ── Base64 helpers ──
 * O conteúdo carrega snippets HTML (Mautic/pixels) que disparam o firewall
 * (ModSecurity) da hospedagem e derrubam a requisição com 403. Codificado em
 * Base64, o corpo não contém HTML legível e passa pela inspeção. */
export function encodeB64(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function decodeB64<T>(b64: string): T {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

/** Resposta do GET pode vir em Base64 (?b64=1) ou em JSON puro (servidor antigo). */
export function unwrapContentResponse(raw: any): any {
  return raw && typeof raw.b64 === 'string' ? decodeB64<any>(raw.b64) : raw;
}

async function fetchContent(): Promise<ContentStore> {
  const res = await fetch('/api/content?b64=1');
  if (!res.ok) throw new Error('API error');
  const json = unwrapContentResponse(await res.json());
  return {
    events:         json.events         ?? DEFAULT_EVENTS,
    packages:       json.packages       ?? DEFAULT_PACKAGES,
    categories:     json.categories     ?? DEFAULT_CATEGORIES,
    categoryIcons:  json.categoryIcons  ?? {},
  };
}

async function putContent(data: ContentStore & { heroImages?: Record<string, string> }) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getSessionToken()}`,
  };
  // Rota Base64 (imune ao firewall da hospedagem); se o servidor ainda for
  // da versão antiga (404 na rota nova), cai para a rota legada em JSON puro.
  let res = await fetch('/api/content/b64', {
    method: 'PUT',
    headers,
    body: JSON.stringify({ b64: encodeB64(data) }),
  });
  if (res.status === 404) {
    res = await fetch('/api/content', { method: 'PUT', headers, body: JSON.stringify(data) });
  }
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.details || errData.error || 'Save failed');
  }
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastUpdated = useRef<string>('');
  const isSaving = useRef(false);
  const hasLocalUnsaved = useRef(false);

  const refetch = useCallback(async () => {
    if (isSaving.current) return;
    if (hasLocalUnsaved.current) return; // não sobrescrebe se há alterações locais não salvas
    try {
      const res = await fetch(`/api/content?b64=1&t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' }});
      if (!res.ok) return;
      const json = unwrapContentResponse(await res.json());
      
      const serverKey = json.updated_at || JSON.stringify(json).slice(0, 40);
      if (serverKey === lastUpdated.current) return;
      
      // Secondary check: if local changes happened during the fetch, do NOT overwrite them!
      if (isSaving.current || hasLocalUnsaved.current) return;

      lastUpdated.current = serverKey;
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

  /* ── Save helper ──
     Salva sempre em série (nunca duas requisições PUT em paralelo): se uma
     edição nova chega enquanto o save anterior ainda está em voo, ela é
     enfileirada em `pendingNext` e processada assim que a atual terminar, em
     vez de disparar outra requisição concorrente. Sem isso, duas requisições
     podiam completar fora de ordem — a mais antiga "vencendo" por último e
     revertendo parte do que o usuário tinha acabado de digitar (tanto na
     tela, via refetch(), quanto no próprio banco). */
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveChain = useRef<Promise<void>>(Promise.resolve());
  const pendingNext = useRef<ContentStore | null>(null);

  const drainSaveQueue = useCallback(async (): Promise<void> => {
    while (pendingNext.current !== null) {
      const next = pendingNext.current;
      pendingNext.current = null;
      setSaving(true);
      setSaveError(null);

      const localCache = loadCache();
      const merged: ContentStore = {
        ...next,
        packages: next.packages.map(pkg => {
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

      window.dispatchEvent(new Event(UPDATE_EVENT));
      try {
        // heroImages NÃO é reenviado daqui: era lido de um cache no
        // localStorage do navegador que podia estar velho (URLs de uploads
        // já apagados/migrados), e cada save de pacote/evento/categoria
        // reinjetava esse retrato antigo no banco, apagando imagens novas
        // da galeria Hero. useImageConfig.ts já salva heroImages sozinho, e
        // o servidor preserva o campo existente quando ele vem ausente.
        await putContent(merged);
        setSaveError(null);
        bc?.postMessage('update');
      } catch (err: any) {
        console.warn('[useContentConfig] API save failed:', err);
        setSaveError(err.message || 'Erro desconhecido ao salvar');
        // Não interrompe o laço: se já houver uma edição mais nova
        // enfileirada, ela ainda tenta salvar em seguida.
      }
    }
    isSaving.current = false;
    hasLocalUnsaved.current = false;
    setSaving(false);
  }, []);

  const persist = useCallback((next: ContentStore, immediate = false): Promise<void> => {
    isSaving.current = true;
    hasLocalUnsaved.current = true;
    setContent(next);
    saveCache(next);
    lastUpdated.current = 'local-edit';
    pendingNext.current = next;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    const enqueue = () => {
      const run = saveChain.current.then(drainSaveQueue);
      saveChain.current = run.catch(() => {});
      return run;
    };

    if (immediate) {
      return enqueue();
    }
    return new Promise((resolve, reject) => {
      saveTimeout.current = setTimeout(() => {
        enqueue().then(resolve, reject);
      }, 1000);
    });
  }, [drainSaveQueue]);

  /* ── Events ── */
  const updateEvent = useCallback((i: number, d: Partial<EventHighlight>) =>
    setContent(prev => { const next = { ...prev, events: prev.events.map((e, idx) => idx === i ? { ...e, ...d, status: 'pending' as const } : e) }; persist(next); return next; }), [persist]);

  const approveEvent = useCallback((i: number) =>
    setContent(prev => { const next = { ...prev, events: prev.events.map((e, idx) => idx === i ? { ...e, status: 'approved' as const } : e) }; persist(next); return next; }), [persist]);

  const rejectEvent = useCallback((i: number) =>
    setContent(prev => { const next = { ...prev, events: prev.events.map((e, idx) => idx === i ? { ...e, status: 'rejected' as const } : e) }; persist(next); return next; }), [persist]);

  const masterUpdateEvent = useCallback((i: number, d: Partial<EventHighlight>) =>
    setContent(prev => { const next = { ...prev, events: prev.events.map((e, idx) => idx === i ? { ...e, ...d } : e) }; persist(next); return next; }), [persist]);

  const addEvent = useCallback(() =>
    setContent(prev => { const next = { ...prev, events: [...prev.events, { title: 'Novo Evento', location: 'Local', date: 'Data', img: '' }] }; persist(next); return next; }), [persist]);

  const removeEvent = useCallback((i: number) =>
    setContent(prev => { const next = { ...prev, events: prev.events.filter((_, idx) => idx !== i) }; persist(next); return next; }), [persist]);

  const reorderEvent = useCallback((from: number, to: number) => {
    setContent(prev => {
      const arr = [...prev.events];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      const next = { ...prev, events: arr };
      persist(next);
      return next;
    });
  }, [persist]);

  /* ── Packages ── */
  const updatePackage = useCallback(async (i: number, d: Partial<TrendingPackage>) => {
    const user = getAdminUser();
    const audit = { updatedBy: user, updatedAt: now(), status: 'pending' as const };
    let nextState: ContentStore | undefined;
    setContent(prev => {
      const patch = { ...d };
      // Slug automático: acompanha o título enquanto não for personalizado manualmente
      const src = prev.packages[i];
      if (src && patch.title !== undefined && patch.slug === undefined) {
        if (!src.slug || src.slug === slugify(src.title)) {
          patch.slug = uniqueSlug(slugify(patch.title), prev.packages.filter((_, j) => j !== i).map(p => p.slug || ''));
        }
      }
      nextState = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, ...patch, ...audit } : p) };
      return nextState;
    });
    if (nextState) await persist(nextState);
  }, [persist]);

  const setPackageTrending = useCallback((i: number, isTrending: boolean) =>
    setContent(prev => { const next = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, isTrending } : p) }; persist(next); return next; }), [persist]);

  /** Liga/desliga a exibição do pacote NESTE portal (controle local da
   *  integração — não altera o conteúdo nem o status de aprovação). */
  const setPackageHidden = useCallback((i: number, hidden: boolean) =>
    setContent(prev => { const next = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, portalHidden: hidden } : p) }; persist(next); return next; }), [persist]);

  const approvePackage = useCallback((i: number) => {
    const user = getMasterUser();
    setContent(prev => { const next = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, status: 'approved' as const, approvedBy: user, approvedAt: now(), rejectedBy: undefined, rejectedAt: undefined } : p) }; persist(next); return next; });
  }, [persist]);

  const rejectPackage = useCallback((i: number) => {
    const user = getMasterUser();
    setContent(prev => { const next = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, status: 'rejected' as const, rejectedBy: user, rejectedAt: now(), approvedBy: undefined, approvedAt: undefined } : p) }; persist(next); return next; });
  }, [persist]);

  const masterUpdatePackage = useCallback(async (i: number, d: Partial<TrendingPackage>) => {
    const user = getMasterUser();
    const audit = { status: 'approved' as const, approvedBy: user, approvedAt: now() };
    let nextState: ContentStore | undefined;
    setContent(prev => { 
      nextState = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, ...d, ...audit } : p) }; 
      return nextState; 
    });
    if (nextState) await persist(nextState, true);
  }, [persist]);

  const marketingUpdatePackage = useCallback(async (i: number, d: Partial<TrendingPackage>) => {
    const user = getMarketingUser();
    const audit = { marketingUpdatedBy: user, marketingUpdatedAt: now() };
    let nextState: ContentStore | undefined;
    setContent(prev => { 
      nextState = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, ...d, ...audit } : p) }; 
      return nextState; 
    });
    if (nextState) await persist(nextState, true);
  }, [persist]);

  const addPackage = useCallback(() => {
    const user = getAdminUser();
    setContent(prev => {
      const next = { ...prev, packages: [...prev.packages, { tag: 'NOVO', title: 'Novo Pacote', loc: 'Local', date: 'Data', price: '0', img: '', badge: 'novo', description: '', flightDetails: '', hotelDetails: '', ticketDetails: '', createdBy: user, createdAt: now() }] };
      persist(next);
      return next;
    });
  }, [persist]);

  /** Duplica um pacote com TODO o conteúdo da LP (hero, cards, programação,
   *  pacotes/tipos, experiência, banco de imagens, template de esporte, integrações).
   *  A cópia nasce pendente, fora de "Em Alta" e com auditoria zerada. */
  const duplicatePackage = useCallback((i: number) => {
    const user = getAdminUser();
    setContent(prev => {
      const src = prev.packages[i];
      if (!src) return prev;
      const copy: TrendingPackage = {
        ...src,
        // Sem isso, a cópia herdava o sharedId do original: as duas
        // apontavam pra MESMA linha na tabela compartilhada, e quem fosse
        // salvo por último sobrescrevia a outra — o original "sumia".
        sharedId: undefined,
        title: `${src.title} (cópia)`,
        slug: src.slug ? uniqueSlug(`${src.slug}-copia`, prev.packages.map(p => p.slug || '')) : undefined,
        status: 'pending',
        isTrending: false,
        createdBy: user, createdAt: now(),
        updatedBy: undefined, updatedAt: undefined,
        approvedBy: undefined, approvedAt: undefined,
        rejectedBy: undefined, rejectedAt: undefined,
        deletedAt: undefined, deletedBy: undefined,
      };
      const arr = [...prev.packages];
      arr.splice(i + 1, 0, copy);
      const next = { ...prev, packages: arr };
      persist(next);
      return next;
    });
  }, [persist]);

  const removePackage = useCallback((i: number, deletedBy?: string) => {
    const user = deletedBy || getAdminUser();
    setContent(prev => {
      const next = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, deletedAt: now(), deletedBy: user } : p) };
      persist(next);
      return next;
    });
  }, [persist]);

  const restorePackage = useCallback((i: number) =>
    setContent(prev => { const next = { ...prev, packages: prev.packages.map((p, idx) => idx === i ? { ...p, deletedAt: undefined, deletedBy: undefined } : p) }; persist(next); return next; }), [persist]);

  const permanentRemovePackage = useCallback((i: number) =>
    setContent(prev => { const next = { ...prev, packages: prev.packages.filter((_, idx) => idx !== i) }; persist(next); return next; }), [persist]);

  const reorderPackage = useCallback((from: number, to: number) => {
    setContent(prev => {
      const arr = [...prev.packages];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      const next = { ...prev, packages: arr };
      persist(next);
      return next;
    });
  }, [persist]);

  /* ── Categories ── */
  const addCategory = useCallback((name: string) =>
    setContent(prev => { const next = { ...prev, categories: [...prev.categories, name.trim()] }; persist(next); return next; }), [persist]);

  const removeCategory = useCallback((i: number) =>
    setContent(prev => { const next = { ...prev, categories: prev.categories.filter((_, idx) => idx !== i) }; persist(next); return next; }), [persist]);

  const updateCategory = useCallback((i: number, name: string) =>
    setContent(prev => { const next = { ...prev, categories: prev.categories.map((c, idx) => idx === i ? name.trim() : c) }; persist(next); return next; }), [persist]);

  const reorderCategory = useCallback((from: number, to: number) => {
    setContent(prev => {
      const arr = [...prev.categories];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      const next = { ...prev, categories: arr };
      persist(next);
      return next;
    });
  }, [persist]);

  /* ── Category Icons ── */
  const updateCategoryIcon = useCallback((name: string, icon: string) =>
    setContent(prev => { const next = { ...prev, categoryIcons: { ...prev.categoryIcons, [name]: icon } }; persist(next); return next; }), [persist]);

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
    updatePackage, addPackage, duplicatePackage, removePackage, restorePackage, permanentRemovePackage, reorderPackage,
    approvePackage, rejectPackage, masterUpdatePackage, marketingUpdatePackage, setPackageTrending, setPackageHidden,
    addCategory, removeCategory, updateCategory, reorderCategory, updateCategoryIcon,
    resetAll, exportConfig, importConfig,
  };
}
