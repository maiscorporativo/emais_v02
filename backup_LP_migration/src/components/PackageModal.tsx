import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plane, BedDouble, Ticket, X } from 'lucide-react';
import type { TrendingPackage } from '../types';
import { getCurrencySymbol, formatDisplayPrice } from '../utils/currency';

/* ── Helper: detail row ─────────────────────────────────────── */
function DetailRow({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        background: '#f3f4f6', borderRadius: 10,
        padding: 10, flexShrink: 0, color: '#374151',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h4 style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 4px', overflowWrap: 'break-word', wordBreak: 'break-word' }}>{title}</h4>
        <p style={{ fontSize: 13, color: '#6b7280', margin: 0, lineHeight: 1.6, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{text}</p>
      </div>
    </div>
  );
}

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: TrendingPackage | null;
}

export default function PackageModal({ isOpen, onClose, pkg }: PackageModalProps) {
  // Trava o scroll da página enquanto o modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fecha via tecla Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pkg) return null;

  const modal = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Card — posicionado acima do backdrop, sem overflow hidden no pai */}
      <div
        style={{
          position: 'relative',
          background: '#fff',
          color: '#111',
          width: '100%',
          maxWidth: 760,
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(100dvh - 32px)',
          flexShrink: 0,
          margin: 'auto',
        }}
      >
        {/* Header Image */}
        <div style={{ position: 'relative', height: 240, flexShrink: 0, borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
          <img
            src={pkg.img}
            alt={pkg.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
              transition: 'background 0.15s',
              color: '#fff',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
          >
            <X size={18} />
          </button>

          {/* Title area */}
          <div style={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
            <span style={{
              display: 'inline-block',
              background: '#e43c44', color: '#000',
              fontSize: 10, fontWeight: 800,
              padding: '3px 10px', borderRadius: 5,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {pkg.tag}
            </span>
            <h2
              id="modal-title"
              style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, color: '#fff', margin: '0 0 4px', lineHeight: 1.15, overflowWrap: 'break-word', wordBreak: 'break-word' }}
            >
              {pkg.title}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
              {pkg.date} | {pkg.loc}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 28px 32px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>

          {/* Left — details */}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', paddingBottom: 10, borderBottom: '1px solid #e5e7eb' }}>
                Sobre a Experiência
              </h3>
              <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, margin: 0, overflowWrap: 'break-word', wordBreak: 'break-word' }}>
                {pkg.description || 'Descrição detalhada do pacote ainda não informada. Por favor, contate nossos especialistas para um roteiro personalizado.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pkg.flightDetails && (
                <DetailRow icon={<Plane size={22} />} title="Passagem Aérea" text={pkg.flightDetails} />
              )}
              {pkg.hotelDetails && (
                <DetailRow icon={<BedDouble size={22} />} title="Hospedagem Premium" text={pkg.hotelDetails} />
              )}
              {pkg.ticketDetails && (
                <DetailRow icon={<Ticket size={22} />} title="Ingressos Oficiais" text={pkg.ticketDetails} />
              )}
            </div>
          </div>

          {/* Right — pricing */}
          <div style={{ flex: '0 0 210px' }}>
            <div style={{
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: 16, padding: '24px 20px',
              position: 'sticky', top: 16,
            }}>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Valor Estimado
              </p>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#111', margin: '0 0 4px', lineHeight: 1.1 }}>
                {getCurrencySymbol(pkg.currency || 'BRL')} {formatDisplayPrice(pkg.price, pkg.currency || 'BRL')}
              </div>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>por pessoa</span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
                <a
                  href="https://api.whatsapp.com/send/?phone=5518997624457&text=Ol%C3%A1,%20tudo%20bem?%20Gostaria%20de%20falar%20com%20um%20consultor.&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%', padding: '13px 0',
                    background: '#e43c44', color: '#000',
                    fontWeight: 800, fontSize: 14,
                    border: 'none', borderRadius: 12,
                    cursor: 'pointer', transition: 'opacity 0.15s',
                    fontFamily: 'inherit', textAlign: 'center',
                    textDecoration: 'none', display: 'block', boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Reservar Pacote
                </a>
                <a
                  href="https://api.whatsapp.com/send/?phone=5518997624457&text=Ol%C3%A1,%20tudo%20bem?%20Gostaria%20de%20falar%20com%20um%20consultor.&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%', padding: '12px 0',
                    background: '#fff', color: '#374151',
                    fontWeight: 700, fontSize: 14,
                    border: '2px solid #e5e7eb', borderRadius: 12,
                    cursor: 'pointer', transition: 'border-color 0.15s',
                    fontFamily: 'inherit', textAlign: 'center',
                    textDecoration: 'none', display: 'block', boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#e43c44')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                >
                  Falar com um Consultor
                </a>
              </div>
              <p style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.5, margin: '16px 0 0', textAlign: 'center' }}>
                Preços e condições sujeitos a disponibilidade e alterações sem prévio aviso.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
