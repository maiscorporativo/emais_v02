import Reveal from './Reveal';
import { useImageConfig } from '../hooks/useImageConfig';
import type { ImageKey } from '../imageConfig';

type ColItem = { key: ImageKey; alt: string; h: string };

const COL1: ColItem[] = [
  { key: 'hero_col1_1', alt: 'Velocidade ação 1',  h: 'h-48' },
  { key: 'hero_col1_2', alt: 'Paddock Club', h: 'h-64' },
  { key: 'hero_col1_3', alt: 'Autódromo vista',    h: 'h-56' },
  { key: 'hero_col1_4', alt: 'Momento da corrida',  h: 'h-40' },
];
const COL2: ColItem[] = [
  { key: 'hero_col2_1', alt: 'Vitória pódio', h: 'h-56' },
  { key: 'hero_col2_2', alt: 'Copa premium',     h: 'h-48' },
  { key: 'hero_col2_3', alt: 'Curva da pista', h: 'h-64' },
  { key: 'hero_col2_4', alt: 'Piloto corrida',   h: 'h-48' },
];
const COL3: ColItem[] = [
  { key: 'hero_col3_1', alt: 'Bandeira quadriculada',  h: 'h-64' },
  { key: 'hero_col3_2', alt: 'Boxes e equipes',    h: 'h-48' },
  { key: 'hero_col3_3', alt: 'Largada',       h: 'h-56' },
  { key: 'hero_col3_4', alt: 'Arquibancada vibrando', h: 'h-40' },
];

function MarqueeCol({ items, direction, offset, getImage }: {
  items: ColItem[];
  direction: 'animate-marquee-up' | 'animate-marquee-down';
  offset: string;
  getImage: (k: ImageKey) => string;
}) {
  // Always render all slots so the marquee height stays consistent.
  // Empty slots get a translucent placeholder so the animation doesn't break.
  function renderSlot(item: ColItem, keyPrefix: string) {
    const src = getImage(item.key);
    if (src) {
      return <img key={`${keyPrefix}-${item.key}`} src={src} alt={item.alt} className={`w-full ${item.h} object-cover rounded-xl shadow-xl shadow-black/80`} />;
    }
    return <div key={`${keyPrefix}-${item.key}`} className={`w-full ${item.h} rounded-xl bg-white/5 border border-white/5`} />;
  }

  return (
    <div className="relative">
      <div className={`flex flex-col gap-4 w-full absolute ${direction} hover:[animation-play-state:paused] ${offset}`}>
        <div className="flex flex-col gap-4">
          {items.map(item => renderSlot(item, 'a'))}
        </div>
        <div className="flex flex-col gap-4">
          {items.map(item => renderSlot(item, 'b'))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  const { getImage } = useImageConfig();

  return (
    <section className="relative pt-6 pb-16 px-4 sm:px-6 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
      {/* Left Content */}
      <Reveal className="w-full lg:w-5/12 z-10 flex flex-col justify-between py-2">
        <div>
          <h1 className="text-[2.2rem] sm:text-[3.2rem] lg:text-[4.2rem] font-semibold leading-[1.05] mb-6 tracking-tight">
            O seu passaporte<br />
            para o<br />
            <span className="font-light italic text-gold text-[2.2rem] sm:text-[3.2rem] lg:text-[4.2rem]">Inesquecível</span>
          </h1>
          <p className="text-neutral-400 text-lg mb-10 max-w-md leading-relaxed pr-4">
            Vivencie momentos inesquecíveis com Ingressos Oficiais, VIP e Hospitalidade para os melhores eventos de automobilismo do mundo, feitos sob medida para você e seus convidados.
          </p>
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="inline-flex items-center gap-3 bg-gold text-black font-bold text-sm px-8 py-4 rounded-full hover:bg-white transition-all duration-300 shadow-lg shadow-gold/20 group"
          >
            Ver Pacotes
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </a>
        </div>
      </Reveal>

      {/* Right Content (Masonry Image Grid with Endless Scrolling) */}
      <Reveal className="w-full lg:w-7/12 relative min-h-[280px] sm:min-h-[400px] md:min-h-[500px]" delay={200}>
        <div className="absolute -inset-8 p-8 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_95%,transparent)] pointer-events-none">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 h-full pointer-events-auto w-full">
            <div className="hidden md:block">
              <MarqueeCol items={COL1} direction="animate-marquee-up"   offset="-top-12" getImage={getImage} />
            </div>
            <MarqueeCol items={COL2} direction="animate-marquee-down" offset="-top-4"  getImage={getImage} />
            <MarqueeCol items={COL3} direction="animate-marquee-up"   offset="-top-16" getImage={getImage} />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
