import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, LogOut, Package, Video, Code, Link as LinkIcon, 
  Check, Save, Search, ExternalLink, Activity, Info, AlertCircle, X,
  Play, Database, Send, CheckCircle2, Globe, Star, Image as ImageIcon,
  BedDouble, Calendar, DollarSign, LayoutGrid, CheckSquare, Plus, Trash2, ChevronDown, ChevronUp, Clock, Tag, FileText
} from 'lucide-react';
import { useContentConfig } from '../hooks/useContentConfig';
import type { TrendingPackage } from '../types';
import { useToast } from '../components/ui/ToastProvider';

const MARKETING_AUTH_KEY = 'emais_marketing_auth';
const MARKETING_TOKEN_KEY = 'emais_marketing_token';

const IS = { 
  background: '#001529', 
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

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: 4 };
const labelStyle = { fontSize: 10, color: '#737373', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4 };



/* ── Image Field Component (Manager) ── */
function ImageField({ value, onUpdate, label = 'Imagem' }: { value: string; onUpdate: (url: string) => void; label?: string }) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const token = localStorage.getItem(MARKETING_TOKEN_KEY);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        onUpdate(data.url);
        toast('Imagem atualizada!', 'success');
      } else {
        const data = await res.json();
        toast(data.error || 'Erro no upload', 'error');
      }
    } catch (err) {
      toast('Erro de conexão', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!value) return;
    
    // Se for um arquivo local (começa com /uploads/), tenta deletar do servidor
    if (value.startsWith('/uploads/')) {
      try {
        const filename = value.split('/').pop();
        await fetch(`/api/upload?file=${filename}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Erro ao deletar arquivo físico:', e);
      }
    }
    
    onUpdate('');
    toast('Imagem removida', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#001a33', padding: 12, borderRadius: 10, border: '1px solid #002b52' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#737373', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <label style={{ 
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, 
            color: uploading ? '#555' : '#3b82f6', cursor: uploading ? 'wait' : 'pointer',
            padding: '4px 8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 6, transition: 'all 0.2s'
          }}>
            {uploading ? <Activity size={10} className="spin-icon" /> : <Plus size={10} />}
            {uploading ? 'Enviando...' : (value ? 'Substituir' : 'Adicionar')}
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
          {value && (
            <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: '#ef4444', cursor: 'pointer', padding: '4px 8px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: 6 }}>
              <Trash2 size={10} /> Remover
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {value ? (
          <div style={{ position: 'relative', width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #333', flexShrink: 0 }}>
            <img src={value} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: 8, background: '#002042', border: '1px dashed #003866', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ImageIcon size={20} color="#003866" />
          </div>
        )}
        <input 
          value={value} 
          onChange={e => onUpdate(e.target.value)} 
          placeholder="https://... ou caminho do arquivo" 
          style={{ 
            ...IS, padding: '8px 10px', fontSize: 12, flex: 1, 
            background: '#001529', border: '1px solid #002b52' 
          }} 
        />
      </div>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}


/* ── Gallery Manager Component ── */
function GalleryManager({ value, onUpdate }: { value: string; onUpdate: (val: string) => void }) {
  const images = value ? value.split(';').map(s => s.trim()).filter(Boolean) : [];

  const updateItem = (index: number, newUrl: string) => {
    const newImages = [...images];
    if (newUrl) {
      newImages[index] = newUrl;
    } else {
      newImages.splice(index, 1);
    }
    onUpdate(newImages.join('; '));
  };

  const addItem = (url: string) => {
    if (!url) return;
    const newImages = [...images, url];
    onUpdate(newImages.join('; '));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {images.map((img, idx) => (
          <ImageField 
            key={`${idx}-${img}`}
            label={`Foto ${idx + 1}`}
            value={img}
            onUpdate={(url) => updateItem(idx, url)}
          />
        ))}
      </div>
      
      <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 12, border: '1px dashed rgba(59, 130, 246, 0.2)' }}>
        <div style={{ marginBottom: 8, fontSize: 10, color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase' }}>Adicionar nova foto à galeria</div>
        <ImageField value="" onUpdate={addItem} label="Nova Imagem" />
      </div>
    </div>
  );
}

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001529', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#001a33', border: '1px solid #333333', borderRadius: 16, padding: '40px 32px', width: 360, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 24px 64px rgba(0,0,0,.8)' }}>
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

/* ── Marketing Editor ── */
/* ── UI Helpers ── */
function Section({ title, icon: Icon, children, color = '#3b82f6' }: { title: string; icon: any; children: React.ReactNode; color?: string }) {
  return (
    <div style={{ background: '#001a33', border: '1px solid #003866', borderRadius: 16, padding: '24px 32px', marginBottom: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, borderBottom: '1px solid #002b52', paddingBottom: 18 }}>
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

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24, padding: 20, background: '#002042', borderRadius: 12, border: '1px solid #002b52' }}>
      <h4 style={{ fontSize: 11, fontWeight: 800, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }}></div>
        {title}
      </h4>
      {children}
    </div>
  );
}

function MarketingEditor({ pkg, onUpdate, onCancel }: { 
  pkg: TrendingPackage; 
  onUpdate: (d: Partial<TrendingPackage>) => void;
  onCancel: () => void;
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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, background: '#001a33', padding: '20px 32px', borderRadius: 16, border: '1px solid #003866' }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        {/* Left Column: Visual & Content */}
        <div>
          <Section title="Estratégia Visual & Hero" icon={Video} color="#3b82f6">
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '150px 150px 1fr', gap: 16 }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Template Esporte</label>
                  <select 
                    value={local.sportType || 'automobilismo'} 
                    onChange={e => setLocal({...local, sportType: e.target.value})}
                    style={IS}
                    className="admin-input"
                  >
                    <option value="automobilismo">🏎️ Automobilismo</option>
                    <option value="futebol">⚽ Futebol</option>
                    <option value="tenis">🎾 Tênis</option>
                    <option value="basquete">🏀 Basquete</option>
                    <option value="lutas">🥊 Lutas (UFC/Boxe)</option>
                    <option value="geral">🏆 Geral</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Destaque Hero</label>
                  <select 
                    value={local.heroType || 'video'} 
                    onChange={e => setLocal({...local, heroType: e.target.value as any})}
                    style={IS}
                    className="admin-input"
                  >
                    <option value="video">🎞️ Vídeo</option>
                    <option value="image">🖼️ Imagem</option>
                  </select>
                </div>
                <ImageField 
                  label={local.heroType === 'image' ? "Imagem de Fundo (Hero)" : "Thumbnail do Vídeo"} 
                  value={local.heroType === 'image' ? (local.heroImage || '') : (local.videoUrl || '')} 
                  onUpdate={(url) => local.heroType === 'image' ? setLocal({...local, heroImage: url}) : setLocal({...local, videoUrl: url})} 
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Galeria de Fotos VIP</label>
                <GalleryManager 
                  value={local.galleryImages || ''} 
                  onUpdate={(val) => setLocal({...local, galleryImages: val})} 
                />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Diferenciais & Benefícios (Cards)</label>
                <textarea 
                  value={local.highlights || ''} 
                  onChange={e => setLocal({...local, highlights: e.target.value})} 
                  placeholder="Acesso ao Paddock; Translado VIP; Hotel 5 Estrelas..." 
                  style={{ ...IS, height: 80 }} 
                  className="admin-input"
                />
              </div>
            </div>
          </Section>

          <Section title="Programação do Evento" icon={Calendar} color="#f59e0b">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => {
                const p = (() => { try { return JSON.parse(local.programacaoData || '[]'); } catch { return []; } })();
                p.push({ titulo_aba: '', titulo_dia: '', atividades: [] });
                setLocal({...local, programacaoData: JSON.stringify(p)});
              }} style={{ background: '#002b52', border: '1px solid #333', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Adicionar Dia
              </button>
            </div>
            
            {(() => {
              const prog = (() => { try { return JSON.parse(local.programacaoData || '[]'); } catch { return []; } })();
              if(prog.length === 0) return <div style={{ textAlign: 'center', padding: '32px', color: '#444', fontSize: 13, background: '#080808', borderRadius: 12, border: '1px dashed #003866' }}>Nenhuma programação definida.</div>;
              return prog.map((day: any, i: number) => (
                <div key={`prog-${i}`} style={{ background: '#002042', padding: 20, borderRadius: 12, border: '1px solid #002b52', marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 12, marginBottom: 16 }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Aba</label>
                      <input placeholder="Ex: DIA 1" value={day.titulo_aba || day.dia || ''} onChange={e => {
                        const newProg = [...prog]; newProg[i].titulo_aba=e.target.value;
                        setLocal({...local, programacaoData: JSON.stringify(newProg)});
                      }} style={IS} className="admin-input" />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Título do Dia</label>
                      <input placeholder="Ex: Sábado, 24 de Maio - Treinos Livres" value={day.titulo_dia || day.data || ''} onChange={e => {
                        const newProg = [...prog]; newProg[i].titulo_dia=e.target.value;
                        setLocal({...local, programacaoData: JSON.stringify(newProg)});
                      }} style={IS} className="admin-input" />
                    </div>
                    <button title="Excluir Dia" onClick={() => {
                      const newProg = [...prog]; newProg.splice(i, 1);
                      setLocal({...local, programacaoData: JSON.stringify(newProg)});
                    }} style={{ marginTop: 22, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 8, borderRadius: 8 }} className="hover-red"><Trash2 size={16} /></button>
                  </div>
                  
                  <div style={{ paddingLeft: 16, borderLeft: '2px solid #003866' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 10, color: '#555', fontWeight: 800, textTransform: 'uppercase' }}>Atividades do Dia</span>
                      <button onClick={() => {
                        const newProg = [...prog]; 
                        if(!newProg[i].atividades) newProg[i].atividades = [];
                        newProg[i].atividades.push({ horario: '', descricao: '' });
                        setLocal({...local, programacaoData: JSON.stringify(newProg)});
                      }} style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>+ Atividade</button>
                    </div>
                    {(day.atividades || []).map((ativ: any, j: number) => (
                      <div key={`ativ-${j}`} style={{ display: 'grid', gridTemplateColumns: '90px 1fr auto', gap: 12, marginBottom: 8 }}>
                        <input placeholder="08:00" value={ativ.horario || ''} onChange={e => {
                          const newProg = [...prog]; newProg[i].atividades[j].horario=e.target.value;
                          setLocal({...local, programacaoData: JSON.stringify(newProg)});
                        }} style={{ ...IS, padding: '8px 10px', fontSize: 12 }} className="admin-input" />
                        <input placeholder="Descrição da atividade..." value={ativ.descricao || ''} onChange={e => {
                          const newProg = [...prog]; newProg[i].atividades[j].descricao=e.target.value;
                          setLocal({...local, programacaoData: JSON.stringify(newProg)});
                        }} style={{ ...IS, padding: '8px 10px', fontSize: 12 }} className="admin-input" />
                        <button onClick={() => {
                          const newProg = [...prog]; newProg[i].atividades.splice(j, 1);
                          setLocal({...local, programacaoData: JSON.stringify(newProg)});
                        }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </Section>
        </div>

        {/* Right Column: Inclusions, Packages & Scripts */}
        <div>
          <Section title="Configuração de Hospedagem" icon={BedDouble} color="#10b981">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button onClick={() => {
                let pacotesObj = { opcoes_hospedagem: [], datas: { partida: '', retorno: '', duracao: '' }, inclusos: [] };
                try { 
                  const parsed = JSON.parse(local.pacotesOptionsData || '{}');
                  pacotesObj = Array.isArray(parsed) ? { ...pacotesObj, opcoes_hospedagem: parsed } : { ...pacotesObj, ...parsed };
                } catch {}
                pacotesObj.opcoes_hospedagem.push({ nome: '', descricao_card: '', valor_individual: '', valor_duplo: '', moeda: 'USD', parcelas: '10', inclusos: [] });
                setLocal({...local, pacotesOptionsData: JSON.stringify(pacotesObj)});
              }} style={{ background: '#002b52', border: '1px solid #333', color: '#fff', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={14} /> Novo Card de Hospedagem
              </button>
            </div>

            {(() => {
              let pacotesObj = { opcoes_hospedagem: [], datas: { partida: '', retorno: '', duracao: '' }, inclusos: [] };
              try { 
                const parsed = JSON.parse(local.pacotesOptionsData || '{}');
                pacotesObj = Array.isArray(parsed) ? { ...pacotesObj, opcoes_hospedagem: parsed } : { ...pacotesObj, ...parsed };
              } catch {}

              const updatePacotes = (newObj: any) => setLocal({...local, pacotesOptionsData: JSON.stringify(newObj)});

              return (
                <div style={{ display: 'grid', gap: 20 }}>
                  {pacotesObj.opcoes_hospedagem.map((op: any, i: number) => (
                    <div key={`op-${i}`} style={{ background: '#002042', padding: 20, borderRadius: 12, border: '1px solid #002b52' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, background: '#10b9811a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#10b981' }}>{i+1}</div>
                          <input placeholder="Nome da Hospedagem (Ex: JW Marriott)" value={op.nome || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].nome=e.target.value; updatePacotes(n); }} style={{ ...IS, width: 250, fontWeight: 700, border: 'none', background: 'transparent', padding: 0 }} />
                        </div>
                        <button onClick={() => { const n={...pacotesObj}; n.opcoes_hospedagem.splice(i, 1); updatePacotes(n); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      </div>

                      <div style={{ display: 'grid', gap: 12 }}>
                        <textarea placeholder="Pequena descrição para o card..." value={op.descricao_card || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].descricao_card=e.target.value; updatePacotes(n); }} style={{ ...IS, height: 60 }} className="admin-input" />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                          <div style={fieldStyle}>
                            <label style={labelStyle}><DollarSign size={10} /> Valor Individual</label>
                            <input placeholder="Ex: 1200" value={op.valor_individual || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].valor_individual=e.target.value; updatePacotes(n); }} style={IS} className="admin-input" />
                          </div>
                          <div style={fieldStyle}>
                            <label style={labelStyle}><DollarSign size={10} /> Valor Duplo</label>
                            <input placeholder="Ex: 1500" value={op.valor_duplo || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].valor_duplo=e.target.value; updatePacotes(n); }} style={IS} className="admin-input" />
                          </div>
                          <div style={fieldStyle}>
                            <label style={labelStyle}><Tag size={10} /> Moeda</label>
                            <input placeholder="Ex: USD" value={op.moeda || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].moeda=e.target.value; updatePacotes(n); }} style={IS} className="admin-input" />
                          </div>
                        </div>

                        {/* Local Inclusions */}
                        <div style={{ marginTop: 12, padding: 16, background: '#001a33', borderRadius: 10, border: '1px solid #002b52' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, color: '#555', fontWeight: 800, textTransform: 'uppercase' }}>Inclusos exclusivos deste card</span>
                            <button onClick={() => {
                              const n = { ...pacotesObj };
                              if(!n.opcoes_hospedagem[i].inclusos) n.opcoes_hospedagem[i].inclusos = [];
                              n.opcoes_hospedagem[i].inclusos.push({ titulo: '', descricao: '' });
                              updatePacotes(n);
                            }} style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontSize: 10 }}>+ Item</button>
                          </div>
                          {(op.inclusos || []).map((inc: any, j: number) => (
                            <div key={`inc-local-${j}`} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                              <input placeholder="Título (Ex: Café da Manhã)" value={inc.titulo || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].inclusos[j].titulo=e.target.value; updatePacotes(n); }} style={{ ...IS, padding: '6px 10px', fontSize: 11 }} />
                              <input placeholder="Descrição curta..." value={inc.descricao || ''} onChange={e => { const n={...pacotesObj}; n.opcoes_hospedagem[i].inclusos[j].descricao=e.target.value; updatePacotes(n); }} style={{ ...IS, padding: '6px 10px', fontSize: 11 }} />
                              <button onClick={() => { const n={...pacotesObj}; n.opcoes_hospedagem[i].inclusos.splice(j, 1); updatePacotes(n); }} style={{ background: 'transparent', border: 'none', color: '#555', cursor: 'pointer' }}><X size={14} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <SubSection title="Datas Gerais & Inclusos Globais (Fallback)">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Partida</label>
                        <input value={pacotesObj.datas?.partida || ''} onChange={e => { const n={...pacotesObj}; if(!n.datas) n.datas={} as any; n.datas.partida=e.target.value; updatePacotes(n); }} style={IS} className="admin-input" />
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Retorno</label>
                        <input value={pacotesObj.datas?.retorno || ''} onChange={e => { const n={...pacotesObj}; if(!n.datas) n.datas={} as any; n.datas.retorno=e.target.value; updatePacotes(n); }} style={IS} className="admin-input" />
                      </div>
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Resumo</label>
                        <input placeholder="Ex: 5 dias / 4 noites" value={pacotesObj.datas?.duracao || ''} onChange={e => { const n={...pacotesObj}; if(!n.datas) n.datas={} as any; n.datas.duracao=e.target.value; updatePacotes(n); }} style={IS} className="admin-input" />
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 10, color: '#555', fontWeight: 800, textTransform: 'uppercase' }}>Inclusos Padrão (Todos os pacotes)</span>
                      <button onClick={() => {
                        const n = { ...pacotesObj }; if(!n.inclusos) n.inclusos=[]; n.inclusos.push({ titulo: '', descricao: '' });
                        updatePacotes(n);
                      }} style={{ background: '#002b52', border: '1px solid #333', color: '#fff', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>+ Adicionar Item Global</button>
                    </div>
                    {(pacotesObj.inclusos || []).map((inc: any, i: number) => (
                      <div key={`inc-global-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 12, marginBottom: 8, alignItems: 'start' }}>
                        <input placeholder="Título..." value={inc.titulo || ''} onChange={e => { const n={...pacotesObj}; n.inclusos[i].titulo=e.target.value; updatePacotes(n); }} style={IS} />
                        <textarea placeholder="Descrição..." value={inc.descricao || ''} onChange={e => { const n={...pacotesObj}; n.inclusos[i].descricao=e.target.value; updatePacotes(n); }} style={{ ...IS, height: 40 }} />
                        <button onClick={() => { const n={...pacotesObj}; n.inclusos.splice(i, 1); updatePacotes(n); }} style={{ marginTop: 10, background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                    ))}
                  </SubSection>
                </div>
              );
            })()}
          </Section>

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
                <label style={labelStyle}><Database size={14} color="#8b5cf6" /> Webhook Clint Digital</label>
                <input value={local.webhookClint || ''} onChange={e => setLocal({...local, webhookClint: e.target.value})} placeholder="https://..." style={IS} className="admin-input" />
              </div>
            </div>
          </Section>
        </div>
      </div>

      <div style={{ marginTop: 32, padding: '24px 32px', background: '#001a33', borderRadius: 16, border: '1px solid #003866', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
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
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(() => !!localStorage.getItem(MARKETING_AUTH_KEY));
  const [search, setSearch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { packages, marketingUpdatePackage, loading: loadingContent } = useContentConfig();
  const { toast } = useToast();

  const logout = useCallback(() => {
    const token = localStorage.getItem(MARKETING_TOKEN_KEY);
    if (token) fetch('/api/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    localStorage.removeItem(MARKETING_AUTH_KEY);
    localStorage.removeItem(MARKETING_TOKEN_KEY);
    setAuthed(false);
  }, []);

  if (!authed) return <MarketingLogin onLogin={() => setAuthed(true)} />;

  // Marketing apenas vê pacotes aprovados
  const approvedPkgs = packages
    .map((p, i) => ({ ...p, originalIndex: i }))
    .filter(p => p.status === 'approved' && !p.deletedAt);

  const filtered = approvedPkgs.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.loc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#001529', color: '#e8edf2', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#001a33', borderRight: '1px solid #003866', display: 'flex', flexDirection: 'column', padding: '32px 20px', gap: 8, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 32, borderBottom: '1px solid #003866', marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>E-Mais</div>
            <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.05em' }}>MKT PORTAL</div>
          </div>
        </div>

        <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#002042', border: '1px solid #3b82f633', borderRadius: 10, color: '#3b82f6', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
          <Package size={18} /> Landing Pages
        </button>
        
        <div style={{ flex: 1 }} />

        <div style={{ background: '#0d0d0d', borderRadius: 14, padding: 16, border: '1px solid #002b52', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3b82f61a', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>M</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{localStorage.getItem(MARKETING_AUTH_KEY)}</div>
              <div style={{ fontSize: 10, color: '#555' }}>marketing@gpexperience</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8, border: '1px solid #003866', background: 'transparent', color: '#737373', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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
                  style={{ ...IS, paddingLeft: 42, background: '#001a33', border: '1px solid #003866' }} 
                />
              </div>
            </header>

            {loadingContent && <div style={{ color: '#737373', padding: 40, textAlign: 'center' }}>Carregando dados...</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {filtered.map((pkg) => (
                <div key={pkg.originalIndex} style={{ background: '#001a33', border: '1px solid #003866', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 0.2s' }}>
                  <div style={{ position: 'relative', height: 140 }}>
                    {pkg.img ? (
                      <img src={pkg.img} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#002042' }} />
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
                        <span style={{ fontSize: 10, background: '#002b52', color: '#555', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Sem Mautic</span>
                      }
                      {pkg.videoUrl ? 
                        <span style={{ fontSize: 10, background: '#1e3a8a', color: '#93c5fd', padding: '2px 8px', borderRadius: 6, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Play size={10} /> Vídeo Hero</span> : 
                        null
                      }
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => setEditingIndex(pkg.originalIndex)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: '#002042', color: '#fff', border: '1px solid #333', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Configurar LP
                      </button>
                      <a 
                        href={`/pacote/${pkg.originalIndex}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ width: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d', border: '1px solid #003866', borderRadius: 10, color: '#737373', cursor: 'pointer' }}
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
              <div style={{ textAlign: 'center', padding: 80, background: '#001a33', border: '1px dashed #003866', borderRadius: 24, marginTop: 24 }}>
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
