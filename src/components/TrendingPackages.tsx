import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from './Reveal';
import { useContentConfig } from '../hooks/useContentConfig';
import { formatInstallmentPrice, hasPrice, PRICE_ON_REQUEST } from '../utils/currency';
import { appendCurrentQuery } from '../utils/slug';
import type { TrendingPackage } from '../types';

type PkgWithIndex = TrendingPackage & { originalIndex: number };

export default function TrendingPackages() {
  const navigate = useNavigate();
  const { packages: allPackages } = useContentConfig();
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const packagesWithIndex: PkgWithIndex[] = allPackages
    .map((p, i) => ({ ...p, originalIndex: i }))
    .filter(p => (!p.status || p.status === 'approved') && p.isTrending === true && !p.deletedAt && !p.portalHidden);

  const handleNavigate = (idx: number, externalUrl?: string, slug?: string) => {
    if (externalUrl && externalUrl.trim() !== '') {
      window.location.href = appendCurrentQuery(externalUrl.trim());
    } else {
      navigate(`/pacote/${slug || idx}`);
      window.scrollTo(0, 0);
    }
  };

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.trending-card');
    const step = card ? card.offsetWidth + 24 : 320;
    el.scrollBy({ left: dir * step * 2, behavior: 'smooth' });
  };

  if (packagesWithIndex.length === 0) return null;

  const canScroll = packagesWithIndex.length > 4;

  const renderCard = (pkg: PkgWithIndex) => (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 border border-neutral-200 hover:border-gold/40 flex flex-col group h-full relative z-10 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
      onClick={() => handleNavigate(pkg.originalIndex, pkg.externalUrl, pkg.slug)}
    >
      <div className="relative h-48 bg-neutral-200 overflow-hidden rounded-t-[11px]">
        <div className="absolute top-4 right-4 z-10 bg-gold text-black backdrop-blur text-[10px] font-bold px-2 py-1 rounded tracking-wider shadow-sm">
          {pkg.tag}
        </div>
        <img src={pkg.img?.match(/^\d{13}-/) ? `/uploads/${pkg.img}` : (pkg.img?.startsWith('http') || pkg.img?.startsWith('/') ? pkg.img : `/${pkg.img}`)} alt={`Pacote ${pkg.title} em ${pkg.loc}`} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
      </div>
      {/* Badge logo */}
      <div className="absolute bottom-auto top-[calc(12rem-1.25rem)] left-4 w-12 h-12 bg-white rounded-md shadow-md flex items-center justify-center p-1.5 z-20">
        {pkg.badgeImg
          ? <img src={pkg.badgeImg?.match(/^\d{13}-/) ? `/uploads/${pkg.badgeImg}` : (pkg.badgeImg?.startsWith('http') || pkg.badgeImg?.startsWith('/') ? pkg.badgeImg : `/${pkg.badgeImg}`)} alt={pkg.badge} className="w-full h-full object-contain" />
          : <span className="text-[10px] font-bold uppercase">{pkg.badge}</span>
        }
      </div>
      <div className="p-6 pt-8 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-1 leading-tight">{pkg.title}</h3>
        <div className="text-xs text-neutral-500 mb-6 flex-1 space-y-1">
          <div>{pkg.date} | {pkg.loc}</div>
        </div>
        <div className="border-t border-neutral-100 pt-4 flex flex-col">
          <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">{hasPrice(pkg.price) ? 'Pacotes a partir de' : 'Fale com um consultor'}</span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-semibold text-lg">{hasPrice(pkg.price) ? formatInstallmentPrice(pkg.price, pkg.installments, pkg.currency || 'BRL') : PRICE_ON_REQUEST}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleNavigate(pkg.originalIndex, pkg.externalUrl, pkg.slug); }}
              className="text-sm font-semibold text-gold hover:text-black transition-colors flex items-center gap-1"
              aria-label={`Ver pacote ${pkg.title}`}
            >
              Ver pacote <ArrowRight size={14} />
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 mt-2 leading-tight">
            Preços e condições sujeitos a disponibilidade e alterações sem prévio aviso.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <section id="trending" className="bg-neutral-50 text-black py-24 px-6 relative">
      <div className="max-w-[1400px] mx-auto">
        <Reveal className="flex justify-between items-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900">Pacotes em Alta</h2>
        </Reveal>

        {!showAll ? (
          <div style={{ position: 'relative' }}>
            {canScroll && (
              <button
                onClick={() => scrollByCards(-1)}
                aria-label="Ver pacotes anteriores"
                className="trending-arrow trending-arrow-left"
                style={arrowBtnStyle('left')}
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <div ref={scrollRef} className="trending-scroll" style={{ display: 'flex', gap: 24, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}>
              {packagesWithIndex.map(pkg => (
                <div key={pkg.originalIndex} className="trending-card" style={{ flex: '0 0 auto', scrollSnapAlign: 'start' }}>
                  {renderCard(pkg)}
                </div>
              ))}
            </div>
            {canScroll && (
              <button
                onClick={() => scrollByCards(1)}
                aria-label="Ver próximos pacotes"
                className="trending-arrow trending-arrow-right"
                style={arrowBtnStyle('right')}
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }} className="trending-grid">
            {packagesWithIndex.map(pkg => (
              <div key={pkg.originalIndex}>
                {renderCard(pkg)}
              </div>
            ))}
          </div>
        )}

        {!showAll && canScroll && (
          <div style={{ textAlign: 'center', marginTop: 40 }}>
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-black border border-neutral-300 rounded-full px-8 py-3 hover:bg-black hover:text-white hover:border-black transition-colors"
            >
              Ver todos os pacotes <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        .trending-card { width: 320px; }
        .trending-arrow { display: flex; }
        @media (max-width: 1023px) {
          .trending-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .trending-card { width: 280px; }
        }
        @media (max-width: 639px) {
          .trending-grid { grid-template-columns: 1fr !important; }
          .trending-card { width: 82vw; }
          .trending-arrow { width: 36px !important; height: 36px !important; }
        }
        .trending-scroll::-webkit-scrollbar { display: none; }
        .trending-scroll { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

function arrowBtnStyle(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '40%',
    [side]: -18,
    transform: 'translateY(-50%)',
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: '#fff',
    border: '1px solid #e5e5e5',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 20,
    color: '#111',
  };
}
