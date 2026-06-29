export default function PartnersMarquee() {
  return (
    <section className="py-20 border-b border-white/5 overflow-hidden flex flex-col items-center" style={{ background: 'linear-gradient(to bottom, transparent 0%, #09090b 60%)' }}>
      <p className="text-[11px] text-[#4a6f93] uppercase tracking-[0.2em] mb-10 font-bold z-10 px-6 text-center">
        Eventos mais iconicos e importantes do mundo
      </p>

      <div className="w-full relative flex overflow-hidden py-4">
        {/* Gradient masks for smooth fade in/out on edges */}
        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none"></div>

        <div className="flex w-max animate-marquee">
          {[1, 2, 3, 4].map((set) => (
            <div key={set} className="flex items-center justify-around gap-16 md:gap-32 px-8 md:px-16 w-max" aria-hidden={set !== 1 ? "true" : "false"}>
              <img src="/partners/f1.png" alt="F1" className="h-8 md:h-24 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/FormulaE.svg" alt="Fórmula E" className="h-8 md:h-12 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/wec.png" alt="WEC" className="h-8 md:h-20 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/motogp.svg" alt="MotoGP" className="h-8 md:h-12 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/Indy.png" alt="Indy" className="h-8 md:h-18 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/formula2.png" alt="F2" className="h-8 md:h-18 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/stockcar.png" alt="Stock Car" className="h-8 md:h-18 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
              <img src="/partners/Nascar.png" alt="Nascar" className="h-8 md:h-26 w-auto object-contain brightness-0 invert opacity-40 hover:opacity-100 transition-all duration-300 hover:scale-110 cursor-pointer" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
