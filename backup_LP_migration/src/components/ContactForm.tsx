import { useState, useId, useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSelectedPackage } from '../hooks/useSelectedPackage';
import { useContentConfig } from '../hooks/useContentConfig';

/* ── floating label input ────────────────────────────────────── */
function FloatInput({
  id, label, type = 'text', autoComplete, value, onChange, required,
}: {
  id: string; label: string; type?: string;
  autoComplete?: string; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const raised = focused || value.length > 0;

  return (
    <div style={{ position: 'relative' }}>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: '#111111',
          border: `1.5px solid ${focused ? '#e43c44' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 12,
          color: '#fff',
          fontSize: 15,
          padding: '22px 18px 8px',
          outline: 'none',
          transition: 'border-color 0.2s, background 0.2s',
          fontFamily: 'inherit',
          letterSpacing: '0.01em',
        }}
      />
      <label
        htmlFor={id}
        style={{
          position: 'absolute',
          left: 18,
          top: raised ? 8 : '50%',
          transform: raised ? 'none' : 'translateY(-50%)',
          fontSize: raised ? 10 : 14,
          color: focused ? '#e43c44' : 'rgba(255,255,255,0.38)',
          fontWeight: raised ? 700 : 400,
          letterSpacing: raised ? '0.08em' : '0.01em',
          textTransform: raised ? 'uppercase' : 'none',
          pointerEvents: 'none',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          userSelect: 'none',
        }}
      >
        {label}
      </label>
      {/* bottom accent line */}
      <span style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        height: 2, width: focused ? '92%' : 0,
        background: 'linear-gradient(90deg, #e43c44, #d12931)',
        borderRadius: 2, transition: 'width 0.25s ease',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [focused, setFocused] = useState(false);

  const fmt = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };

  const raised = true;

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center',
          width: '100%', boxSizing: 'border-box',
          background: '#111111',
          border: `1.5px solid ${focused ? '#e43c44' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 12,
          padding: '22px 18px 8px',
          transition: 'border-color 0.2s, background 0.2s',
          cursor: 'text',
          overflow: 'hidden',
        }}
        onClick={() => document.getElementById(id)?.focus()}
      >
        <span style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 15,
          fontWeight: 600,
          marginRight: 6,
          userSelect: 'none',
          flexShrink: 0,
          fontFamily: 'inherit',
        }}>+55</span>
        <input
          id={id}
          type="tel"
          autoComplete="tel"
          value={value}
          onChange={e => onChange(fmt(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            WebkitAppearance: 'none',
            color: '#fff',
            fontSize: 15,
            padding: 0,
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
          }}
        />
      </div>
      <label
        htmlFor={id}
        style={{
          position: 'absolute',
          left: 18,
          top: raised ? 8 : '50%',
          transform: raised ? 'none' : 'translateY(-50%)',
          fontSize: raised ? 10 : 14,
          color: focused ? '#e43c44' : 'rgba(255,255,255,0.38)',
          fontWeight: raised ? 700 : 400,
          letterSpacing: raised ? '0.08em' : '0.01em',
          textTransform: raised ? 'uppercase' : 'none',
          pointerEvents: 'none',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          userSelect: 'none',
        }}
      >
        Telefone / WhatsApp
      </label>
      <span style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        height: 2, width: focused ? '92%' : 0,
        background: 'linear-gradient(90deg, #e43c44, #d12931)',
        borderRadius: 2, transition: 'width 0.25s ease',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

/* ── Package dropdown select ─────────────────────────── */
function PackageSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const { packages: allPackages } = useContentConfig();

  const options = allPackages.filter(p => (!p.status || p.status === 'approved') && !p.deletedAt);
  const selectedPkg = options.find(p => p.title === value) ?? null;

  const filtered = query
    ? options.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openSearch = () => { setQuery(''); setOpen(true); };
  const active = focused || open;

  // ── ESTADO: pacote selecionado → mini-card compacto ────────────
  if (selectedPkg && !open) {
    const curr = selectedPkg.currency || 'BRL';
    const sym = curr === 'BRL' ? 'R$' : curr === 'USD' ? '$' : '€';
    const priceNum = selectedPkg.price ? parseInt(selectedPkg.price.replace(/\D/g, ''), 10) : null;
    const priceStr = priceNum ? `${sym} ${priceNum.toLocaleString('pt-BR')}` : null;

    return (
      <div ref={ref} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, rgba(228,60,68,0.1) 0%, rgba(209,41,49,0.04) 100%)',
            border: '1.5px solid rgba(228,60,68,0.45)',
            borderRadius: 12,
            padding: '22px 12px 8px 14px',   /* mesma altura dos outros inputs */
            position: 'relative', overflow: 'hidden',
            minHeight: 56,
          }}
        >
          {/* Glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at left, rgba(228,60,68,0.07) 0%, transparent 65%)',
            pointerEvents: 'none',
          }} />

          {/* Floating label */}
          <span style={{
            position: 'absolute', left: 14, top: 8,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
            textTransform: 'uppercase', color: '#e43c44',
            pointerEvents: 'none',
          }}>
            Pacote de interesse
          </span>

          {/* Thumbnail */}
          {selectedPkg.img && (
            <div style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: 7,
              overflow: 'hidden', border: '1.5px solid rgba(228,60,68,0.4)',
            }}>
              <img src={selectedPkg.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* Title — 1 linha */}
          <div style={{
            flex: 1, minWidth: 0,
            fontSize: 14, fontWeight: 700, color: '#fff',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {selectedPkg.title}
          </div>

          {/* Price */}
          {priceStr && (
            <span style={{
              flexShrink: 0,
              fontSize: 12, fontWeight: 800, color: '#e43c44',
              background: 'rgba(228,60,68,0.12)',
              border: '1px solid rgba(228,60,68,0.25)',
              padding: '3px 8px', borderRadius: 7,
              whiteSpace: 'nowrap',
            }}>
              {priceStr}
            </span>
          )}

          {/* Trocar */}
          <button
            type="button" onClick={openSearch} title="Trocar pacote"
            style={{
              flexShrink: 0, background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7, padding: '5px 7px',
              cursor: 'pointer', color: 'rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'center', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = '#e43c44'; b.style.borderColor = 'rgba(228,60,68,0.4)'; }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.color = 'rgba(255,255,255,0.45)'; b.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── ESTADO: input de busca / vazio ──────────────────────────────
  const raised = focused || value.length > 0;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={open ? query : value}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setQuery(''); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder={open ? 'Buscar pacote...' : ' '}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: active ? '#1a1a1a' : '#111111',
            border: `1.5px solid ${active ? '#e43c44' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: open ? '12px 12px 0 0' : 12,
            color: '#fff', fontSize: 15,
            padding: '22px 42px 8px 18px',
            outline: 'none',
            transition: 'border-color 0.2s, background 0.2s, border-radius 0.15s',
            fontFamily: 'inherit', cursor: 'pointer',
          }}
        />
        <label
          htmlFor={id}
          style={{
            position: 'absolute', left: 18,
            top: raised ? 8 : '50%',
            transform: raised ? 'none' : 'translateY(-50%)',
            fontSize: raised ? 10 : 14,
            color: active ? '#e43c44' : 'rgba(255,255,255,0.38)',
            fontWeight: raised ? 700 : 400,
            letterSpacing: raised ? '0.08em' : '0.01em',
            textTransform: raised ? 'uppercase' : 'none',
            pointerEvents: 'none',
            transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          Pacote de interesse
        </label>
        <span style={{
          position: 'absolute', right: 14, top: '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: 'transform 0.2s ease',
          pointerEvents: 'none', color: active ? '#e43c44' : 'rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          height: 2, width: active && !open ? '92%' : 0,
          background: 'linear-gradient(90deg, #e43c44, #d12931)',
          borderRadius: 2, transition: 'width 0.25s ease', pointerEvents: 'none',
        }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', left: 0, right: 0,
          background: '#0a0a0a',
          border: '1.5px solid #e43c44',
          borderTop: '1px solid rgba(228,60,68,0.2)',
          borderRadius: '0 0 14px 14px',
          zIndex: 500, overflowY: 'auto', overflowX: 'hidden',
          maxHeight: 260,
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px 18px', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              Nenhum pacote encontrado
            </div>
          ) : (
            filtered.map((pkg, i) => {
              const selected = value === pkg.title;
              const curr = pkg.currency || 'BRL';
              const sym = curr === 'BRL' ? 'R$' : curr === 'USD' ? '$' : '€';
              const priceNum = pkg.price ? parseInt(pkg.price.replace(/\D/g, ''), 10) : null;
              const priceStr = priceNum ? `${sym} ${priceNum.toLocaleString('pt-BR')}` : null;

              return (
                <button
                  key={pkg.title}
                  type="button"
                  onMouseDown={e => { e.preventDefault(); onChange(pkg.title); setQuery(''); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    width: '100%', textAlign: 'left',
                    padding: '13px 16px',
                    background: selected ? 'rgba(228,60,68,0.1)' : 'none',
                    border: 'none',
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.12s', gap: 10,
                  }}
                  onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = selected ? 'rgba(228,60,68,0.1)' : 'none'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: selected ? 700 : 500, color: selected ? '#e43c44' : '#fff', lineHeight: 1.35, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                      {pkg.title}
                    </div>
                    {pkg.loc && (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        📍 {pkg.loc}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {priceStr && (
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: selected ? '#e43c44' : 'rgba(255,255,255,0.4)',
                        background: selected ? 'rgba(228,60,68,0.12)' : 'rgba(255,255,255,0.05)',
                        padding: '3px 8px', borderRadius: 6,
                      }}>{priceStr}</span>
                    )}
                    {selected && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#e43c44" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* ── main component ───────────────────────────────────────────── */
export default function ContactForm() {
  const uid = useId();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [pacote, setPacote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const { packages } = useContentConfig();

  // Sincroniza com o contexto (clique em "Reservar Pacote" no modal)
  const { selectedTitle, setSelectedTitle } = useSelectedPackage();
  useEffect(() => {
    if (selectedTitle) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPacote(selectedTitle);
      setSelectedTitle('');
    }
  }, [selectedTitle, setSelectedTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // data_lead: formatado em pt-BR, fuso Brasília
      const data_lead = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }).replace(',', ' às');

      // pacote: nome completo | valor | local
      const pkgObj = packages.find(p => p.title === pacote && !p.deletedAt);
      const pacoteEnvio = pkgObj
        ? [pkgObj.title, pkgObj.price ? `${pkgObj.currency || 'BRL'} ${pkgObj.price}` : '', pkgObj.loc || '']
          .filter(Boolean).join(' | ')
        : pacote;

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          pacote: pacoteEnvio,
          origem_lead: window.location.hostname,
          data_lead,
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section
      id="contato-form"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #09090b 100%)',
        padding: '96px 24px',
        position: 'relative',
      }}
    >
      <style>{`
        @media (max-width: 639px) {
          .cf-outer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .cf-card { padding: 24px 16px !important; border-radius: 16px !important; }
          .cf-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
      {/* decorative glow orbs */}
      <div style={{
        position: 'absolute', top: -120, left: -120, width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(228,60,68,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -80, right: -80, width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(209,41,49,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div
          className="cf-outer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
            gap: 64,
            alignItems: 'center',
          }}
        >

          {/* ── Left column ── */}
          <div>
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 800,
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: '#e43c44', marginBottom: 20,
            }}>
              Fale com a gente
            </span>

            <h2 style={{
              fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
              fontWeight: 800, lineHeight: 1.08,
              color: '#fff', margin: '0 0 20px',
              letterSpacing: '-0.03em',
            }}>
              Planeje sua<br />
              <span style={{
                background: 'linear-gradient(90deg, #e43c44, #d12931)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                experiência
              </span>
            </h2>

            <p style={{
              fontSize: 15, lineHeight: 1.75,
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 40px', maxWidth: 380,
            }}>
              Nossa equipe especializada cria itinerários sob medida para o seu evento de automobilismo — ingressos, hospedagem, transfers e muito mais.
            </p>

            {/* feature chips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                'Resposta em até 24 horas',
                'Pacotes 100% personalizados',
                'Atendimento em PT, EN e ES',
              ].map(text => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(228,60,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5L4.5 8L9 3" stroke="#e43c44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column: card ── */}
          <div
            className="cf-card"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24,
              padding: '40px 36px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.35)',
            }}
          >
            {status === 'success' ? (
              /* ── success state ── */
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'rgba(228,60,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px',
                }}>
                  <CheckCircle2 size={36} color="#e43c44" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                  Formulário enviado com sucesso!
                </h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 28px', lineHeight: 1.6 }}>
                  Nossa equipe entrará em contato em breve para montar o pacote ideal para você.
                </p>
                <button
                  onClick={() => { setNome(''); setEmail(''); setTelefone(''); setPacote(''); setStatus('idle'); }}
                  style={{
                    background: 'none', border: 'none', color: '#e43c44',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    textDecoration: 'underline', textDecorationColor: 'rgba(228,60,68,0.4)',
                  }}
                >
                  Enviar outro formulário?
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* row: nome + email */}
                <div className="cf-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 14 }}>
                  <FloatInput id={`${uid}-nome`} label="Nome completo" autoComplete="name" value={nome} onChange={setNome} required />
                  <FloatInput id={`${uid}-email`} label="E-mail" type="email" autoComplete="email" value={email} onChange={setEmail} required />
                </div>

                {/* row: telefone + evento */}
                <div className="cf-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 14, alignItems: 'start' }}>
                  <PhoneInput value={telefone} onChange={setTelefone} />
                  <PackageSelect id={`${uid}-pacote`} value={pacote} onChange={setPacote} />
                </div>

                {/* divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                {/* error */}
                {status === 'error' && (
                  <p style={{
                    margin: 0, fontSize: 13, color: '#f87171',
                    background: 'rgba(248,113,113,0.08)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: 10, padding: '10px 14px',
                  }}>
                    ⚠ Algo deu errado. Tente novamente ou nos contate diretamente.
                  </p>
                )}

                {/* submit */}
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    padding: '16px 32px',
                    background: status === 'sending'
                      ? 'rgba(228,60,68,0.5)'
                      : 'linear-gradient(135deg, #e43c44 0%, #d12931 100%)',
                    color: '#000',
                    fontWeight: 800, fontSize: 14,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    border: 'none', borderRadius: 100,
                    cursor: status === 'sending' ? 'wait' : 'pointer',
                    transition: 'opacity 0.2s, transform 0.15s',
                    boxShadow: '0 8px 32px rgba(228,60,68,0.35)',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { if (status !== 'sending') (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                >
                  {status === 'sending' ? 'Enviando…' : (
                    <>Enviar formulário <ArrowRight size={16} strokeWidth={2.5} /></>
                  )}
                </button>

                <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
                  Seus dados são tratados com total segurança e privacidade.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
