import { Check } from 'lucide-react';
import Reveal from './Reveal';
import { useImageConfig } from '../hooks/useImageConfig';
import type { ImageKey } from '../imageConfig';

export default function PlatinumAccess() {
  const { getImage } = useImageConfig();

  const scrollToContact = () => {
    const el = document.querySelector('footer');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const col1: { key: ImageKey; alt: string }[] = [
    { key: 'platinum_col1_1', alt: 'Tênis' },
    { key: 'platinum_col1_2', alt: 'Atletismo' },
    { key: 'platinum_col1_3', alt: 'Natação' },
    { key: 'platinum_col1_4', alt: 'Ciclismo' },
    { key: 'platinum_col1_5', alt: 'Surfe' },
    { key: 'platinum_col1_6', alt: 'Boxe' },
  ];

  const col2: { key: ImageKey; alt: string }[] = [
    { key: 'platinum_col2_1', alt: 'Futebol' },
    { key: 'platinum_col2_2', alt: 'Basquete' },
    { key: 'platinum_col2_3', alt: 'Baseball' },
    { key: 'platinum_col2_4', alt: 'Golfe' },
    { key: 'platinum_col2_5', alt: 'Esqui' },
    { key: 'platinum_col2_6', alt: 'Estádio' },
  ];

  return (
    <section id="platinum" className="bg-slate-50 text-slate-900 py-24 px-6 overflow-hidden">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          
          {/* Left Content */}
          <Reveal className="w-full lg:w-1/2 flex flex-col items-start text-left">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-6 block">
              Experiências Premium
            </span>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 mb-6 leading-[1.1]">
              Acesso<br />Platinum
            </h2>
            <h3 className="text-2xl md:text-3xl font-light mb-8 text-slate-800 leading-tight">
              Curadoria. Personalização. <span className="font-semibold">Sem limites.</span>
            </h3>
            <p className="text-slate-600 font-medium text-base md:text-lg leading-relaxed mb-10 max-w-xl">
              Antes, durante e depois — o Acesso Platinum transforma cada evento em uma experiência completa. Vivencie os bastidores com exclusividade e eleve seu pacote com upgrades sob medida, para qualquer esporte ou evento, em qualquer lugar do mundo.
            </p>
            
            <button onClick={scrollToContact} className="text-sm font-bold uppercase tracking-[0.15em] text-slate-900 border-b-2 border-slate-900 pb-2 hover:text-gold hover:border-gold transition-colors mb-16">
              Vamos Planejar a Viagem
            </button>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full">
              <div className="flex gap-4 items-start">
                <div className="text-black mt-1 shrink-0 bg-gold p-2 rounded-full"><Check size={18} strokeWidth={3} /></div>
                <div>
                  <h5 className="font-bold text-sm mb-1 uppercase tracking-[0.1em] text-slate-900">Programas Sob Medida</h5>
                  <p className="text-sm text-black/70 font-medium">Roteiros personalizados para cada necessidade.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-black mt-1 shrink-0 bg-gold p-2 rounded-full"><Check size={18} strokeWidth={3} /></div>
                <div>
                  <h5 className="font-bold text-sm mb-1 uppercase tracking-[0.1em] text-slate-900">Acesso Inigualável</h5>
                  <p className="text-sm text-black/70 font-medium">Bastidores, áreas VIP e camarotes exclusivos.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-black mt-1 shrink-0 bg-gold p-2 rounded-full"><Check size={18} strokeWidth={3} /></div>
                <div>
                  <h5 className="font-bold text-sm mb-1 uppercase tracking-[0.1em] text-slate-900">Acomodações de Luxo</h5>
                  <p className="text-sm text-black/70 font-medium">Hotéis 5 estrelas e vilas privativas.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="text-black mt-1 shrink-0 bg-gold p-2 rounded-full"><Check size={18} strokeWidth={3} /></div>
                <div>
                  <h5 className="font-bold text-sm mb-1 uppercase tracking-[0.1em] text-slate-900">Experiência Pré-Evento</h5>
                  <p className="text-sm text-black/70 font-medium">Acesso exclusivo aos bastidores, área VIP e meet & greet com atletas e artistas.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start sm:col-span-2">
                <div className="text-black mt-1 shrink-0 bg-gold p-2 rounded-full"><Check size={18} strokeWidth={3} /></div>
                <div>
                  <h5 className="font-bold text-sm mb-1 uppercase tracking-[0.1em] text-slate-900">Upgrades de Pacote</h5>
                  <p className="text-sm text-black/70 font-medium">Eleve seu pacote a qualquer momento — camarotes, transfers privativos, open bar e muito mais.</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Animated 2-column photo grid */}
          <Reveal
            className="w-full lg:w-1/2 relative h-[500px] md:h-[600px] lg:h-[680px] rounded-[2rem] overflow-hidden"
            delay={200}
          >
            {/* Top & bottom fade masks */}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none" />

            <div className="relative flex gap-3 h-full w-full p-3">

              {/* Column 1 — scrolls UP */}
              <div className="flex-1 overflow-hidden">
                <div className="flex flex-col gap-3 animate-marquee-up">
                  {(col1.filter(item => getImage(item.key)).length > 0
                    ? [...col1.map(i => ({...i, _dup: false})), ...col1.map(i => ({...i, _dup: true}))]
                    : col1.map(i => ({...i, _dup: false}))
                  ).map((item) => {
                    const src = getImage(item.key);
                    return (
                      <div key={item._dup ? `${item.key}-dup` : item.key} className="rounded-xl overflow-hidden shrink-0 aspect-[4/3] w-full bg-black/20">
                        {src
                          ? <img src={src} alt={item.alt} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">sem imagem</div>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Column 2 — scrolls DOWN */}
              <div className="flex-1 overflow-hidden">
                <div className="flex flex-col gap-3 animate-marquee-down">
                  {(col2.filter(item => getImage(item.key)).length > 0
                    ? [...col2.map(i => ({...i, _dup: false})), ...col2.map(i => ({...i, _dup: true}))]
                    : col2.map(i => ({...i, _dup: false}))
                  ).map((item) => {
                    const src = getImage(item.key);
                    return (
                      <div key={item._dup ? `${item.key}-dup` : item.key} className="rounded-xl overflow-hidden shrink-0 aspect-[4/3] w-full bg-black/20">
                        {src
                          ? <img src={src} alt={item.alt} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">sem imagem</div>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
