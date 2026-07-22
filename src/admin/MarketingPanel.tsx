import React, { useState, useCallback, useEffect } from 'react';
import {
  LogOut, Package, Code, Link as LinkIcon,
  Save, Search, ExternalLink, Activity,
  Play, Database, CheckCircle2, Globe, Clock
} from 'lucide-react';
import { useContentConfig } from '../hooks/useContentConfig';
import { PORTAL_ID, type TrendingPackage } from '../types';
import { useToast } from '../components/ui/ToastProvider';
import LPContentEditor from './LPEditor';

const MARKETING_AUTH_KEY = 'emais_marketing_auth';
const MARKETING_TOKEN_KEY = 'emais_marketing_token';

const IS = {
  background: '#050505',
  border: '1px solid #333333',
  borderRadius: 8,
  color: '#e8edf2',
  fontSize: 13,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
  fontFamily: 'Inter, system-ui, sans-serif'
};

/* ── Login ── */
function MarketingLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw, role: 'marketing' }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(MARKETING_AUTH_KEY, data.username ?? username);
        localStorage.setItem(MARKETING_TOKEN_KEY, data.token);
        onLogin();
      } else {
        const data = await res.json();
        setError(data.error || 'Acesso negado para marketing');
      }
    } catch {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#0a0a0a', border: '1px solid #333333', borderRadius: 16, padding: '40px 32px', width: 360, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 24px 64px rgba(0,0,0,.8)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)' }}>
            <Activity size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e8edf2', margin: 0 }}>Painel Marketing</h1>
          <p style={{ fontSize: 13, color: '#737373', marginTop: 8 }}>Gestão de LPs e Conversão</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Marketing User" autoFocus style={IS} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" style={IS} />
          {error && <span style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{error}</span>}
        </div>

        <button type="submit" disabled={loading} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)' }}>
          {loading ? 'Entrando...' : 'Acessar Painel'}
        </button>
      </form>
    </div>
  );
}

/* ── UI Helpers ── */
function Section({ title, icon: Icon, children, color = '#3b82f6' }: { title: string; icon: any; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 16, padding: '24px 32px', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, borderBottom: '1px solid #1a1a1a', paddingBottom: 18 }}>
        <div style={{ width: 42, height: 42, background: `${color}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}33` }}>
          <Icon size={20} color={color} />
        </div>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{title}</h3>
          <div style={{ width: 30, height: 2, background: color, marginTop: 4, borderRadius: 2 }}></div>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Marketing Editor ── */
function MarketingEditor({ pkg, onUpdate, onCancel, allPackages }: {
  pkg: TrendingPackage;
  onUpdate: (d: Partial<TrendingPackage>) => void;
  onCancel: () => void;
  allPackages?: TrendingPackage[];
}) {
  const [local, setLocal] = useState<TrendingPackage>({ ...pkg });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(local);
      toast('Configurações salvas!', 'success');
      onCancel();
    } catch {
      toast('Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: 8 };
  const labelStyle = { fontSize: 11, color: '#737373', fontWeight: 700, textTransform: 'uppercase' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .admin-input:focus { border-color: #3b82f6 !important; background: #0c0c0c !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, background: '#0a0a0a', padding: '20px 32px', borderRadius: 16, border: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, background: '#3b82f6', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
            <Activity size={24} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{pkg.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, color: '#737373', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Criado em {pkg.createdAt?.split('T')[0] || 'N/A'}</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#333' }}></span>
              <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>PAINEL DE MARKETING</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #333', color: '#737373', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Descartar</button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
            {saving ? 'Gravando...' : <><Save size={16} /> Salvar Alterações</>}
          </button>
        </div>
      </div>

      {/* ── Conteúdo da Landing Page — editor compartilhado (Admin/Master/Marketing) ── */}
      <LPContentEditor pkg={local} onUpdate={d => setLocal(prev => ({ ...prev, ...d }))} tokenKey="emais_marketing_token" allPackages={allPackages} />

      <div style={{ marginTop: 32 }}>

          <Section title="Integrações & Tracking" icon={Code} color="#8b5cf6">
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}><Globe size={14} color="#8b5cf6" /> Snippet Form Mautic (HTML)</label>
                <textarea
                  value={local.mauticFormCode || ''}
                  onChange={e => setLocal({...local, mauticFormCode: e.target.value})}
                  placeholder="Cole aqui o formulário completo do Mautic..."
                  style={{ ...IS, height: 120, fontFamily: 'monospace', fontSize: 11 }}
                  className="admin-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Scripts HEAD (Pixel/GTM)</label>
                  <textarea
                    value={local.trackingScriptHead || ''}
                    onChange={e => setLocal({...local, trackingScriptHead: e.target.value})}
                    placeholder="<script>..."
                    style={{ ...IS, height: 80, fontSize: 11, fontFamily: 'monospace' }}
                    className="admin-input"
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Scripts BODY</label>
                  <textarea
                    value={local.trackingScriptBody || ''}
                    onChange={e => setLocal({...local, trackingScriptBody: e.target.value})}
                    placeholder="<noscript>..."
                    style={{ ...IS, height: 80, fontSize: 11, fontFamily: 'monospace' }}
                    className="admin-input"
                  />
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}><LinkIcon size={14} color="#8b5cf6" /> URL de Redirect (Obrigado)</label>
                <input value={local.redirectUrl || ''} onChange={e => setLocal({...local, redirectUrl: e.target.value})} placeholder="https://..." style={IS} className="admin-input" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}><LinkIcon size={14} color="#ef4444" /> URL de LP Externa (Opcional)</label>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px' }}>Se preenchido, o clique no pacote abrirá esta URL em vez de gerar a página interna.</div>
                <input value={local.externalUrl || ''} onChange={e => setLocal({...local, externalUrl: e.target.value})} placeholder="Ex: https://evento.emais.tur.br" style={IS} className="admin-input" />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}><Database size={14} color="#8b5cf6" /> Webhook Clint Digital</label>
                <input value={local.webhookClint || ''} onChange={e => setLocal({...local, webhookClint: e.target.value})} placeholder="https://..." style={IS} className="admin-input" />
              </div>
            </div>
          </Section>
      </div>

      <div style={{ marginTop: 32, padding: '24px 32px', background: '#0a0a0a', borderRadius: 16, border: '1px solid #222', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
        <button onClick={onCancel} style={{ padding: '12px 32px', background: 'transparent', color: '#737373', border: '1px solid #333333', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Descartar Alterações</button>
        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 48px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}>
          {saving ? 'Gravando...' : <><Save size={18} /> Salvar Tudo</>}
        </button>
      </div>
    </div>
  );
}

/* ── Main Marketing Panel ── */
export default function MarketingPanel() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(MARKETING_AUTH_KEY));
  const [search, setSearch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { packages, marketingUpdatePackage, loading: loadingContent, saveError } = useContentConfig();
  const { toast } = useToast();

  const logout = useCallback(() => {
    const token = localStorage.getItem(MARKETING_TOKEN_KEY);
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem(MARKETING_AUTH_KEY);
    localStorage.removeItem(MARKETING_TOKEN_KEY);
    setAuthed(false);
  }, []);

  // Sem isso, um save que falha (ex: sessão expirada) não avisa ninguém — a
  // edição fica só na tela, o usuário acha que salvou, e ao reabrir o pacote
  // vê tudo revertido. Sessão expirada/inválida também derruba de volta pro
  // login, já que continuar editando contra uma sessão morta só perde mais
  // trabalho do usuário.
  useEffect(() => {
    if (!saveError) return;
    toast(`Erro ao salvar: ${saveError}`, 'error');
    if (/sess[ãa]o/i.test(saveError)) logout();
  }, [saveError, toast, logout]);

  if (!authed) return <MarketingLogin onLogin={() => setAuthed(true)} />;

  // Marketing apenas vê pacotes aprovados
  const approvedPkgs = packages
    .map((p, i) => ({ ...p, originalIndex: i }))
    .filter(p => (!p.origem || p.origem === PORTAL_ID) && p.status === 'approved' && !p.deletedAt); // Integração: LPs de pacotes de outros portais são configuradas na origem

  const filtered = approvedPkgs.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.loc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: '#e8edf2', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#0a0a0a', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', padding: '32px 20px', gap: 8, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 32, borderBottom: '1px solid #222', marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>E-Mais</div>
            <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.05em' }}>MKT PORTAL</div>
          </div>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#111', border: '1px solid #3b82f633', borderRadius: 10, color: '#3b82f6', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
          <Package size={18} /> Landing Pages
        </button>

        <div style={{ flex: 1 }} />

        <div style={{ background: '#0d0d0d', borderRadius: 14, padding: 16, border: '1px solid #1a1a1a', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f61a', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>M</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{localStorage.getItem(MARKETING_AUTH_KEY)}</div>
              <div style={{ fontSize: 10, color: '#555' }}>marketing@emais</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8, border: '1px solid #222', background: 'transparent', color: '#737373', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <LogOut size={14} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '48px 64px', overflowY: 'auto' }}>
        {editingIndex !== null ? (
          <MarketingEditor
            pkg={packages[editingIndex]}
            onCancel={() => setEditingIndex(null)}
            onUpdate={d => marketingUpdatePackage(editingIndex, d)}
            allPackages={packages}
          />
        ) : (
          <div style={{ maxWidth: 1000 }}>
            <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Landing Pages de Pacotes</h1>
                <p style={{ fontSize: 14, color: '#737373', marginTop: 8 }}>Gerencie as integrações e scripts das páginas de conversão.</p>
              </div>
              <div style={{ position: 'relative', width: 300 }}>
                <Search size={18} color="#444" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Buscar pacotes aprovados..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ ...IS, paddingLeft: 42, background: '#0a0a0a', border: '1px solid #222' }}
                />
              </div>
            </header>

            {loadingContent && <div style={{ color: '#737373', padding: 40, textAlign: 'center' }}>Carregando dados...</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filtered.map((pkg) => (
                <div key={pkg.originalIndex} style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}>
                  <div style={{ position: 'relative', height: 140 }}>
                    {pkg.img ? (
                      <img src={pkg.img} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#111' }} />
                    )}
                    <div style={{ position: 'absolute', top: 12, right: 12, background: '#0d3320', color: '#4ade80', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 800 }}>APROVADO</div>
                  </div>

                  <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{pkg.title}</h3>
                      <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{pkg.loc} · {pkg.date}</div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {pkg.mauticFormCode ?
                        <span style={{ fontSize: 10, background: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={10} /> Mautic OK</span> :
                        <span style={{ fontSize: 10, background: '#1a1a1a', color: '#555', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Sem Mautic</span>
                      }
                      {pkg.videoUrl ?
                        <span style={{ fontSize: 10, background: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Play size={10} /> Vídeo Hero</span> :
                        null
                      }
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setEditingIndex(pkg.originalIndex)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Configurar LP
                      </button>
                      <a
                        href={pkg.externalUrl && pkg.externalUrl.trim() !== '' ? pkg.externalUrl : `/pacote/${pkg.slug || pkg.originalIndex}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', border: '1px solid #222', borderRadius: 10, color: '#737373', cursor: 'pointer' }}
                        title="Ver Landing Page"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && !loadingContent && (
              <div style={{ textAlign: 'center', padding: 80, background: '#0a0a0a', border: '1px dashed #222', borderRadius: 24, marginTop: 24 }}>
                <Package size={40} color="#333" style={{ marginBottom: 16 }} />
                <h3 style={{ color: '#fff', margin: 0 }}>Nenhum pacote disponível</h3>
                <p style={{ color: '#737373', fontSize: 14, marginTop: 8 }}>Os pacotes precisam ser aprovados pelo Admin Mestre para aparecerem aqui.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
