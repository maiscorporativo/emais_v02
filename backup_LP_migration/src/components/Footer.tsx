import { Instagram, ArrowRight } from 'lucide-react';
import Reveal from './Reveal';

export default function Footer() {

    return (
        <footer className="bg-[#09090b] text-white font-sans overflow-hidden relative">

            {/* Subtle gradient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />

            {/* CTA Hero strip */}
            <div className="relative border-b border-white/8 px-6 py-20 text-center">
                <Reveal>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-5">Experimente o Premium</p>
                    <h2 className="footer-cta-heading text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.05]">
                        Descubra a sua<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-secondary">melhor experiência.</span>
                    </h2>
                    <a
                        href="https://api.whatsapp.com/send/?phone=5518997624457&text=Ol%C3%A1,%20tudo%20bem?%20Gostaria%20de%20falar%20com%20um%20consultor.&type=phone_number&app_absent=0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-gold text-black font-bold text-sm px-8 py-4 rounded-full hover:bg-white transition-all duration-300 group shadow-lg shadow-gold/20"
                    >
                        Fale com um Consultor
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                </Reveal>
            </div>

            {/* Brand Center */}
            <div className="relative max-w-[1400px] mx-auto px-6 py-16">
                <Reveal className="flex flex-col items-center text-center gap-5">
                    <img src="/logo-gpexperience.webp" alt="GP Experience" className="h-[130px] object-contain" />
                    <p className="text-sm text-neutral-400 leading-relaxed max-w-md">
                        Hospitalidade premium e experiências inesquecíveis nos maiores eventos de automobilismo e de entretenimento do mundo.
                    </p>

                    <div className="flex gap-3 pt-1">
                        <a href="https://www.instagram.com/emais.viagensesportivas/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-neutral-400 hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/5 transition-all">
                            <Instagram size={16} />
                        </a>
                    </div>
                </Reveal>
            </div>

            <div className="border-t border-white/8 px-6 py-6 max-w-[1400px] mx-auto flex flex-col items-center gap-3 text-[12px] text-neutral-600">
                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                    <span className="text-neutral-500 font-medium">© {new Date().getFullYear()} GP EXPERIENCE.</span>
                    <a href="https://maiscorporativo.tur.br/politica-de-privacidade/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">Privacidade</a>
                    <a href="https://emais.tur.br/admin" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">Administrador</a>
                    <a href="https://emais.tur.br/admin-master" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors">Administrador Master</a>
                </div>
                <p className="text-neutral-700">Produto Mais Corporativo</p>
            </div>
        </footer>
    );
}
