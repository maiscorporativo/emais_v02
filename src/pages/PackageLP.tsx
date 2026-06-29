import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Plane, BedDouble, Ticket,
  MapPin, Calendar, ChevronDown, Users,
  MessageCircle, AlertTriangle, Zap, Trophy, Headset, ChevronRight
} from 'lucide-react';
import { useContentConfig } from '../hooks/useContentConfig';
import type { TrendingPackage } from '../types';

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

/* --- Hodômetro (Speedometer) Component --- */
function Speedometer() {
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      // Max speed = 350
      setSpeed(Math.min(350, Math.max(0, Math.floor(scrollPercent * 350))));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate rotation (-130deg to +130deg)
  const rotation = -130 + (speed / 350) * 260;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      width: '120px',
      height: '120px',
      background: 'radial-gradient(circle, #002b52 0%, #001529 100%)',
      borderRadius: '50%',
      border: '2px solid #333',
      boxShadow: '0 10px 30px rgba(0,0,0,0.8), inset 0 0 20px rgba(228,60,68,0.2)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none'
    }}>
      {/* Ticks */}
      {[...Array(11)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: i % 2 === 0 ? '4px' : '2px',
          height: i % 2 === 0 ? '12px' : '8px',
          background: i > 7 ? '#f7ad40' : '#555',
          top: '4px',
          left: '50%',
          transformOrigin: '50% 56px',
          transform: `translateX(-50%) rotate(${-130 + (i * 26)}deg)`
        }} />
      ))}
      {/* Needle */}
      <div style={{
        position: 'absolute',
        width: '4px',
        height: '50px',
        background: 'linear-gradient(to top, transparent, #f7ad40)',
        bottom: '50%',
        left: 'calc(50% - 2px)',
        transformOrigin: 'bottom center',
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.1s ease-out'
      }} />
      {/* Center dot */}
      <div style={{
        position: 'absolute',
        width: '12px',
        height: '12px',
        background: '#f7ad40',
        borderRadius: '50%',
        top: 'calc(50% - 6px)',
        left: 'calc(50% - 6px)',
        boxShadow: '0 0 10px rgba(228,60,68,0.8)'
      }} />

      {/* Speed text */}
      <div style={{ position: 'absolute', bottom: '15px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff', lineHeight: '1' }}>{speed}</div>
        <div style={{ fontSize: '10px', fontWeight: 800, color: '#f7ad40', letterSpacing: '1px' }}>KM/H</div>
      </div>
    </div>
  );
}

/* --- Football Kick Animation Component --- */
/* --- Sport Ball Scroll Animation Component --- */
function SportBall({ sport }: { sport: string }) {
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
      {sport === 'tenis' && (
        <img
          src={fixImgPath('raquete.png')}
          alt="Racket"
          style={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            objectFit: 'contain',
            transform: isMobile
              ? 'rotate(0deg) translate(100px, 90px) scale(0.8)'
              : 'rotate(0deg) translate(320px, 270px) scale(0.8)',
            filter: 'drop-shadow(0 15px 35px rgba(0,0,0,0.4))',
            zIndex: -1
          }}
        />
      )}
      {sport === 'futebol' && (
        <img
          src={fixImgPath('jogador.png')}
          alt="Player"
          style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            objectFit: 'contain',
            transform: isMobile
              ? 'translate(110px, 75px) scale(1.0)'
              : 'translate(300px, 200px) scale(1.2)',
            filter: 'drop-shadow(0 15px 45px rgba(0,0,0,0.5))',
            zIndex: -1
          }}
        />
      )}
      {sport === 'basquete' && (
        <img
          src={fixImgPath('basquete_player.png')}
          alt="Basketball Player"
          style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            objectFit: 'contain',
            transform: isMobile
              ? 'translate(130px, 70px) scale(1.2)'
              : 'translate(400px, 170px) scale(1.5)',
            filter: 'drop-shadow(0 15px 45px rgba(0,0,0,0.5))',
            zIndex: -1
          }}
        />
      )}
      {sport === 'automobilismo' && (
        <img
          src={fixImgPath(`img_f1/f1_turnarround_000${Math.min(9, Math.max(0, Math.floor(scrollPercent * 10)))}_Camada-${Math.min(9, Math.max(0, Math.floor(scrollPercent * 10))) + 5}.png`)}
          alt="F1 Car"
          style={{
            position: 'absolute',
            width: '60%',
            height: '60%',
            objectFit: 'contain',
            transform: isMobile
              ? 'translate(70px, 100px) scale(0.8)'
              : 'translate(240px, 320px) scale(0.5)',
            filter: 'drop-shadow(0 15px 45px rgba(0,0,0,0.5))',
            zIndex: -1
          }}
        />
      )}
      {sport === 'lutas' && (
        <img
          src={fixImgPath(`img_lutador/fighter_${Math.min(7, Math.max(1, Math.floor(scrollPercent * 7) + 1))}.png`)}
          alt="Fighter"
          style={{
            position: 'absolute',
            width: '50%',
            height: '50%',
            objectFit: 'contain',
            transform: isMobile
              ? 'translate(80px, 80px) scale(0.5)'
              : 'translate(300px, 270px) scale(0.8)',
            filter: 'drop-shadow(0 15px 45px rgba(0,0,0,0.5))',
            zIndex: -1
          }}
        />
      )}
      {sport !== 'lutas' && sport !== 'automobilismo' && (
        <img
          src={fixImgPath(sport === 'tenis' ? 'tenis_ball.png' : sport === 'basquete' ? 'basquete_ball.png' : 'soccer_ball.png')}
          alt={sport === 'tenis' ? 'Tennis Ball' : sport === 'basquete' ? 'Basketball' : 'Soccer Ball'}
          style={{
            width: sport === 'futebol'
              ? (isMobile ? '30px' : '100px')
              : sport === 'tenis'
                ? (isMobile ? '15px' : '40px')
                : (isMobile ? '30px' : '100px'),
            height: sport === 'futebol'
              ? (isMobile ? '30px' : '100px')
              : sport === 'tenis'
                ? (isMobile ? '15px' : '40px')
                : (isMobile ? '30px' : '100px'),
            objectFit: 'contain',
            transform: isMobile
              ? `${sport === 'futebol' ? 'translate(80px, 35px)' : sport === 'tenis' ? 'translate(50px, 100px)' : sport === 'basquete' ? 'translate(65px, -65px)' : ''} rotate(${rotation}deg)`
              : `${sport === 'futebol' ? 'translate(180px, -10px)' : sport === 'tenis' ? 'translate(150px, 260px)' : sport === 'basquete' ? 'translate(160px, -230px)' : ''} rotate(${rotation}deg)`,
            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))'
          }}
        />
      )}
    </div>
  );
}

/* --- Package Navbar Component --- */
function PackageNavbar({ onBook, isMobile }: { onBook: () => void, isMobile: boolean }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
  const [activePkgTab, setActivePkgTab] = useState(0); // Para a seção de Pacotes
  const [pricingMode, setPricingMode] = useState<'individual' | 'duplo'>('duplo');
  const mauticContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!loading && packages.length > 0) {
      const index = Number(id);
      const p = packages[index];
      if (!p) { setNotFound(true); return; }
      if (p.status !== 'approved' && !localStorage.getItem('emais_marketing_auth')) {
        navigate('/');
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

  // Parse JSON data safely
  const parseJSON = (data: any, fallback: any) => {
    if (!data) return fallback;
    try { return JSON.parse(data); } catch { return fallback; }
  };

  const programacao = parseJSON(pkg.programacaoData, [
    { dia: 'SEXTA', data: '22 de maio', descricao: 'Acesso VIP aos treinos livres e atividades no paddock.' },
    { dia: 'SÁBADO', data: '23 de maio', descricao: 'Acompanhe a qualificação com vista privilegiada.' },
    { dia: 'DOMINGO', data: '24 de maio', descricao: 'O grande dia da corrida. Acesso premium e hospitalidade.' }
  ]);

  const pacotes = parseJSON(pkg.pacotesOptionsData, [
    { tipo: 'Quarto Individual', preço: '450,00', info: 'Pacote Premium' },
    { tipo: 'Quarto Duplo', preço: '790,00', info: 'Pacote VIP Exclusivo' }
  ]);

  const cards = parseJSON(pkg.cardsData, [
    { titulo: 'Experiência Completa', descricao: 'Ingressos, hospedagem e transporte tudo em um único pacote cuidadosamente planejado.', icone: 'Zap' },
    { titulo: 'Acesso Exclusivo', descricao: 'Áreas VIP, encontros com pilotos e experiências que não estão disponíveis ao público.', icone: 'Trophy' },
    { titulo: 'Suporte 24/7', descricao: 'Nossa equipe está disponível antes, durante e após o evento para garantir sua satisfação.', icone: 'Headset' }
  ]);

  const sport = pkg.sportType || 'automobilismo';

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
      {/* {sport === 'automobilismo' && <Speedometer />} */}
      {(sport === 'futebol' || sport === 'tenis' || sport === 'basquete' || sport === 'lutas' || sport === 'automobilismo') && <SportBall sport={sport} isMobile={isMobile} />}

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
            {pkg.description || 'Viva a emoção da corrida com um pacote completo: passagens aéreas, hospedagem e ingressos garantidos, além de experiências exclusivas que vão muito além da corrida.'}
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
      <section style={{ padding: '0 20px', position: 'relative', zIndex: 20, marginTop: '-80px', marginBottom: '80px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
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
        {/* Local Background Video */}
        {sport === 'automobilismo' ? (
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
      <section id="pacotes" style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#0a0a0b' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, margin: '0 0 16px' }}>Pacotes de <span style={{ color: '#f7ad40' }}>Viagem Completos</span></h2>
            <p style={{ fontSize: 16, color: '#aaa', maxWidth: 600, margin: '0 auto' }}>Voe com tudo incluído. Hospedagem, transporte e ingressos em um único pacote.</p>

            {/* Pricing Toggle */}
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
                      <div style={{ fontSize: 13, color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>{parcelas}x de</div>
                      <div style={{ fontSize: isMobile ? 28 : 40, fontWeight: 900, color: i === 0 ? '#f7ad40' : '#fbbf24', display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: isMobile ? 16 : 20 }}>{op.moeda || 'USD'}</span>
                        <span style={{ fontSize: isMobile ? 32 : 48 }}>{price || op.valor_parcela || op.preço || '---'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 8 }}>por pessoa em quarto {pricingMode}</div>
                    </div>

                    <div style={{ flex: 1, marginBottom: 32 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 16 }}>O que está incluso:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {showInclusos.slice(0, 5).map((inc: any, j: number) => (
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
        </div>
      </section>

      {/* --- EXPERIÊNCIA --- */}
      <section id="experiencia" style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#001529' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, margin: '0 0 24px', lineHeight: 1.1 }}>Uma Experiência <span style={{ color: '#f7ad40' }}>Inesquecível</span></h2>
            <div style={{ fontSize: isMobile ? 14 : 16, color: '#aaa', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: pkg.experienciaSection || 'Nossos pacotes garantem que você vivencie cada momento memorável com conforto, segurança e acesso a áreas exclusivas que a maioria dos visitantes nunca experimenta.' }} />
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            {pkg.galleryImages ? (
              pkg.galleryImages.split(';').filter(Boolean).slice(0, 2).map((img, i) => (
                <img key={i} src={fixImgPath(img.trim())} alt="Experiência" style={{ width: '100%', borderRadius: 24, border: '1px solid #003866' }} />
              ))
            ) : (
              <div style={{ width: '100%', height: 300, background: '#002042', borderRadius: 24, border: '1px solid #003866' }} />
            )}
          </div>
        </div>
      </section>

      {/* --- PARCERIA --- */}
      <section style={{ padding: isMobile ? '60px 20px' : '100px 20px', background: '#002042', borderTop: '1px solid #003866', borderBottom: '1px solid #003866', textAlign: 'center' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <p style={{ fontSize: 12, color: '#f7ad40', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Realizado por:</p>
          <h2 style={{ fontSize: isMobile ? '2rem' : 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, color: '#fff', margin: '0 0 16px' }}>Uma Parceria de Referência</h2>
          <p style={{ fontSize: isMobile ? 15 : 18, color: '#aaa', maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Duas empresas líderes unidas para levar você ao espetáculo mais emocionante do automobilismo mundial.
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
                'Empresa consolidada há mais de 15 anos'
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
        <div className="text-2xl font-black uppercase tracking-tighter text-white" style={{ marginBottom: 16, opacity: 0.5, fontSize: isMobile ? 18 : 24 }}>
          TORCIDA <span className="text-gold">PLACAR</span>
        </div>
        <p style={{ fontSize: isMobile ? 11 : 13, color: '#444', maxWidth: 800, margin: '0 auto', lineHeight: 1.6 }}>
          © Todos os direitos reservados Mais Corporativo - 2026 - Não somos afiliados à IndyCar ou Penske Corporation. Somos apenas uma empresa de turismo que oferece pacotes para a corrida.
        </p>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;900&display=swap');
        
        .animate-fade-in { animation: fadeIn 1.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .mautic-premium-form .mauticform_wrapper { width: 100% !important; }
        .mautic-premium-form .mauticform-innerform { display: flex; flex-direction: column; gap: 16px; }
        .mauticform-grid-row { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 16px !important; width: 100% !important; }
        .mautic-premium-form .mauticform-row { margin-bottom: 0; width: 100% !important; }
        .mautic-premium-form label { display: block; font-size: 10px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
        .mautic-premium-form label span.mauticform-required { color: #f7ad40; }
        .mautic-premium-form input:not([type="radio"]), .mautic-premium-form select, .mautic-premium-form textarea { width: 100% !important; height: 45px !important; background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 10px !important; padding: 0 16px !important; color: #fff !important; font-size: 14px !important; outline: none; transition: all 0.2s; }
        .mautic-premium-form input:focus { border-color: #f7ad40; background: rgba(228, 60, 68, 0.04); }
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
          .mauticform-grid-row { display: flex !important; flex-direction: column !important; gap: 0 !important; }
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
