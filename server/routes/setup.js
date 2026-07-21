/**
 * setup.js — Rota HTTP para rodar manutenções que normalmente exigiriam
 * terminal SSH (indisponível neste plano de hospedagem). Protegida por
 * SETUP_TOKEN: sem essa variável definida, a rota fica DESATIVADA (404).
 *
 * Uso: defina SETUP_TOKEN nas variáveis de ambiente do site, reinicie o
 * app e acesse (no navegador, logado como admin do painel ou não — o
 * token é a autenticação):
 *   https://SEU-SITE/api/setup/full-setup?token=SEU_TOKEN_SECRETO
 *
 * IMPORTANTE: depois de usar, REMOVA a variável SETUP_TOKEN e reinicie o
 * app para desativar a rota — ela recria os usuários padrão com senhas
 * conhecidas, então não deve ficar exposta indefinidamente em produção.
 */
import express from 'express';
import { runFullSetup } from '../setup-full.js';
import pool from '../db.js';
import { sharedPool, sharedDbEnabled } from '../shared-db.js';
import { PORTAL } from '../shared-packages.js';

const router = express.Router();

function requireSetupToken(req, res, next) {
  const configured = process.env.SETUP_TOKEN;
  if (!configured) return res.status(404).json({ error: 'Rota desativada (SETUP_TOKEN não configurado)' });
  if (req.query.token !== configured) return res.status(401).json({ error: 'Token inválido' });
  next();
}

router.get('/status', requireSetupToken, async (req, res) => {
  const lines = [];
  lines.push(`Portal: ${PORTAL}`);
  lines.push(`SHARED_DB_HOST: ${process.env.SHARED_DB_HOST || '(não definido, usa 127.0.0.1)'}`);
  lines.push(`SHARED_DB_PORT: ${process.env.SHARED_DB_PORT || '(não definido, usa 3306)'}`);
  lines.push(`SHARED_DB_NAME: ${process.env.SHARED_DB_NAME || '(NÃO DEFINIDO — integração desativada)'}`);
  lines.push(`SHARED_DB_USER: ${process.env.SHARED_DB_USER || '(não definido)'}`);
  lines.push(`Banco compartilhado ativo (sharedDbEnabled): ${sharedDbEnabled() ? 'SIM' : 'NÃO'}`);
  lines.push('');

  if (sharedDbEnabled()) {
    try {
      const [rows] = await sharedPool.query(
        'SELECT id, origem, esporte, JSON_UNQUOTE(JSON_EXTRACT(payload, "$.title")) AS titulo FROM shared_packages ORDER BY id'
      );
      lines.push('✅ Conexão com o banco compartilhado OK.');
      lines.push(`Total de pacotes na tabela shared_packages: ${rows.length}`);
      for (const r of rows) lines.push(`  #${r.id} [origem: ${r.origem} / esporte: ${r.esporte}] "${r.titulo}"`);
    } catch (err) {
      lines.push(`❌ ERRO ao conectar/consultar o banco compartilhado: ${err.code || ''} ${err.message}`);
    }
  } else {
    lines.push('⚠️ Integração desativada — defina SHARED_DB_NAME para ativar.');
  }

  lines.push('');
  try {
    const [rows] = await pool.query('SELECT packages FROM site_content WHERE id = 1');
    const packages = rows.length ? JSON.parse(rows[0].packages || '[]') : [];
    lines.push(`Pacotes no banco PRÓPRIO deste portal (site_content, legado/backup): ${packages.length}`);
    for (const p of packages) lines.push(`  - "${p.title}" (origem: ${p.origem || 'local, ainda não sincronizado'})`);
  } catch (err) {
    lines.push(`❌ ERRO ao consultar o banco próprio: ${err.message}`);
  }

  res.type('text/plain').send(lines.join('\n'));
});

router.get('/full-setup', requireSetupToken, async (req, res) => {
  try {
    const log = await runFullSetup();
    res.type('text/plain').send(log.join('\n') + '\n\nLembre-se de remover SETUP_TOKEN e reiniciar o app depois de conferir.');
  } catch (err) {
    console.error('[GET /api/setup/full-setup]', err);
    res.status(500).json({ error: 'Erro ao rodar o setup', details: err.message });
  }
});

export default router;
