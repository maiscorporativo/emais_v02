export default function PartnersMarquee() {
  return (
    <section className="-mt-12 relative z-20 py-20 border-b border-white/5 overflow-hidden flex flex-col items-center" style={{ background: 'linear-gradient(to bottom, transparent 0%, #001a33 60%)' }}>
      <p className="text-[11px] text-white uppercase tracking-[0.2em] mb-10 font-bold z-10 px-6 text-center">
        Eventos mais iconicos e importantes do mundo esportivo
      </p>

      <div className="w-full relative flex overflow-hidden py-4">
        {/* Gradient masks for smooth fade in/out on edges */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#001a33] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#001a33] to-transparent z-10 pointer-events-none"></div>

        <div className="flex w-max animate-marquee">
          {[1, 2, 3, 4].map((set) => (
            <div key={set} className="flex items-center justify-around gap-16 md:gap-32 px-8 md:px-16 w-max" aria-hidden={set !== 1 ? "true" : "false"}>
              <img src="/partners/champions_logo.png" alt="Champions League" className="h-8 md:h-22 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/libertadores_logo.png" alt="Libertadores" className="h-8 md:h-22 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/premier_logo.png" alt="Premier League" className="h-8 md:h-16 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/laliga_logo.svg" alt="La Liga" className="h-8 md:h-16 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/bundesliga_logo.png" alt="Bundesliga" className="h-8 md:h-16 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/elclasico_logo.png" alt="El Clasico" className="h-8 md:h-20 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/nba_logo.png" alt="NBA" className="h-8 md:h-16 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/nfl_logo.png" alt="NFL" className="h-8 md:h-22 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/NHL_logo.png" alt="NHL" className="h-8 md:h-22 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/mlb_logo.png" alt="MLB" className="h-8 md:h-20 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/ufc_logo.png" alt="UFC" className="h-8 md:h-24 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/wimbledon_logo.png" alt="Wimbledon" className="h-8 md:h-22 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/rolandgarros_logo.png" alt="Roland Garros" className="h-8 md:h-22 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
