import pool from '../server/db.js';
import bcrypt from 'bcryptjs';

async function migrate() {
  try {
    console.log('🚀 Iniciando migração do banco de dados...');

    // 1. Atualizar admin_users role ENUM
    console.log('🔄 Atualizando ENUM de roles em admin_users...');
    await pool.query(`
      ALTER TABLE admin_users 
      MODIFY COLUMN role ENUM('admin', 'master', 'marketing') NOT NULL DEFAULT 'admin'
    `);
    console.log('✅ admin_users atualizada.');

    // 2. Atualizar user_sessions role ENUM (caso já exista)
    console.log('🔄 Atualizando ENUM de roles em user_sessions...');
    await pool.query(`
      ALTER TABLE user_sessions 
      MODIFY COLUMN role ENUM('admin', 'master', 'marketing') NOT NULL
    `);
    console.log('✅ user_sessions atualizada.');

    // 3. Criar usuário de marketing
    const username = 'marketing';
    const password = 'mkt2025';
    const role = 'marketing';

    console.log(`👤 Verificando usuário '${username}'...`);
    const [existing] = await pool.query('SELECT id FROM admin_users WHERE username = ?', [username]);

    if (existing.length === 0) {
      console.log(`🆕 Criando usuário '${username}'...`);
      const hash = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, hash, role]
      );
      console.log(`✅ Usuário '${username}' criado com sucesso!`);
    } else {
      console.log(`ℹ️ Usuário '${username}' já existe.`);
    }

    console.log('🏁 Migração concluída com sucesso!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
    process.exit(1);
  }
}

migrate();
