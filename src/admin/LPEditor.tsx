/**
 * LPEditor.tsx — Editor compartilhado da Landing Page de Pacotes.
 *
 * Usado pelos três painéis (Admin, Admin-Master e Marketing) para que todos
 * editem o MESMO conteúdo da LP com formulários organizados na ordem visual
 * das seções da página:
 *
 *   Template do Esporte → define o tema da LP e a imagem animada que
 *                          acompanha o scroll no canto inferior direito.
 *   Seção 1 — Topo da Página (Hero)
 *   Seção 2 — Cards de Benefícios
 *   Seção 3 — Programação do Evento
 *   Seção 4 — Pacotes & Tipos (hospedagens / opções de venda)
 *   Seção 5 — Experiência (texto + 2 primeiras fotos do Banco de Imagens)
 */
import React, { useState } from 'react';
import {
  Image as ImageIcon, Plus, Trash2, X, Video, LayoutGrid, CalendarDays,
  BedDouble, Star, Images, Loader2, DollarSign, Medal, Check, MapPin,
} from 'lucide-react';
import type { TrendingPackage } from '../types';
import { useContentConfig } from '../hooks/useContentConfig';

/* ── Estilos base (mesma linguagem visual dos painéis) ── */
const IS: React.CSSProperties = {
  background: '#001529', border: '1px solid #333333', borderRadius: 8,
  color: '#e8edf2', fontSize: 13, padding: '9px 12px', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif',
};
const fieldCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 };
const lbl: React.CSSProperties = {
  fontSize: 10, color: '#737373', fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4,
};
const hint: React.CSSProperties = { fontSize: 11, color: '#666', lineHeight: 1.5, margin: 0 };

function parseJSONSafe<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { const v = JSON.parse(raw); return (v ?? fallback) as T; } catch { return fallback; }
}

const splitList = (v?: string) => (v ? v.split(';').map(s => s.trim()).filter(Boolean) : []);
const joinList = (arr: string[]) => arr.join('; ');

/* ── Upload helper ── */
async function uploadImage(file: File, tokenKey: string): Promise<string> {
  const token = localStorage.getItem(tokenKey) ?? '';
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no upload');
  return data.url as string;
}

/* ── Switch liga/desliga ── */
function VisSwitch({ on, onChange, label = 'Exibir na LP' }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: on ? '#4ade80' : '#666' }}>{label}</span>
      <button type="button" onClick={() => onChange(!on)} title={on ? 'Seção visível — clique para ocultar' : 'Seção oculta — clique para exibir'}
        style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', background: on ? '#16a34a' : '#333', padding: 0 }}>
        <span style={{ position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', left: on ? 21 : 3 }} />
      </button>
    </div>
  );
}

/* ── Wrapper de seção, com etiqueta indicando onde o conteúdo aparece na LP ── */
function LPSection({ badge, title, subtitle, icon: Icon, color, toggle, children }: {
  badge: string; title: string; subtitle: string;
  icon: React.ComponentType<{ size?: number | string; color?: string }>;
  color: string;
  toggle?: { on: boolean; onChange: (v: boolean) => void };
  children: React.ReactNode;
}) {
  const hidden = toggle && !toggle.on;
  return (
    <div style={{ background: '#001a33', border: `1px solid ${hidden ? '#002042' : '#222'}`, borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, opacity: hidden ? 0.65 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #002b52', paddingBottom: 14 }}>
        <div style={{ width: 38, height: 38, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9, fontWeight: 900, color, background: `${color}15`, border: `1px solid ${color}35`, padding: '2px 8px', borderRadius: 100, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{badge}</span>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{title}</h3>
            {hidden && <span style={{ fontSize: 9, fontWeight: 800, color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase' }}>Oculta na LP</span>}
          </div>
          <p style={{ ...hint, marginTop: 4 }}>{subtitle}</p>
        </div>
        {toggle && <VisSwitch on={toggle.on} onChange={toggle.onChange} />}
      </div>
      {children}
    </div>
  );
}

/* ── Campo de imagem individual (upload + URL manual) ── */
function LPImageInput({ label, value, onChange, tokenKey }: {
  label: string; value: string; onChange: (url: string) => void; tokenKey: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try { onChange(await uploadImage(file, tokenKey)); }
    catch (err: any) { setError(err.message || 'Erro no upload'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#002042', padding: 10, borderRadius: 10, border: '1px solid #002b52' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={lbl}>{label}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: uploading ? '#555' : '#f7ad40', cursor: uploading ? 'wait' : 'pointer', padding: '3px 8px', background: 'rgba(247,173,64,0.08)', borderRadius: 6 }}>
            {uploading ? <Loader2 size={10} className="lp-spin" /> : <Plus size={10} />}
            {uploading ? 'Enviando...' : (value ? 'Substituir' : 'Enviar imagem')}
            <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {value && (
            <button onClick={() => onChange('')} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#ef4444', cursor: 'pointer', padding: '3px 8px', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6 }}>
              <Trash2 size={10} /> Remover
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {value ? (
          <img src={value} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid #333', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: 8, background: '#002b52', border: '1px dashed #003866', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ImageIcon size={18} color="#333" />
          </div>
        )}
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://... ou /uploads/..." style={{ ...IS, fontSize: 12, padding: '7px 10px' }} />
      </div>
      {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
    </div>
  );
}

/* ── Banco de Imagens (upload múltiplo + grade de miniaturas) ──
 * otherPackages: bancos de outros pacotes do portal (título + imagens), para
 * o seletor "Importar de outro pacote..." — evita reenviar a mesma foto que
 * já foi enviada em outro pacote. */
function ImageBankManager({ value, onChange, tokenKey, otherPackages }: {
  value: string; onChange: (val: string) => void; tokenKey: string;
  otherPackages?: { title: string; images: string[] }[];
}) {
  const images = splitList(value);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setError('');
    const added: string[] = [];
    for (const file of files) {
      try { added.push(await uploadImage(file, tokenKey)); }
      catch (err: any) { setError(err.message || 'Erro no upload'); }
    }
    if (added.length) onChange(joinList([...images, ...added]));
    setUploading(false); e.target.value = '';
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!images.includes(url)) onChange(joinList([...images, url]));
    setUrlInput('');
  };

  const removeAt = (idx: number) => {
    const next = [...images]; next.splice(idx, 1);
    onChange(joinList(next));
  };

  const importable = (otherPackages || []).filter(p => p.images.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="https://... (colar URL de uma imagem já hospedada)"
          style={{ ...IS, flex: 1, minWidth: 220, fontSize: 12, padding: '7px 10px' }} />
        <button onClick={addUrl} type="button"
          style={{ background: '#002042', border: '1px solid #003866', color: '#fff', padding: '0 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          Adicionar
        </button>
      </div>
      {importable.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <select
            onChange={e => {
              const idx = e.target.value;
              e.target.value = '';
              if (idx === '') return;
              const src = importable[Number(idx)];
              if (!src) return;
              const newItems = src.images.filter(url => !images.includes(url));
              if (newItems.length > 0) onChange(joinList([...images, ...newItems]));
            }}
            style={{ background: '#002042', color: '#f7ad40', border: '1px solid #003866', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}
          >
            <option value="">📥 Importar de outro pacote...</option>
            {importable.map((p, idx) => (
              <option key={idx} value={idx}>{p.title} ({p.images.length} fotos)</option>
            ))}
          </select>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
        {images.map((img, idx) => (
          <div key={`${idx}-${img}`} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '1px solid #003866' }}>
            <img src={img} alt={`Imagem ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => removeAt(idx)} title="Remover do banco"
              style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.75)', border: '1px solid #444', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
              <X size={11} />
            </button>
            <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.65)', padding: '1px 6px', borderRadius: 6 }}>{idx + 1}</span>
          </div>
        ))}
        <label style={{ aspectRatio: '1', borderRadius: 10, border: '1px dashed #333', background: '#002042', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: uploading ? 'wait' : 'pointer', color: '#f7ad40' }}>
          {uploading ? <Loader2 size={18} className="lp-spin" /> : <Plus size={18} />}
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.3 }}>{uploading ? 'Enviando...' : 'Adicionar fotos'}</span>
          <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>
      {images.length === 0 && <p style={hint}>Nenhuma imagem no banco ainda. Você pode selecionar várias fotos de uma vez.</p>}
      {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
    </div>
  );
}

/* ── Seletor de imagens a partir do Banco de Imagens ── */
function BankPicker({ bank, selected, multiple, onChange }: {
  bank: string[]; selected: string[]; multiple: boolean;
  onChange: (urls: string[]) => void;
}) {
  // Imagens selecionadas que não existem mais no banco (ex: apagadas após duplicar
  // um pacote) — exibidas em vermelho para poderem ser removidas da seleção.
  const orphans = selected.filter(u => !bank.includes(u));
  if (bank.length === 0 && orphans.length === 0) {
    return <p style={{ ...hint, padding: 12, background: '#002042', borderRadius: 8, border: '1px dashed #002b52' }}>O Banco de Imagens está vazio — envie fotos na seção "Experiências" ou "Banco de Imagens" para poder selecioná-las aqui.</p>;
  }
  const toggle = (url: string) => {
    if (selected.includes(url)) onChange(selected.filter(u => u !== url));
    else onChange(multiple ? [...selected, url] : [url]);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {orphans.length > 0 && (
        <div style={{ padding: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚠️ Imagens selecionadas que não estão mais no Banco de Imagens — clique no X para removê-las
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
            {orphans.map((img, idx) => (
              <button key={`orfa-${idx}`} onClick={() => toggle(img)} title="Remover esta imagem da seção"
                style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', padding: 0, cursor: 'pointer', border: '2px solid #ef4444' }}>
                <img src={img} alt={`Imagem removida do banco ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.7 }} />
                <span style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={11} color="#fff" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 8 }}>
      {bank.map((img, idx) => {
        const isSel = selected.includes(img);
        return (
          <button key={`${idx}-${img}`} onClick={() => toggle(img)} title={isSel ? 'Clique para desmarcar' : 'Clique para usar esta imagem'}
            style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', padding: 0, cursor: 'pointer', border: isSel ? '2px solid #4ade80' : '1px solid #002b52', opacity: isSel ? 1 : 0.75 }}>
            <img src={img} alt={`Banco ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {isSel && (
              <span style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={11} color="#000" />
              </span>
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}

/* ── Editor de lista simples (um texto por item — ex: "experiências exclusivas") ── */
function SimpleListEditor({ items, onChange, placeholder, addLabel }: {
  items: string[]; onChange: (items: string[]) => void; placeholder: string; addLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <input placeholder={placeholder} value={item} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n); }} style={{ ...IS, fontSize: 12, padding: '7px 10px' }} />
          <button onClick={() => { const n = [...items]; n.splice(i, 1); onChange(n); }} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}><X size={13} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])}
        style={{ alignSelf: 'flex-start', background: '#002042', border: '1px solid #003866', color: '#aaa', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Plus size={11} /> {addLabel}
      </button>
    </div>
  );
}

/* ── Tipos auxiliares do JSON de pacotes ── */
type Incluso = { titulo?: string; descricao?: string };
type OpcaoHospedagem = {
  nome?: string; descricao_card?: string;
  valor_individual?: string; valor_duplo?: string; moeda?: string; parcelas?: string;
  inclusos?: Incluso[];
};
type PacotesObj = {
  opcoes_hospedagem: OpcaoHospedagem[];
  datas: { partida?: string; retorno?: string; duracao?: string };
  inclusos: Incluso[];
};

function parsePacotes(raw?: string): PacotesObj {
  const base: PacotesObj = { opcoes_hospedagem: [], datas: { partida: '', retorno: '', duracao: '' }, inclusos: [] };
  const parsed = parseJSONSafe<any>(raw, {});
  if (Array.isArray(parsed)) return { ...base, opcoes_hospedagem: parsed };
  return { ...base, ...parsed, datas: { ...base.datas, ...(parsed.datas || {}) }, inclusos: parsed.inclusos || [], opcoes_hospedagem: parsed.opcoes_hospedagem || [] };
}

type DestinoLifestyle = { titulo?: string; descricao?: string; items?: string[]; imagens?: string[]; invertido?: boolean };
type SectionBg = { type?: 'image' | 'video'; url?: string };

/* ── Fundo customizado de uma seção (imagem ou vídeo, opcional) ── */
function SectionBgEditor({ bg, onChange, tokenKey }: {
  bg: SectionBg; onChange: (bg: SectionBg) => void; tokenKey: string;
}) {
  const type = bg.type || 'none';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: '#002042', borderRadius: 10, border: '1px solid #002b52' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <label style={lbl}>Fundo da seção</label>
        <select value={type} onChange={e => { const t = e.target.value; onChange(t === 'none' ? {} : { type: t as 'image' | 'video', url: bg.url }); }}
          style={{ ...IS, width: 'auto', padding: '5px 10px', fontSize: 11, cursor: 'pointer' }}>
          <option value="none">Nenhum (padrão)</option>
          <option value="image">🖼️ Imagem</option>
          <option value="video">🎞️ Vídeo</option>
        </select>
      </div>
      {type === 'image' && (
        <LPImageInput label="Imagem de fundo" value={bg.url || ''} onChange={url => onChange({ type: 'image', url })} tokenKey={tokenKey} />
      )}
      {type === 'video' && (
        <input value={bg.url || ''} onChange={e => onChange({ type: 'video', url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=... ou .mp4" style={{ ...IS, fontSize: 12 }} />
      )}
    </div>
  );
}

/* ── Editor de lista de "inclusos" (título + descrição) ── */
function InclusosEditor({ items, onChange, addLabel }: {
  items: Incluso[]; onChange: (items: Incluso[]) => void; addLabel: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((inc, j) => (
        <div key={j} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 8 }}>
          <input placeholder="Título (Ex: Voo Internacional)" value={inc.titulo || ''} onChange={e => { const n = [...items]; n[j] = { ...n[j], titulo: e.target.value }; onChange(n); }} style={{ ...IS, fontSize: 12, padding: '7px 10px' }} />
          <input placeholder="Descrição curta..." value={inc.descricao || ''} onChange={e => { const n = [...items]; n[j] = { ...n[j], descricao: e.target.value }; onChange(n); }} style={{ ...IS, fontSize: 12, padding: '7px 10px' }} />
          <button onClick={() => { const n = [...items]; n.splice(j, 1); onChange(n); }} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}><X size={13} /></button>
        </div>
      ))}
      <button onClick={() => onChange([...items, { titulo: '', descricao: '' }])}
        style={{ alignSelf: 'flex-start', background: '#002042', border: '1px solid #003866', color: '#aaa', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Plus size={11} /> {addLabel}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Editor principal — usado por Admin, Master e Marketing
   ════════════════════════════════════════════════════════════════ */
export default function LPContentEditor({ pkg, onUpdate, tokenKey }: {
  pkg: TrendingPackage;
  onUpdate: (d: Partial<TrendingPackage>) => void;
  tokenKey: string;
}) {
  const bank = splitList(pkg.galleryImages);
  // Bancos de imagens dos outros pacotes do portal, para o seletor "Importar
  // de outro pacote..." do Banco de Imagens — evita reenviar a mesma foto.
  // Importar do próprio pacote é inofensivo (as fotos já presentes são
  // ignoradas), então não há necessidade de excluí-lo da lista.
  const { packages: allPackages } = useContentConfig();
  const otherPackages = allPackages
    .map(p => ({ title: p.title || 'Sem título', images: splitList(p.galleryImages) }))
    .filter(p => p.images.length > 0);
  const pacotes = parsePacotes(pkg.pacotesOptionsData);
  const setPacotes = (obj: PacotesObj) => onUpdate({ pacotesOptionsData: JSON.stringify(obj) });
  const prog = parseJSONSafe<any[]>(pkg.programacaoData, []);
  const setProg = (p: any[]) => onUpdate({ programacaoData: JSON.stringify(p) });
  const cards = parseJSONSafe<any[]>(pkg.cardsData, []);
  const setCards = (c: any[]) => onUpdate({ cardsData: JSON.stringify(c) });
  const experienciaItems = splitList(pkg.experienciaItems);
  const destino = parseJSONSafe<DestinoLifestyle>(pkg.destinoLifestyleData, {});
  const setDestino = (d: DestinoLifestyle) => onUpdate({ destinoLifestyleData: JSON.stringify(d) });

  // Visibilidade das seções opcionais da LP (visíveis por padrão)
  const vis: Record<string, boolean> = { experiencia: true, destino: true, ...parseJSONSafe<Record<string, boolean>>(pkg.lpSections, {}) };
  const setVis = (key: string, value: boolean) => onUpdate({ lpSections: JSON.stringify({ ...vis, [key]: value }) });

  // Fundo customizado (imagem ou vídeo) por seção — nenhuma seção tem por padrão
  const bgs: Record<string, SectionBg> = parseJSONSafe<Record<string, SectionBg>>(pkg.lpBackgrounds, {});
  const setBg = (key: string, bg: SectionBg) => onUpdate({ lpBackgrounds: JSON.stringify({ ...bgs, [key]: bg }) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } } .lp-spin { animation: lp-spin 1s linear infinite; }`}</style>

      {/* ══ TEMPLATE DO ESPORTE ══ */}
      <LPSection badge="Tema da LP" title="Template do Esporte" icon={Medal} color="#f7ad40"
        subtitle="Define o visual temático da LP inteira: cores de destaque, textos padrão e a imagem animada do esporte que acompanha o scroll no canto inferior direito da página.">
        <div style={fieldCol}>
          <label style={lbl}>Esporte do pacote</label>
          <select value={pkg.sportType || 'automobilismo'} onChange={e => onUpdate({ sportType: e.target.value })} style={{ ...IS, cursor: 'pointer' }}>
            <option value="automobilismo">🏎️ Automobilismo</option>
            <option value="futebol">⚽ Futebol</option>
            <option value="tenis">🎾 Tênis</option>
            <option value="basquete">🏀 Basquete</option>
            <option value="lutas">🥊 Lutas (UFC/Boxe)</option>
            <option value="geral">🏆 Geral</option>
          </select>
        </div>
      </LPSection>

      {/* ══ SEÇÃO 1 — HERO ══ */}
      <LPSection badge="Seção 1 da LP" title="Topo da Página (Hero)" icon={Video} color="#e43c44"
        subtitle="Primeira dobra da LP: tag pequena em destaque, título grande (Nome do Pacote), descrição e fundo em vídeo ou imagem.">
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ ...hint, padding: '8px 12px', background: '#002042', borderRadius: 8, border: '1px solid #002b52' }}>
            💡 O <strong style={{ color: '#ccc' }}>título grande</strong> do Hero é o <strong style={{ color: '#ccc' }}>Nome do Pacote</strong> (campo "Título do Pacote" das informações básicas).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12 }}>
            <div style={fieldCol}>
              <label style={lbl}>Fundo do Hero</label>
              <select value={pkg.heroType || (pkg.videoUrl ? 'video' : 'image')} onChange={e => onUpdate({ heroType: e.target.value as 'video' | 'image' })} style={{ ...IS, cursor: 'pointer' }}>
                <option value="video">🎞️ Vídeo</option>
                <option value="image">🖼️ Imagem</option>
              </select>
            </div>
            <div style={fieldCol}>
              <label style={lbl}>Tag pequena (acima do título)</label>
              <input value={pkg.tag || ''} onChange={e => onUpdate({ tag: e.target.value })} placeholder='Ex: 111ª EDIÇÃO' style={IS} />
            </div>
          </div>
          {(pkg.heroType || (pkg.videoUrl ? 'video' : 'image')) === 'video' ? (
            <div style={fieldCol}>
              <label style={lbl}>URL do vídeo (YouTube ou .mp4)</label>
              <input value={pkg.videoUrl || ''} onChange={e => onUpdate({ videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." style={IS} />
            </div>
          ) : (
            <LPImageInput label="Imagem de fundo do Hero" value={pkg.heroImage || ''} onChange={url => onUpdate({ heroImage: url })} tokenKey={tokenKey} />
          )}
          <div style={fieldCol}>
            <label style={lbl}>Descrição do Hero (parágrafo abaixo do título)</label>
            <textarea value={pkg.description || ''} onChange={e => onUpdate({ description: e.target.value })} rows={3}
              placeholder="Viva a emoção do evento com um pacote completo: passagens aéreas, hospedagem e ingressos garantidos..." style={{ ...IS, resize: 'vertical' }} />
          </div>
        </div>
      </LPSection>

      {/* ══ SEÇÃO 2 — CARDS DE BENEFÍCIOS ══ */}
      <LPSection badge="Seção 2 da LP" title="Cards de Benefícios" icon={LayoutGrid} color="#ec4899"
        subtitle='Os 3 cards logo abaixo do Hero (ex: "Experiência Completa", "Acesso Exclusivo", "Suporte 24/7").'>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionBgEditor bg={bgs.cards || {}} onChange={bg => setBg('cards', bg)} tokenKey={tokenKey} />
          {cards.map((c: any, i: number) => (
            <div key={i} style={{ background: '#002042', padding: 12, borderRadius: 10, border: '1px solid #002b52', display: 'grid', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8 }}>
                <div style={fieldCol}>
                  <label style={lbl}>Ícone</label>
                  <select value={c.icone || 'Zap'} onChange={e => { const n = [...cards]; n[i] = { ...n[i], icone: e.target.value }; setCards(n); }} style={{ ...IS, cursor: 'pointer' }}>
                    <option value="Zap">⚡ Raio</option>
                    <option value="Trophy">🏆 Troféu</option>
                    <option value="Headset">🎧 Suporte</option>
                  </select>
                </div>
                <div style={fieldCol}>
                  <label style={lbl}>Título do card</label>
                  <input placeholder="Ex: Experiência Completa" value={c.titulo || ''} onChange={e => { const n = [...cards]; n[i] = { ...n[i], titulo: e.target.value }; setCards(n); }} style={IS} />
                </div>
                <button onClick={() => { const n = [...cards]; n.splice(i, 1); setCards(n); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: 18 }}><Trash2 size={14} /></button>
              </div>
              <textarea placeholder="Descrição do benefício..." value={c.descricao || ''} onChange={e => { const n = [...cards]; n[i] = { ...n[i], descricao: e.target.value }; setCards(n); }} rows={2} style={{ ...IS, resize: 'vertical' }} />
            </div>
          ))}
          <button onClick={() => setCards([...cards, { titulo: '', descricao: '', icone: 'Zap' }])}
            style={{ alignSelf: 'flex-start', background: '#002042', border: '1px solid #003866', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Adicionar Card
          </button>
        </div>
      </LPSection>

      {/* ══ SEÇÃO 3 — PROGRAMAÇÃO ══ */}
      <LPSection badge="Seção 3 da LP" title="Programação do Evento" icon={CalendarDays} color="#f59e0b"
        subtitle="Abas de dias (Sexta / Sábado / Domingo) e as atividades de cada dia.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionBgEditor bg={bgs.programacao || {}} onChange={bg => setBg('programacao', bg)} tokenKey={tokenKey} />
          {prog.map((day: any, i: number) => (
            <div key={i} style={{ background: '#002042', padding: 14, borderRadius: 10, border: '1px solid #002b52' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr auto', gap: 8, marginBottom: 10 }}>
                <div style={fieldCol}>
                  <label style={lbl}>Aba</label>
                  <input placeholder="Ex: SEXTA" value={day.titulo_aba || day.dia || ''} onChange={e => { const n = [...prog]; n[i] = { ...n[i], titulo_aba: e.target.value }; setProg(n); }} style={IS} />
                </div>
                <div style={fieldCol}>
                  <label style={lbl}>Título do dia</label>
                  <input placeholder="Ex: Sexta, 22 de maio - Treinos Livres" value={day.titulo_dia || day.data || ''} onChange={e => { const n = [...prog]; n[i] = { ...n[i], titulo_dia: e.target.value }; setProg(n); }} style={IS} />
                </div>
                <button onClick={() => { const n = [...prog]; n.splice(i, 1); setProg(n); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginTop: 18 }}><Trash2 size={14} /></button>
              </div>
              <div style={{ paddingLeft: 12, borderLeft: '2px solid #222', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(day.atividades || []).map((ativ: any, j: number) => (
                  <div key={j} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 8 }}>
                    <input placeholder="08:00" value={ativ.horario || ''} onChange={e => { const n = [...prog]; n[i].atividades[j] = { ...n[i].atividades[j], horario: e.target.value }; setProg(n); }} style={{ ...IS, fontSize: 12, padding: '7px 10px' }} />
                    <input placeholder="Descrição da atividade..." value={ativ.descricao || ''} onChange={e => { const n = [...prog]; n[i].atividades[j] = { ...n[i].atividades[j], descricao: e.target.value }; setProg(n); }} style={{ ...IS, fontSize: 12, padding: '7px 10px' }} />
                    <button onClick={() => { const n = [...prog]; n[i].atividades.splice(j, 1); setProg(n); }} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><X size={13} /></button>
                  </div>
                ))}
                <button onClick={() => { const n = [...prog]; if (!n[i].atividades) n[i].atividades = []; n[i].atividades.push({ horario: '', descricao: '' }); setProg(n); }}
                  style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px solid #003866', color: '#aaa', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>+ Atividade</button>
              </div>
            </div>
          ))}
          <button onClick={() => setProg([...prog, { titulo_aba: '', titulo_dia: '', atividades: [] }])}
            style={{ alignSelf: 'flex-start', background: '#002042', border: '1px solid #003866', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Adicionar Dia
          </button>
        </div>
      </LPSection>

      {/* ══ SEÇÃO 4 — PACOTES & TIPOS ══ */}
      <LPSection badge="Seção 4 da LP" title="Pacotes & Tipos (Hospedagens)" icon={BedDouble} color="#10b981"
        subtitle="Cards de venda da LP, com valores por quarto individual/duplo e a lista do que está incluso em cada opção.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SectionBgEditor bg={bgs.pacotes || {}} onChange={bg => setBg('pacotes', bg)} tokenKey={tokenKey} />
          {pacotes.opcoes_hospedagem.map((op, i) => (
            <div key={i} style={{ background: '#002042', padding: 16, borderRadius: 12, border: '1px solid #002b52', display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: i === 0 ? '#f7ad40' : '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Card {i + 1} {i === 0 ? '(destaque principal)' : '(destaque dourado)'}</span>
                <button onClick={() => { const n = { ...pacotes }; n.opcoes_hospedagem = [...n.opcoes_hospedagem]; n.opcoes_hospedagem.splice(i, 1); setPacotes(n); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={15} /></button>
              </div>
              <div style={fieldCol}>
                <label style={lbl}>Nome do card (título)</label>
                <input placeholder="Ex: Pacote Premium" value={op.nome || ''} onChange={e => { const n = { ...pacotes }; n.opcoes_hospedagem[i] = { ...op, nome: e.target.value }; setPacotes(n); }} style={IS} />
              </div>
              <div style={fieldCol}>
                <label style={lbl}>Descrição breve do card</label>
                <textarea rows={2} placeholder="Experiência completa com todo o conforto e exclusividade..." value={op.descricao_card || ''} onChange={e => { const n = { ...pacotes }; n.opcoes_hospedagem[i] = { ...op, descricao_card: e.target.value }; setPacotes(n); }} style={{ ...IS, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div style={fieldCol}>
                  <label style={lbl}><DollarSign size={10} /> Valor Individual</label>
                  <input placeholder="Ex: 612,00" value={op.valor_individual || ''} onChange={e => { const n = { ...pacotes }; n.opcoes_hospedagem[i] = { ...op, valor_individual: e.target.value }; setPacotes(n); }} style={IS} />
                </div>
                <div style={fieldCol}>
                  <label style={lbl}><DollarSign size={10} /> Valor Duplo</label>
                  <input placeholder="Ex: 550,00" value={op.valor_duplo || ''} onChange={e => { const n = { ...pacotes }; n.opcoes_hospedagem[i] = { ...op, valor_duplo: e.target.value }; setPacotes(n); }} style={IS} />
                </div>
                <div style={fieldCol}>
                  <label style={lbl}>Moeda</label>
                  <input placeholder="USD" value={op.moeda || 'USD'} onChange={e => { const n = { ...pacotes }; n.opcoes_hospedagem[i] = { ...op, moeda: e.target.value }; setPacotes(n); }} style={IS} />
                </div>
                <div style={fieldCol}>
                  <label style={lbl}>Parcelas</label>
                  <input placeholder="10" value={op.parcelas || '10'} onChange={e => { const n = { ...pacotes }; n.opcoes_hospedagem[i] = { ...op, parcelas: e.target.value }; setPacotes(n); }} style={IS} />
                </div>
              </div>
              <div style={{ padding: 12, background: '#001a33', borderRadius: 10, border: '1px solid #002b52' }}>
                <div style={{ ...lbl, marginBottom: 8 }}>"O que está incluso" deste card</div>
                <InclusosEditor items={op.inclusos || []} addLabel="Adicionar item incluso"
                  onChange={items => { const n = { ...pacotes }; n.opcoes_hospedagem[i] = { ...op, inclusos: items }; setPacotes(n); }} />
              </div>
            </div>
          ))}
          <button onClick={() => { const n = { ...pacotes }; n.opcoes_hospedagem = [...n.opcoes_hospedagem, { nome: '', descricao_card: '', valor_individual: '', valor_duplo: '', moeda: 'USD', parcelas: '10', inclusos: [] }]; setPacotes(n); }}
            style={{ alignSelf: 'flex-start', background: '#002042', border: '1px solid #003866', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Novo Tipo de Pacote
          </button>

          <div style={{ padding: 14, background: '#002042', borderRadius: 10, border: '1px solid #002b52', display: 'grid', gap: 12 }}>
            <div style={lbl}>Datas da viagem (faixa abaixo dos cards)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={fieldCol}>
                <label style={lbl}>Partida</label>
                <input placeholder="Ex: 26 de maio de 2027" value={pacotes.datas.partida || ''} onChange={e => setPacotes({ ...pacotes, datas: { ...pacotes.datas, partida: e.target.value } })} style={IS} />
              </div>
              <div style={fieldCol}>
                <label style={lbl}>Retorno</label>
                <input placeholder="Ex: 31 de maio de 2027" value={pacotes.datas.retorno || ''} onChange={e => setPacotes({ ...pacotes, datas: { ...pacotes.datas, retorno: e.target.value } })} style={IS} />
              </div>
              <div style={fieldCol}>
                <label style={lbl}>Duração</label>
                <input placeholder="Ex: 5 dias / 4 noites" value={pacotes.datas.duracao || ''} onChange={e => setPacotes({ ...pacotes, datas: { ...pacotes.datas, duracao: e.target.value } })} style={IS} />
              </div>
            </div>
            <div style={lbl}>Inclusos padrão (usados quando o card não tem inclusos próprios)</div>
            <InclusosEditor items={pacotes.inclusos || []} addLabel="Adicionar item global"
              onChange={items => setPacotes({ ...pacotes, inclusos: items })} />
          </div>
        </div>
      </LPSection>

      {/* ══ SEÇÃO 5 — EXPERIÊNCIAS + BANCO DE IMAGENS ══ */}
      <LPSection badge="Seção 5 da LP" title="Experiências" icon={Star} color="#8b5cf6"
        toggle={{ on: vis.experiencia, onChange: v => setVis('experiencia', v) }}
        subtitle='Bloco "Uma Experiência Inesquecível": subtítulo + lista de experiências exclusivas à esquerda, fotos escolhidas do Banco de Imagens à direita.'>
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionBgEditor bg={bgs.experiencia || {}} onChange={bg => setBg('experiencia', bg)} tokenKey={tokenKey} />
          <div style={fieldCol}>
            <label style={lbl}>Subtítulo da seção</label>
            <textarea rows={3} value={pkg.experienciaSection || ''} onChange={e => onUpdate({ experienciaSection: e.target.value })}
              placeholder="Nossos pacotes garantem que você vivencie cada momento memorável com conforto, segurança e acesso a áreas exclusivas..." style={{ ...IS, resize: 'vertical' }} />
          </div>
          <div style={fieldCol}>
            <label style={lbl}>Experiências exclusivas (lista de itens)</label>
            <SimpleListEditor items={experienciaItems} placeholder="Ex: Acesso aos boxes e paddock"
              addLabel="Adicionar experiência" onChange={items => onUpdate({ experienciaItems: joinList(items) })} />
          </div>
          <div style={fieldCol}>
            <label style={lbl}><Images size={10} /> Banco de Imagens</label>
            <ImageBankManager value={pkg.galleryImages || ''} onChange={v => onUpdate({ galleryImages: v })} tokenKey={tokenKey} otherPackages={otherPackages} />
          </div>
          <div style={fieldCol}>
            <label style={lbl}>Fotos desta seção (clique para selecionar do banco)</label>
            <BankPicker bank={bank} multiple selected={splitList(pkg.experienciaImages)}
              onChange={urls => onUpdate({ experienciaImages: joinList(urls) })} />
          </div>
        </div>
      </LPSection>

      {/* ══ SEÇÃO 6 — DESTINO & LIFESTYLE ══ */}
      <LPSection badge="Seção 6 da LP" title="Destino & Lifestyle" icon={MapPin} color="#06b6d4"
        toggle={{ on: vis.destino, onChange: v => setVis('destino', v) }}
        subtitle="Apresenta a cidade/destino do evento: título, breve descrição, atrativos locais e fotos escolhidas do Banco de Imagens. Fica oculta automaticamente se título e descrição estiverem vazios.">
        <div style={{ display: 'grid', gap: 12 }}>
          <SectionBgEditor bg={bgs.destino || {}} onChange={bg => setBg('destino', bg)} tokenKey={tokenKey} />
          <div style={fieldCol}>
            <label style={lbl}>Título</label>
            <input placeholder="Ex: Milão te espera" value={destino.titulo || ''} onChange={e => setDestino({ ...destino, titulo: e.target.value })} style={IS} />
          </div>
          <div style={fieldCol}>
            <label style={lbl}>Descrição breve da cidade</label>
            <textarea rows={3} value={destino.descricao || ''} onChange={e => setDestino({ ...destino, descricao: e.target.value })}
              placeholder="Capital da moda e do design, Milão combina história centenária com um estilo de vida vibrante..." style={{ ...IS, resize: 'vertical' }} />
          </div>
          <div style={fieldCol}>
            <label style={lbl}>Atrativos da cidade (lista de itens)</label>
            <SimpleListEditor items={destino.items || []} placeholder="Ex: Duomo di Milano a poucos minutos do hotel"
              addLabel="Adicionar atrativo" onChange={items => setDestino({ ...destino, items })} />
          </div>
          <div style={fieldCol}>
            <label style={lbl}>Fotos desta seção (clique para selecionar do banco)</label>
            <BankPicker bank={bank} multiple selected={destino.imagens || []}
              onChange={urls => setDestino({ ...destino, imagens: urls })} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#aaa', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!destino.invertido} onChange={e => setDestino({ ...destino, invertido: e.target.checked })} />
            Texto à esquerda / fotos à direita (padrão é fotos à esquerda / texto à direita)
          </label>
        </div>
      </LPSection>

      {/* ══ SEÇÃO 8 — PARCERIA (conteúdo fixo, só o fundo é configurável) ══ */}
      <LPSection badge="Seção 8 da LP" title="Parceria" icon={Images} color="#f59e0b"
        subtitle='Bloco fixo "Realizado por" no final da LP — só o fundo é configurável aqui.'>
        <SectionBgEditor bg={bgs.parceria || {}} onChange={bg => setBg('parceria', bg)} tokenKey={tokenKey} />
      </LPSection>
    </div>
  );
}
