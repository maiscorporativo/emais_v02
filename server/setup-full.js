/**
 * setup-full.js — Cria TODO o schema do banco próprio do E-Mais + usuários
 * padrão, em um único comando. Idempotente: pode rodar quantas vezes quiser,
 * nunca apaga ou sobrescreve dados existentes (exceto a senha dos usuários
 * padrão, que é sempre re-hasheada para os valores abaixo).
 *
 * Uso (na pasta do projeto, com o .env já configurado com DB_*):
 *   node server/setup-full.js
 */
import bcrypt from 'bcryptjs';
import pool from './db.js';
import { DEFAULT_CATEGORIES } from './defaults.js';

const USERS = [
  { username: 'admin',     password: 'emais2025', role: 'admin' },
  { username: 'master',    password: 'zago2026',  role: 'master' },
  { username: 'marketing', password: 'mkt2025',   role: 'marketing' },
];

async function main() {
  console.log('📦 Criando tabelas...\n');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_content (
      id INT PRIMARY KEY DEFAULT 1,
      events LONGTEXT NOT NULL,
      packages LONGTEXT NOT NULL,
      testimonials LONGTEXT NOT NULL,
      hero_images LONGTEXT NOT NULL,
      categories LONGTEXT NOT NULL,
      category_icons LONGTEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log('  ✅ site_content');

  await pool.query(
    `INSERT IGNORE INTO site_content (id, events, packages, testimonials, hero_images, categories, category_icons)
     VALUES (1, '[]', '[]', '[]', '{}', ?, '{}')`,
    [JSON.stringify(DEFAULT_CATEGORIES)]
  );
  console.log('  ✅ linha padrão em site_content (id=1)');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'master', 'marketing') NOT NULL DEFAULT 'admin'
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  // Garante o role 'marketing' mesmo se a tabela já existia com o ENUM antigo
  try {
    await pool.query("ALTER TABLE admin_users MODIFY COLUMN role ENUM('admin', 'master', 'marketing') NOT NULL DEFAULT 'admin'");
  } catch { /* já está correto */ }
  console.log('  ✅ admin_users');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      token      VARCHAR(64)  NOT NULL PRIMARY KEY,
      user_id    INT          NOT NULL,
      username   VARCHAR(255) NOT NULL,
      role       ENUM('admin','master','marketing') NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  console.log('  ✅ user_sessions');

  console.log('\n🔐 Criando/atualizando usuários de login...\n');
  for (const user of USERS) {
    const hash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO admin_users (username, password_hash, role)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
      [user.username, hash, user.role]
    );
    console.log(`  ✅ ${user.role.padEnd(9)} → usuário: "${user.username}" / senha: "${user.password}"`);
  }

  console.log('\n✔ Banco pronto. Troque as senhas padrão depois do primeiro login.');
  process.exit(0);
}

main().catch(err => { console.error('❌ Erro:', err); process.exit(1); });
