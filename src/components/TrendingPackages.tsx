import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { TrendingPackage } from '../types';
import Reveal from './Reveal';
import PackageModal from './PackageModal';
import { useContentConfig } from '../hooks/useContentConfig';
import { getCurrencySymbol, formatDisplayPrice } from '../utils/currency';



export default function TrendingPackages() {
  const navigate = useNavigate();
  const { packages: allPackages } = useContentConfig();
  
  const packagesWithIndex = allPackages
    .map((p, i) => ({ ...p, originalIndex: i }))
    .filter(p => (!p.status || p.status === 'approved') && p.isTrending === true && !p.deletedAt)
    .slice(0, 8);

  const handleNavigate = (idx: number) => {
    navigate(`/pacote/${idx}`);
    window.scrollTo(0, 0);
  };

  if (packagesWithIndex.length === 0) return null;

  return (
    <section id="trending" className="bg-neutral-50 text-black py-24 px-6 relative">
      <div className="max-w-[1400px] mx-auto">
        <Reveal className="flex justify-between items-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900">Pacotes em Alta</h2>
        </Reveal>

        {/* Grid: 4 colunas no desktop, 2 no tablet, 1 no mobile → até 2 linhas para 8 cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}
          className="trending-grid"
        >
          {packagesWithIndex.map((pkg) => (
            <div
              key={pkg.originalIndex}
              style={{ perspective: '1000px' }}
            >
              <div
                className="bg-white rounded-xl overflow-hidden shadow-sm transition-all duration-300 border border-neutral-200 flex flex-col group h-full relative z-10 hover:shadow-2xl cursor-pointer"
                style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                onClick={() => handleNavigate(pkg.originalIndex)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const centerX = rect.width / 2;
                  const centerY = rect.height / 2;
                  const rotateX = -((y - centerY) / centerY) * 12;
                  const rotateY = ((x - centerX) / centerX) * 12;
                  e.currentTarget.style.transition = 'none';
                  e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transition = 'transform 0.5s ease-out';
                  e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
                }}
              >
                <div className="relative h-48 bg-neutral-200 overflow-hidden rounded-t-[11px]">
                  <div className="absolute top-4 right-4 z-10 bg-gold text-black backdrop-blur text-[10px] font-bold px-2 py-1 rounded tracking-wider shadow-sm">
                    {pkg.tag}
                  </div>
                  <img src={pkg.img} alt={`Pacote ${pkg.title} em ${pkg.loc}`} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                {/* Badge logo */}
                <div className="absolute bottom-auto top-[calc(12rem-1.25rem)] left-4 w-12 h-12 bg-white rounded-md shadow-md flex items-center justify-center p-1.5 z-20">
                  {pkg.badgeImg
                    ? <img src={pkg.badgeImg} alt={pkg.badge} className="w-full h-full object-contain" />
                    : <span className="text-[10px] font-bold uppercase">{pkg.badge}</span>
                  }
                </div>
                <div className="p-6 pt-8 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-1 leading-tight">{pkg.title}</h3>
                  <div className="text-xs text-neutral-500 mb-6 flex-1 space-y-1">
                    <div>{pkg.date} | {pkg.loc}</div>
                  </div>
                  <div className="border-t border-neutral-100 pt-4 flex flex-col">
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">Pacotes a partir de</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-semibold text-lg">{getCurrencySymbol(pkg.currency || 'BRL')} {formatDisplayPrice(pkg.price, pkg.currency || 'BRL')}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleNavigate(pkg.originalIndex); }}
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
            </div>
          ))}
        </div>

        {/* Modal removed because we now use LPs */}
      </div>

      {/* Responsive: 2 colunas em tablet, 1 no mobile */}
      <style>{`
        @media (max-width: 1023px) {
          .trending-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 639px) {
          .trending-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
