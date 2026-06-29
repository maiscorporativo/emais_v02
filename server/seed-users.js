/**
 * seed-users.js
 * Cria os usuários admin e master no banco com senhas hasheadas.
 * Execute uma vez: node server/seed-users.js
 */
import bcrypt from 'bcryptjs';
import pool from './db.js';

const USERS = [
  { username: 'admin',  password: 'emais2025', role: 'admin'  },
  { username: 'master', password: 'zago2026',  role: 'master' },
  { username: 'marketing', password: 'mkt2025', role: 'marketing' },
];

async function seed() {
  console.log('🔐 Criando usuários admin...\n');
  try {
    await pool.query("ALTER TABLE admin_users MODIFY COLUMN role ENUM('admin', 'master', 'marketing') NOT NULL DEFAULT 'admin'");
  } catch (err) {
    // silently ignore if it fails
  }

  for (const user of USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    try {
      await pool.query(
        `INSERT INTO admin_users (username, password_hash, role)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
        [user.username, hash, user.role]
      );
      console.log(`  ✅ ${user.role.padEnd(8)} → username: "${user.username}"`);
    } catch (err) {
      console.error(`  ❌ Erro ao criar "${user.username}":`, err.message);
    }
  }

  console.log('\n✔ Pronto! Feche com Ctrl+C.');
  process.exit(0);
}

seed();
