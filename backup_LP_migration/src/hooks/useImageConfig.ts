import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_IMAGES, STORAGE_KEY, type ImageKey } from '../imageConfig';

type ImageOverrides = Partial<Record<ImageKey, string>>;

const UPDATE_EVENT = 'emais_image_update';
const CONTENT_UPDATE_EVENT = 'emais_content_update';
const getSessionToken = () =>
  localStorage.getItem('emais_admin_token') ||
  localStorage.getItem('emais_master_token') ||
  '';


function loadOverrides(): ImageOverrides {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function pushHeroToApi(overrides: ImageOverrides) {
  try {
    // Read current content from cache and attach updated hero images
    const contentRaw = localStorage.getItem('emais_content_cache');
    const content = contentRaw ? JSON.parse(contentRaw) : {};
    await fetch('/api/content', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getSessionToken()}`,
      },
      body: JSON.stringify({ ...content, heroImages: overrides }),
    });
  } catch { /* silent — localStorage already updated */ }
}

export function useImageConfig() {
  const [overrides, setOverrides] = useState<ImageOverrides>(loadOverrides);

  // Fetch hero images from API on mount
  useEffect(() => {
    fetch('/api/content')
      .then(r => r.json())
      .then(data => {
        if (data.heroImages && Object.keys(data.heroImages).length > 0) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.heroImages));
          setOverrides(data.heroImages);
        }
      })
      .catch(() => { /* use local cache */ });
  }, []);

  // Sync when content changes (from useContentConfig saves)
  useEffect(() => {
    const handler = () => setOverrides(loadOverrides());
    window.addEventListener(UPDATE_EVENT, handler);
    window.addEventListener(CONTENT_UPDATE_EVENT, handler);
    return () => {
      window.removeEventListener(UPDATE_EVENT, handler);
      window.removeEventListener(CONTENT_UPDATE_EVENT, handler);
    };
  }, []);

  const getImage = useCallback(
    (key: ImageKey): string => overrides[key] ?? DEFAULT_IMAGES[key],
    [overrides]
  );

  const updateImage = useCallback((key: ImageKey, url: string) => {
    setOverrides(prev => {
      const next = { ...prev, [key]: url };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(UPDATE_EVENT));
      pushHeroToApi(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOverrides({});
    window.dispatchEvent(new Event(UPDATE_EVENT));
    pushHeroToApi({});
  }, []);

  const exportConfig = useCallback((): string => JSON.stringify(overrides, null, 2), [overrides]);

  const importConfig = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as ImageOverrides;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setOverrides(parsed);
      window.dispatchEvent(new Event(UPDATE_EVENT));
      pushHeroToApi(parsed);
      return true;
    } catch { return false; }
  }, []);

  return { getImage, updateImage, resetAll, exportConfig, importConfig, overrides };
}
