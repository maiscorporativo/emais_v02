// Seed script — populates MySQL with default content
// Run: node server/seed.js
import dotenv from 'dotenv';
import pool from './db.js';
import { DEFAULT_EVENTS, DEFAULT_PACKAGES, DEFAULT_TESTIMONIALS, DEFAULT_HERO_IMAGES } from './defaults.js';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding database with default content...');
  try {
    await pool.query(
      `INSERT INTO site_content (id, events, packages, testimonials, hero_images)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         events       = VALUES(events),
         packages     = VALUES(packages),
         testimonials = VALUES(testimonials),
         hero_images  = VALUES(hero_images)`,
      [
        JSON.stringify(DEFAULT_EVENTS),
        JSON.stringify(DEFAULT_PACKAGES),
        JSON.stringify(DEFAULT_TESTIMONIALS),
        JSON.stringify(DEFAULT_HERO_IMAGES),
      ]
    );
    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();
