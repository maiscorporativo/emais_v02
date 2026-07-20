export interface EventHighlight {
  title: string;
  location: string;
  date: string;
  img: string;
  status?: 'approved' | 'pending' | 'rejected';
  /* ── Audit trail ── */
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
}

export interface TrendingPackage {
  /* ── Integração (banco compartilhado) ── */
  sharedId?: number; // id na tabela shared_packages
  origem?: 'gp' | 'emais' | 'torcida'; // portal dono do conteúdo (só ele edita)
  portalHidden?: boolean; // true = pacote DESLIGADO neste portal (controle local)
  tag: string;
  title: string;
  slug?: string; // URL permanente da LP: /pacote/<slug> (único; gerado do título, editável no admin)
  loc: string;
  date: string;
  price: string;
  currency?: string;
  installments?: string;
  img: string;
  badge: string;
  badgeImg?: string;
  description?: string;
  flightDetails?: string;
  hotelDetails?: string;
  ticketDetails?: string;
  status?: 'approved' | 'pending' | 'rejected';
  category?: string;
  isTrending?: boolean;
  /* ── Audit trail ── */
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  /* ── Marketing fields ── */
  videoUrl?: string;
  trackingScriptHead?: string;
  trackingScriptBody?: string;
  webhookClint?: string;
  mauticFormCode?: string;
  redirectUrl?: string;
  externalUrl?: string; // Link externo para pular a Landing Page interna
  marketingUpdatedAt?: string;
  marketingUpdatedBy?: string;
  /* ── Enhanced Marketing fields ── */
  heroType?: 'video' | 'image';
  heroImage?: string;
  galleryImages?: string; // Semicolon separated URLs
  highlights?: string; // Semicolon separated features/highlights
  sectionBackground?: string;
  sportType?: string; // Ex: 'automobilismo', 'futebol', 'tenis', etc.
  /* ── New GP Experience LP Sections ── */
  cardsData?: string; // JSON string para Cards de Experiência
  programacaoData?: string; // JSON string para dias e programação
  pacotesOptionsData?: string; // JSON string para opções de pacotes
  experienciaSection?: string; // JSON string ou texto da seção Experiência
  partnershipSection?: string; // JSON string ou boolean para parceria
  /* ── Soft-delete ── */
  deletedAt?: string;
  deletedBy?: string;
}

/* ── Integração entre portais (banco compartilhado de pacotes) ── */
/** Identidade deste portal na integração (GP/E-Mais/Torcida). */
export const PORTAL_ID = 'emais';
export const PORTAL_NAMES: Record<string, string> = { gp: 'GP Experience', emais: 'E-Mais', torcida: 'Torcida Placar' };
