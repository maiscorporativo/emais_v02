import { useState } from 'react';
import { ChevronDown, MapPin, Calendar, ArrowRight } from 'lucide-react';
import type { TrendingPackage } from '../types';
import { useContentConfig } from '../hooks/useContentConfig';
import PackageModal from './PackageModal';
import Reveal from './Reveal';
import { getCurrencySymbol, formatDisplayPrice } from '../utils/currency';

/* ── Category icons/emojis ── */
const CATEGORY_ICONS: Record<string, string> = {
  'Fórmula 1': '🏎️',
  'MotoGP': '🏍️',
  'Fórmula E': '⚡',
  'Stock Car': '🚘',
  'Porsche Cup': '🏁',
  'Nascar': '🏎️',
  'WEC / Endurance': '⏱️',
  'Multiesportivo': '🏅',
  'Outros': '🎟️',
};

/* ── Mini package card ── */
function PackageCard({ pkg, onClick }: { pkg: TrendingPackage; onClick: () => void }) {
  const curr = pkg.currency || 'BRL';
  return (
    <div
      onClick={onClick}
      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gold/40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        {pkg.img
          ? <img src={pkg.img} alt={pkg.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">{CATEGORY_ICONS[pkg.category || ''] || '🎟️'}</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-1 rounded-full bg-gold text-black uppercase tracking-wider">
          {pkg.tag}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-bold text-white text-base mb-2 leading-tight">{pkg.title}</h4>
        <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1">
          <MapPin size={11} className="text-gold" />{pkg.loc}
        </div>
        <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-3">
          <Calendar size={11} className="text-gold" />{pkg.date}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">a partir de</p>
            <p className="text-gold font-bold text-lg">{getCurrencySymbol(curr)} {formatDisplayPrice(pkg.price, curr)}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gold/10 group-hover:bg-gold flex items-center justify-center transition-all duration-300">
            <ArrowRight size={14} className="text-gold group-hover:text-black transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Accordion item ── */
function CategoryAccordion({
  category, packages, isOpen, onToggle, iconEmoji,
}: {
  category: string;
  packages: TrendingPackage[];
  isOpen: boolean;
  onToggle: () => void;
  iconEmoji?: string;
}) {
  const [selectedPkg, setSelectedPkg] = useState<TrendingPackage | null>(null);
  const displayIcon = iconEmoji || CATEGORY_ICONS[category] || '🎟️';

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 text-left hover:bg-white/5 transition-colors duration-200"
      >
        <span className="text-2xl">{displayIcon}</span>
        <div className="flex-1">
          <span className="text-white font-semibold text-lg">{category}</span>
          <span className="ml-3 text-xs text-neutral-500 font-normal">
            {packages.length} pacote{packages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className={`w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-gold/20' : ''}`}>
          <ChevronDown size={16} className={isOpen ? 'text-gold' : 'text-neutral-400'} />
        </div>
      </button>

      {/* Body — accordion content */}
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: isOpen ? `${packages.length * 400 + 80}px` : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 border-t border-white/5 pt-5">
          {packages.map((pkg) => (
            <PackageCard key={pkg.title} pkg={pkg} onClick={() => setSelectedPkg(pkg)} />
          ))}
        </div>
      </div>

      {/* Modal */}
      <PackageModal
        isOpen={!!selectedPkg}
        onClose={() => setSelectedPkg(null)}
        pkg={selectedPkg}
      />
    </div>
  );
}

/* ── Main Section ── */
export default function CategoriesSection() {
  const { packages: allPackages, categoryIcons, categories: configCategories } = useContentConfig();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // Filtrar apenas aprovados
  const packages = allPackages.filter(p => (!p.status || p.status === 'approved') && !p.deletedAt);

  // Agrupar por categoria
  const grouped = packages.reduce<Record<string, TrendingPackage[]>>((acc, pkg) => {
    const cat = pkg.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(pkg);
    return acc;
  }, {});

  // Ordenar conforme a ordem salva no Admin, mas só mostrar categorias com pacotes ativos
  const safeConfigCats = Array.isArray(configCategories) ? configCategories : [];
  const displayCategories = safeConfigCats.filter(cat => grouped[cat]);
  
  // Categorias "órfãs" (que têm pacotes, mas não estão na lista de config do Admin) aparecem no final
  Object.keys(grouped).forEach(cat => {
    if (!displayCategories.includes(cat)) {
      displayCategories.push(cat);
    }
  });

  if (displayCategories.length === 0) return null;

  return (
    <section id="events" className="px-6 py-16 max-w-[1400px] mx-auto">
      <Reveal>
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-3">Explore por Esporte</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            Escolha sua <span className="text-gold">modalidade</span>
          </h2>
          <p className="text-neutral-400 mt-3 text-lg max-w-xl">
            Encontre o pacote perfeito no esporte que você mais ama.
          </p>
        </div>
      </Reveal>

      <div className="flex flex-col gap-3">
        {displayCategories.map((cat, i) => (
          <Reveal key={cat} delay={i * 60}>
            <CategoryAccordion
              category={cat}
              packages={grouped[cat]}
              isOpen={openCategory === cat}
              onToggle={() => setOpenCategory(prev => prev === cat ? null : cat)}
              iconEmoji={categoryIcons[cat]}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
