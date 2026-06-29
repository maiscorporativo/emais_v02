import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <>

      {/* Top Banner */}
      <div className="w-full px-8 pt-4 pb-2 text-xs flex justify-center items-center text-neutral-100 font-medium">
        <span className="text-center">
          Confira nosso <a href="/" onClick={scrollTo('events')} className="underline text-gold hover:text-white transition-colors font-bold">calendário completo de eventos</a>
        </span>
      </div>


      <nav className="w-full sticky top-4 z-50 px-4 transition-all mb-6">
        <div className="mx-auto w-full max-w-[1400px] flex items-center justify-between h-[86px] bg-[#09090b]/60 backdrop-blur-lg rounded-lg px-6 shadow-xl border border-white/10 font-sans">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center cursor-pointer py-1" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo-gpexperience.webp" alt="GP Experience" className="h-[65px] object-contain" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-7 text-[13px] text-neutral-300 font-medium">
            <a href="/" onClick={scrollTo('trending')} className="hover:text-gold transition-colors duration-200">Em Alta</a>
            <a href="/" onClick={scrollTo('events')} className="hover:text-gold transition-colors duration-200">Eventos</a>
            <a href="/" onClick={scrollTo('platinum')} className="hover:text-gold transition-colors duration-200">Acesso Platinum</a>

          </div>


          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white hover:text-gold transition-colors p-1"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl lg:hidden pt-24 px-6 flex flex-col">
          <div className="flex flex-col gap-6 text-xl font-medium text-center text-white">
            <a href="/" className="hover:text-gold" onClick={scrollTo('trending')}>Em Alta</a>
            <a href="/" className="hover:text-gold" onClick={scrollTo('events')}>Eventos</a>
            <a href="/" className="hover:text-gold" onClick={scrollTo('platinum')}>Acesso Platinum</a>


          </div>
        </div>
      )}
    </>
  );
}
