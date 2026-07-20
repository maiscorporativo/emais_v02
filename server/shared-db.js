/**
 * shared-db.js — Banco COMPARTILHADO de pacotes (integração dos 3 portais).
 *
 * Os três sistemas (GP Experience, E-Mais e Torcida Placar) apontam para o
 * MESMO banco MySQL definido pelas variáveis SHARED_DB_*. Cada portal mantém
 * seu banco próprio (site_content) para hero, depoimentos, categorias etc.;
 * aqui vivem apenas os pacotes, compartilhados entre os sites.
 *
 * Sem SHARED_DB_NAME definido, o módulo fica DESATIVADO e o portal segue
 * funcionando 100% com o banco próprio (comportamento atual).
 *
 * Regras de negócio (fechadas em jul/2026):
 *  - Conteúdo do pacote editável apenas no portal de ORIGEM (coluna `origem`).
 *  - Demais portais controlam somente flags locais: visível, Em Alta, ordem
 *    e (no torcida) o template de esporte (sport_type_torcida).
 *  - Aprovação é global (master do portal de origem; vive no payload).
 *  - GP exibe apenas esporte = 'automobilismo'; emais/torcida exibem todos.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const enabled = !!process.env.SHARED_DB_NAME;

export const sharedPool = enabled
  ? mysql.createPool({
      host: process.env.SHARED_DB_HOST || 'localhost',
      port: Number(process.env.SHARED_DB_PORT || 3306),
      user: process.env.SHARED_DB_USER,
      password: process.env.SHARED_DB_PASSWORD,
      database: process.env.SHARED_DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      charset: 'utf8mb4',
    })
  : null;

export function sharedDbEnabled() {
  return enabled;
}

/* ── Auto-migração: cria a tabela shared_packages se não existir ──
   O primeiro portal que subir cria; os demais encontram pronta.
   Espelho documentacional em server/setup-shared.sql. */
export async function migrateSharedDb() {
  if (!sharedPool) {
    console.log('ℹ️ Banco compartilhado desativado (defina SHARED_DB_NAME para ativar).');
    return;
  }
  await sharedPool.query(`
    CREATE TABLE IF NOT EXISTS shared_packages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      origem ENUM('gp','emais','torcida') NOT NULL,
      esporte VARCHAR(40) NOT NULL DEFAULT 'automobilismo',
      payload LONGTEXT NOT NULL,
      visivel_gp TINYINT(1) NOT NULL DEFAULT 1,
      visivel_emais TINYINT(1) NOT NULL DEFAULT 1,
      visivel_torcida TINYINT(1) NOT NULL DEFAULT 1,
      em_alta_gp TINYINT(1) NOT NULL DEFAULT 0,
      em_alta_emais TINYINT(1) NOT NULL DEFAULT 0,
      em_alta_torcida TINYINT(1) NOT NULL DEFAULT 0,
      ordem_gp INT NOT NULL DEFAULT 0,
      ordem_emais INT NOT NULL DEFAULT 0,
      ordem_torcida INT NOT NULL DEFAULT 0,
      sport_type_torcida VARCHAR(40) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_esporte (esporte),
      INDEX idx_origem (origem)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log(`✅ Banco compartilhado pronto: ${process.env.SHARED_DB_NAME} @ ${process.env.SHARED_DB_HOST || 'localhost'} (tabela shared_packages)`);
}
