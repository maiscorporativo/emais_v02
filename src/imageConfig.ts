// Central image configuration for E-Mais Landing Page
// All default image URLs are defined here. Overrides are stored in localStorage.

export const DEFAULT_IMAGES = {
  // Hero Section Gallery — 12 images (3 columns auto-scroll)
  hero_col1_1: '/sports/carrossel01.jpg',
  hero_col1_2: '/sports/carrossel02.jpg',
  hero_col1_3: '/sports/carrossel03.jpg',
  hero_col1_4: '/sports/carrossel04.jpg',
  hero_col2_1: '/sports/carrossel05.jpg',
  hero_col2_2: '/sports/carrossel06.jpg',
  hero_col2_3: '/sports/carrossel07.jpg',
  hero_col2_4: '/sports/Carrossel08.png',
  hero_col3_1: '/sports/carrossel09.jpg',
  hero_col3_2: '/sports/carrossel10.png',
  hero_col3_3: '/sports/carrossel01.jpg',
  hero_col3_4: '/sports/carrossel02.jpg',

  // Events Section
  event_0: '',
  event_1: '',
  event_2: '',

  // Trending Packages
  package_0: '',
  package_1: '',
  package_2: '',
  package_3: '',

  // Platinum Access — Animated Grid (2 columns × 6 images each)
  platinum_col1_1: '',
  platinum_col1_2: '',
  platinum_col1_3: '',
  platinum_col1_4: '',
  platinum_col1_5: '',
  platinum_col1_6: '',
  platinum_col2_1: '',
  platinum_col2_2: '',
  platinum_col2_3: '',
  platinum_col2_4: '',
  platinum_col2_5: '',
  platinum_col2_6: '',
};

export type ImageKey = keyof typeof DEFAULT_IMAGES;

export const STORAGE_KEY = 'torcida_image_config';
