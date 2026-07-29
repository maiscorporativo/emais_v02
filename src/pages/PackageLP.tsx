import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Calendar, Users, MapPin,
  MessageCircle, AlertTriangle, Zap, Trophy, Headset, ChevronRight, ChevronLeft, X, Ticket
} from 'lucide-react';
import { useContentConfig } from '../hooks/useContentConfig';
import type { TrendingPackage } from '../types';
import { appendCurrentQuery } from '../utils/slug';
import { hasPrice, PRICE_ON_REQUEST } from '../utils/currency';

// Helper to convert YouTube URL to Embed URL
const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) return url;

  let videoId = '';
  if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  } else if (url.includes('embed/')) {
    videoId = url.split('embed/')[1].split('?')[0];
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&modestbranding=1&playlist=${videoId}&rel=0&iv_load_policy=3&disablekb=1` : url;
};

// Helper to fix relative image paths
const fixImgPath = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/') || path.startsWith('data:')) return path;
  
  // Se for um arquivo de upload gerado pelo multer (começa com timestamp de 13 dígitos e um traço)
  if (/^\d{13}-/.test(path)) {
    return `/uploads/${path}`;
  }
  
  return `/${path}`;
};

const injectScript = (id: string, content: string, target: 'head' | 'body' = 'head') => {
  if (!content) return;
  try {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.innerHTML = content;
    const scripts = wrapper.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
      if (oldScript.innerHTML) newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      if (oldScript.parentNode) oldScript.parentNode.replaceChild(newScript, oldScript);
    });
    if (target === 'head') document.head.appendChild(wrapper);
    else document.body.prepend(wrapper);
  } catch (err) { console.error('Script injection failed:', err); }
};

/* --- Fundo customizado de seção (imagem ou vídeo, com véu escuro por cima) --- */
function SectionBackground({ bg }: { bg?: { type?: 'image' | 'video'; url?: string } }) {
  if (!bg?.url) return null;
  if (bg.type === 'video') {
    const isYoutube = bg.url.includes('youtube.com') || bg.url.includes('youtu.be');
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
        {isYoutube ? (
          <iframe src={getYoutubeEmbedUrl(bg.url)} title="Fundo"
            style={{ width: '100vw', height: '56.25vw', minHeight: '100%', minWidth: '177.77vh', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            frameBorder="0" allow="autoplay; encrypted-media" />
        ) : (
          <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
            <source src={bg.url} type="video/mp4" />
          </video>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      </div>
    );
  }
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      <img src={fixImgPath(bg.url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
    </div>
  );
}

/* --- Quantas fotos cabem "alinhadas" ao lado de um bloco de texto ---
 * Mede a altura REAL do texto (depois de renderizado, e de novo sempre que
 * ela mudar — texto maior/menor, resize da janela) e calcula quantas linhas
 * de fotos (2 por linha no desktop, 1 no mobile) cabem nesse espaço. O
 * restante das fotos desce pra uma grade em largura total logo abaixo,
 * em vez de um número fixo de fotos que não se adapta ao texto. */
function useAdaptiveTopCount(imagesLength: number, isMobile: boolean, rowHeightPx = 220) {
  const textRef = useRef<HTMLDivElement>(null);
  const [topCount, setTopCount] = useState(imagesLength);

  useEffect(() => {
    const el = textRef.current;
    if (!el || imagesLength === 0) { setTopCount(imagesLength); return; }
    const perRow = isMobile ? 1 : 2;
    const gap = 16;
    const compute = () => {
      const h = el.offsetHeight;
      const rows = Math.max(1, Math.round((h + gap) / (rowHeightPx + gap)));
      setTopCount(Math.min(imagesLength, rows * perRow));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imagesLength, isMobile, rowHeightPx]);

  return { textRef, topCount };
}

/* --- Galeria de Fotos: imagem grande + tira de miniaturas, avança sozinha,
   com setas para navegar na hora e lightbox ao clicar para ver ampliada --- */
function PhotoGallery({ images, isMobile, themeColor }: { images: string[]; isMobile: boolean; themeColor: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || lightboxOpen) return;
    const interval = setInterval(() => setActive(prev => (prev + 1) % images.length), 4500);
    return () => clearInterval(interval);
  }, [images.length, lightboxOpen]);

  // Navegação do lightbox por teclado (ESC fecha, setas trocam de foto)
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActive(prev => (prev - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setActive(prev => (prev + 1) % images.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, images.length]);

  if (!images.length) return null;

  const goPrev = () => setActive(prev => (prev - 1 + images.length) % images.length);
  const goNext = () => setActive(prev => (prev + 1) % images.length);
  const arrowBtn: React.CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: '100%', height: isMobile ? 300 : 500, borderRadius: 24, overflow: 'hidden', position: 'relative', border: '1px solid #003866' }}>
        {images.map((img, i) => (
          <img key={i} src={fixImgPath(img)} onClick={() => setLightboxOpen(true)} title="Clique para ampliar"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: i === active ? 1 : 0, transition: 'opacity 0.6s ease-in-out', cursor: 'zoom-in' }}
            alt={`Foto ${i + 1}`} />
        ))}
        {images.length > 1 && (
          <>
            <button onClick={goPrev} title="Foto anterior" style={{ ...arrowBtn, left: 12, width: 40, height: 40 }}><ChevronLeft size={20} /></button>
            <button onClick={goNext} title="Próxima foto" style={{ ...arrowBtn, right: 12, width: 40, height: 40 }}><ChevronRight size={20} /></button>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {images.map((img, i) => (
          <div key={i} onClick={() => setActive(i)}
            style={{ flexShrink: 0, width: isMobile ? 100 : 160, height: isMobile ? 60 : 100, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: active === i ? `2px solid ${themeColor}` : '2px solid transparent', transition: 'all 0.3s', opacity: active === i ? 1 : 0.5, transform: active === i ? 'scale(1.02)' : 'scale(1)' }}>
            <img src={fixImgPath(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Miniatura ${i + 1}`} />
          </div>
        ))}
      </div>

      {lightboxOpen && (
        <div onClick={() => setLightboxOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s ease' }}>
          <button onClick={() => setLightboxOpen(false)} title="Fechar (ESC)"
            style={{ position: 'absolute', top: 20, right: 20, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <X size={22} />
          </button>
          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); goPrev(); }} title="Anterior (←)" style={{ ...arrowBtn, left: 16, width: 52, height: 52, background: 'rgba(255,255,255,0.08)' }}>
              <ChevronLeft size={28} />
            </button>
          )}
          <img src={fixImgPath(images[active])} alt={`Foto ${active + 1}`} onClick={e => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 30px 80px rgba(0,0,0,0.8)' }} />
          {images.length > 1 && (
            <button onClick={e => { e.stopPropagation(); goNext(); }} title="Próxima (→)" style={{ ...arrowBtn, right: 16, width: 52, height: 52, background: 'rgba(255,255,255,0.08)' }}>
              <ChevronRight size={28} />
            </button>
          )}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: '#ccc', fontSize: 14, fontWeight: 700, background: 'rgba(0,0,0,0.6)', padding: '6px 18px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)' }}>
              {active + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* --- Football Kick Animation Component --- */
/* --- Sport Ball Scroll Animation Component --- */
interface CornerAdjust { x?: number; y?: number; scale?: number }
interface CornerLayout { player?: CornerAdjust; ball?: CornerAdjust }

// Posição/tamanho padrão (desktop e mobile) do slot "jogador/mascote" (estático) por esporte.
const PLAYER_DEFAULTS: Record<string, { mobile: { x: number; y: number; scale: number }; desktop: { x: number; y: number; scale: number }; sizePct: number }> = {
  tenis: { mobile: { x: 100, y: 90, scale: 0.8 }, desktop: { x: 320, y: 270, scale: 0.8 }, sizePct: 60 },
  futebol: { mobile: { x: 125, y: 90, scale: 0.8 }, desktop: { x: 340, y: 240, scale: 0.85 }, sizePct: 50 },
  basquete: { mobile: { x: 130, y: 70, scale: 1.2 }, desktop: { x: 400, y: 170, scale: 1.5 }, sizePct: 50 },
  automobilismo: { mobile: { x: 70, y: 100, scale: 0.8 }, desktop: { x: 240, y: 320, scale: 0.5 }, sizePct: 60 },
  lutas: { mobile: { x: 80, y: 80, scale: 0.5 }, desktop: { x: 300, y: 270, scale: 0.8 }, sizePct: 50 },
};

// Posição/tamanho padrão do slot "bola" (gira com o scroll) — só existe para esportes com bola.
const BALL_DEFAULTS: Record<string, { mobileSize: number; desktopSize: number; mobile: { x: number; y: number }; desktop: { x: number; y: number } }> = {
  futebol: { mobileSize: 24, desktopSize: 71, mobile: { x: 100, y: 60 }, desktop: { x: 290, y: 160 } },
  tenis: { mobileSize: 15, desktopSize: 40, mobile: { x: 50, y: 100 }, desktop: { x: 150, y: 260 } },
  basquete: { mobileSize: 30, desktopSize: 100, mobile: { x: 65, y: -65 }, desktop: { x: 160, y: -230 } },
};

function SportBall({ sport, playerImage, ballImage, layout }: {
  sport: string; playerImage?: string; ballImage?: string; layout?: CornerLayout;
}) {
  const [rotation, setRotation] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollPercent(pct);
      // Rotaciona 1080 graus (3 voltas completas) ao longo da página
      setRotation(pct * 1080);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Esportes com "bola" própria — o jogador/mascote fica estático e a bola gira sozinha.
  // Esportes sem bola (automobilismo/lutas) usam um único slot que troca de imagem com o scroll.
  const hasBall = sport === 'futebol' || sport === 'tenis' || sport === 'basquete';
  const playerAdj = layout?.player;
  const ballAdj = layout?.ball;

  // --- Jogador / mascote (estático — não gira com o scroll) ---
  let playerSrc = '';
  let playerAlt = 'Player';
  // Sem bola própria (automobilismo/lutas ou esporte "geral"): a imagem customizada
  // assume o slot único, com a leve rotação que sempre teve (não há bola para girar).
  const playerUsesCustomGeneric = !hasBall && !!playerImage;

  if (playerImage) {
    playerSrc = fixImgPath(playerImage);
    playerAlt = 'Decoração';
  } else if (sport === 'automobilismo') {
    const frame = Math.min(9, Math.max(0, Math.floor(scrollPercent * 10)));
    playerSrc = fixImgPath(`img_f1/f1_turnarround_000${frame}_Camada-${frame + 5}.png`);
    playerAlt = 'F1 Car';
  } else if (sport === 'lutas') {
    playerSrc = fixImgPath(`img_lutador/fighter_${Math.min(7, Math.max(1, Math.floor(scrollPercent * 7) + 1))}.png`);
    playerAlt = 'Fighter';
  } else if (sport === 'tenis') {
    playerSrc = fixImgPath('raquete.png'); playerAlt = 'Racket';
  } else if (sport === 'futebol') {
    playerSrc = fixImgPath('jogador.png'); playerAlt = 'Player';
  } else if (sport === 'basquete') {
    playerSrc = fixImgPath('basquete_player.png'); playerAlt = 'Basketball Player';
  }

  const playerDefaults = PLAYER_DEFAULTS[sport] || PLAYER_DEFAULTS.automobilismo;
  const pBase = playerUsesCustomGeneric
    ? { x: isMobile ? 90 : 280, y: isMobile ? 90 : 260, scale: 1 }
    : (isMobile ? playerDefaults.mobile : playerDefaults.desktop);
  const pSizePct = playerUsesCustomGeneric ? 55 : playerDefaults.sizePct;
  const pScale = pBase.scale * (playerAdj?.scale ?? 1);
  const pX = pBase.x + (playerAdj?.x || 0);
  const pY = pBase.y + (playerAdj?.y || 0);
  const pTransform = playerUsesCustomGeneric
    ? `translate(${pX}px, ${pY}px) rotate(${rotation * 0.15}deg) scale(${pScale})`
    : `translate(${pX}px, ${pY}px) scale(${pScale})`;

  // --- Bola (gira com o scroll) ---
  const ballDefaults = BALL_DEFAULTS[sport];
  let ballNode: React.ReactNode = null;
  if (hasBall && ballDefaults) {
    const bSrc = ballImage
      ? fixImgPath(ballImage)
      : fixImgPath(sport === 'tenis' ? 'tenis_ball.png' : sport === 'basquete' ? 'basquete_ball.png' : 'soccer_ball.png');
    const bBase = isMobile ? ballDefaults.mobile : ballDefaults.desktop;
    const bSize = (isMobile ? ballDefaults.mobileSize : ballDefaults.desktopSize) * (ballAdj?.scale ?? 1);
    const bX = bBase.x + (ballAdj?.x || 0);
    const bY = bBase.y + (ballAdj?.y || 0);
    ballNode = (
      <img
        src={bSrc}
        alt={sport === 'tenis' ? 'Tennis Ball' : sport === 'basquete' ? 'Basketball' : 'Soccer Ball'}
        style={{
          width: bSize,
          height: bSize,
          objectFit: 'contain',
          transform: `translate(${bX}px, ${bY}px) rotate(${rotation}deg)`,
          filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
        }}
      />
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: isMobile ? '0px' : '30px',
      right: isMobile ? '0px' : '30px',
      width: isMobile ? '300px' : '800px',
      height: isMobile ? '300px' : '800px',
      zIndex: 9999,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {playerSrc && (
        <img
          src={playerSrc}
          alt={playerAlt}
          style={{
            position: 'absolute',
            width: `${pSizePct}%`,
            height: `${pSizePct}%`,
            objectFit: 'contain',
            transform: pTransform,
            filter: 'drop-shadow(0 15px 45px rgba(0,0,0,0.5))',
            zIndex: playerUsesCustomGeneric ? undefined : -1,
          }}
        />
      )}
      {ballNode}
    </div>
  );
}

/* --- Package Navbar Component --- */
function PackageNavbar({ onBook, isMobile }: { onBook: () => void, isMobile: boolean }) {
  const navigate = useNavigate();
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav style={{
      width: '100%', position: 'fixed', top: 0, zIndex: 1000,
      background: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, cursor: 'pointer' }} onClick={() => navigate('/')} title="Voltar para a Home">
          <img src="/emais-logo.svg" alt="E-Mais" className="h-10 w-auto" />
        </div>

        {/* Links */}
        <div style={{ display: 'none', gap: 32, alignItems: 'center' }} className="md-flex">
          <a href="#programacao" onClick={scrollTo('programacao')} style={{ fontSize: 13, fontWeight: 700, color: '#e8edf2', textDecoration: 'none', textTransform: 'uppercase' }} className="nav-link">Programação</a>
          <a href="#pacotes" onClick={scrollTo('pacotes')} style={{ fontSize: 13, fontWeight: 700, color: '#e8edf2', textDecoration: 'none', textTransform: 'uppercase' }} className="nav-link">Pacote</a>
          <a href="#experiencia" onClick={scrollTo('experiencia')} style={{ fontSize: 13, fontWeight: 700, color: '#e8edf2', textDecoration: 'none', textTransform: 'uppercase' }} className="nav-link">Experiência</a>
        </div>

        {/* CTA */}
        <button onClick={onBook} style={{
          background: '#f7ad40', color: '#002042', border: 'none', borderRadius: 8, padding: isMobile ? '8px 12px' : '10px 20px', fontSize: isMobile ? 11 : 13, fontWeight: 800, cursor: 'pointer',
          textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          Comprar Pacote
        </button>
      </div>
      <style>{`
        @media (min-width: 768px) { .md-flex { display: flex !important; } }
        .nav-link:hover { color: #f7ad40 !important; }
      `}</style>
    </nav>
  );
}


export default function PackageLP() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { packages, loading } = useContentConfig();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [pkg, setPkg] = useState<TrendingPackage | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // Para a seção de Programação
  const [pricingMode, setPricingMode] = useState<'individual' | 'duplo'>('duplo');
  const mauticContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!loading && packages.length > 0) {
      // Resolve por slug (URL permanente) e, se for numérico, pelo índice (links antigos)
      const raw = (id || '').toLowerCase();
      let p = packages.find(pk => (pk.slug || '').toLowerCase() === raw);
      if (!p && /^\d+$/.test(raw)) p = packages[Number(raw)];
      if (!p) { setNotFound(true); return; }
      if (p.status !== 'approved' && !localStorage.getItem('emais_marketing_auth')) {
        navigate('/');
        return;
      }
      // Pacote desligado NESTE portal (controle local da integração)
      if (p.portalHidden) { setNotFound(true); return; }
      if (p.externalUrl && p.externalUrl.trim() !== '') {
        // Repassa UTMs/fbclid/gclid da URL atual para a LP externa
        window.location.href = appendCurrentQuery(p.externalUrl.trim());
        return;
      }
      setPkg(p);
      setNotFound(false);
      if (p.title) document.title = `${p.title} | E-Mais`;
      if (p.trackingScriptHead) injectScript('lp-tracking-head', p.trackingScriptHead, 'head');
      if (p.trackingScriptBody) injectScript('lp-tracking-body', p.trackingScriptBody, 'body');
      return () => {
        document.getElementById('lp-tracking-head')?.remove();
        document.getElementById('lp-tracking-body')?.remove();
      };
    } else if (!loading && packages.length === 0) {
      setNotFound(true);
    }
  }, [id, packages, loading, navigate]);

  // --- MAUTIC LOGIC (Preserved) ---
  useEffect(() => {
    if (pkg?.mauticFormCode && mauticContainerRef.current) {
      mauticContainerRef.current.innerHTML = pkg.mauticFormCode;
      const form = mauticContainerRef.current.querySelector('form');
      if (!form) return;
      const formName = form.getAttribute('data-mautic-form') || '';

      // Preenche sozinho o campo "Pacote de Interesse" com o nome deste pacote
      // e trava para somente-leitura — assim UM ÚNICO formulário do Mautic
      // serve para todos os pacotes, sem precisar customizar um HTML diferente
      // por pacote. No Mautic, o campo de texto tem alias "pacote_interesse"
      // como PRIMEIRO campo do formulário (acima de "Nome"); aqui ele é
      // preenchido a cada carregamento da página.
      const pacoteInput = form.querySelector('[name="mauticform[pacote_interesse]"]') as HTMLInputElement | null;
      if (pacoteInput) {
        pacoteInput.value = pkg.title;
        pacoteInput.readOnly = true;
        pacoteInput.dispatchEvent(new Event('input', { bubbles: true }));
        pacoteInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // @ts-ignore
      window.MauticDomain = 'https://mkt.maiscorporativo.tur.br';
      // @ts-ignore
      if (typeof window.MauticLang === 'undefined') { window.MauticLang = { submittingMessage: 'Enviando...' }; }
      // @ts-ignore
      if (typeof window.MauticFormCallback === 'undefined') { window.MauticFormCallback = {}; }

      // @ts-ignore
      window.MauticFormCallback[formName] = {
        onResponse: function (response: any) {
          if (response.success) {
            handleFormSuccess();
          } else {
            setSubmitting(false);
          }
        }
      };

      const handleFormSuccess = () => {
        if (pkg.webhookClint) {
          const clintData = new URLSearchParams();
          const inputs = form.querySelectorAll('input, select, textarea');
          inputs.forEach((input: any) => {
            const nameAttr = input.getAttribute('name');
            const nameMatch = nameAttr ? nameAttr.match(/mauticform\[(.*?)\]/) : null;

            if (nameMatch) {
              const fieldName = nameMatch[1];
              if (['formId', 'return', 'formName'].includes(fieldName)) return;

              if (input.type === 'radio') {
                if (input.checked) clintData.append(fieldName, input.value);
              } else if (input.type === 'checkbox') {
                if (input.checked) clintData.append(fieldName, input.value);
              } else {
                clintData.append(fieldName, input.value || '');
              }
            }
          });

          clintData.append('pacote_lp', pkg.title);
          clintData.append('origem_lead', 'Landing Page Experiência');
          clintData.append('url_conversao', window.location.href);

          fetch(pkg.webhookClint, {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: clintData.toString()
          }).catch(e => console.error('Erro Clint:', e));
        }
        setShowSuccess(true);
        if (pkg.redirectUrl) {
          setTimeout(() => { window.location.href = pkg.redirectUrl!; }, 1500);
        }
      }

      const observer = new MutationObserver(() => {
        const errorMsg = mauticContainerRef.current?.querySelector('.mauticform-error');
        const successMsg = mauticContainerRef.current?.querySelector('.mauticform-message');
        if (errorMsg && errorMsg.innerHTML.trim().length > 0) setSubmitting(false);
        if (successMsg && successMsg.innerHTML.trim().length > 0 && !showSuccess) handleFormSuccess();
      });

      if (mauticContainerRef.current) observer.observe(mauticContainerRef.current, { childList: true, subtree: true, characterData: true });

      if (!document.getElementById('mautic-sdk-script')) {
        const sc = document.createElement('script');
        sc.id = 'mautic-sdk-script';
        sc.src = 'https://mkt.maiscorporativo.tur.br/media/js/mautic-form.js';
        sc.onload = () => { if ((window as any).MauticSDK) (window as any).MauticSDK.onLoad(); };
        document.head.appendChild(sc);
      } else { if ((window as any).MauticSDK) (window as any).MauticSDK.onLoad(); }

      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.addEventListener('click', () => {
          setTimeout(() => {
            const hasErrors = form.querySelectorAll('.mauticform-has-error').length > 0;
            if (form.checkValidity() && !hasErrors) setSubmitting(true);
          }, 100);
        });
      }

      let iframe = document.getElementById('mautic_hidden_iframe') as HTMLIFrameElement;
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'mautic_hidden_iframe';
        iframe.name = 'mautic_hidden_iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
      }
      form.setAttribute('target', 'mautic_hidden_iframe');

      setTimeout(() => {
        const pForm = mauticContainerRef.current?.querySelector('form');
        const pageWrapper = mauticContainerRef.current?.querySelector('.mauticform-page-wrapper') || mauticContainerRef.current?.querySelector('.mauticform-innerform');
        if (pForm && pageWrapper) {
          const rows = Array.from(pageWrapper.querySelectorAll('.mauticform-row:not(.mauticform-button-wrapper):not(.mauticform-radiogrp)'));
          for (let i = 0; i < rows.length; i += 2) {
            if (rows[i] && rows[i + 1]) {
              const gridRow = document.createElement('div');
              gridRow.className = 'mauticform-grid-row';
              rows[i].parentNode?.insertBefore(gridRow, rows[i]);
              gridRow.appendChild(rows[i]);
              gridRow.appendChild(rows[i + 1]);
            }
          }
          const radioGroups = pForm.querySelectorAll('.mauticform-radiogrp');
          radioGroups.forEach(group => {
            const options = group.querySelector('.mauticform-radiogrp-options') || group;
            options.classList.add('horizontal');
          });
        }
      }, 500);
    }
  }, [pkg]);
  // --- END MAUTIC LOGIC ---

  // Parse JSON data safely
  const parseJSON = (data: any, fallback: any) => {
    if (!data) return fallback;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  // Imagens escolhidas no admin para a seção Experiências (experienciaImages);
  // se não houver, usa as 2 primeiras do Banco de Imagens como fallback.
  // Imagens que foram removidas do banco ("órfãs") são ignoradas.
  // Calculados antes dos early returns abaixo (loading/notFound) para não violar
  // as Regras dos Hooks — useAdaptiveTopCount precisa ser chamado sempre, em toda renderização.
  const experienciaBank = (pkg?.galleryImages || '').split(';').map(s => s.trim()).filter(Boolean);
  const experienciaPicked = (pkg?.experienciaImages || '').split(';').map(s => s.trim()).filter(Boolean).filter(u => experienciaBank.includes(u));
  const experienciaImgs = experienciaPicked.length > 0 ? experienciaPicked : experienciaBank.slice(0, 2);
  // A quantidade de fotos alinhadas ao lado do texto se ajusta sozinha à
  // altura real do texto (mais texto = mais fotos cabem); o restante desce
  // para uma grade em largura total abaixo do bloco, em vez de continuar
  // empilhando na coluna estreita.
  const { textRef: experienciaTextRef, topCount: experienciaTopCount } = useAdaptiveTopCount(experienciaImgs.length, isMobile);
  const experienciaTopImgs = experienciaImgs.slice(0, experienciaTopCount);
  const experienciaOverflowImgs = experienciaImgs.slice(experienciaTopCount);

  // Destino & Lifestyle — mesma lógica de ajuste automático das fotos
  const destino = parseJSON(pkg?.destinoLifestyleData, null);
  const destinoImgs: string[] = destino ? (destino.imagens || []).filter((u: string) => experienciaBank.includes(u)) : [];
  const destinoItems: string[] = destino ? (destino.items || []).filter(Boolean) : [];
  const { textRef: destinoTextRef, topCount: destinoTopCount } = useAdaptiveTopCount(destinoImgs.length, isMobile);
  const destinoTopImgs = destinoImgs.slice(0, destinoTopCount);
  const destinoOverflowImgs = destinoImgs.slice(destinoTopCount);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#001529', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ width: 48, height: 48, border: '4px solid #002042', borderTopColor: '#f7ad40', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (showSuccess) return <SuccessSection redirectUrl={pkg?.redirectUrl} />;

  if (notFound || !pkg) return (
    <div style={{ minHeight: '100vh', background: '#001529', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: 20 }}>
      <AlertTriangle size={64} color="#f7ad40" style={{ marginBottom: 24 }} />
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>Pacote indisponível</h1>
      <button onClick={() => navigate('/')} style={{ background: '#f7ad40', color: '#002042', fontWeight: 800, padding: '12px 32px', borderRadius: 8, marginTop: 24, cursor: 'pointer', border: 'none' }}>Voltar para Home</button>
    </div>
  );

  // Visibilidade das seções opcionais da LP (visíveis por padrão)
  const vis: Record<string, boolean> = { experiencia: true, destino: true, ...parseJSON(pkg.lpSections, {}) };

  // Fundo customizado (imagem ou vídeo) por seção, configurável no admin
  const bgs: Record<string, { type?: 'image' | 'video'; url?: string }> = parseJSON(pkg.lpBackgrounds, {});

  const sport = pkg.sportType || 'automobilismo';

  const sportEventText = sport === 'futebol' ? 'da partida' : sport === 'tenis' ? 'do torneio' : sport === 'basquete' ? 'do jogo' : sport === 'lutas' ? 'da luta' : 'da corrida';
  const sportAthletesText = sport === 'futebol' ? 'jogadores' : sport === 'tenis' ? 'tenistas' : sport === 'basquete' ? 'jogadores' : sport === 'lutas' ? 'lutadores' : 'pilotos';
  const sportNameText = sport === 'futebol' ? 'futebol mundial' : sport === 'tenis' ? 'tênis mundial' : sport === 'basquete' ? 'basquete mundial' : sport === 'lutas' ? 'mundo das lutas' : 'automobilismo mundial';

  const programacao = parseJSON(pkg.programacaoData, [
    { dia: 'SEXTA', data: '22 de maio', descricao: 'Acesso VIP aos eventos e atividades preparatórias.' },
    { dia: 'SÁBADO', data: '23 de maio', descricao: 'Acompanhe os momentos decisivos com vista privilegiada.' },
    { dia: 'DOMINGO', data: '24 de maio', descricao: `O grande dia ${sportEventText}. Acesso premium e hospitalidade.` }
  ]);

  const pacotes = parseJSON(pkg.pacotesOptionsData, [
    { tipo: 'Quarto Individual', preço: '450,00', info: 'Pacote Premium' },
    { tipo: 'Quarto Duplo', preço: '790,00', info: 'Pacote VIP Exclusivo' }
  ]);

  const cards = parseJSON(pkg.cardsData, [
    { titulo: 'Experiência Completa', descricao: 'Ingressos, hospedagem e transporte tudo em um único pacote cuidadosamente planejado.', icone: 'Zap' },
    { titulo: 'Acesso Exclusivo', descricao: `Áreas VIP, encontros com ${sportAthletesText} e experiências que não estão disponíveis ao público.`, icone: 'Trophy' },
    { titulo: 'Suporte 24/7', descricao: 'Nossa equipe está disponível antes, durante e após o evento para garantir sua satisfação.', icone: 'Headset' }
  ]);

  const theme = {
    primary: '#f7ad40',
    accent: sport === 'automobilismo' ? 'rgba(228,60,68,0.15)' :
      sport === 'futebol' ? 'rgba(34,197,94,0.15)' :
        sport === 'tenis' ? 'rgba(234,88,12,0.15)' :
          sport === 'lutas' ? 'rgba(220,38,38,0.2)' :
            'rgba(59,130,246,0.15)',
    heroTitle: sport === 'automobilismo' ? 'Seu lugar no grid' :
      sport === 'futebol' ? 'Viva a paixão do estádio' :
        sport === 'tenis' ? 'A emoção da quadra central' :
          sport === 'basquete' ? 'Sinta a energia da quadra' :
            sport === 'lutas' ? 'No coração do octógono' :
              'A melhor experiência esportiva',
    defaultTag: sport === 'automobilismo' ? '110ª EDIÇÃO' : 'EVENTO EXCLUSIVO'
  };

  return (
    <div style={{ background: '#001529', color: '#fff', fontFamily: 'Montserrat, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <PackageNavbar onBook={() => document.getElementById('conversion-section')?.scrollIntoView({ behavior: 'smooth' })} isMobile={isMobile} />
      {(pkg.cornerImage || sport === 'futebol' || sport === 'tenis' || sport === 'basquete' || sport === 'lutas' || sport === 'automobilismo') && (
        <SportBall sport={sport} playerImage={pkg.cornerImage} ballImage={pkg.cornerBallImage} layout={parseJSON(pkg.cornerLayout, {})} />
      )}

      {/* --- HERO SECTION --- */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}>
          {pkg.heroType === 'image' || (!pkg.videoUrl && pkg.heroImage) ? (
            <img src={fixImgPath(pkg.heroImage || pkg.img)} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : pkg.videoUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative', background: '#001529' }}>
              <img src={fixImgPath(pkg.img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, zIndex: -1, opacity: 0.5 }} />
              {pkg.videoUrl.includes('youtube.com') || pkg.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={getYoutubeEmbedUrl(pkg.videoUrl)}
                  style={{ width: '100vw', height: '56.25vw', minHeight: '100vh', minWidth: '177.77vh', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
                  frameBorder="0" allow="autoplay; encrypted-media"
                />
              ) : (
                <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                  <source src={pkg.videoUrl} type="video/mp4" />
                </video>
              )}
            </div>
          ) : (
            <img src={fixImgPath(pkg.img)} alt={pkg.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(5,5,5,1) 100%)' }} />
        </div>

        <div className="container animate-fade-in" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: theme.primary, letterSpacing: '0.15em' }}>{pkg.tag || theme.defaultTag}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 24px', textShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            {pkg.title || theme.heroTitle}
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', lineHeight: 1.6, color: '#ccc', maxWidth: 650, margin: '0 auto 40px', fontWeight: 400 }}>
            {pkg.description || `Viva a emoção ${sportEventText} com um pacote completo: passagens aéreas, hospedagem e ingressos garantidos, além de experiências exclusivas que vão muito além do evento.`}
          </p>
          <button
            onClick={() => document.getElementById('pacotes')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: '#f7ad40', color: '#002042', fontWeight: 800, fontSize: isMobile ? 14 : 15, padding: isMobile ? '14px 28px' : '16px 36px', borderRadius: 8, cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'transform 0.2s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Explorar Pacotes <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* --- CARDS DE BENEFÍCIOS --- */}
      <section style={{ padding: '0 20px', position: 'relative', zIndex: 20, marginTop: '-80px', marginBottom: '80px', overflow: bgs.cards?.url ? 'hidden' : undefined, borderRadius: bgs.cards?.url ? 24 : undefined }}>
        <SectionBackground bg={bgs.cards} />
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, position: 'relative', zIndex: 1 }}>
          {cards.map((c: any, i: number) => (
            <div key={i} style={{
              background: '#001a33', border: '1px solid #003866', borderRadius: 16, padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)', transition: 'border-color 0.3s',
              cursor: 'default'
            }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#4ade80'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#003866'}
            >
              <div style={{ width: 48, height: 48, background: '#f7ad40', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                {c.icone === 'Zap' ? <Zap size={24} color="#fff" /> : c.icone === 'Trophy' ? <Trophy size={24} color="#fff" /> : <Headset size={24} color="#fff" />}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px' }}>{c.titulo}</h3>
              <p style={{ color: '#888', lineHeight: 1.6, margin: 0, fontSize: 14 }}>{c.descricao}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- PROGRAMAÇÃO --- */}
      <section id="programacao" style={{
        position: 'relative', padding: isMobile ? '60px 20px' : '100px 20px', background: '#001529', overflow: 'hidden'
      }}>
        {/* Fundo customizado (se configurado no admin) substitui o vídeo/gradiente padrão */}
        {bgs.programacao?.url ? <SectionBackground bg={bgs.programacao} /> : sport === 'automobilismo' ? (
          <video
            autoPlay muted loop playsInline
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: 0.15, pointerEvents: 'none'
            }}
          >
            <source src="/flag_quadriculada.mp4" type="video/mp4" />
          </video>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #002042 0%, #001529 100%)', opacity: 0.5 }}></div>
        )}

        {/* Red speed gradient */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', background: `linear-gradient(to right, transparent, ${theme.accent})`, pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, margin: '0 0 8px' }}>
            Programação do <span style={{ color: '#f7ad40' }}>Fim de Semana</span>
          </h2>
          <p style={{ fontSize: 16, color: '#aaa', margin: '0 0 40px' }}>Dias de ação e emoção</p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
            {programacao.map((p: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                style={{
                  background: activeTab === i ? '#f7ad40' : 'transparent',
                  color: activeTab === i ? '#002042' : '#888',
                  border: `1px solid ${activeTab === i ? '#f7ad40' : '#333'}`,
                  borderRadius: 8, padding: '12px 24px', fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em',
                  transition: 'all 0.3s'
                }}
              >
                {p.titulo_aba || p.dia}
              </button>
            ))}
          </div>

          <div style={{ background: '#001a33', border: '1px solid #003866', borderRadius: 16, padding: '40px', minHeight: 200 }}>
            <h3 style={{ fontSize: 24, color: '#f7ad40', fontWeight: 800, margin: '0 0 24px' }}>{programacao[activeTab]?.titulo_dia || programacao[activeTab]?.data}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(programacao[activeTab]?.atividades || []).length > 0 ? (
                programacao[activeTab]?.atividades.map((ativ: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 24, padding: '16px 24px', borderRadius: 12, border: '1px solid #003866', background: '#002042' }}>
                    <div style={{ color: '#fbbf24', fontWeight: 800, minWidth: 100 }}>{ativ.horario}</div>
                    <div style={{ color: '#fff' }}>{ativ.descricao}</div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: 18, color: '#ddd', lineHeight: 1.6, margin: 0 }}>{programacao[activeTab]?.descricao}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- PACOTES --- */}
      <section id="pacotes" style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#0a0a0b', position: 'relative', overflow: 'hidden' }}>
        <SectionBackground bg={bgs.pacotes} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, margin: '0 0 16px' }}>Pacotes de <span style={{ color: '#f7ad40' }}>Viagem Completos</span></h2>
            <p style={{ fontSize: 16, color: '#aaa', maxWidth: 600, margin: '0 auto' }}>Voe com tudo incluído. Hospedagem, transporte e ingressos em um único pacote.</p>

            {/* Pricing Toggle — oculto quando nenhuma opção tem preço (Valor sob consulta) */}
            {(() => {
              const opts = pacotes && !Array.isArray(pacotes) ? (pacotes.opcoes_hospedagem || []) : (Array.isArray(pacotes) ? pacotes : []);
              return opts.some((op: any) => hasPrice(op.valor_individual) || hasPrice(op.valor_duplo) || hasPrice(op.valor_parcela) || hasPrice(op.preço));
            })() && (
            <div style={{ marginTop: 40, display: 'inline-flex', background: '#002042', padding: 6, borderRadius: 100, border: '1px solid #003866' }}>
              <button
                onClick={() => setPricingMode('individual')}
                style={{
                  background: pricingMode === 'individual' ? '#f7ad40' : 'transparent',
                  color: pricingMode === 'individual' ? '#002042' : '#888',
                  border: 'none', borderRadius: 100, padding: '10px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                Quarto Individual
              </button>
              <button
                onClick={() => setPricingMode('duplo')}
                style={{
                  background: pricingMode === 'duplo' ? '#f7ad40' : 'transparent',
                  color: pricingMode === 'duplo' ? '#002042' : '#888',
                  border: 'none', borderRadius: 100, padding: '10px 24px', fontSize: 13, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                Quarto Duplo
              </button>
            </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {(() => {
              const data = pacotes && !Array.isArray(pacotes) ? pacotes : { opcoes_hospedagem: Array.isArray(pacotes) ? pacotes : [], inclusos: [] };
              const options = data.opcoes_hospedagem || [];

              if (options.length === 0) {
                return <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#555', padding: 40 }}>Nenhum pacote configurado.</div>;
              }

              return options.map((op: any, i: number) => {
                const price = pricingMode === 'individual' ? op.valor_individual : op.valor_duplo;
                const parcelas = op.parcelas || '10';
                const showInclusos = (op.inclusos && op.inclusos.length > 0) ? op.inclusos : (data.inclusos || []);

                return (
                  <div key={i} style={{
                    background: '#001529', border: '1px solid #003866', borderRadius: 24, padding: '40px',
                    display: 'flex', flexDirection: 'column', transition: 'transform 0.3s, border-color 0.3s',
                    position: 'relative', overflow: 'hidden'
                  }}
                    className="package-card-hover"
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: i === 0 ? '#f7ad40' : '#fbbf24' }} />

                    <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 8px', color: '#fff' }}>{op.nome || op.tipo}</h3>
                    <p style={{ color: '#888', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>{op.descricao_card || 'Experiência completa com todo o conforto e exclusividade.'}</p>

                    <div style={{ borderTop: '1px solid #003866', borderBottom: '1px solid #003866', margin: '0 0 32px', padding: '24px 0' }}>
                      {hasPrice(price || op.valor_parcela || op.preço) ? (
                        <>
                          <div style={{ fontSize: 13, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>{parcelas}x de</div>
                          <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, color: i === 0 ? '#f7ad40' : '#fbbf24', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: isMobile ? 16 : 20 }}>{op.moeda || 'USD'}</span>
                            <span style={{ fontSize: isMobile ? 32 : 48 }}>{price || op.valor_parcela || op.preço || '---'}</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>por pessoa em quarto {pricingMode}</div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 900, color: i === 0 ? '#f7ad40' : '#fbbf24' }}>{PRICE_ON_REQUEST}</div>
                          <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>fale com um consultor para condições e valores</div>
                        </>
                      )}
                    </div>

                    <div style={{ flex: 1, marginBottom: 32 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>O que está incluso:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {showInclusos.map((inc: any, j: number) => (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <CheckCircle2 size={16} color={i === 0 ? '#f7ad40' : '#fbbf24'} style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#eee' }}>{inc.titulo}</div>
                              {inc.descricao && <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{inc.descricao}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => document.getElementById('conversion-section')?.scrollIntoView({ behavior: 'smooth' })}
                      style={{
                        background: i === 0 ? '#f7ad40' : '#002042',
                        color: i === 0 ? '#002042' : '#fff', border: i === 0 ? 'none' : '1px solid #333',
                        borderRadius: 12, padding: '16px', fontSize: 14, fontWeight: 800,
                        cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase'
                      }}
                      onMouseOver={e => {
                        if (i !== 0) e.currentTarget.style.borderColor = '#fbbf24';
                      }}
                      onMouseOut={e => {
                        if (i !== 0) e.currentTarget.style.borderColor = '#333';
                      }}
                    >
                      Solicitar Cotação
                    </button>
                  </div>
                );
              });
            })()}
          </div>

          <style>{`
            .package-card-hover:hover { transform: translateY(-10px); border-color: rgba(228,60,68,0.4) !important; }
          `}</style>

          {pacotes && !Array.isArray(pacotes) && pacotes.datas && (
            <div style={{ marginTop: 60, padding: '40px', background: '#002042', borderRadius: 24, border: '1px solid #003866', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32, textAlign: 'center' }}>
              <div>
                <div style={{ color: '#f7ad40', marginBottom: 12 }}><Calendar size={32} style={{ margin: '0 auto' }} /></div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Partida</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{pacotes.datas.partida}</div>
              </div>
              <div>
                <div style={{ color: '#f7ad40', marginBottom: 12 }}><Calendar size={32} style={{ margin: '0 auto' }} /></div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Retorno</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{pacotes.datas.retorno}</div>
              </div>
              <div>
                <div style={{ color: '#fbbf24', marginBottom: 12 }}><Users size={32} style={{ margin: '0 auto' }} /></div>
                <div style={{ fontSize: 12, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Duração</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{pacotes.datas.duracao}</div>
              </div>
            </div>
          )}

          {/* --- BANNER "SOMENTE INGRESSO" (para quem já está na Europa) --- */}
          {pkg.euTicketBannerTitle && (
            <div style={{
              marginTop: 40,
              position: 'relative',
              borderRadius: 24,
              overflow: 'hidden',
              padding: isMobile ? '36px 24px' : '48px 64px',
              background: 'linear-gradient(120deg, #f7ad40 0%, #f2952e 38%, #002042 100%)',
              boxShadow: '0 24px 60px -16px rgba(247,173,64,0.35)',
              textAlign: 'center',
            }}>
              <Ticket size={isMobile ? 130 : 220} style={{ position: 'absolute', top: '50%', right: isMobile ? -50 : -20, transform: 'translateY(-50%) rotate(-15deg)', color: '#002042', opacity: 0.14, pointerEvents: 'none' }} />
              <Ticket size={isMobile ? 80 : 140} style={{ position: 'absolute', bottom: -28, left: isMobile ? -30 : -10, transform: 'rotate(20deg)', color: '#fff', opacity: 0.08, pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,21,41,0.9)', color: '#f7ad40', fontSize: 11, fontWeight: 900, letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 20px', borderRadius: 100, marginBottom: 22 }}>
                  <Ticket size={13} /> Somente Ingresso
                </span>
                <h3 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 900, color: '#001529', margin: '0 0 14px', lineHeight: 1.3 }}>
                  {pkg.euTicketBannerTitle}
                </h3>
                {pkg.euTicketBannerText && (
                  <p style={{ fontSize: isMobile ? 14 : 16.5, fontStyle: 'italic', fontWeight: 600, color: '#001529', opacity: 0.82, margin: '0 auto 30px', lineHeight: 1.6, maxWidth: 560 }}>
                    {pkg.euTicketBannerText}
                  </p>
                )}
                <button
                  onClick={() => document.getElementById('conversion-section')?.scrollIntoView({ behavior: 'smooth' })}
                  style={{ background: '#001529', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 38px', fontSize: 13, fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 8px 20px rgba(0,0,0,0.25)' }}
                >
                  Falar com um Consultor
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- EXPERIÊNCIAS --- */}
      {vis.experiencia && (
      <section id="experiencia" style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#001529', position: 'relative', overflow: 'hidden' }}>
        <SectionBackground bg={bgs.experiencia} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60, alignItems: 'start' }}>
            <div ref={experienciaTextRef}>
              <h2 style={{ fontSize: isMobile ? '2.2rem' : 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, margin: '0 0 24px', lineHeight: 1.1 }}>Uma Experiência <span style={{ color: '#f7ad40' }}>Inesquecível</span></h2>
              <div style={{ fontSize: isMobile ? 14 : 16, color: '#aaa', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: pkg.experienciaSection || 'Nossos pacotes garantem que você vivencie cada momento memorável com conforto, segurança e acesso a áreas exclusivas que a maioria dos visitantes nunca experimenta.' }} />
              {(pkg.experienciaItems || '').split(';').map(s => s.trim()).filter(Boolean).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28 }}>
                  {(pkg.experienciaItems || '').split(';').map(s => s.trim()).filter(Boolean).map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 22, height: 22, background: '#f7ad40', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckCircle2 size={13} color="#002042" />
                      </div>
                      <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: '#eee' }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: experienciaTopImgs.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
              {experienciaTopImgs.length > 0 ? experienciaTopImgs.map((img, i) => (
                <img key={i} src={fixImgPath(img)} alt="Experiência" style={{ width: '100%', height: experienciaTopImgs.length > 1 ? 220 : 380, objectFit: 'cover', borderRadius: 24, border: '1px solid #003866' }} />
              )) : (
                <div style={{ width: '100%', height: 380, background: '#002042', borderRadius: 24, border: '1px solid #003866' }} />
              )}
            </div>
          </div>
          {experienciaOverflowImgs.length > 0 && (
            <div style={{ marginTop: isMobile ? 20 : 24, display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
              {experienciaOverflowImgs.map((img, i) => (
                <img key={i} src={fixImgPath(img)} alt="Experiência" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 24, border: '1px solid #003866' }} />
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      {/* --- DESTINO & LIFESTYLE --- */}
      {vis.destino && destino && (destino.titulo || destino.descricao) && (() => {
        const fotos = (
          <div style={{ display: 'grid', gridTemplateColumns: destinoTopImgs.length > 1 ? '1fr 1fr' : '1fr', gap: 16 }}>
            {destinoTopImgs.length > 0 ? destinoTopImgs.map((img, i) => (
              <img key={i} src={fixImgPath(img)} alt={destino.titulo || 'Destino'} style={{ width: '100%', height: destinoTopImgs.length > 1 ? 220 : 380, objectFit: 'cover', borderRadius: 24, border: '1px solid #003866' }} />
            )) : (
              <div style={{ width: '100%', height: 380, background: '#002042', borderRadius: 24, border: '1px solid #003866' }} />
            )}
          </div>
        );
        const texto = (
          <div ref={destinoTextRef}>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, margin: '0 0 24px', lineHeight: 1.1 }}>
              <span style={{ color: '#f7ad40' }}>{destino.titulo}</span>
            </h2>
            {destino.descricao && <p style={{ fontSize: isMobile ? 14 : 16, color: '#aaa', lineHeight: 1.8, marginBottom: destinoItems.length > 0 ? 28 : 0 }}>{destino.descricao}</p>}
            {destinoItems.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {destinoItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 22, height: 22, background: '#f7ad40', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <MapPin size={12} color="#002042" />
                    </div>
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: '#eee' }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        return (
          <section style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#002042', borderTop: '1px solid #003866', borderBottom: '1px solid #003866', position: 'relative', overflow: 'hidden' }}>
            <SectionBackground bg={bgs.destino} />
            <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60, alignItems: 'start' }}>
                {destino.invertido ? <>{texto}{fotos}</> : <>{fotos}{texto}</>}
              </div>
              {destinoOverflowImgs.length > 0 && (
                <div style={{ marginTop: isMobile ? 20 : 24, display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16 }}>
                  {destinoOverflowImgs.map((img, i) => (
                    <img key={i} src={fixImgPath(img)} alt={destino.titulo || 'Destino'} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 24, border: '1px solid #003866' }} />
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* --- GALERIA DE FOTOS (todo o Banco de Imagens do pacote) --- */}
      {pkg.galleryImages && pkg.galleryImages.trim() !== '' && (
        <section id="galeria" style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#001529' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, margin: '0 0 8px', lineHeight: 1.1 }}>Galeria de <span style={{ color: '#f7ad40' }}>Fotos</span></h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#aaa', margin: '0 0 40px' }}>Um gostinho do que espera por você.</p>
            <PhotoGallery images={pkg.galleryImages.split(';').filter(Boolean).map(s => s.trim())} isMobile={isMobile} themeColor="#f7ad40" />
          </div>
        </section>
      )}

      {/* --- PARCERIA --- */}
      <section style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#002042', borderTop: '1px solid #003866', borderBottom: '1px solid #003866', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <SectionBackground bg={bgs.parceria} />
        <div style={{ maxWidth: 1000, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 12, color: '#f7ad40', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Realizado por:</p>
          <h2 style={{ fontSize: isMobile ? '2rem' : 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Uma Parceria de Referência</h2>
          <p style={{ fontSize: isMobile ? 15 : 18, color: '#aaa', maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Duas empresas líderes unidas para levar você ao espetáculo mais emocionante do {sportNameText}.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 30, textAlign: 'left' }}>

            {/* Card Mais Corporativo */}
            <div style={{ background: '#001529', border: '1px solid #003866', borderRadius: 24, padding: '40px', display: 'flex', flexDirection: 'column', transition: 'border-color 0.3s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#f7ad40'} onMouseOut={e => e.currentTarget.style.borderColor = '#003866'}>
              <img src="/logo_mais.png" alt="Mais Corporativo" style={{ height: 65, objectFit: 'contain', marginBottom: 24, alignSelf: 'flex-start' }} />
              <p style={{ color: '#aaa', fontSize: 16, lineHeight: 1.6, flex: 1, marginBottom: 32 }}>
                Especialistas em viagens e experiências corporativas de alto padrão. Do planejamento ao retorno, cuidamos de cada detalhe para que você viva momentos inesquecíveis com segurança e conforto.
              </p>
              <div style={{ alignSelf: 'flex-start', background: 'rgba(228,60,68,0.1)', border: '1px solid rgba(228,60,68,0.2)', color: '#f7ad40', padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Turismo Corporativo
              </div>
            </div>

            {/* Card E-Mais */}
            <div style={{ background: '#001529', border: '1px solid #003866', borderRadius: 24, padding: '40px', display: 'flex', flexDirection: 'column', transition: 'border-color 0.3s' }} onMouseOver={e => e.currentTarget.style.borderColor = '#f7ad40'} onMouseOut={e => e.currentTarget.style.borderColor = '#003866'}>
              <img src="/logo_emais.png" alt="E-Mais" style={{ height: 40, objectFit: 'contain', marginBottom: 24, alignSelf: 'flex-start' }} />
              <p style={{ color: '#aaa', fontSize: 16, lineHeight: 1.6, flex: 1, marginBottom: 32 }}>
                A plataforma de experiências esportivas que conecta você aos maiores eventos do mundo com tecnologia, agilidade e personalização de ponta a ponta.
              </p>
              <div style={{ alignSelf: 'flex-start', background: 'rgba(228,60,68,0.1)', border: '1px solid rgba(228,60,68,0.2)', color: '#f7ad40', padding: '8px 16px', borderRadius: 100, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Experiências Esportivas
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- CONVERSION / FORM SECTION --- */}
      <section id="conversion-section" style={{ padding: '120px 20px', background: '#0a0a0b', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: 1, background: 'linear-gradient(to right, transparent, #f7ad40, transparent)' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', gap: isMobile ? 40 : 80, alignItems: 'center' }}>
          <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
            <h2 style={{ fontSize: isMobile ? '2.5rem' : 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: isMobile ? 16 : 32 }}>Garanta seu lugar na <span style={{ color: '#f7ad40' }}>História.</span></h2>
            <p style={{ fontSize: isMobile ? 16 : 20, color: '#888', lineHeight: 1.6, marginBottom: isMobile ? 32 : 48 }}>Preencha os dados ao lado e receba um atendimento personalizado de nossos especialistas em eventos esportivos.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                'Atendimento humanizado 24h durante o evento',
                'Pagamento facilitado em até 10x',
                'Empresa consolidada há mais de 20 anos'
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 24, height: 24, background: '#f7ad40', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={14} color="#002042" />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="glass-form" style={{ background: '#001a33', border: '1px solid #003866', borderRadius: 32, padding: isMobile ? '24px' : '40px' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Cotação de Pacote</h3>
                <p style={{ fontSize: 14, color: '#666', marginTop: 8 }}>Mantenha seus dados atualizados para contato.</p>
              </div>

              <div ref={mauticContainerRef} className="mautic-premium-form" />

              {!pkg.mauticFormCode && (
                <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <MessageCircle size={32} color="#333" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: '#555' }}>Formulário indisponível.</p>
                </div>
              )}

              {submitting && !showSuccess && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', borderRadius: 32, zIndex: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#f7ad40', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: 20, fontSize: 12, fontWeight: 800, color: '#f7ad40' }}>Processando...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: isMobile ? '40px 20px' : '80px 40px', textAlign: 'center', borderTop: '1px solid #002042' }}>
        <img src="/emais-logo.svg" alt="E-Mais" style={{ height: isMobile ? 26 : 34, margin: '0 auto 16px', opacity: 0.5 }} />
        <p style={{ fontSize: isMobile ? 11 : 13, color: '#444', maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
          © Todos os direitos reservados Mais Corporativo - 2026 - {sport === 'automobilismo' ? 'Não somos afiliados à IndyCar ou Penske Corporation. Somos apenas uma empresa de turismo que oferece pacotes para a corrida.' : 'Somos uma agência de turismo corporativo especializada em pacotes para grandes eventos esportivos.'}
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&display=swap');
        
        .animate-fade-in { animation: fadeIn 1.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .mautic-premium-form .mauticform_wrapper { width: 100% !important; }
        .mautic-premium-form .mauticform-innerform { display: flex; flex-direction: column; gap: 28px; }
        .mauticform-grid-row { display: grid !important; grid-template-columns: 1fr 1fr !important; column-gap: 16px !important; row-gap: 28px !important; width: 100% !important; }
        .mautic-premium-form .mauticform-row { margin-bottom: 0; width: 100% !important; }
        .mautic-premium-form label { display: block; font-size: 10px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
        .mautic-premium-form label span.mauticform-required { color: #f7ad40; }
        .mautic-premium-form input:not([type="radio"]), .mautic-premium-form select, .mautic-premium-form textarea { width: 100% !important; height: 45px !important; background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 10px !important; padding: 0 16px !important; color: #fff !important; font-size: 14px !important; outline: none; transition: all 0.2s; }
        .mautic-premium-form input:focus { border-color: #f7ad40; background: rgba(228, 60, 68, 0.04); }
        .mautic-premium-form input[readonly] { color: #f7ad40 !important; font-weight: 700 !important; cursor: default; background: rgba(247, 173, 64, 0.08) !important; border-color: rgba(247, 173, 64, 0.25) !important; }
        .mautic-premium-form .mauticform-radiogrp-options { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; width: 100%; }
        @media (max-width: 600px) { .mauticform-grid-row { grid-template-columns: 1fr !important; } }
        .mautic-premium-form input[type="radio"] { appearance: none; width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.15); border-radius: 50%; cursor: pointer; position: relative; flex-shrink: 0; }
        .mautic-premium-form input[type="radio"]:checked { border-color: #f7ad40; }
        .mautic-premium-form input[type="radio"]:checked::after { content: ""; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: #f7ad40; border-radius: 50%; }
        .mautic-premium-form .mauticform-radiogrp-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; cursor: pointer; }
        .mautic-premium-form .mauticform-radiogrp-label { font-size: 13px; color: #999; cursor: pointer; }
        .mautic-premium-form input[type="radio"]:checked + .mauticform-radiogrp-label { color: #fff; }
        .mautic-premium-form .mauticform-button { width: 100% !important; height: 54px !important; background: #f7ad40 !important; border: none !important; border-radius: 12px !important; color: #002042 !important; font-size: 16px !important; font-weight: 900 !important; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s; margin-top: 12px; }
        .mautic-premium-form .mauticform-button:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(228,60,68,0.3); }
        .mautic-premium-form .mauticform-description, .mautic-premium-form .mauticform-helpmessage { display: none !important; }

        @media (max-width: 768px) {
          .mauticform-grid-row { display: flex !important; flex-direction: column !important; gap: 28px !important; }
          .mautic-premium-form .mauticform-button { height: 50px !important; font-size: 14px !important; }
          section { padding-left: 15px !important; padding-right: 15px !important; }
        }
      `}</style>
    </div>
  );
}

function SuccessSection({ redirectUrl }: { redirectUrl?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: '#001529', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
      <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(228,60,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
        <CheckCircle2 size={60} color="#f7ad40" />
      </div>
      <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, marginBottom: 16, color: '#fff' }}>SOLICITAÇÃO RECEBIDA</h1>
      <p style={{ fontSize: 20, color: '#888', maxWidth: 600, lineHeight: 1.6 }}>Obrigado pelo seu interesse. Um de nossos especialistas entrará em contato via WhatsApp ou E-mail em breve.</p>
      {redirectUrl && <p style={{ fontSize: 14, color: '#f7ad40', marginTop: 32, fontWeight: 700 }}>Redirecionando você...</p>}
    </div>
  );
}
