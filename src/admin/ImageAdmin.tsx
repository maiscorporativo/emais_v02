import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ImageIcon, LayoutDashboard, LogOut, RotateCcw,
  Upload, Download, Eye, Shield, X, Plus, Trash2,
  ChevronUp, ChevronDown, CalendarDays, MapPin, Tag,
  DollarSign, FileText, Plane, BedDouble, Ticket, Save,
  Flame, AlertTriangle, Award, Type, Package, ImageIcon as ImgIcon, CheckCircle2, XCircle, Globe2, Clock, GripVertical, Star
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { DEFAULT_IMAGES, type ImageKey } from '../imageConfig';
import { useImageConfig } from '../hooks/useImageConfig';
import { useContentConfig } from '../hooks/useContentConfig';
import type { TrendingPackage } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import { useDialog } from '../components/ui/DialogProvider';


/* ── Auth ───────────────────────────────────────────────────────── */
const AUTH_KEY = 'emais_admin_auth';

/* ── Types ──────────────────────────────────────────────────────── */
type Tab = 'hero' | 'platinum' | 'packages' | 'trending' | 'categories' | 'trash';

/* ── Small helpers ──────────────────────────────────────────────── */
function ImgPreview({ src, size = 80 }: { src: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div style={{ width: size, height: size, borderRadius: 8, background: '#002b52', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #333333' }}>
        <ImageIcon size={size / 3} color="#737373" />
      </div>
    );
  }
  return (
    <img
      src={src} alt="preview"
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, flexShrink: 0, border: '1px solid #333333' }}
      onError={() => setErr(true)}
    />
  );
}

function Field({ label, icon, value, onChange, type = 'text', mono }: {
  label: string; icon?: React.ReactNode; value: string; onChange: (v: string) => void; type?: string; mono?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: '#001529', border: '1px solid #333333', borderRadius: 7,
          color: '#e8edf2', fontSize: mono ? 11 : 13, fontFamily: mono ? 'monospace' : 'inherit',
          padding: '9px 12px', outline: 'none', width: '100%', boxSizing: 'border-box',
        }}
        onFocus={e => { e.target.style.borderColor = '#f7ad40'; }}
        onBlur={e => { e.target.style.borderColor = '#333333'; }}
      />
    </div>
  );
}

function Textarea({ label, icon, value, onChange, rows = 3 }: {
  label: string; icon?: React.ReactNode; value: string; onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        style={{
          background: '#001529', border: '1px solid #333333', borderRadius: 7,
          color: '#e8edf2', fontSize: 13, padding: '9px 12px', outline: 'none',
          width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit',
        }}
        onFocus={e => { e.target.style.borderColor = '#f7ad40'; }}
        onBlur={e => { e.target.style.borderColor = '#333333'; }}
      />
    </div>
  );
}

/* ── UI Helpers for Sections ── */
function AdminSection({ title, icon: Icon, children, color = '#f7ad40' }: { title: string; icon: any; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ marginTop: 24, background: '#001a33', border: '1px solid #003866', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid #002b52', paddingBottom: 12 }}>
        <div style={{ width: 32, height: 32, background: `${color}1a`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        <h4 style={{ fontSize: 12, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function AdminSubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 16, padding: 16, background: '#002042', borderRadius: 10, border: '1px solid #002b52' }}>
      <h5 style={{ fontSize: 10, fontWeight: 800, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f7ad40' }}></div>
        {title}
      </h5>
      {children}
    </div>
  );
}

/* ── Image Upload Field ─────────────────────────────────────────── */

function ImageUploadField({ label, labelIcon, value, onChange }: {
  label: string; labelIcon?: React.ReactNode; value: string; onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem('emais_admin_token') ?? '';

  const handleFile = async (file: File) => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) { setError('Arquivo muito grande. Máximo: 5 MB.'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { setError('Use JPEG, PNG, WebP ou GIF.'); return; }

    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }
      const { url } = await res.json();
      onChange(url); // ex: /uploads/1234567-abc.jpg
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha no upload.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    const currentValue = value || '';

    // Se é imagem hospedada no servidor, deletar do disco
    if (currentValue.startsWith('/uploads/')) {
      setDeleting(true);
      try {
        const filename = currentValue.split('/').pop();
        const res = await fetch(`/api/upload?file=${encodeURIComponent(filename || '')}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Erro ${res.status}`);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Falha ao deletar.';
        setError(msg);
        setDeleting(false);
        return;
      }
      setDeleting(false);
    }

    // Limpar o valor
    onChange('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isUploaded = value?.startsWith('/uploads/');
  const isBase64   = value?.startsWith('data:'); // legado
  const hasValue   = !!value && value.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>{labelIcon}{label}</label>

      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#001529', border: '1px dashed #333333', borderRadius: 8, padding: 10 }}
      >
        <div style={{ flexShrink: 0 }}>
          <ImgPreview src={value} size={72} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: uploading ? '#002b52' : '#1f1f1f',
                color: uploading ? '#737373' : '#f7ad40',
                border: '1px solid #333333', borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: uploading ? 'wait' : 'pointer',
              }}
            >
              <Upload size={13} />
              {uploading ? 'Enviando…' : 'Subir imagem'}
            </button>

            {hasValue && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                title="Remover imagem"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
                  background: deleting ? '#1a0d0d' : '#2a0d0d',
                  color: deleting ? '#7a4a4a' : '#f87171',
                  border: '1px solid #3a1a1a', borderRadius: 7,
                  fontSize: 12, fontWeight: 600, cursor: deleting ? 'wait' : 'pointer',
                }}
              >
                <Trash2 size={13} />
                {deleting ? 'Deletando…' : 'Deletar'}
              </button>
            )}
          </div>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="url"
              value={isBase64 ? '' : (value || '')}
              placeholder={isBase64 ? '(imagem legada — re-envie)' : 'https://... (ou arraste/clique acima)'}
              onChange={e => onChange(e.target.value)}
              style={{
                background: '#002042', border: '1px solid #333333', borderRadius: 7,
                color: '#e8edf2', fontSize: 11, fontFamily: 'monospace',
                padding: '7px 32px 7px 10px', outline: 'none', width: '100%', boxSizing: 'border-box',
              }}
              onFocus={e => { e.target.style.borderColor = '#f7ad40'; }}
              onBlur={e => { e.target.style.borderColor = '#333333'; }}
            />
            {hasValue && !isBase64 && (
              <button
                type="button"
                onClick={() => onChange('')}
                title="Limpar URL"
                style={{
                  position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#737373', padding: 2, display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#737373'; }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <span style={{ fontSize: 10, color: isUploaded ? '#4ade80' : '#737373' }}>
            {isUploaded ? '✅ Imagem enviada (servidor)' : isBase64 ? '⚠️ Base64 legado — re-envie o arquivo' : 'Arraste ou clique em "Subir imagem" · máx. 5 MB'}
          </span>

          {error && <span style={{ fontSize: 11, color: '#ff6b6b' }}>⚠ {error}</span>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
    </div>
  );
}

/* ── Hero Gallery Tab ───────────────────────────────────────────── */
const HERO_ITEMS: { key: ImageKey; label: string }[] = [
  { key: 'hero_col1_1', label: 'Coluna 1 — Imagem 1' }, { key: 'hero_col1_2', label: 'Coluna 1 — Imagem 2' },
  { key: 'hero_col1_3', label: 'Coluna 1 — Imagem 3' }, { key: 'hero_col1_4', label: 'Coluna 1 — Imagem 4' },
  { key: 'hero_col2_1', label: 'Coluna 2 — Imagem 1' }, { key: 'hero_col2_2', label: 'Coluna 2 — Imagem 2' },
  { key: 'hero_col2_3', label: 'Coluna 2 — Imagem 3' }, { key: 'hero_col2_4', label: 'Coluna 2 — Imagem 4' },
  { key: 'hero_col3_1', label: 'Coluna 3 — Imagem 1' }, { key: 'hero_col3_2', label: 'Coluna 3 — Imagem 2' },
  { key: 'hero_col3_3', label: 'Coluna 3 — Imagem 3' }, { key: 'hero_col3_4', label: 'Coluna 3 — Imagem 4' },
];

function HeroImageRow({ imgKey, label }: { imgKey: ImageKey; label: string }) {
  const { getImage, updateImage, overrides } = useImageConfig();
  const [val, setVal] = useState(getImage(imgKey));
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isCustom = !!overrides[imgKey];
  const getToken = () => localStorage.getItem('emais_admin_token') ?? '';

  const save = () => { updateImage(imgKey, val); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const reset = () => { updateImage(imgKey, DEFAULT_IMAGES[imgKey]); setVal(DEFAULT_IMAGES[imgKey]); };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Apenas imagens são permitidas.'); return; }
    setUploading(true);
    setUploadError('');
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }
      const { url } = await res.json();
      setVal(url);
      updateImage(imgKey, url);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Falha no upload.');
    } finally {
      setUploading(false);
    }
  };

  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: '#001529', border: `1px ${dragging ? 'dashed' : 'solid'} ${dragging ? '#f7ad40' : '#262626'}`, borderRadius: 10, padding: 14, transition: 'border-color .15s' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0, width: 90 }}>
        <div style={{ position: 'relative' }}>
          <ImgPreview src={val} size={80} />
        </div>
        <span style={{ fontSize: 10, color: '#737373', textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dragging ? (
          <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: '#f7ad40', fontWeight: 600 }}>
            📂 Solte para substituir a imagem
          </div>
        ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="url" value={val?.startsWith('/uploads/') ? val : (val?.startsWith('data:') ? '' : val)} onChange={e => setVal(e.target.value)}
            placeholder={val?.startsWith('/uploads/') ? val : val?.startsWith('data:') ? '⚠ Base64 legado — re-envie' : 'https://... ou arraste aqui'}
            style={{ flex: 1, background: '#002042', border: '1px solid #333333', borderRadius: 7, color: '#e8edf2', fontSize: 12, padding: '9px 12px', outline: 'none', fontFamily: 'monospace' }}
            onFocus={e => { e.target.style.borderColor = '#f7ad40'; }}
            onBlur={e => { e.target.style.borderColor = '#333333'; }}
          />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = ''; }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            title="Fazer upload de arquivo"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 12px',
              background: '#002042', color: uploading ? '#f7ad40' : '#f7ad40',
              border: '1px solid #333333', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Upload size={13} />{uploading ? '…' : ''}
          </button>
          <button onClick={save} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px',
            background: saved ? '#0d3320' : '#1f1f1f', color: saved ? '#4ade80' : '#f7ad40',
            border: `1px solid ${saved ? '#1a4030' : '#333333'}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>
            <Save size={13} /> {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
        )}
        {uploadError && <span style={{ fontSize: 11, color: '#ff6b6b' }}>⚠ {uploadError}</span>}
        {isCustom && (
          <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', fontSize: 11, color: '#737373', cursor: 'pointer', padding: 0 }}>
            <RotateCcw size={11} /> Restaurar padrão
          </button>
        )}
        {!dragging && <span style={{ fontSize: 10, color: val?.startsWith('/uploads/') ? '#4ade80' : '#737373' }}>
          {val?.startsWith('/uploads/') ? '✅ Imagem no servidor' : 'Arraste ou clique em ↑ para selecionar arquivo'}
        </span>}
      </div>
    </div>
  );
}


function HeroTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: '#737373', margin: '0 0 8px' }}>12 imagens que compõem a galeria animada com scroll automático no topo da página.</p>
      {HERO_ITEMS.map(item => <HeroImageRow key={item.key} imgKey={item.key} label={item.label} />)}
    </div>
  );
}

/* ── Platinum Access Tab ───────────────────────────────────── */
const PLATINUM_ITEMS: { key: ImageKey; label: string }[] = [
  { key: 'platinum_col1_1', label: 'Coluna 1 — Imagem 1' },
  { key: 'platinum_col1_2', label: 'Coluna 1 — Imagem 2' },
  { key: 'platinum_col1_3', label: 'Coluna 1 — Imagem 3' },
  { key: 'platinum_col1_4', label: 'Coluna 1 — Imagem 4' },
  { key: 'platinum_col1_5', label: 'Coluna 1 — Imagem 5' },
  { key: 'platinum_col1_6', label: 'Coluna 1 — Imagem 6' },
  { key: 'platinum_col2_1', label: 'Coluna 2 — Imagem 1' },
  { key: 'platinum_col2_2', label: 'Coluna 2 — Imagem 2' },
  { key: 'platinum_col2_3', label: 'Coluna 2 — Imagem 3' },
  { key: 'platinum_col2_4', label: 'Coluna 2 — Imagem 4' },
  { key: 'platinum_col2_5', label: 'Coluna 2 — Imagem 5' },
  { key: 'platinum_col2_6', label: 'Coluna 2 — Imagem 6' },
];

function PlatinumTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: '#737373', margin: '0 0 8px' }}>12 imagens da grade animada na seção "Acesso Platinum" (2 colunas × 6 imagens).</p>
      {PLATINUM_ITEMS.map(item => <HeroImageRow key={item.key} imgKey={item.key} label={item.label} />)}
    </div>
  );
}

/* ── Events Tab ─────────────────────────────────────────────────── */


/* ── Trending Tab ───────────────────────────────────────────────── */
function TrendingTab() {
  const { packages, updatePackage } = useContentConfig();
  const trending = packages.filter(p => p.isTrending === true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>
          Pacotes marcados como 🔥 <strong style={{ color: '#f7ad40' }}>Em Alta</strong>. Estes aparecem no carrossel principal do site. Máximo de {MAX_TRENDING}.
        </p>
      </div>
      {trending.length === 0 && <EmptyState text="Nenhum pacote marcado como Em Alta. Vá em Pacotes e ative o toggle 🔥." />}
      {trending.map(pkg => {
        const realIdx = packages.findIndex(p => p === pkg);
        return (
          <div key={realIdx} style={{ background: '#002042', border: '1px solid #f7ad40', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
            <ImgPreview src={pkg.img} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf2' }}>{pkg.title || 'Sem título'}</span>
                <span style={{ fontSize: 10, background: '#333333', color: '#f7ad40', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{pkg.tag}</span>
                {pkg.category
                  ? <span style={{ fontSize: 10, background: '#262626', color: '#f7ad40', padding: '2px 8px', borderRadius: 12 }}>{pkg.category}</span>
                  : <span style={{ fontSize: 10, background: '#2a1a00', color: '#fbbf24', padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>⚠ Sem categoria</span>
                }
              </div>
              <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>{pkg.date} · {pkg.loc} · {pkg.currency || 'BRL'} {pkg.price}</div>
            </div>
            <button
              type="button"
              title="Remover de Pacotes em Alta"
              onClick={() => updatePackage(realIdx, { isTrending: false })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#333333', color: '#f7ad40', border: '1px solid #333333', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <Flame size={13} /> Remover
            </button>
          </div>
        );
      })}
      <div style={{ marginTop: 8, padding: '10px 14px', background: '#002042', border: '1px solid #333333', borderRadius: 8, fontSize: 12, color: '#737373' }}>
        {trending.length}/{MAX_TRENDING} slots usados
        <span style={{ display: 'inline-block', width: `${(trending.length / MAX_TRENDING) * 100}%`, height: 4, background: trending.length >= MAX_TRENDING ? '#f87171' : '#f7ad40', borderRadius: 2, marginLeft: 8, verticalAlign: 'middle', maxWidth: 120 }} />
      </div>
    </div>
  );
}

/* ── Packages Tab ───────────────────────────────────────────────── */
const TAG_OPTIONS = ['NOVO LOTE', 'QUASE ESGOTADO', 'PREMIUM', 'POPULAR', 'EXCLUSIVO', 'DESTAQUE'];

const CURRENCIES = [
  { code: 'BRL', symbol: 'R$', label: 'BRL — Real Brasileiro' },
  { code: 'USD', symbol: '$', label: 'USD — Dólar Americano' },
  { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP — Libra Esterlina' },
  { code: 'ARS', symbol: '$', label: 'ARS — Peso Argentino' },
  { code: 'CLP', symbol: '$', label: 'CLP — Peso Chileno' },
  { code: 'COP', symbol: '$', label: 'COP — Peso Colombiano' },
  { code: 'MXN', symbol: '$', label: 'MXN — Peso Mexicano' },
  { code: 'PYG', symbol: '₲', label: 'PYG — Guarani Paraguaio' },
  { code: 'UYU', symbol: '$U', label: 'UYU — Peso Uruguaio' },
  { code: 'PEN', symbol: 'S/', label: 'PEN — Sol Peruano' },
  { code: 'BOB', symbol: 'Bs', label: 'BOB — Boliviano' },
  { code: 'VES', symbol: 'Bs.S', label: 'VES — Bolívar Venezuelano' },
  { code: 'JPY', symbol: '¥', label: 'JPY — Iene Japonês' },
  { code: 'CNY', symbol: '¥', label: 'CNY — Yuan Chinês' },
  { code: 'AUD', symbol: 'A$', label: 'AUD — Dólar Australiano' },
  { code: 'CAD', symbol: 'C$', label: 'CAD — Dólar Canadense' },
  { code: 'CHF', symbol: 'Fr', label: 'CHF — Franco Suíço' },
  { code: 'AED', symbol: 'د.إ', label: 'AED — Dirham Emirados' },
  { code: 'QAR', symbol: '﷼', label: 'QAR — Riyal Catariano' },
  { code: 'SAR', symbol: '﷼', label: 'SAR — Riyal Saudita' },
  { code: 'ZAR', symbol: 'R', label: 'ZAR — Rand Sul-Africano' },
  { code: 'INR', symbol: '₹', label: 'INR — Rúpia Indiana' },
  { code: 'KRW', symbol: '₩', label: 'KRW — Won Sul-Coreano' },
  { code: 'SGD', symbol: 'S$', label: 'SGD — Dólar de Singapura' },
  { code: 'HKD', symbol: 'HK$', label: 'HKD — Dólar de Hong Kong' },
  { code: 'NZD', symbol: 'NZ$', label: 'NZD — Dólar Neozelandês' },
  { code: 'NOK', symbol: 'kr', label: 'NOK — Coroa Norueguesa' },
  { code: 'SEK', symbol: 'kr', label: 'SEK — Coroa Sueca' },
  { code: 'DKK', symbol: 'kr', label: 'DKK — Coroa Dinamarquesa' },
  { code: 'PLN', symbol: 'zł', label: 'PLN — Złoty Polonês' },
];

function CurrencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}><Globe2 size={11} /> Moeda</label>
      <select
        value={value || 'BRL'}
        onChange={e => onChange(e.target.value)}
        style={{ background: '#001529', border: '1px solid #333333', borderRadius: 7, color: '#e8edf2', fontSize: 13, padding: '9px 12px', outline: 'none' }}
        onFocus={e => { e.target.style.borderColor = '#f7ad40'; }}
        onBlur={e => { e.target.style.borderColor = '#333333'; }}
      >
        {CURRENCIES.map(c => (
          <option key={c.code} value={c.code}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Currency-aware Price Mask Input ────────────────────────── */
const CURRENCY_LOCALES: Record<string, string> = {
  BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB',
  ARS: 'es-AR', CLP: 'es-CL', COP: 'es-CO', MXN: 'es-MX',
  PYG: 'es-PY', UYU: 'es-UY', PEN: 'es-PE', BOB: 'es-BO',
  VES: 'es-VE', JPY: 'ja-JP', CNY: 'zh-CN', AUD: 'en-AU',
  CAD: 'en-CA', CHF: 'de-CH', AED: 'ar-AE', QAR: 'ar-QA',
  SAR: 'ar-SA', ZAR: 'en-ZA', INR: 'en-IN', KRW: 'ko-KR',
  SGD: 'en-SG', HKD: 'zh-HK', NZD: 'en-NZ', NOK: 'nb-NO',
  SEK: 'sv-SE', DKK: 'da-DK', PLN: 'pl-PL',
};

/** Returns a locale-formatted number string for display */
function formatPrice(rawDigits: string, currencyCode: string): string {
  const digits = rawDigits.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  const locale = CURRENCY_LOCALES[currencyCode] || 'pt-BR';
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num);
}

/** Returns just the raw digits from a formatted string */
function stripFormatting(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

function PriceMaskInput({
  price, currency, onPriceChange,
}: { price: string; currency: string; onPriceChange: (v: string) => void }) {
  const locale = CURRENCY_LOCALES[currency] || 'pt-BR';
  const currencyEntry = CURRENCIES.find(c => c.code === currency);
  const symbol = currencyEntry?.symbol ?? currency;
  const displayValue = price ? formatPrice(price, currency) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripFormatting(e.target.value);
    onPriceChange(raw); // store raw digits
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
        <DollarSign size={11} /> Preço
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{
          position: 'absolute', left: 10, fontSize: 12, color: '#f7ad40',
          fontWeight: 700, pointerEvents: 'none', userSelect: 'none',
        }}>{symbol}</span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(0)}
          style={{
            background: '#001529', border: '1px solid #333333', borderRadius: 7,
            color: '#e8edf2', fontSize: 13, padding: `9px 12px 9px ${symbol.length > 2 ? 40 : 32}px`,
            outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = '#f7ad40'; }}
          onBlur={e => { e.target.style.borderColor = '#333333'; }}
        />
      </div>
    </div>
  );
}
function DateRangeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [start, end] = value.includes(' - ') ? value.split(' - ') : [value, ''];

  const toInput = (d: string) => {
    const p = d.trim().split('/');
    if (p.length === 3) {
      const day = p[0].padStart(2, '0');
      const month = p[1].padStart(2, '0');
      const year = p[2];
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const fromInput = (d: string) => {
    const p = d.split('-');
    if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return d;
  };

  const handleStart = (v: string) => {
    const newStart = v ? fromInput(v) : '';
    const newEnd = end.trim();
    onChange(newEnd ? `${newStart} - ${newEnd}` : newStart);
  };

  const handleEnd = (v: string) => {
    const newEnd = v ? fromInput(v) : '';
    const newStart = start.trim();
    onChange(newStart ? `${newStart} - ${newEnd}` : newEnd);
  };

  const inputStyle: React.CSSProperties = {
    background: '#001529', border: '1px solid #333333', borderRadius: 7,
    color: '#e8edf2', fontSize: 13, padding: '8px 10px', outline: 'none',
    width: '100%', boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, gridColumn: 'span 2' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarDays size={11} /> Data Ida
        </label>
        <input
          type="date"
          value={toInput(start)}
          onChange={e => handleStart(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CalendarDays size={11} /> Data Volta
        </label>
        <input
          type="date"
          value={toInput(end)}
          onChange={e => handleEnd(e.target.value)}
          style={inputStyle}
        />
      </div>
    </div>
  );
}

const MAX_TRENDING = 8;

function PackageCard({ pkg, index, total, trendingCount, categories, onUpdate, onRemove, onReorder, onSetTrending, onSaved, isOpen, onToggle, dragHandleProps }: {
  pkg: TrendingPackage; index: number; total: number; trendingCount: number; categories: string[];
  onUpdate: (d: Partial<TrendingPackage>) => void;
  onRemove: () => void;
  onReorder: (dir: 'up' | 'down') => void;
  onSetTrending: (v: boolean) => void;
  onSaved?: () => void;
  isOpen: boolean;
  onToggle: () => void;
  dragHandleProps?: any;
}) {
  const { showAlert, showConfirm } = useDialog();
  const [trendMsg, setTrendMsg] = useState<string | null>(null);
  const [hasEdited, setHasEdited] = useState(false);

  const handleToggle = () => {
    if (isOpen && hasEdited) { onSaved?.(); setHasEdited(false); }
    onToggle();
  };

  const handleUpdate = (d: Partial<TrendingPackage>) => { onUpdate(d); setHasEdited(true); };

  const handleTrendToggle = () => {
    if (!pkg.isTrending && trendingCount >= MAX_TRENDING) {
      showAlert(`Já existem ${MAX_TRENDING} pacotes em "Pacotes em Alta". Desative um antes de ativar este.`, 'warning');
      return;
    }
    const next = !pkg.isTrending;
    onSetTrending(next); // direto — sem status: 'pending'
    const msg = next
      ? '🔥 Adicionado a Pacotes em Alta! Nenhuma aprovação necessária.'
      : '🔕 Removido de Pacotes em Alta.';
    setTrendMsg(msg);
    setTimeout(() => setTrendMsg(null), 3500);
  };
  return (
    <div style={{ background: '#002042', border: '1px solid #333333', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }} onClick={handleToggle}>
        <ImgPreview src={pkg.img} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf2' }}>{pkg.title || 'Sem título'}</span>
            <span style={{ fontSize: 10, background: '#333333', color: '#f7ad40', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{pkg.tag}</span>
          </div>
          <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>{pkg.date} · {pkg.loc} · {pkg.currency || 'BRL'} {pkg.price}</div>
        </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {dragHandleProps && (
              <button {...dragHandleProps} onClick={e => e.stopPropagation()} style={{ ...iconBtn(false), cursor: 'grab' }} title="Arrastar pacote">
                <GripVertical size={14} />
              </button>
            )}
            <button onClick={e => { e.stopPropagation(); onReorder('up'); }} disabled={index === 0} style={iconBtn(index === 0)} title="Mover para cima"><ChevronUp size={14} /></button>
            <button onClick={e => { e.stopPropagation(); onReorder('down'); }} disabled={index === total - 1} style={iconBtn(index === total - 1)} title="Mover para baixo"><ChevronDown size={14} /></button>
            <button onClick={async e => { e.stopPropagation(); if (await showConfirm('Remover este pacote?', { type: 'danger', confirmText: 'Remover', title: 'Remover Pacote' })) onRemove(); }} style={iconBtn(false, true)} title="Remover"><Trash2 size={14} /></button>
          </div>
        <span style={{ color: '#737373', fontSize: 12 }}>{isOpen ? '▴' : '▾'}</span>
      </div>
      {isOpen && (
        <div style={{ padding: '0 16px 20px', borderTop: '1px solid #333333' }}>
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Trend notification */}
            {trendMsg && (
              <div style={{
                background: trendMsg.startsWith('🔥') ? '#0d3320' : '#1a2030',
                border: `1px solid ${trendMsg.startsWith('🔥') ? '#1a5c38' : '#333333'}`,
                borderRadius: 8, padding: '10px 14px', fontSize: 12,
                color: trendMsg.startsWith('🔥') ? '#4ade80' : '#f7ad40',
                display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
                animation: 'fadeIn .3s ease',
              }}>
                {trendMsg}
              </div>
            )}

            {/* Approval status warning */}
            {(!pkg.status || pkg.status === 'pending') && (
              <div style={{ background: '#3d2800', border: '1px solid #7a4f00', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ffd57a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={14} style={{ flexShrink: 0 }} />
                <span><strong>Enviado para aprovação,</strong> este pacote só aparecerá no site após aprovação.</span>
              </div>
            )}
            {pkg.status === 'rejected' && (
              <div style={{ background: '#3a0d0d', border: '1px solid #7a1a1a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                <XCircle size={14} /> <span><strong>Rejeitado por {pkg.rejectedBy ?? 'Master'},</strong> corrija e salve para reenviar para aprovação.</span>
              </div>
            )}
            {pkg.status === 'approved' && (
              <div style={{ background: '#0d3320', border: '1px solid #1a5c38', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} /> <span><strong>Aprovado por {pkg.approvedBy ?? 'Master'},</strong> este pacote está visível no site. Qualquer edição voltará para aprovação.</span>
              </div>
            )}
            {/* Audit trail */}
            <AuditTrail pkg={pkg} />

            {/* Audit trail */}
            <AuditTrail pkg={pkg} />

            <AdminSection title="Informações Básicas" icon={Tag}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                <Field label="Título do Pacote" icon={<Tag size={11} />} value={pkg.title} onChange={v => onUpdate({ title: v })} />
                <Field label="Local / Destino" icon={<MapPin size={11} />} value={pkg.loc} onChange={v => onUpdate({ loc: v })} />
                <DateRangeField value={pkg.date} onChange={v => onUpdate({ date: v })} />
                <PriceMaskInput price={pkg.price} currency={pkg.currency || 'BRL'} onPriceChange={v => onUpdate({ price: v })} />
                <CurrencySelect value={pkg.currency || 'BRL'} onChange={v => onUpdate({ currency: v })} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}><Award size={11} /> Tag do Card</label>
                  <select
                    value={pkg.tag}
                    onChange={e => onUpdate({ tag: e.target.value })}
                    style={{ background: '#001529', border: '1px solid #333333', borderRadius: 7, color: '#e8edf2', fontSize: 13, padding: '9px 12px', outline: 'none' }}
                  >
                    {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    {!TAG_OPTIONS.includes(pkg.tag) && <option value={pkg.tag}>{pkg.tag}</option>}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 }}><Package size={11} /> Categoria</label>
                  <select
                    value={pkg.category || ''}
                    onChange={e => onUpdate({ category: e.target.value })}
                    style={{ background: '#001529', border: '1px solid #333333', borderRadius: 7, color: '#e8edf2', fontSize: 13, padding: '9px 12px', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
                  <label style={{ fontSize: 11, color: pkg.isTrending ? '#f7ad40' : '#737373', fontWeight: pkg.isTrending ? 700 : 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={11} /> Em Alta</label>
                  <button
                    type="button"
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: pkg.isTrending || trendingCount < MAX_TRENDING ? 'pointer' : 'not-allowed', position: 'relative', transition: 'background .2s',
                      background: pkg.isTrending ? '#f7ad40' : '#333333', opacity: !pkg.isTrending && trendingCount >= MAX_TRENDING ? 0.5 : 1,
                    }}
                    onClick={handleTrendToggle}
                  >
                    <span style={{
                      position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s',
                      left: pkg.isTrending ? 23 : 3,
                    }} />
                  </button>
                </div>
              </div>
            </AdminSection>

            <AdminSection title="Mídia & Descrição Principal" icon={ImgIcon}>
              <div style={{ display: 'grid', gap: 16 }}>
                <ImageUploadField label="Imagem de Capa do Pacote" value={pkg.img} onChange={v => handleUpdate({ img: v })} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <ImageUploadField
                    label="Logo do Badge (imagem)"
                    labelIcon={<Award size={11} />}
                    value={pkg.badgeImg ?? ''}
                    onChange={v => onUpdate({ badgeImg: v })}
                  />
                  <Field label="Sigla do Badge (Ex: GP)" icon={<Type size={11} />} value={pkg.badge} onChange={v => onUpdate({ badge: v })} />
                </div>
                <Textarea label="Descrição do Pacote (Front)" icon={<FileText size={11} />} value={pkg.description ?? ''} onChange={v => handleUpdate({ description: v })} rows={3} />
              </div>
            </AdminSection>

            <AdminSection title="Detalhes do Pacote (Logística)" icon={Plane} color="#f59e0b">
              <div style={{ display: 'grid', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#333333', padding: 8, borderRadius: 8, marginTop: 24, flexShrink: 0 }}><Plane size={16} color="#f59e0b" /></div>
                  <div style={{ flex: 1 }}>
                    <Textarea label="Logística de Voo" icon={<Plane size={11} />} value={pkg.flightDetails ?? ''} onChange={v => onUpdate({ flightDetails: v })} rows={2} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#333333', padding: 8, borderRadius: 8, marginTop: 24, flexShrink: 0 }}><BedDouble size={16} color="#f59e0b" /></div>
                  <div style={{ flex: 1 }}>
                    <Textarea label="Detalhes de Hospedagem" icon={<BedDouble size={11} />} value={pkg.hotelDetails ?? ''} onChange={v => onUpdate({ hotelDetails: v })} rows={2} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ background: '#333333', padding: 8, borderRadius: 8, marginTop: 24, flexShrink: 0 }}><Ticket size={16} color="#f59e0b" /></div>
                  <div style={{ flex: 1 }}>
                    <Textarea label="Acesso & Ingressos" icon={<Ticket size={11} />} value={pkg.ticketDetails ?? ''} onChange={v => onUpdate({ ticketDetails: v })} rows={2} />
                  </div>
                </div>
              </div>
            </AdminSection>

            <AdminSection title="Hospedagem Detalhada (Landing Page)" icon={BedDouble} color="#10b981">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => {
                  let pacotesObj = { opcoes_hospedagem: [], datas: { partida: '', retorno: '', duracao: '' }, inclusos: [] };
                  try { 
                    const parsed = JSON.parse(pkg.pacotesOptionsData || '{}');
                    pacotesObj = Array.isArray(parsed) ? { ...pacotesObj, opcoes_hospedagem: parsed } : { ...pacotesObj, ...parsed };
                  } catch {}
                  pacotesObj.opcoes_hospedagem.push({ nome: '', descricao_card: '', valor_individual: '', valor_duplo: '', moeda: 'USD', parcelas: '10', inclusos: [] });
                  onUpdate({ pacotesOptionsData: JSON.stringify(pacotesObj) });
                }} style={{ background: '#002b52', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={12} /> Novo Card de Hospedagem
                </button>
              </div>

              {(() => {
                let pacotesObj = { opcoes_hospedagem: [], datas: { partida: '', retorno: '', duracao: '' }, inclusos: [] };
                try { 
                  const parsed = JSON.parse(pkg.pacotesOptionsData || '{}');
                  pacotesObj = Array.isArray(parsed) ? { ...pacotesObj, opcoes_hospedagem: parsed } : { ...pacotesObj, ...parsed };
                } catch {}

                const updatePacotes = (newObj: any) => onUpdate({ pacotesOptionsData: JSON.stringify(newObj) });

                return (
                  <div style={{ display: 'grid', gap: 16 }}>
                    {pacotesObj.opcoes_hospedagem.map((op: any, i: number) => (
                      <div key={`op-${i}`} style={{ background: '#001a33', padding: 16, borderRadius: 10, border: '1px solid #002b52' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <input placeholder="Nome da Hospedagem..." value={op.nome || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].nome=e.target.value; updatePacotes(n); }} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, outline: 'none', width: '80%' }} />
                          <button onClick={() => { const n={...pacotesObj}; n.opcoes_hospedagem.splice(i, 1); updatePacotes(n); }} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={14} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gap: 12 }}>
                          <Textarea label="Breve Descrição do Card" value={op.descricao_card || ''} onChange={v => { const n={...pacotesObj}; n.opcoes_hospedagem[i].descricao_card=v; updatePacotes(n); }} rows={2} />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                            <Field label="V. Individual" value={op.valor_individual || ''} onChange={v => { const n={...pacotesObj}; n.opcoes_hospedagem[i].valor_individual=v; updatePacotes(n); }} />
                            <Field label="V. Duplo" value={op.valor_duplo || ''} onChange={v => { const n={...pacotesObj}; n.opcoes_hospedagem[i].valor_duplo=v; updatePacotes(n); }} />
                            <Field label="Moeda" value={op.moeda || 'USD'} onChange={v => { const n={...pacotesObj}; n.opcoes_hospedagem[i].moeda=v; updatePacotes(n); }} />
                          </div>

                          <AdminSubSection title="Inclusos Específicos">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                              <button onClick={() => {
                                const n = { ...pacotesObj };
                                if(!n.opcoes_hospedagem[i].inclusos) n.opcoes_hospedagem[i].inclusos = [];
                                n.opcoes_hospedagem[i].inclusos.push({ titulo: '', descricao: '' });
                                updatePacotes(n);
                              }} style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 9 }}>+ Item</button>
                            </div>
                            {(op.inclusos || []).map((inc: any, j: number) => (
                              <div key={`inc-local-${j}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                                <input placeholder="Título..." value={inc.titulo || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].inclusos[j].titulo=e.target.value; updatePacotes(n); }} style={{ background: '#001529', border: '1px solid #003866', borderRadius: 4, color: '#eee', fontSize: 11, padding: '4px 8px' }} />
                                <input placeholder="Desc..." value={inc.descricao || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].inclusos[j].descricao=e.target.value; updatePacotes(n); }} style={{ background: '#001529', border: '1px solid #003866', borderRadius: 4, color: '#eee', fontSize: 11, padding: '4px 8px' }} />
                                <button onClick={() => { const n={...pacotesObj}; n.opcoes_hospedagem[i].inclusos.splice(j, 1); updatePacotes(n); }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}><X size={12} /></button>
                              </div>
                            ))}
                          </AdminSubSection>
                        </div>
                      </div>
                    ))}

                    <AdminSubSection title="Datas & Inclusos Globais (Fallback)">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <Field label="Partida" value={pacotesObj.datas?.partida || ''} onChange={v => { const n={...pacotesObj}; if(!n.datas) n.datas={} as any; n.datas.partida=v; updatePacotes(n); }} />
                        <Field label="Retorno" value={pacotesObj.datas?.retorno || ''} onChange={v => { const n={...pacotesObj}; if(!n.datas) n.datas={} as any; n.datas.retorno=v; updatePacotes(n); }} />
                        <Field label="Resumo" value={pacotesObj.datas?.duracao || ''} onChange={v => { const n={...pacotesObj}; if(!n.datas) n.datas={} as any; n.datas.duracao=v; updatePacotes(n); }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, color: '#555', fontWeight: 800 }}>INCLUSOS PADRÃO</span>
                        <button onClick={() => {
                          const n = { ...pacotesObj }; if(!n.inclusos) n.inclusos=[]; n.inclusos.push({ titulo: '', descricao: '' });
                          updatePacotes(n);
                        }} style={{ background: '#002042', border: '1px solid #333', color: '#fff', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 9 }}>+ Adicionar Item Global</button>
                      </div>
                      {(pacotesObj.inclusos || []).map((inc: any, i: number) => (
                        <div key={`inc-global-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 8, marginBottom: 6 }}>
                          <input placeholder="Título..." value={inc.titulo || ''} onChange={e => { const n={...pacotesObj}; n.inclusos[i].titulo=e.target.value; updatePacotes(n); }} style={{ background: '#001529', border: '1px solid #003866', borderRadius: 4, color: '#eee', fontSize: 11, padding: '4px 8px' }} />
                          <input placeholder="Descrição..." value={inc.descricao || ''} onChange={e => { const n={...pacotesObj}; n.inclusos[i].descricao=e.target.value; updatePacotes(n); }} style={{ background: '#001529', border: '1px solid #003866', borderRadius: 4, color: '#eee', fontSize: 11, padding: '4px 8px' }} />
                          <button onClick={() => { const n={...pacotesObj}; n.inclusos.splice(i, 1); updatePacotes(n); }} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={14} /></button>
                        </div>
                      ))}
                    </AdminSubSection>
                  </div>
                );
              })()}
            </AdminSection>

            <AdminSection title="Programação do Evento" icon={CalendarDays} color="#8b5cf6">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button onClick={() => {
                  const p = (() => { try { return JSON.parse(pkg.programacaoData || '[]'); } catch { return []; } })();
                  p.push({ titulo_aba: '', titulo_dia: '', atividades: [] });
                  onUpdate({ programacaoData: JSON.stringify(p) });
                }} style={{ background: '#002b52', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={12} /> Adicionar Dia
                </button>
              </div>
              {(() => {
                const prog = (() => { try { return JSON.parse(pkg.programacaoData || '[]'); } catch { return []; } })();
                return (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {prog.map((day: any, i: number) => (
                      <div key={`prog-comm-${i}`} style={{ background: '#001a33', padding: 16, borderRadius: 10, border: '1px solid #002b52' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: 8, marginBottom: 12 }}>
                          <Field label="Aba" value={day.titulo_aba || ''} onChange={v => { const n=[...prog]; n[i].titulo_aba=v; onUpdate({ programacaoData: JSON.stringify(n) }); }} />
                          <Field label="Título do Dia" value={day.titulo_dia || ''} onChange={v => { const n=[...prog]; n[i].titulo_dia=v; onUpdate({ programacaoData: JSON.stringify(n) }); }} />
                          <button onClick={() => { const n=[...prog]; n.splice(i, 1); onUpdate({ programacaoData: JSON.stringify(n) }); }} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', marginTop: 20 }}><Trash2 size={14} /></button>
                        </div>
                        <AdminSubSection title="Atividades">
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                            <button onClick={() => {
                              const n = [...prog]; if(!n[i].atividades) n[i].atividades = [];
                              n[i].atividades.push({ horario: '', descricao: '' });
                              onUpdate({ programacaoData: JSON.stringify(n) });
                            }} style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 9 }}>+ Atividade</button>
                          </div>
                          {(day.atividades || []).map((ativ: any, j: number) => (
                            <div key={`ativ-comm-${j}`} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 6, marginBottom: 6 }}>
                              <input placeholder="08:00" value={ativ.horario || ''} onChange={e => { const n=[...prog]; n[i].atividades[j].horario=e.target.value; onUpdate({ programacaoData: JSON.stringify(n) }); }} style={{ background: '#001529', border: '1px solid #003866', borderRadius: 4, color: '#eee', fontSize: 11, padding: '4px 8px' }} />
                              <input placeholder="Descrição..." value={ativ.descricao || ''} onChange={e => { const n=[...prog]; n[i].atividades[j].descricao=e.target.value; onUpdate({ programacaoData: JSON.stringify(n) }); }} style={{ background: '#001529', border: '1px solid #003866', borderRadius: 4, color: '#eee', fontSize: 11, padding: '4px 8px' }} />
                              <button onClick={() => { const n=[...prog]; n[i].atividades.splice(j, 1); onUpdate({ programacaoData: JSON.stringify(n) }); }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}><X size={12} /></button>
                            </div>
                          ))}
                        </AdminSubSection>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </AdminSection>

            <AdminSection title="Experiência & Benefícios (Cards)" icon={Star} color="#ec4899">
              <div style={{ display: 'grid', gap: 16 }}>
                <Textarea label="Texto da Seção Experiência" value={pkg.experienciaSection ?? ''} onChange={v => onUpdate({ experienciaSection: v })} rows={3} />
                
                <AdminSubSection title="Cards de Destaque">
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                    <button onClick={() => {
                      const c = (() => { try { return JSON.parse(pkg.cardsData || '[]'); } catch { return []; } })();
                      c.push({ titulo: '', descricao: '', icone: 'Zap' });
                      onUpdate({ cardsData: JSON.stringify(c) });
                    }} style={{ background: '#003866', border: '1px solid #333', color: '#fff', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>+ Adicionar Card</button>
                  </div>
                  {(() => {
                    const cards = (() => { try { return JSON.parse(pkg.cardsData || '[]'); } catch { return []; } })();
                    return cards.map((c: any, i: number) => (
                      <div key={`card-comm-${i}`} style={{ background: '#001a33', padding: 12, borderRadius: 8, border: '1px solid #002b52', marginBottom: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <input placeholder="Título do Card..." value={c.titulo || ''} onChange={e => { const n=[...cards]; n[i].titulo=e.target.value; onUpdate({ cardsData: JSON.stringify(n) }); }} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, outline: 'none' }} />
                          <button onClick={() => { const n=[...cards]; n.splice(i, 1); onUpdate({ cardsData: JSON.stringify(n) }); }} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}><X size={12} /></button>
                        </div>
                        <Textarea label="Descrição do Card" value={c.descricao || ''} onChange={v => { const n=[...cards]; n[i].descricao=v; onUpdate({ cardsData: JSON.stringify(n) }); }} rows={2} />
                      </div>
                    ));
                  })()}
                </AdminSubSection>
              </div>
            </AdminSection>

            <div style={{ marginTop: 24, padding: 16, background: '#3a0d0d1a', borderRadius: 12, border: '1px solid #3a0d0d', display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertTriangle size={20} color="#f87171" />
              <p style={{ fontSize: 12, color: '#f87171', margin: 0, lineHeight: 1.5 }}>
                <strong>Atenção:</strong> Informações de Rastreamento (Mautic, Pixels e Webhooks) devem ser configuradas exclusivamente pelo módulo de <strong>Marketing</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}

function SortablePackageCard(props: any) {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef, isDragging } = useSortable({ id: props.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative',
  };
  return (
    <div ref={setNodeRef} style={style}>
      <PackageCard {...props} dragHandleProps={{ ref: setActivatorNodeRef, ...attributes, ...listeners }} />
    </div>
  );
}

function PackagesTab() {
  const { packages, categories, updatePackage, addPackage, removePackage, reorderPackage, setPackageTrending } = useContentConfig();
  const { toast } = useToast();
  const [openRealIdx, setOpenRealIdx] = useState<number | null>(null);
  const activePackages = packages
    .map((p, realIdx) => ({ p, realIdx }))
    .filter(({ p }) => !p.deletedAt);
  const trendingCount = activePackages.filter(({ p }) => p.isTrending === true).length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activePackages.findIndex(x => x.realIdx === active.id);
      const newIndex = activePackages.findIndex(x => x.realIdx === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderPackage(activePackages[oldIndex].realIdx, activePackages[newIndex].realIdx);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 13, color: '#737373', margin: 0 }}>
          Gerencie todos os pacotes. Use o toggle{' '}
          <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', color: '#f7ad40', gap: 3 }}>
            <Flame size={13} /> <strong style={{ color: '#f7ad40' }}>Em Alta</strong>
          </span>{' '}
          para escolher quais aparecem no carrossel principal do site.
        </p>
        <button onClick={() => { addPackage(); toast('Pacote criado!', 'success'); }} style={addBtn}><Plus size={14} /> Adicionar Pacote</button>
      </div>
      {trendingCount >= MAX_TRENDING && (
        <div style={{ background: '#1a1400', border: '1px solid #7a4a00', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={13} /> <strong>Limite atingido:</strong> já há {MAX_TRENDING} pacotes em "Em Alta". Desative um antes de ativar outro.
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activePackages.map(x => x.realIdx)} strategy={verticalListSortingStrategy}>
          {activePackages.map(({ p: pkg, realIdx }) => (
            <SortablePackageCard
              key={realIdx}
              id={realIdx}
              pkg={pkg}
              index={realIdx}
              total={packages.length}
              trendingCount={trendingCount}
              categories={categories}
              isOpen={openRealIdx === realIdx}
              onToggle={() => setOpenRealIdx(prev => prev === realIdx ? null : realIdx)}
              onUpdate={(d: any) => updatePackage(realIdx, d)}
              onSetTrending={(v: any) => setPackageTrending(realIdx, v)}
              onRemove={() => { removePackage(realIdx); toast('Pacote movido para a lixeira.', 'warning'); }}
              onReorder={(dir: string) => reorderPackage(realIdx, dir === 'up' ? realIdx - 1 : realIdx + 1)}
              onSaved={() => toast('Pacote atualizado!', 'success')}
            />
          ))}
        </SortableContext>
      </DndContext>
      {activePackages.length === 0 && <EmptyState text="Nenhum pacote ativo. Verifique a Lixeira ou clique em Adicionar Pacote." />}
    </div>
  );
}

/* ── Sports Emoji Picker for Categories ─────────────────── */
const SPORT_EMOJIS = [
  // Futebol e bolas
  '⚽','🏀','🏈','⚾','🆓','🏐','🏉','🥏',
  // Raquetes e Mesas
  '🎾','🏓','🏸','🎱',
  // Combate
  '🥊','🥋','🤼‍♂️','🤺',
  // Corrida e Atletismo
  '🏃','🏃‍♂️','🏃‍♀️','🧘','🧘‍♂️','🤸','🤸‍♂️',
  // Peso e Ginástica
  '🏋️','🏋️‍♂️','⛹️','⛹️‍♂️',
  // Aquaticos
  '🏄','🏄‍♂️','🏄‍♀️','🏈️','🏈️‍♂️','🤽','🤽‍♂️','🚣','🚣‍♂️','🤿',
  // Ciclismo e Motor
  '🚴','🚴‍♂️','🚴‍♀️','🏐️','🏍️','🏁','🏎️','🚘','⚡','⏱️','🎫',
  // Inverno e Montanha
  '⛷️','🏂','🧗','🧗‍♂️','🛷','⛰️',
  // Alvo e Equestre
  '🎯','🏹','🏇',
  // Campo e Bastao
  '🏑','🏒','🥍','🪃','🏏','⛳','🏌️',
  // Skate e outros
  '🛹','🤾','🤾‍♂️','🧗‍♀️',
  // Prêmios e Geral
  '🏆','🥇','🥈','🥉','🏅','🎖️','🏟️','🎟️',
];

function EmojiPicker({ currentEmoji, onChange }: {
  currentEmoji: string;
  onChange: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        title="Escolher emoji"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 36, height: 36, borderRadius: 8, fontSize: 20,
          background: open ? '#333333' : '#1f1f1f',
          border: `1px solid ${open ? '#f7ad40' : '#333333'}`,
          cursor: 'pointer', flexShrink: 0, transition: 'all .15s',
        }}
      >
        {currentEmoji || '⚽'}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
          background: '#001a33', border: '1px solid #333333', borderRadius: 10,
          padding: 10, width: 270, boxShadow: '0 8px 32px rgba(0,0,0,.6)',
        }}>
          <p style={{ fontSize: 10, color: '#737373', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Escolha o emoji do esporte</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, maxHeight: 210, overflowY: 'auto' }}>
            {SPORT_EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                title={emoji}
                onClick={() => { onChange(emoji); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '100%', aspectRatio: '1', borderRadius: 6, border: 'none',
                  background: currentEmoji === emoji ? '#f7ad40' : '#1f1f1f',
                  fontSize: 18, cursor: 'pointer', transition: 'background .1s',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{ marginTop: 8, width: '100%', background: 'none', border: '1px solid #333333', borderRadius: 6, color: '#737373', fontSize: 11, padding: '5px 0', cursor: 'pointer' }}
          >Fechar</button>
        </div>
      )}
    </div>
  );
}


function SortableCategoryItem({ cat, i, categoryIcons, updateCategoryIcon, reorderCategory, editIdx, editVal, setEditVal, confirmEdit, setEditIdx, startEdit, removeCategory, categoriesCount, toast, showConfirm }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, setActivatorNodeRef, isDragging } = useSortable({ id: cat });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 8, background: '#002042', border: '1px solid #333333', borderRadius: 8, padding: '10px 12px'
  };

  return (
    <div ref={setNodeRef} style={style}>
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'grab', padding: 0 }} title="Arrastar">
        <GripVertical size={14} />
      </button>

      {/* Emoji picker */}
      <EmojiPicker currentEmoji={categoryIcons[cat] ?? ''} onChange={emoji => updateCategoryIcon(cat, emoji)} />

      {/* Reorder buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <button onClick={() => reorderCategory(i, i - 1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? '#333333' : '#737373', cursor: i === 0 ? 'default' : 'pointer', padding: 0, lineHeight: 1 }}><ChevronUp size={13} /></button>
        <button onClick={() => reorderCategory(i, i + 1)} disabled={i === categoriesCount - 1} style={{ background: 'none', border: 'none', color: i === categoriesCount - 1 ? '#333333' : '#737373', cursor: i === categoriesCount - 1 ? 'default' : 'pointer', padding: 0, lineHeight: 1 }}><ChevronDown size={13} /></button>
      </div>

      {editIdx === i ? (
        <input
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') confirmEdit(); if (e.key === 'Escape') setEditIdx(null); }}
          autoFocus
           style={{ flex: 1, background: '#001529', border: '1px solid #f7ad40', borderRadius: 6, color: '#e8edf2', fontSize: 13, padding: '6px 10px', outline: 'none' }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: 13, color: '#e8edf2' }}>{cat}</span>
      )}

      {editIdx === i ? (
        <button onClick={confirmEdit} style={{ background: '#0d3320', border: '1px solid #1a5c38', borderRadius: 6, color: '#4ade80', fontSize: 11, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>✓ Salvar</button>
      ) : (
        <button onClick={() => startEdit(i)} style={{ background: '#1f1f1f', border: '1px solid #333333', borderRadius: 6, color: '#f7ad40', fontSize: 11, padding: '5px 10px', cursor: 'pointer' }}>Editar</button>
      )}
      <button onClick={async () => { if (await showConfirm(`Remover a categoria "${cat}"?`, { type: 'danger', confirmText: 'Remover', title: 'Remover Categoria' })) { removeCategory(i); toast(`Categoria "${cat}" removida.`, 'warning'); } }} style={{ background: '#2a0a0a', border: '1px solid #3a1a1a', borderRadius: 6, color: '#ff6b6b', fontSize: 11, padding: '5px 8px', cursor: 'pointer' }}><Trash2 size={12} /></button>
    </div>
  );
}

/* ── Categories Tab ───────────────────────────────────────────── */
function CategoriesTab() {
  const { categories, categoryIcons, addCategory, removeCategory, updateCategory, reorderCategory, updateCategoryIcon } = useContentConfig();
  const { toast } = useToast();
  const { showConfirm } = useDialog();
  const [newName, setNewName] = useState('');
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setNewName('');
    toast(`Categoria "${trimmed}" criada!`, 'success');
  };

  const startEdit = (i: number) => { setEditIdx(i); setEditVal(categories[i]); };
  const confirmEdit = () => {
    if (editIdx !== null && editVal.trim()) { updateCategory(editIdx, editVal); toast('Categoria atualizada!', 'info'); }
    setEditIdx(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.indexOf(active.id as string);
      const newIndex = categories.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderCategory(oldIndex, newIndex);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e8edf2', margin: 0 }}>Categorias</h2>
        <span style={{ fontSize: 12, color: '#737373' }}>{categories.length} categori{categories.length !== 1 ? 'as' : 'a'}</span>
      </div>

      {/* Add new */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Nome da nova categoria..."
          style={{ flex: 1, background: '#001529', border: '1px solid #333333', borderRadius: 8, color: '#e8edf2', fontSize: 13, padding: '10px 12px', outline: 'none' }}
          onFocus={e => { e.target.style.borderColor = '#f7ad40'; }}
          onBlur={e => { e.target.style.borderColor = '#333333'; }}
        />
        <button
          onClick={handleAdd}
          disabled={!newName.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: newName.trim() ? 'linear-gradient(135deg, #f7ad40, #d45f1a)' : '#1f1f1f', color: newName.trim() ? '#002042' : '#737373', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'not-allowed' }}
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {/* Helper text */}
      <p style={{ fontSize: 11, color: '#737373', margin: '-8px 0 0' }}>Clique no emoji à esquerda de cada categoria para trocar o emoji do esporte.</p>

      {/* Category list */}
      {categories.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#737373', fontSize: 13 }}>Nenhuma categoria. Adicione uma acima.</div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={categories} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {categories.map((cat, i) => (
              <SortableCategoryItem
                key={cat}
                cat={cat}
                i={i}
                categoriesCount={categories.length}
                categoryIcons={categoryIcons}
                updateCategoryIcon={updateCategoryIcon}
                reorderCategory={reorderCategory}
                editIdx={editIdx}
                editVal={editVal}
                setEditVal={setEditVal}
                confirmEdit={confirmEdit}
                setEditIdx={setEditIdx}
                startEdit={startEdit}
                removeCategory={removeCategory}
                toast={toast}
                showConfirm={showConfirm}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

/* ── Trash Tab ────────────────────────────────── */
function TrashTab() {
  const { packages } = useContentConfig();
  const deleted = packages
    .map((p, realIdx) => ({ p, realIdx }))
    .filter(({ p }) => !!p.deletedAt);

  if (deleted.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px', color: '#737373' }}>
        <Trash2 size={32} />
        <span style={{ fontSize: 14 }}>Lixeira vazia. Pacotes excluídos aparecerão aqui.</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#1a1400', border: '1px solid #7a4a00', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={13} /> Pacotes na lixeira não aparecem no site. Somente o <strong>Admin Master</strong> pode restaurar ou deletar permanentemente.
      </div>
      {deleted.map(({ p: pkg, realIdx }) => (
        <div key={realIdx} style={{ background: '#002042', border: '1px solid #3a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', opacity: 0.8 }}>
          <ImgPreview src={pkg.img} size={52} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf2' }}>{pkg.title || 'Sem título'}</div>
            <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
              Excluído por <strong style={{ color: '#f7ad40' }}>{pkg.deletedBy ?? 'admin'}</strong>
              {pkg.deletedAt ? ` em ${new Date(pkg.deletedAt).toLocaleDateString('pt-BR')}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              disabled
              title="Somente o Admin Master pode restaurar pacotes"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#0d3320', color: '#4ade80', border: '1px solid #1a5c38', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', opacity: 0.4 }}
            >
              <RotateCcw size={13} /> Restaurar
            </button>
            <button
              disabled
              title="Somente o Admin Master pode deletar permanentemente"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#2a0a0a', color: '#ff6b6b', border: '1px solid #3a1a1a', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'not-allowed', opacity: 0.4 }}
            >
              <Trash2 size={13} /> Deletar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


/* ── Util components ────────────────────────────────────────────── */
function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#737373', fontSize: 14, background: '#002042', borderRadius: 12, border: '1px dashed #333333' }}>
      {text}
    </div>
  );
}

/* ── Style helpers ──────────────────────────────────────────────── */
const iconBtn = (disabled: boolean, danger = false): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 6, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? '#001529' : danger ? '#2a0a0a' : '#1f1f1f',
  color: disabled ? '#2a3a4a' : danger ? '#ff6b6b' : '#f7ad40',
  flexShrink: 0,
});

const addBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
  background: 'linear-gradient(135deg, #f7ad40, #d45f1a)', color: '#002042',
  border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
};

/* ── Audit Trail ─────────────────────────────────────────────────── */
function fmtDate(iso?: string) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch { return iso; }
}

function AuditTrail({ pkg }: { pkg: import('../types').TrendingPackage }) {
  const rows: { label: string; user?: string; at?: string; color: string }[] = [];
  if (pkg.createdBy) rows.push({ label: 'Criado por', user: pkg.createdBy, at: pkg.createdAt, color: '#4a7fa8' });
  if (pkg.updatedBy) rows.push({ label: 'Editado por', user: pkg.updatedBy, at: pkg.updatedAt, color: '#f39c12' });
  if (pkg.approvedBy) rows.push({ label: 'Autorizado por', user: pkg.approvedBy, at: pkg.approvedAt, color: '#4ade80' });
  if (pkg.rejectedBy) rows.push({ label: 'Rejeitado por', user: pkg.rejectedBy, at: pkg.rejectedAt, color: '#f87171' });
  if (!rows.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
      {rows.map(r => (
        <span key={r.label} style={{ fontSize: 10, background: '#001529', border: `1px solid ${r.color}22`, borderRadius: 6, padding: '3px 8px', color: r.color, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ opacity: 0.7 }}>{r.label}:</span>
          <strong>{r.user}</strong>
          {r.at && <span style={{ opacity: 0.5 }}>· {fmtDate(r.at)}</span>}
        </span>
      ))}
    </div>
  );
}

/* ── Login Screen ───────────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw, role: 'admin' }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(AUTH_KEY, data.username ?? username);
        localStorage.setItem('emais_admin_token', data.token);
        onLogin();
      } else {
        const data = await res.json();
        setError(data.error || 'Usuário ou senha inválidos');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    background: '#001529',
    border: `1px solid ${hasErr ? '#e55' : '#333333'}`,
    borderRadius: 8, color: '#fff', fontSize: 14, padding: '12px 14px', outline: 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #001529 0%, #002b52 50%, #001529 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <form onSubmit={handleSubmit} style={{
        background: '#002042', border: '1px solid #333333', borderRadius: 16,
        padding: '40px 36px', width: 360, display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        animation: shake ? 'shake .4s ease' : 'none',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Shield size={36} color="#f7ad40" /></div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', textAlign: 'center', margin: 0 }}>Painel Admin</h1>
        <p style={{ fontSize: 13, color: '#737373', textAlign: 'center', margin: 0 }}>E-Mais · Gerenciador de Conteúdo</p>
        <input
          type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }}
          placeholder="Usuário" autoFocus autoComplete="username"
          style={inputStyle(!!error)}
        />
        <input
          type="password" value={pw} onChange={e => { setPw(e.target.value); setError(''); }}
          placeholder="Senha" autoComplete="current-password"
          style={inputStyle(!!error)}
        />
        {error && <p style={{ color: '#ff6b6b', fontSize: 12, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #f7ad40, #d45f1a)', color: '#002042', fontWeight: 700, fontSize: 14, border: 'none', borderRadius: 8, padding: 13, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

/* ── Main Admin Panel ───────────────────────────────────────────── */
export default function ImageAdmin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => {
    const v = localStorage.getItem(AUTH_KEY);
    if (v === '1') { localStorage.removeItem(AUTH_KEY); return false; } // limpa sessão legada
    return !!v;
  });
  const [tab, setTab] = useState<Tab>('packages');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const { packages, exportConfig: exportContent, importConfig: importContent, resetAll: resetContent, saving, saveError } = useContentConfig();
  const { exportConfig: exportImages, importConfig: importImages, resetAll: resetImages } = useImageConfig();

  const deletedCount = packages.filter(p => !!p.deletedAt).length;

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Exibe toast quando o servidor falhar ao salvar
  useEffect(() => {
    if (saveError) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showToast('Não foi possível salvar no servidor. As alterações foram mantidas localmente — reinicie o servidor e salve novamente.', 'error');
    }
  }, [saveError, showToast]);

  const handleExport = () => {
    const data = { content: JSON.parse(exportContent()), images: JSON.parse(exportImages()) };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'emais-config.json'; a.click();
    URL.revokeObjectURL(url);
    showToast('Configuração exportada com sucesso!');
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      if (parsed.content) importContent(JSON.stringify(parsed.content));
      if (parsed.images) importImages(JSON.stringify(parsed.images));
      showToast('Configuração importada com sucesso!');
      setImportText(''); setShowImport(false);
    } catch { showToast('JSON inválido.', 'error'); }
  };

  const handleReset = () => {
    resetContent(); resetImages();
    setShowResetConfirm(false);
    showToast('Tudo resetado para o padrão.');
  };

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const TABS: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: 'packages',     label: 'Pacotes',          icon: <Package size={15} /> },
    { id: 'trending',     label: 'Pacotes em Alta',  icon: <Flame size={15} /> },
    { id: 'categories',   label: 'Categorias',       icon: <Tag size={15} /> },
    { id: 'platinum',     label: 'Galeria Platinum', icon: <Award size={15} /> },
    { id: 'hero',         label: 'Galeria Hero',     icon: <ImgIcon size={15} /> },
    { id: 'trash',        label: deletedCount > 0 ? `Lixeira (${deletedCount})` : 'Lixeira', icon: <Trash2 size={15} color={deletedCount > 0 ? '#ff6b6b' : undefined} /> },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#001529', color: '#e8edf2', fontFamily: 'Inter, system-ui, sans-serif', alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, minWidth: 220, background: '#002042', borderRight: '1px solid #333333', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 8, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 24px', fontSize: 15, fontWeight: 700, color: '#f7ad40', borderBottom: '1px solid #333333', marginBottom: 16 }}>
          <LayoutDashboard size={20} /> E-Mais Admin
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as Tab)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none', textAlign: 'left', width: '100%',
              background: tab === t.id ? '#1f1f1f' : 'transparent',
              color: tab === t.id ? '#f7ad40' : '#7a9db5',
              fontWeight: tab === t.id ? 700 : 400,
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16, borderTop: '1px solid #333333' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none', background: '#1f1f1f', color: '#f7ad40' }}>
            <Eye size={14} /> Ver Site
          </button>
          <button onClick={async () => {
            const token = localStorage.getItem('emais_admin_token');
            if (token) await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
            localStorage.removeItem(AUTH_KEY);
            localStorage.removeItem('emais_admin_token');
            setAuthed(false);
          }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: 'none', background: 'transparent', color: '#737373', textAlign: 'left' }}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '28px 32px 20px', borderBottom: '1px solid #333333', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              {TABS.find(t => t.id === tab)?.icon} {TABS.find(t => t.id === tab)?.label}
            </h1>
            <p style={{ fontSize: 13, color: saving ? '#f7ad40' : '#737373', margin: 0, display: 'flex', alignItems: 'center', gap: 5, transition: 'color .3s' }}>
              {saving ? <><span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#f7ad40', animation: 'pulse 1s infinite' }} /> Salvando…</> : 'Edições salvas automaticamente.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#1f1f1f', color: '#f7ad40', border: '1px solid #333333', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Download size={13} /> Exportar JSON
            </button>
            <button onClick={() => setShowImport(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#1f1f1f', color: '#f7ad40', border: '1px solid #333333', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <Upload size={13} /> Importar JSON
            </button>
            <button onClick={() => setShowResetConfirm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#2a0a0a', color: '#ff6b6b', border: '1px solid #3a1a1a', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <RotateCcw size={13} /> Resetar Tudo
            </button>
          </div>
        </header>

        {/* Import panel */}
        {showImport && (
          <div style={{ margin: '16px 32px', background: '#002042', border: '1px solid #333333', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, fontWeight: 600, color: '#aac' }}>
              <span>Importar configuração JSON (emais-config.json)</span>
              <button onClick={() => setShowImport(false)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <textarea value={importText} onChange={e => setImportText(e.target.value)} rows={5}
              placeholder='Cole aqui o conteúdo exportado...'
              style={{ background: '#001529', border: '1px solid #333333', borderRadius: 8, color: '#e8edf2', fontSize: 12, fontFamily: 'monospace', padding: 12, resize: 'vertical', outline: 'none' }}
            />
            <button onClick={handleImport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'linear-gradient(135deg, #f7ad40, #d45f1a)', color: '#002042', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
              <Upload size={13} /> Aplicar Configuração
            </button>
          </div>
        )}

        {/* Tab content */}
        <div style={{ padding: '24px 32px', flex: 1 }}>
          {tab === 'hero'         && <HeroTab />}
          {tab === 'platinum'     && <PlatinumTab />}
          {tab === 'packages'     && <PackagesTab />}
          {tab === 'trending'     && <TrendingTab />}
          {tab === 'categories'   && <CategoriesTab />}
          {tab === 'trash'        && <TrashTab />}
        </div>
      </main>

      {/* Reset confirm modal */}
      {showResetConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: '#002042', border: '1px solid #333333', borderRadius: 14, padding: 32, maxWidth: 420, width: '90%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>Resetar tudo?</h2>
            <p style={{ fontSize: 14, color: '#737373', margin: 0, lineHeight: 1.5 }}>Isso vai restaurar todos os textos, imagens e cards para o conteúdo original. Esta ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowResetConfirm(false)} style={{ padding: '9px 16px', background: '#1f1f1f', color: '#f7ad40', border: '1px solid #333333', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleReset} style={{ padding: '9px 16px', background: '#2a0a0a', color: '#ff6b6b', border: '1px solid #3a1a1a', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Sim, resetar tudo</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, padding: '14px 22px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, zIndex: 9999,
          background: toast.type === 'error' ? '#2a0a0a' : '#0d3320',
          color: toast.type === 'error' ? '#ff6b6b' : '#4ade80',
          border: `1px solid ${toast.type === 'error' ? '#3a1a1a' : '#1a4030'}`,
          animation: 'slideIn .3s ease',
        }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideIn { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  );
}

