import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ChevronDown, ChevronUp, Shield, LogOut, Upload, Plus, Trash2, Pencil, Users, KeyRound, AlertTriangle, Clock, CheckCircle2, XCircle, Plane, BedDouble, Ticket, FileText, Globe2, Type, Award, Flame, Package, ArrowRight, Tag, MapPin, CalendarDays, DollarSign, RotateCcw } from 'lucide-react';
import { useContentConfig } from '../hooks/useContentConfig';
import type { TrendingPackage } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import { useDialog } from '../components/ui/DialogProvider';

const MASTER_AUTH_KEY = 'emais_master_auth';

const CURRENCIES = [
  { code: 'BRL', label: 'BRL — Real Brasileiro' },
  { code: 'USD', label: 'USD — Dólar Americano' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'GBP', label: 'GBP — Libra Esterlina' },
  { code: 'ARS', label: 'ARS — Peso Argentino' },
  { code: 'CLP', label: 'CLP — Peso Chileno' },
  { code: 'COP', label: 'COP — Peso Colombiano' },
  { code: 'MXN', label: 'MXN — Peso Mexicano' },
  { code: 'PYG', label: 'PYG — Guarani Paraguaio' },
  { code: 'UYU', label: 'UYU — Peso Uruguaio' },
  { code: 'PEN', label: 'PEN — Sol Peruano' },
  { code: 'JPY', label: 'JPY — Iene Japonês' },
  { code: 'CNY', label: 'CNY — Yuan Chinês' },
  { code: 'AUD', label: 'AUD — Dólar Australiano' },
  { code: 'CAD', label: 'CAD — Dólar Canadense' },
  { code: 'CHF', label: 'CHF — Franco Suíço' },
  { code: 'AED', label: 'AED — Dirham Emirados' },
  { code: 'ZAR', label: 'ZAR — Rand Sul-Africano' },
  { code: 'INR', label: 'INR — Rúpia Indiana' },
  { code: 'KRW', label: 'KRW — Won Coreano' },
  { code: 'NOK', label: 'NOK — Coroa Norueguesa' },
  { code: 'SEK', label: 'SEK — Coroa Sueca' },
];

const TAG_OPTIONS = ['NOVO LOTE', 'QUASE ESGOTADO', 'VIP', 'DESTAQUE', 'EXCLUSIVO', 'ÚLTIMAS VAGAS', 'PREMIUM'];

const IS = { background: '#050505', border: '1px solid #333333', borderRadius: 7, color: '#e8edf2', fontSize: 13, padding: '8px 10px', outline: 'none', width: '100%', boxSizing: 'border-box' as const };

/* ── Login ── */
function MasterLogin({ onLogin }: { onLogin: () => void }) {
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
        body: JSON.stringify({ username, password: pw, role: 'master' }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(MASTER_AUTH_KEY, data.username ?? username);
        localStorage.setItem('emais_master_token', data.token);
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#0a0a0a', border: '1px solid #333333', borderRadius: 16, padding: '40px 36px', width: 360, display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 24px 64px rgba(0,0,0,.8)', animation: shake ? 'shake .4s ease' : 'none' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #e43c44, #d45f1a)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={26} color="#000" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e8edf2', margin: 0 }}>Admin Mestre</h1>
          <p style={{ fontSize: 13, color: '#737373', marginTop: 6 }}>Painel de Aprovação — Zago</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário</label>
          <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} placeholder="Usuário" autoFocus autoComplete="username"
            style={{ background: '#050505', border: `1px solid ${error ? '#7a1a1a' : '#333333'}`, borderRadius: 8, color: '#e8edf2', fontSize: 14, padding: '11px 14px', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = error ? '#7a1a1a' : '#333333'}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
          <input type="password" value={pw} onChange={e => { setPw(e.target.value); setError(''); }} placeholder="••••••••" autoComplete="current-password"
            style={{ background: '#050505', border: `1px solid ${error ? '#7a1a1a' : '#333333'}`, borderRadius: 8, color: '#e8edf2', fontSize: 14, padding: '11px 14px', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = error ? '#7a1a1a' : '#333333'}
          />
          {error && <span style={{ fontSize: 11, color: '#f87171' }}>{error}</span>}
        </div>
        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #e43c44, #d45f1a)', color: '#000', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Verificando…' : 'Entrar'}
        </button>
      </form>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }`}</style>
    </div>
  );
}

/* ── Helpers ── */
function MField({ label, icon, value, onChange, textarea = false, rows = 2 }: { label: string; icon?: React.ReactNode; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number }) {
  const focus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#e43c44'; };
  const blur =  (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { e.target.style.borderColor = '#333333'; };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={{ ...IS, resize: 'vertical' }} onFocus={focus} onBlur={blur} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={IS} onFocus={focus} onBlur={blur} />
      }
    </div>
  );
}

function ImageUploadField({ label, labelIcon, value, onChange }: { label: string; labelIcon?: React.ReactNode; value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { onChange(ev.target?.result as string); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>{labelIcon}{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {value && <img src={value} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          <input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." style={{ ...IS, flex: 1 }}
            onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          <button type="button" onClick={() => fileRef.current?.click()} title="Upload" style={{ padding: '8px 10px', background: '#111111', border: '1px solid #333333', borderRadius: 7, color: '#e43c44', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Upload size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Audit Trail ── */
function fmtDate(iso?: string) {
  if (!iso) return '';
  try { return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)); }
  catch { return iso; }
}
function AuditTrail({ pkg }: { pkg: TrendingPackage }) {
  const rows: { label: string; user?: string; at?: string; color: string }[] = [];
  if (pkg.createdBy)  rows.push({ label: 'Criado por',     user: pkg.createdBy,  at: pkg.createdAt,  color: '#737373' });
  if (pkg.updatedAt)  rows.push({ label: 'Editado em',    at: pkg.updatedAt,  color: '#737373' });
  if (pkg.approvedBy) rows.push({ label: 'Autorizado por', user: pkg.approvedBy, at: pkg.approvedAt, color: '#4ade80' });
  if (pkg.rejectedBy) rows.push({ label: 'Rejeitado por',  user: pkg.rejectedBy, at: pkg.rejectedAt, color: '#f87171' });
  if (!rows.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
      {rows.map(r => (
        <span key={r.label} style={{ fontSize: 10, background: '#050505', border: `1px solid ${r.color}33`, borderRadius: 6, padding: '3px 8px', color: r.color, display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ opacity: 0.7 }}>{r.label}:</span>
          <strong>{r.user}</strong>
          {r.at && <span style={{ opacity: 0.5 }}>· {fmtDate(r.at)}</span>}
        </span>
      ))}
    </div>
  );
}

/* ── Package Review Card ── */
const MAX_TRENDING = 8;

function PackageReviewCard({ pkg, onApprove, onReject, onUpdate, onRemove, trendingCount }: {
  pkg: TrendingPackage; index: number;
  onApprove: () => void; onReject: () => void;
  onUpdate: (d: Partial<TrendingPackage>) => void;
  onRemove: () => void;
  trendingCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<TrendingPackage>(pkg);
  const set = (d: Partial<TrendingPackage>) => setLocal(p => ({ ...p, ...d }));

  // Sincroniza local quando pkg muda (após salvar, o hook reconstrói o array)
  useEffect(() => { setLocal(pkg); }, [pkg]);

  const masterUser = localStorage.getItem(MASTER_AUTH_KEY) ?? 'master';
  const now = () => new Date().toISOString();
  const { toast } = useToast();
  const { showAlert, showConfirm } = useDialog();

  const handleSaveApprove = () => { onUpdate({ ...local, status: 'approved', updatedBy: masterUser, updatedAt: now() }); toast('Edições salvas com sucesso!', 'success'); };
  const handleSaveOnly    = () => { onUpdate({ ...local, updatedBy: masterUser, updatedAt: now() }); toast('Salvo sem aprovar.', 'info'); };

  const statusColor = pkg.status === 'approved' ? '#4ade80' : pkg.status === 'rejected' ? '#f87171' : '#fbbf24';
  const statusBg    = pkg.status === 'approved' ? '#0d3320' : pkg.status === 'rejected' ? '#3a0d0d' : '#1a1a1a';
  const statusLabel = pkg.status === 'approved' ? '✅ Aprovado' : pkg.status === 'rejected' ? '❌ Rejeitado' : '🟡 Pendente';

  return (
    <div style={{ background: '#111111', border: `1px solid ${pkg.status === 'pending' || !pkg.status ? '#333333' : pkg.status === 'approved' ? '#1a5c38' : '#7a1a1a'}`, borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        {pkg.img ? <img src={pkg.img} alt={pkg.title} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 52, height: 52, background: '#1a1a1a', borderRadius: 8, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e8edf2' }}>{pkg.title || 'Sem título'}</span>
            <span style={{ fontSize: 10, background: statusBg, color: statusColor, padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{statusLabel}</span>
          </div>
          <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>{pkg.date} · {pkg.loc} · {pkg.currency || 'BRL'} {pkg.price}</div>
          <AuditTrail pkg={pkg} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pkg.status !== 'approved' && (
            <button onClick={e => { e.stopPropagation(); onApprove(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#0d3320', color: '#4ade80', border: '1px solid #1a5c38', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Check size={13} /> Aprovar
            </button>
          )}
          {pkg.status !== 'rejected' && (
            <button onClick={e => { e.stopPropagation(); onReject(); }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#3a0d0d', color: '#f87171', border: '1px solid #7a1a1a', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <X size={13} /> Rejeitar
            </button>
          )}
          <button onClick={async e => { e.stopPropagation(); if (await showConfirm('Mover este pacote para a lixeira?', { type: 'danger', confirmText: 'Excluir', title: 'Excluir Pacote' })) { onRemove(); toast('Pacote movido para a lixeira.', 'warning'); } }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#2a0a0a', color: '#f87171', border: '1px solid #3a1a1a', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              <Trash2 size={13} />
            </button>
            {open ? <ChevronUp size={16} color="#737373" /> : <ChevronDown size={16} color="#737373" />}
        </div>
      </div>

      {/* Expanded edit form */}
      {open && (
        <div style={{ padding: '16px', borderTop: '1px solid #333333', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontSize: 11, color: '#737373', margin: 0 }}>{pkg.status === 'approved' ? 'Edite os campos e salve. O pacote continuará aprovado.' : 'Edite todos os campos necessários antes de aprovar:'}</p>

          {/* Images */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ImageUploadField label="🖼️ Imagem do Card" value={local.img} onChange={v => set({ img: v })} />
            <ImageUploadField label="Logo do Badge" labelIcon={<Award size={11} />} value={local.badgeImg ?? ''} onChange={v => set({ badgeImg: v })} />
          </div>

          {/* Row 1: título / local / data */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            <MField label="Título"  icon={<Tag size={11} />}         value={local.title} onChange={v => set({ title: v })} />
            <MField label="Local"    icon={<MapPin size={11} />}      value={local.loc}   onChange={v => set({ loc: v })} />
            <MField label="Data"     icon={<CalendarDays size={11} />} value={local.date}  onChange={v => set({ date: v })} />
          </div>

          {/* Row 2: preço / moeda */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <MField label="Preço" icon={<DollarSign size={11} />} value={local.price} onChange={v => set({ price: v })} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Globe2 size={11} /> Moeda</label>
              <select value={local.currency || 'BRL'} onChange={e => set({ currency: e.target.value })}
                style={{ ...IS, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'}>
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: tag / sigla / categoria / em alta */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Award size={11} /> Tag do Card</label>
              <select value={local.tag} onChange={e => set({ tag: e.target.value })}
                style={{ ...IS, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'}>
                {TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <MField label="Sigla do Badge" icon={<Type size={11} />} value={local.badge} onChange={v => set({ badge: v })} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}><Package size={11} /> Categoria</label>
              <select value={local.category || ''} onChange={e => set({ category: e.target.value })}
                style={{ ...IS, cursor: 'pointer' }}
                onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'}>
                <option value="">Selecione uma categoria</option>
                {['Futebol', 'Futebol Americano', 'F1 / Automobilismo', 'UFC / MMA', 'Tênis', 'Basquete', 'WWE / Wrestling', 'Multiesportivo', 'Outros'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, paddingBottom: 2 }}>
              <label style={{ fontSize: 10, color: local.isTrending ? '#e43c44' : '#737373', fontWeight: local.isTrending ? 700 : 600, textTransform: 'uppercase', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}><Flame size={11} /> Em Alta</label>
              <button type="button" onClick={() => {
                if (!local.isTrending && trendingCount >= MAX_TRENDING) {
                  showAlert(`Já existem ${MAX_TRENDING} pacotes em "Pacotes em Alta". Desative um antes de ativar este.`, 'warning');
                  return;
                }
                set({ isTrending: !local.isTrending });
              }}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none',
                  cursor: local.isTrending || trendingCount < MAX_TRENDING ? 'pointer' : 'not-allowed',
                  position: 'relative', transition: 'background .2s',
                  background: local.isTrending ? '#e43c44' : '#1a1a1a',
                  opacity: !local.isTrending && trendingCount >= MAX_TRENDING ? 0.5 : 1,
                }}>
                <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', left: local.isTrending ? 23 : 3 }} />
              </button>
              <span style={{ fontSize: 10, color: local.isTrending ? '#e43c44' : '#737373' }}>{local.isTrending ? 'Sim' : 'Não'}</span>
              {!local.isTrending && trendingCount >= MAX_TRENDING && (
                <span style={{ fontSize: 9, color: '#f87171', textAlign: 'center', lineHeight: 1.3 }}>Lotado ({trendingCount}/{MAX_TRENDING})</span>
              )}
            </div>
          </div>

          {/* Descrição */}
          <MField label="Descrição" icon={<FileText size={11} />} value={local.description ?? ''} onChange={v => set({ description: v })} textarea rows={3} />

          {/* Detalhes */}
          <MField label="Detalhes do Voo"        icon={<Plane size={11} />} value={local.flightDetails ?? ''} onChange={v => set({ flightDetails: v })} textarea />
          <MField label="Detalhes da Hospedagem" icon={<BedDouble size={11} />} value={local.hotelDetails ?? ''}  onChange={v => set({ hotelDetails: v })} textarea />
          <MField label="Detalhes dos Ingressos" icon={<Ticket size={11} />} value={local.ticketDetails ?? ''} onChange={v => set({ ticketDetails: v })} textarea />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            {pkg.status === 'approved' ? (
              <button onClick={handleSaveApprove} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg, #e43c44, #d45f1a)', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Check size={14} /> Salvar Edições
              </button>
            ) : (
              <>
                <button onClick={handleSaveOnly} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#111111', color: '#e8edf2', border: '1px solid #333333', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Salvar sem Aprovar
                </button>
                <button onClick={handleSaveApprove} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'linear-gradient(135deg, #e43c44, #d45f1a)', color: '#000', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  <Check size={14} /> Salvar e Aprovar
                </button>
              </>
            )}
            <button onClick={onReject} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#3a0d0d', color: '#f87171', border: '1px solid #7a1a1a', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <X size={14} /> Rejeitar
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start', paddingTop: 8, borderTop: '1px solid #333333', marginTop: 4 }}>
            <button onClick={async () => { if (await showConfirm('Mover este pacote para a lixeira?', { type: 'danger', confirmText: 'Excluir', title: 'Excluir Pacote' })) { onRemove(); toast('Pacote movido para a lixeira.', 'warning'); } }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: '#2a0a0a', color: '#f87171', border: '1px solid #3a1a1a', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <Trash2 size={14} /> Excluir Pacote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Users Tab ── */
type AdminUser = { id: number; username: string; role: 'admin' | 'master' };

const masterHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('emais_master_token') ?? ''}`,
});

function UsersTab() {
  const { showAlert, showConfirm } = useDialog();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // form state for new user
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'admin' as 'admin' | 'master' });
  const [newErr, setNewErr] = useState('');
  const [newLoading, setNewLoading] = useState(false);

  // form state for edit
  const [editForm, setEditForm] = useState({ username: '', password: '', role: 'admin' as 'admin' | 'master' });
  const [editErr, setEditErr] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users', { headers: masterHeaders() });
      const data = await res.json();
      if (res.ok) setUsers(data);
      else setError(data.error || 'Erro ao carregar usuários');
    } catch { setError('Erro de conexão'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) { setNewErr('Preencha todos os campos'); return; }
    setNewLoading(true); setNewErr('');
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST', headers: masterHeaders(),
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setNewUser({ username: '', password: '', role: 'admin' });
        fetchUsers();
      } else setNewErr(data.error || 'Erro ao criar usuário');
    } catch { setNewErr('Erro de conexão'); }
    finally { setNewLoading(false); }
  };

  const startEdit = (u: AdminUser) => {
    setEditId(u.id);
    setEditForm({ username: u.username, password: '', role: u.role });
    setEditErr('');
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.username) { setEditErr('Username é obrigatório'); return; }
    setEditLoading(true); setEditErr('');
    try {
      const res = await fetch(`/api/auth/users/${editId}`, {
        method: 'PUT', headers: masterHeaders(),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) { setEditId(null); fetchUsers(); }
      else setEditErr(data.error || 'Erro ao editar');
    } catch { setEditErr('Erro de conexão'); }
    finally { setEditLoading(false); }
  };

  const handleDelete = async (u: AdminUser) => {
    const ok = await showConfirm(`Excluir o usuário "${u.username}"? Esta ação não pode ser desfeita.`, { type: 'danger', confirmText: 'Excluir', title: 'Excluir Usuário' });
    if (!ok) return;
    try {
      await fetch(`/api/auth/users/${u.id}`, { method: 'DELETE', headers: masterHeaders() });
      fetchUsers();
    } catch { showAlert('Erro ao excluir usuário.', 'error'); }
  };

  const roleLabel = (r: string) => r === 'master' ? '🔑 Master' : '👤 Admin';
  const roleBg    = (r: string) => r === 'master' ? { background: '#1a1a1a', color: '#e43c44', border: '1px solid #e43c44' } : { background: '#1a1a1a', color: '#737373', border: '1px solid #333333' };

  const inputSt: React.CSSProperties = { ...IS, width: '100%' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e8edf2', margin: 0 }}>Usuários do Painel</h2>
          <p style={{ fontSize: 12, color: '#737373', margin: '4px 0 0' }}>Gerencie quem tem acesso aos painéis Admin e Master.</p>
        </div>
        <button onClick={() => { setShowAdd(a => !a); setNewErr(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: 'linear-gradient(135deg, #e43c44, #d45f1a)', color: '#000', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Novo Usuário
        </button>
      </div>

      {/* Add User Form */}
      {showAdd && (
        <form onSubmit={handleAdd} style={{ background: '#0a0a0a', border: '1px solid #e43c44', borderRadius: 12, padding: '20px 20px 16px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#e43c44', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>➕ Novo Usuário</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>Usuário</label>
              <input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="ex: joao" style={inputSt}
                onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 10, color: '#4a7fa8', fontWeight: 600, textTransform: 'uppercase' }}>Senha</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" style={inputSt}
                onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>Tipo de Acesso</label>
            <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as 'admin' | 'master' }))} style={{ ...inputSt, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'}>
              <option value="admin">👤 Admin — gerencia conteúdo do site</option>
              <option value="master">🔑 Master — aprova pacotes e gerencia usuários</option>
            </select>
          </div>
          {newErr && <p style={{ fontSize: 11, color: '#f87171', margin: '0 0 10px' }}>{newErr}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 14px', background: 'transparent', color: '#737373', border: '1px solid #333333', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={newLoading} style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #e43c44, #d45f1a)', color: '#000', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {newLoading ? 'Criando…' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      )}

      {/* User List */}
      {loading && <div style={{ textAlign: 'center', color: '#737373', padding: 32 }}>Carregando…</div>}
      {error && <div style={{ color: '#f87171', fontSize: 13 }}>{error}</div>}

      {!loading && users.map(u => (
        <div key={u.id}>
          {/* Row */}
          {editId !== u.id ? (
            <div style={{ background: '#0a0a0a', border: '1px solid #333333', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {u.role === 'master' ? <KeyRound size={16} color="#e43c44" /> : <Users size={16} color="#e43c44" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf2' }}>{u.username}</div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, ...roleBg(u.role) }}>{roleLabel(u.role)}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => startEdit(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#111111', color: '#e43c44', border: '1px solid #333333', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Pencil size={12} /> Editar
                </button>
                <button onClick={() => handleDelete(u)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: '#3a0d0d', color: '#f87171', border: '1px solid #7a1a1a', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            </div>
          ) : (
            /* Edit Form */
            <form onSubmit={handleEdit} style={{ background: '#0a0a0a', border: '1px solid #e43c44', borderRadius: 12, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#e43c44', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>✏️ Editando: {u.username}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>Novo Usuário</label>
                  <input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))} style={inputSt}
                    onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: '#4a7fa8', fontWeight: 600, textTransform: 'uppercase' }}>Nova Senha <span style={{ color: '#4a7fa8', fontWeight: 400 }}>(deixe vazio pra manter)</span></label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" style={inputSt}
                    onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                <label style={{ fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' }}>Tipo de Acesso</label>
                <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value as 'admin' | 'master' }))} style={{ ...inputSt, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = '#e43c44'} onBlur={e => e.target.style.borderColor = '#333333'}>
                  <option value="admin">👤 Admin — gerencia conteúdo do site</option>
                  <option value="master">🔑 Master — aprova pacotes e gerencia usuários</option>
                </select>
              </div>
              {editErr && <p style={{ fontSize: 11, color: '#f87171', margin: '0 0 10px' }}>{editErr}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setEditId(null)} style={{ padding: '8px 14px', background: 'transparent', color: '#737373', border: '1px solid #333333', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={editLoading} style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #e43c44, #d45f1a)', color: '#000', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {editLoading ? 'Salvando…' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          )}
        </div>
      ))}

      {!loading && users.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#737373', fontSize: 14, background: '#0a0a0a', borderRadius: 12, border: '1px dashed #333333' }}>
          Nenhum usuário encontrado.
        </div>
      )}
    </div>
  );
}


/* ── Trash Delete Button (needs useDialog hook) ── */
function TrashDeleteButton({ realIdx, permanentRemovePackage, toast }: {
  realIdx: number;
  permanentRemovePackage: (i: number) => void;
  toast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}) {
  const { showConfirm } = useDialog();
  return (
    <button
      onClick={async () => { if (await showConfirm('Excluir permanentemente? Esta ação não pode ser desfeita.', { type: 'danger', confirmText: 'Excluir', title: 'Exclusão Permanente' })) { permanentRemovePackage(realIdx); toast('Pacote excluído permanentemente.', 'error'); } }}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#2a0a0a', color: '#ff6b6b', border: '1px solid #3a1a1a', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
    >
      <Trash2 size={13} /> Deletar
    </button>
  );
}

/* ── Main Master Admin ── */
export default function MasterAdmin() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => {
    const v = localStorage.getItem(MASTER_AUTH_KEY);
    if (v === '1') { localStorage.removeItem(MASTER_AUTH_KEY); return false; } // limpa sessão legada
    return !!v;
  });
  const [section, setSection] = useState<'pending' | 'approved' | 'rejected' | 'users' | 'trash'>('pending');
  const { packages, approvePackage, rejectPackage, masterUpdatePackage, removePackage, restorePackage, permanentRemovePackage, saveError } = useContentConfig();
  const { toast } = useToast();

  // Exibe toast de erro quando o servidor falhar ao salvar
  useEffect(() => {
    if (saveError) {
      toast('Não foi possível salvar no servidor. Suas alterações estão seguras aqui — reinicie o servidor e tente novamente.', 'error');
    }
  }, [saveError, toast]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('emais_master_token');
    if (token) await fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem(MASTER_AUTH_KEY);
    localStorage.removeItem('emais_master_token');
    setAuthed(false);
  }, []);

  if (!authed) return <MasterLogin onLogin={() => setAuthed(true)} />;

  const pendingPkgs = packages.filter(p => (!p.status || p.status === 'pending') && !p.deletedAt);
  const approvedPkgs = packages.filter(p => p.status === 'approved' && !p.deletedAt);
  const rejectedPkgs = packages.filter(p => p.status === 'rejected' && !p.deletedAt);
  const deletedPkgs = packages.map((p, i) => ({ p, i })).filter(({ p }) => !!p.deletedAt);

  const totalPending = pendingPkgs.length;

  const sections = [
    { id: 'pending'  as const, icon: <Clock size={14} />,        label: 'Pendentes',  count: pendingPkgs.length },
    { id: 'approved' as const, icon: <CheckCircle2 size={14} />, label: 'Aprovados',  count: approvedPkgs.length },
    { id: 'rejected' as const, icon: <XCircle size={14} />,      label: 'Rejeitados', count: rejectedPkgs.length },
  ];

  const curPkgs = section === 'pending' ? pendingPkgs : section === 'approved' ? approvedPkgs : section === 'rejected' ? rejectedPkgs : [];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: '#e8edf2', fontFamily: 'Inter, system-ui, sans-serif', alignItems: 'flex-start' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: '#0a0a0a', borderRight: '1px solid #333333', display: 'flex', flexDirection: 'column', padding: '24px 16px', gap: 8, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px 24px', fontSize: 15, fontWeight: 700, color: '#e43c44', borderBottom: '1px solid #333333', marginBottom: 16 }}>
          <Shield size={18} /> Admin Mestre
        </div>

        {totalPending > 0 && (
          <div style={{ background: '#1a1a1a', border: '1px solid #e43c44', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#e43c44', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={13} /> <strong>{totalPending} item{totalPending > 1 ? 's' : ''}</strong> aguardando aprovação
          </div>
        )}

        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600,
            background: section === s.id ? '#1a1a1a' : 'transparent',
            color: section === s.id ? '#e43c44' : '#737373',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{s.icon} {s.label}</span>
            {s.count > 0 && <span style={{ fontSize: 11, background: '#1a1a1a', color: '#e43c44', padding: '1px 7px', borderRadius: 10, fontWeight: 700, border: '1px solid #e43c44' }}>{s.count}</span>}
          </button>
        ))}

        <div style={{ borderTop: '1px solid #333333', margin: '8px 0' }} />

        {/* Users section */}
        <button onClick={() => setSection('users')} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600,
          background: section === 'users' ? '#1a1a1a' : 'transparent',
          color: section === 'users' ? '#e43c44' : '#737373',
        }}>
          <Users size={14} /> Usuários
        </button>

        {/* Trash section */}
        <button onClick={() => setSection('trash')} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600,
          background: section === 'trash' ? '#1a1a1a' : 'transparent',
          color: section === 'trash' ? '#e43c44' : '#737373',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Trash2 size={14} /> Lixeira</span>
          {deletedPkgs.length > 0 && <span style={{ fontSize: 11, background: '#3a1a1a', color: '#f87171', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>{deletedPkgs.length}</span>}
        </button>

        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid #333333', cursor: 'pointer', background: 'transparent', color: '#737373', fontSize: 12, marginBottom: 4 }}>
          <ArrowRight size={13} /> Admin Vendedores
        </button>
        <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid #333333', cursor: 'pointer', background: 'transparent', color: '#737373', fontSize: 12 }}>
          <LogOut size={14} /> Sair
        </button>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>

        {/* Users section */}
        {section === 'users' ? (
          <UsersTab />
        ) : section === 'trash' ? (
          /* Trash Tab */
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e43c44', marginBottom: 4 }}>Lixeira</h1>
            <p style={{ fontSize: 13, color: '#737373', marginBottom: 24 }}>Pacotes excluídos. Restaure ou exclua permanentemente.</p>
            {deletedPkgs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#1a1400', border: '1px solid #7a4a00', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={13} /> Pacotes na lixeira não aparecem no site. Restaure para reativá-los.
                </div>
                {deletedPkgs.map(({ p: pkg, i: realIdx }) => (
                  <div key={realIdx} style={{ background: '#111111', border: '1px solid #3a1a1a', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', opacity: 0.8 }}>
                    {pkg.img ? <img src={pkg.img} alt={pkg.title} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} /> : <div style={{ width: 52, height: 52, background: '#1a1a1a', borderRadius: 8, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#e8edf2' }}>{pkg.title || 'Sem título'}</div>
                      <div style={{ fontSize: 12, color: '#737373', marginTop: 2 }}>
                        Excluído por <strong style={{ color: '#e43c44' }}>{pkg.deletedBy ?? 'admin'}</strong>
                        {pkg.deletedAt ? ` em ${new Date(pkg.deletedAt).toLocaleDateString('pt-BR')}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { restorePackage(realIdx); toast(`"${pkg.title}" restaurado!`, 'success'); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#0d3320', color: '#4ade80', border: '1px solid #1a5c38', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        <RotateCcw size={13} /> Restaurar
                      </button>
                      <TrashDeleteButton realIdx={realIdx} permanentRemovePackage={permanentRemovePackage} toast={toast} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 20px', color: '#737373' }}>
                <Trash2 size={32} />
                <span style={{ fontSize: 14 }}>Lixeira vazia. Pacotes excluídos aparecerão aqui.</span>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e43c44', marginBottom: 4 }}>
              {section === 'pending' ? 'Aguardando Aprovação' : section === 'approved' ? 'Conteúdo Aprovado' : 'Conteúdo Rejeitado'}
            </h1>
            <p style={{ fontSize: 13, color: '#737373', marginBottom: 24 }}>
              {section === 'pending' ? 'Revise, edite se necessário, e aprove ou rejeite cada item.' : section === 'approved' ? 'Estes itens estão visíveis no site público.' : 'Estes itens foram rejeitados e não aparecem no site.'}
            </p>

            {/* Packages */}
            {curPkgs.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Plane size={13} /> Pacotes ({curPkgs.length})</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {curPkgs.map((pkg) => {
                    const realIdx = packages.findIndex(p =>
                      pkg.createdAt ? p.createdAt === pkg.createdAt : (p.title === pkg.title && p.loc === pkg.loc)
                    );
                    return (
                      <PackageReviewCard
                        key={realIdx}
                        pkg={pkg}
                        index={realIdx}
                        onApprove={() => { approvePackage(realIdx); toast('Pacote aprovado! ✅', 'success'); }}
                        onReject={() => { rejectPackage(realIdx); toast('Pacote rejeitado.', 'warning'); }}
                        onUpdate={d => masterUpdatePackage(realIdx, d)}
                        onRemove={() => removePackage(realIdx, localStorage.getItem('emais_master_auth') || 'master')}
                        trendingCount={packages.filter(p => p.isTrending && !p.deletedAt).length}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {curPkgs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#737373', fontSize: 14 }}>
                {section === 'pending'
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Flame size={14} /> Nenhum item pendente. Tudo em ordem!</span>
                  : section === 'approved' ? 'Nenhum pacote aprovado ainda.' : 'Nenhum pacote rejeitado.'}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
