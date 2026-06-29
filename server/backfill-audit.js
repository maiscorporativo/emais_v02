/**
 * backfill-audit.js
 * Adiciona campos de auditoria nos pacotes que ainda não têm (legados).
 * Execute: node server/backfill-audit.js
 */
import pool from './db.js';

async function backfill() {
  console.log('🔄 Buscando conteúdo atual...\n');

  const [rows] = await pool.query('SELECT id, packages FROM site_content WHERE id = 1');
  if (!rows.length) { console.error('❌ Nenhum conteúdo encontrado.'); process.exit(1); }

  const packages = typeof rows[0].packages === 'string'
    ? JSON.parse(rows[0].packages)
    : rows[0].packages;

  const now = new Date().toISOString();
  let updated = 0;

  const patched = packages.map(pkg => {
    if (!pkg.createdBy) {
      updated++;
      return { ...pkg, createdBy: 'sistema', createdAt: now };
    }
    return pkg;
  });

  if (updated === 0) {
    console.log('✅ Todos os pacotes já têm auditoria. Nada a fazer.');
    await pool.end(); process.exit(0);
  }

  await pool.query(
    'UPDATE site_content SET packages = ? WHERE id = 1',
    [JSON.stringify(patched)]
  );

  console.log(`✅ ${updated} pacote(s) atualizado(s) com createdBy: "sistema".`);
  await pool.end();
  process.exit(0);
}

backfill().catch(err => { console.error('❌', err.message); process.exit(1); });
