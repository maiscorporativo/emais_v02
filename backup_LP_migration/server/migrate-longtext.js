/**
 * migrate-longtext.js
 * Migra as colunas JSON do site_content para LONGTEXT
 * Rodar: node server/migrate-longtext.js
 */
import pool from './db.js';

async function migrate() {
  console.log('🔧 Migrando colunas para LONGTEXT...');
  const cols = ['events', 'packages', 'testimonials', 'hero_images', 'categories'];
  for (const col of cols) {
    try {
      await pool.query(`ALTER TABLE site_content MODIFY COLUMN \`${col}\` LONGTEXT`);
      console.log(`  ✅ ${col} → LONGTEXT`);
    } catch (e) {
      console.log(`  ⚠️  ${col}: ${e.message}`);
    }
  }
  // Também aumentar max_allowed_packet para esta sessão
  try {
    await pool.query(`SET GLOBAL max_allowed_packet = 67108864`); // 64MB
    console.log('  ✅ max_allowed_packet → 64MB');
  } catch (e) {
    console.log(`  ⚠️  max_allowed_packet: ${e.message} (pode precisar de privilégio SUPER)`);
  }
  console.log('\n✅ Migração concluída!');
  process.exit(0);
}

migrate().catch(e => { console.error(e); process.exit(1); });
