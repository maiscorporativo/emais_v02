import { ChevronLeft, ChevronRight } from 'lucide-react';
import Reveal from './Reveal';
import { useContentConfig } from '../hooks/useContentConfig';
import { useRef, useState } from 'react';

export default function EventsSection() {
  const { events: allEvents } = useContentConfig();
  const [filter, setFilter] = useState<'populares' | 'proximos'>('populares');
  const gridRef = useRef<HTMLDivElement>(null);

  const events = allEvents.filter(e => !e.status || e.status === 'approved');

  const handleCardClick = () => {
    const el = document.getElementById('trending');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollGrid = (dir: 'left' | 'right') => {
    gridRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  return (
    <section id="events" className="py-20 px-6 bg-gradient-to-b from-primary-main to-[#09090b]">
      <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-4">
            <h2 className="text-3xl font-semibold">Explorar Eventos</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-8">
              <div className="flex gap-6 text-sm font-medium">
                <button
                  onClick={() => setFilter('populares')}
                  className={`pb-4 -mb-[18px] font-bold transition-colors ${filter === 'populares' ? 'text-white border-b-2 border-gold' : 'text-neutral-500 hover:text-gold'}`}
                >Populares</button>
                <button
                  onClick={() => setFilter('proximos')}
                  className={`pb-4 -mb-[18px] transition-colors ${filter === 'proximos' ? 'text-white border-b-2 border-gold font-bold' : 'text-neutral-500 hover:text-gold'}`}
                >Próximos</button>
              </div>
              <div className="flex gap-3 justify-end sm:justify-start mt-2 sm:mt-0 pb-2 sm:pb-0">
                <button onClick={() => scrollGrid('left')} className="text-neutral-500 hover:text-gold transition-colors" aria-label="Anterior">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => scrollGrid('right')} className="text-neutral-500 hover:text-gold transition-colors" aria-label="Próximo">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-auto">
          {events.map((evt, idx) => (
            <Reveal key={evt.title || idx} className={`group relative rounded-lg overflow-hidden cursor-pointer aspect-[16/9] shadow-lg`} delay={(idx % 3 + 1) * 100}>
              <div onClick={handleCardClick} className="w-full h-full relative">
                <img src={evt.img} alt={`Imagem do evento ${evt.title} em ${evt.location}`} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-main/90 via-primary-main/20 to-transparent flex flex-col justify-end p-6">
                <h3 className="text-xl font-semibold mb-1">{evt.title}</h3>
                <div className="flex flex-row items-center gap-4 text-xs text-neutral-300">
                  <span>{evt.location}</span>
                  <span className="w-1 h-1 bg-neutral-500 rounded-full"></span>
                  <span>{evt.date}</span>
                </div>
              </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
